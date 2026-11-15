<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PaymentGatewayInterface;
use App\Services\Payments\PaymentGatewayResolver;
use App\Services\Payments\PesapalVerificationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class PaymentController extends Controller
{
    public function initialize(
        Request $request,
        PaymentGatewayResolver $resolver,
        PesapalVerificationService $verificationService
    ): JsonResponse {
        $validated = $request->validate([
            'order_number' => ['required', 'string'],
            'payment_access_token' => [
                'required',
                'string',
                'size:64',
                'regex:/\A[a-fA-F0-9]{64}\z/',
            ],
        ]);

        $order = Order::query()
            ->where('order_number', $validated['order_number'])
            ->first();

        if (
            ! $order ||
            ! $this->authorizedForPayment(
                $order,
                $validated['payment_access_token']
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment authorization.',
            ], 403);
        }

        if ($order->payment_method === 'cash_on_delivery') {
            return response()->json([
                'success' => false,
                'message' => 'This order uses Cash on Delivery.',
            ], 422);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid.',
            ], 409);
        }

        if ($order->order_status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cancelled orders cannot be paid.',
            ], 422);
        }

        if (
            ! in_array(
                $order->payment_method,
                ['mtn_mobile_money', 'airtel_money', 'card'],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported payment method.',
            ], 422);
        }

        try {
            $gateway = $resolver->resolve();
        } catch (Throwable $exception) {
            Log::error('Payment gateway resolution failed.', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Online payments are unavailable.',
            ], 503);
        }

        if (! $gateway instanceof PaymentGatewayInterface) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway is unavailable.',
            ], 503);
        }

        // Only Pesapal is supported by this controller for now.
        if (config('services.payment_gateway') !== 'pesapal') {
            return response()->json([
                'success' => false,
                'message' => 'Payment provider is not supported yet.',
            ], 503);
        }

        /*
         * Coordinate initialization and retry reconciliation per order.
         * Never hold a database transaction during Pesapal API calls.
         */
        $retryLock = Cache::lock(
            'jsb:payment-initialize:' . $order->id,
            120
        );

        if (! $retryLock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'A payment request is already being processed. Please try again shortly.',
            ], 409);
        }

        try {
            $hasOpenReconciliationAlert = \App\Models\PaymentReconciliationAlert::query()
                ->where('order_id', $order->id)
                ->where('status', 'open')
                ->exists();

            if ($hasOpenReconciliationAlert) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment requires manual reconciliation before another attempt.',
                ], 409);
            }

            $previousAttempts = Payment::query()
                ->where('order_id', $order->id)
                ->where('provider', 'pesapal')
                ->orderBy('id')
                ->get();

            $reusableCheckout = null;

            foreach ($previousAttempts as $previous) {
                if ($previous->status === 'paid') {
                    return response()->json([
                        'success' => false,
                        'message' => 'A previous payment has already succeeded.',
                    ], 409);
                }

                if (empty($previous->provider_transaction_id)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'An earlier payment attempt cannot yet be reconciled.',
                    ], 409);
                }

                try {
                    $verification = $verificationService->verify($previous);
                } catch (Throwable $exception) {
                    Log::warning('Previous Pesapal attempt could not be reconciled.', [
                        'order_id' => $order->id,
                        'payment_id' => $previous->id,
                        'error' => $exception->getMessage(),
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Previous payment status could not be confirmed. Please contact support before retrying.',
                    ], 409);
                }

                if ($verification['status'] === 'pending') {
                    if (
                        $previous->status === 'pending' &&
                        ! empty($previous->checkout_url)
                    ) {
                        $reusableCheckout = $previous;
                        continue;
                    }

                    return response()->json([
                        'success' => false,
                        'message' => 'A previous payment requires reconciliation before continuing.',
                    ], 409);
                }

                if ($verification['status'] !== 'failed') {
                    return response()->json([
                        'success' => false,
                        'message' => 'A previous payment is paid or requires reconciliation.',
                    ], 409);
                }
            }

            if ($reusableCheckout) {
                return response()->json([
                    'success' => true,
                    'message' => 'Existing checkout session retrieved.',
                    'data' => [
                        'provider' => 'pesapal',
                        'checkout_url' => $reusableCheckout->checkout_url,
                        'transaction_reference' =>
                            $reusableCheckout->transaction_reference,
                        'status' => 'pending',
                    ],
                ]);
            }

            return $this->reserveAndInitializePayment($order, $gateway);
        } finally {
            $retryLock->release();
        }
    }

    private function reserveAndInitializePayment(
        Order $order,
        PaymentGatewayInterface $gateway
    ): JsonResponse {
        /*
         * Reserve a payment attempt under a database lock.
         * External HTTP calls are intentionally made after
         * the transaction has committed.
         */
        $reservation = DB::transaction(function () use ($order) {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedOrder->payment_status === 'paid' ||
                $lockedOrder->order_status === 'cancelled'
            ) {
                return ['state' => 'blocked'];
            }

            $hasOpenAlert = \App\Models\PaymentReconciliationAlert::query()
                ->where('order_id', $lockedOrder->id)
                ->where('status', 'open')
                ->exists();

            if ($hasOpenAlert) {
                return ['state' => 'reconciliation_required'];
            }

            $existing = Payment::query()
                ->where('order_id', $lockedOrder->id)
                ->where('provider', 'pesapal')
                ->where('status', 'pending')
                ->orderByDesc('id')
                ->first();

            if ($existing) {
                if (
                    ! empty($existing->checkout_url) &&
                    ! empty($existing->provider_transaction_id)
                ) {
                    return [
                        'state' => 'ready',
                        'payment_id' => $existing->id,
                        'checkout_url' => $existing->checkout_url,
                        'transaction_reference' =>
                            $existing->transaction_reference,
                    ];
                }

                return ['state' => 'unresolved'];
            }

            $payment = Payment::create([
                'order_id' => $lockedOrder->id,
                'method' => $lockedOrder->payment_method,
                'amount' => $lockedOrder->total,
                'transaction_reference' => 'JSB-' . Str::uuid(),
                'status' => 'pending',
                'provider' => 'pesapal',
                'currency' => config('services.payments.currency', 'UGX'),
            ]);

            return [
                'state' => 'new',
                'payment_id' => $payment->id,
                'transaction_reference' =>
                    $payment->transaction_reference,
            ];
        });

        if ($reservation['state'] === 'blocked') {
            return response()->json([
                'success' => false,
                'message' => 'This order cannot accept payment.',
            ], 409);
        }

        if ($reservation['state'] === 'reconciliation_required') {
            return response()->json([
                'success' => false,
                'message' => 'Payment requires manual reconciliation before another attempt.',
            ], 409);
        }

        if ($reservation['state'] === 'unresolved') {
            return response()->json([
                'success' => false,
                'message' => 'A previous payment attempt is still being processed. Please contact support before retrying.',
            ], 409);
        }

        if ($reservation['state'] === 'ready') {
            return response()->json([
                'success' => true,
                'message' => 'Existing checkout session retrieved.',
                'data' => [
                    'provider' => 'pesapal',
                    'checkout_url' => $reservation['checkout_url'],
                    'transaction_reference' =>
                        $reservation['transaction_reference'],
                    'status' => 'pending',
                ],
            ]);
        }

        try {
            $result = $gateway->initialize(
                $order,
                $reservation['transaction_reference']
            );

            if (
                ($result['provider'] ?? null) !== 'pesapal' ||
                ($result['transaction_reference'] ?? null)
                    !== $reservation['transaction_reference'] ||
                empty($result['provider_transaction_id']) ||
                empty($result['checkout_url'])
            ) {
                throw new \RuntimeException(
                    'Invalid gateway initialization result.'
                );
            }

            DB::transaction(function () use ($reservation, $result) {
                $payment = Payment::query()
                    ->whereKey($reservation['payment_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $payment->update([
                    'provider_transaction_id' =>
                        $result['provider_transaction_id'],
                    'checkout_url' => $result['checkout_url'],
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment checkout initialized.',
                'data' => [
                    'provider' => 'pesapal',
                    'checkout_url' => $result['checkout_url'],
                    'transaction_reference' =>
                        $reservation['transaction_reference'],
                    'status' => 'pending',
                ],
            ]);
        } catch (Throwable $exception) {
            Log::error('Pesapal initialization failed.', [
                'order_id' => $order->id,
                'payment_id' => $reservation['payment_id'],
                'error' => $exception->getMessage(),
            ]);

            // Keep the attempt pending. The gateway may
            // have accepted it before the connection failed.
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization could not be confirmed. Please contact support before retrying.',
            ], 503);
        }
    }

    public function verify(
        Request $request,
        \App\Services\Payments\PesapalVerificationService $verificationService
    ): JsonResponse {
        $validated = $request->validate([
            'order_number' => ['required', 'string'],
            'payment_access_token' => [
                'required',
                'string',
                'size:64',
                'regex:/\\A[a-fA-F0-9]{64}\\z/',
            ],
        ]);

        $order = Order::query()
            ->where('order_number', $validated['order_number'])
            ->first();

        if (
            ! $order ||
            ! $this->authorizedForPayment(
                $order,
                $validated['payment_access_token']
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment authorization.',
            ], 403);
        }

        $payment = Payment::query()
            ->where('order_id', $order->id)
            ->where('provider', 'pesapal')
            ->whereNotNull('provider_transaction_id')
            ->orderByDesc('id')
            ->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'No initialized Pesapal payment found.',
            ], 404);
        }

        try {
            $result = $verificationService->verify($payment);
        } catch (Throwable $exception) {
            Log::warning('Pesapal verification unsuccessful.', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment could not be verified. Please try again later.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment status checked.',
            'data' => $result,
        ]);
    }

    public function webhook(
        Request $request,
        string $provider,
        \App\Services\Payments\PesapalVerificationService $verificationService
    ): JsonResponse {
        if ($provider !== 'pesapal') {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported payment provider.',
            ], 404);
        }

        $trackingId = $request->input('OrderTrackingId');
        $merchantReference = $request->input('OrderMerchantReference');

        if (
            ! is_string($trackingId) ||
            ! preg_match('/\A[0-9a-fA-F-]{36}\z/', $trackingId) ||
            ! is_string($merchantReference) ||
            $merchantReference === ''
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Pesapal notification.',
            ], 400);
        }

        $payment = Payment::query()
            ->where('provider', 'pesapal')
            ->where('provider_transaction_id', $trackingId)
            ->where('transaction_reference', $merchantReference)
            ->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment transaction not found.',
            ], 404);
        }

        try {
            $verificationService->verify($payment);
        } catch (Throwable $exception) {
            Log::warning('Pesapal IPN verification failed.', [
                'payment_id' => $payment->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed.',
            ], 503);
        }

        return response()->json([
            'orderNotificationType' =>
                $request->input('OrderNotificationType', 'IPNCHANGE'),
            'orderTrackingId' => $trackingId,
            'orderMerchantReference' => $merchantReference,
            'status' => 200,
        ]);
    }

    private function authorizedForPayment(
        Order $order,
        string $token
    ): bool {
        if (empty($order->payment_access_token_hash)) {
            return false;
        }

        return hash_equals(
            $order->payment_access_token_hash,
            hash('sha256', $token)
        );
    }
}

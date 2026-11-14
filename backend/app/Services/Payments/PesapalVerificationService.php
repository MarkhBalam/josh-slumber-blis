<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PesapalVerificationService
{
    public function __construct(
        private readonly PesapalGateway $gateway
    ) {
    }

    public function verify(Payment $payment): array
    {
        if (
            $payment->provider !== 'pesapal' ||
            empty($payment->provider_transaction_id)
        ) {
            throw new RuntimeException(
                'Payment has no valid Pesapal tracking ID.'
            );
        }

        $result = $this->gateway->verify(
            $payment->provider_transaction_id
        );

        $order = $payment->order;

        if (! $order) {
            throw new RuntimeException('Payment order not found.');
        }

        if (
            ($result['provider'] ?? null) !== 'pesapal' ||
            ($result['provider_transaction_id'] ?? null)
                !== $payment->provider_transaction_id ||
            ($result['transaction_reference'] ?? null)
                !== $payment->transaction_reference ||
            strtoupper((string) ($result['currency'] ?? ''))
                !== strtoupper((string) $payment->currency)
        ) {
            throw new RuntimeException(
                'Pesapal transaction identity mismatch.'
            );
        }

        $reportedAmount = $result['amount'] ?? null;

        if (
            ! is_numeric($reportedAmount) ||
            ! is_finite((float) $reportedAmount) ||
            round((float) $reportedAmount, 2)
                !== round((float) $order->total, 2) ||
            round((float) $reportedAmount, 2)
                !== round((float) $payment->amount, 2)
        ) {
            throw new RuntimeException(
                'Pesapal transaction amount mismatch.'
            );
        }

        $providerStatus = $result['status'] ?? 'unknown';

        if (
            ! in_array(
                $providerStatus,
                ['paid', 'pending', 'failed', 'reversed', 'unknown'],
                true
            )
        ) {
            throw new RuntimeException(
                'Unrecognized Pesapal payment status.'
            );
        }

        return DB::transaction(function () use (
            $payment,
            $providerStatus
        ) {
            $lockedOrder = Order::query()
                ->whereKey($payment->order_id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedPayment->provider !== 'pesapal' ||
                $lockedPayment->provider_transaction_id
                    !== $payment->provider_transaction_id
            ) {
                throw new RuntimeException(
                    'Payment changed during verification.'
                );
            }

            if ($lockedPayment->status === 'paid') {
                if (in_array($providerStatus, ['failed', 'reversed'], true)) {
                    throw new RuntimeException(
                        'Previously paid transaction has conflicting provider status; manual reconciliation required.'
                    );
                }

                return [
                    'status' => 'paid',
                    'order_number' => $lockedOrder->order_number,
                ];
            }

            if ($providerStatus === 'paid') {
                if (
                    $lockedOrder->order_status === 'cancelled' ||
                    $lockedOrder->payment_status === 'paid'
                ) {
                    throw new RuntimeException(
                        'Order requires payment reconciliation.'
                    );
                }

                $now = now();

                $lockedPayment->update([
                    'status' => 'paid',
                    'paid_at' => $now,
                    'verified_at' => $now,
                ]);

                $lockedOrder->update([
                    'payment_status' => 'paid',
                    'paid_at' => $now,
                ]);

                return [
                    'status' => 'paid',
                    'order_number' => $lockedOrder->order_number,
                ];
            }

            if ($providerStatus === 'failed') {
                $lockedPayment->update([
                    'status' => 'failed',
                    'verified_at' => now(),
                ]);

                return [
                    'status' => 'failed',
                    'order_number' => $lockedOrder->order_number,
                ];
            }

            // A reversal may require financial reconciliation.
            // Do not automatically mark it as refunded.
            if ($providerStatus === 'reversed') {
                $lockedPayment->update([
                    'verified_at' => now(),
                ]);

                return [
                    'status' => 'reversed',
                    'order_number' => $lockedOrder->order_number,
                ];
            }

            $lockedPayment->update([
                'verified_at' => now(),
            ]);

            return [
                'status' => $providerStatus === 'unknown' ? 'pending' : $providerStatus,
                'order_number' => $lockedOrder->order_number,
            ];
        });
    }
}

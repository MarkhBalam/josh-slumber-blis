<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['out_for_delivery', 'cancelled'],
        'out_for_delivery' => ['delivered', 'cancelled'],
        'delivered' => [],
        'cancelled' => [],
    ];

    private function loadDetails(Order $order): Order
    {
        return $order->load([
            'items.product.images',
            'items.variant',
        ]);
    }

    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with([
                'items.product.images',
                'items.variant',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->loadDetails($order),
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => [
                'required',
                'string',
                'in:pending,confirmed,processing,out_for_delivery,delivered,cancelled',
            ],
            'payment_status' => ['prohibited'],
        ]);

        $result = DB::transaction(function () use ($order, $validated) {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $current = $lockedOrder->order_status;
            $next = $validated['order_status'];

            if ($current === $next) {
                return $lockedOrder;
            }

            if (! in_array($next, self::TRANSITIONS[$current] ?? [], true)) {
                throw ValidationException::withMessages([
                    'order_status' =>
                        "Cannot change order status from {$current} to {$next}.",
                ]);
            }

            $updates = ['order_status' => $next];

            if ($next === 'confirmed' && ! $lockedOrder->confirmed_at) {
                $updates['confirmed_at'] = now();
            }

            if (
                $next === 'out_for_delivery' &&
                ! $lockedOrder->out_for_delivery_at
            ) {
                $updates['out_for_delivery_at'] = now();
            }

            if ($next === 'delivered' && ! $lockedOrder->delivered_at) {
                $updates['delivered_at'] = now();
            }

            if ($next === 'cancelled' && ! $lockedOrder->cancelled_at) {
                $updates['cancelled_at'] = now();
            }

            $lockedOrder->update($updates);

            return $lockedOrder;
        });

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'data' => $this->loadDetails($result),
        ]);
    }

    public function collectPayment(
        Request $request,
        Order $order
    ): JsonResponse {
        $request->validate([
            'confirm_collected' => ['required', 'accepted'],
        ]);

        $result = DB::transaction(function () use ($order) {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->payment_method !== 'cash_on_delivery') {
                throw ValidationException::withMessages([
                    'payment' =>
                        'Only Cash on Delivery payments can be collected manually.',
                ]);
            }

            if ($lockedOrder->order_status === 'cancelled') {
                throw ValidationException::withMessages([
                    'payment' =>
                        'Cannot collect payment for a cancelled order.',
                ]);
            }

            if ($lockedOrder->payment_status !== 'pending') {
                throw ValidationException::withMessages([
                    'payment' =>
                        'This order is not awaiting a Cash on Delivery payment.',
                ]);
            }

            if (
                Payment::query()
                    ->where('order_id', $lockedOrder->id)
                    ->where('status', 'paid')
                    ->exists()
            ) {
                throw ValidationException::withMessages([
                    'payment' =>
                        'A successful payment already exists for this order.',
                ]);
            }

            $now = now();

            Payment::create([
                'order_id' => $lockedOrder->id,
                'method' => 'cash_on_delivery',
                'amount' => $lockedOrder->total,
                'transaction_reference' => 'JSB-COD-' . Str::uuid(),
                'status' => 'paid',
                'paid_at' => $now,
                'provider' => 'manual_cod',
                'currency' => 'UGX',
            ]);

            $lockedOrder->update([
                'payment_status' => 'paid',
                'paid_at' => $now,
            ]);

            return $lockedOrder;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cash on Delivery payment recorded successfully.',
            'data' => $this->loadDetails($result),
        ]);
    }
}

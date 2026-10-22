<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | List All Orders
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Show One Order
    |--------------------------------------------------------------------------
    */

    public function show(Order $order): JsonResponse
    {
        $order->load([
            'items.product.images',
            'items.variant',
        ]);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Order
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated = $request->validate([
            'order_status' => [
                'required',
                'string',
                'in:pending,confirmed,processing,out_for_delivery,delivered,cancelled',
            ],

            'payment_status' => [
                'nullable',
                'string',
                'in:pending,paid,failed,refunded',
            ],
        ]);

        $newOrderStatus = $validated['order_status'];

        $newPaymentStatus =
            $validated['payment_status']
            ?? $order->payment_status;

        /*
        |--------------------------------------------------------------------------
        | Fields To Update
        |--------------------------------------------------------------------------
        */

        $updates = [
            'order_status' => $newOrderStatus,
            'payment_status' => $newPaymentStatus,
        ];

        /*
        |--------------------------------------------------------------------------
        | Order Status Timestamps
        |--------------------------------------------------------------------------
        |
        | We only set a timestamp if it has not already been recorded.
        |
        | This preserves the first time that stage was reached.
        |
        */

        if (
            $newOrderStatus === 'confirmed'
            && $order->confirmed_at === null
        ) {
            $updates['confirmed_at'] = now();
        }

        if (
            $newOrderStatus === 'out_for_delivery'
            && $order->out_for_delivery_at === null
        ) {
            $updates['out_for_delivery_at'] = now();
        }

        if (
            $newOrderStatus === 'delivered'
            && $order->delivered_at === null
        ) {
            $updates['delivered_at'] = now();
        }

        if (
            $newOrderStatus === 'cancelled'
            && $order->cancelled_at === null
        ) {
            $updates['cancelled_at'] = now();
        }

        /*
        |--------------------------------------------------------------------------
        | Payment Timestamp
        |--------------------------------------------------------------------------
        */

        if (
            $newPaymentStatus === 'paid'
            && $order->paid_at === null
        ) {
            $updates['paid_at'] = now();
        }

        /*
        |--------------------------------------------------------------------------
        | Save
        |--------------------------------------------------------------------------
        */

        $order->update($updates);

        $order->load([
            'items.product.images',
            'items.variant',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully.',
            'data' => $order,
        ]);
    }
}
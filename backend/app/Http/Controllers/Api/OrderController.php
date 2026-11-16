<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Create Order
    |--------------------------------------------------------------------------
    */

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],

            'delivery_address' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'delivery_notes' => ['nullable', 'string'],

            'payment_method' => [
                'required',
                'string',
                'in:cash_on_delivery,mtn_mobile_money,airtel_money,card',
            ],

            'items' => ['required', 'array', 'min:1'],

            'items.*.variant_id' => [
                'required',
                'integer',
                'exists:product_variants,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        // The raw token is only returned once to the checkout.
        // Never store this raw value in the database.
        $paymentAccessToken = bin2hex(random_bytes(32));

        $order = DB::transaction(function () use (
            $validated,
            $paymentAccessToken
        ) {
            $subtotal = 0;
            $preparedItems = [];

            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::query()
                    ->with('product')
                    ->findOrFail($item['variant_id']);

                if (
                    ! $variant->is_active ||
                    $variant->stock_status !== 'in_stock'
                ) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "{$variant->product->name} - {$variant->label} is currently unavailable.",
                        ],
                    ]);
                }

                $quantity = (int) $item['quantity'];
                $unitPrice = (float) $variant->price;
                $lineSubtotal = $unitPrice * $quantity;

                $subtotal += $lineSubtotal;

                $preparedItems[] = [
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'variant_name' => $variant->label,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $lineSubtotal,
                ];
            }

            // Delivery is currently free within Uganda.
            $deliveryFee = 0;

            $phone = $this->normalizePhone(
                $validated['phone']
            );

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),

                'customer_name' => $validated['customer_name'],
                'phone' => $phone,
                'email' => $validated['email'] ?? null,

                'delivery_address' => $validated['delivery_address'],
                'district' => $validated['district'] ?? null,
                'delivery_notes' => $validated['delivery_notes'] ?? null,

                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $subtotal + $deliveryFee,

                'payment_method' => $validated['payment_method'],
                'payment_status' => 'pending',
                'order_status' => 'pending',

                'payment_access_token_hash' => hash(
                    'sha256',
                    $paymentAccessToken
                ),
            ]);

            $order->items()->createMany($preparedItems);

            return $order->load([
                'items',
                'payments',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully.',
            'data' => $order,

            // Treat this like a password.
            // The frontend must never place it in a URL.
            'payment_access_token' => $paymentAccessToken,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Guest Customer Orders — Limited Public Tracking
    |--------------------------------------------------------------------------
    */

    public function customerOrders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
        ]);

        $normalizedPhone = $this->normalizePhone($validated['phone']);

        $localPhone = $normalizedPhone;

        if (str_starts_with($normalizedPhone, '256')) {
            $localPhone = '0' . substr($normalizedPhone, 3);
        }

        $internationalPhone = '+' . $normalizedPhone;

        $orders = Order::query()
            ->where(function ($query) use (
                $normalizedPhone,
                $localPhone,
                $internationalPhone
            ) {
                $query
                    ->where('phone', $normalizedPhone)
                    ->orWhere('phone', $localPhone)
                    ->orWhere('phone', $internationalPhone);
            })
            ->with(['items.product.images'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'count' => $orders->count(),
            'data' => $orders->map(
                fn (Order $order) => $this->trackingData($order)
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Show One Order — Limited Public Tracking
    |--------------------------------------------------------------------------
    */

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->with(['items.product.images'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $this->trackingData($order),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Explicitly Allowed Public Tracking Fields
    |--------------------------------------------------------------------------
    */

    private function trackingData(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_status' => $order->order_status,
            'created_at' => $order->created_at,
            'confirmed_at' => $order->confirmed_at,
            'out_for_delivery_at' => $order->out_for_delivery_at,
            'delivered_at' => $order->delivered_at,
            'cancelled_at' => $order->cancelled_at,
            'items' => $order->items->map(function ($item) {
                $product = $item->product;

                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'product' => $product ? [
                        'slug' => $product->slug,
                        'images' => $product->images->map(
                            fn ($image) => [
                                'image_path' => $image->image_path,
                                'is_primary' => $image->is_primary,
                            ]
                        )->values()->all(),
                    ] : null,
                ];
            })->values()->all(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Unique Order Number
    |--------------------------------------------------------------------------
    */

    private function generateOrderNumber(): string
    {
        do {
            $orderNumber =
                'JSB-' .
                now()->format('Ymd') .
                '-' .
                strtoupper(Str::random(6));
        } while (
            Order::where(
                'order_number',
                $orderNumber
            )->exists()
        );

        return $orderNumber;
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Uganda Phone Number
    |--------------------------------------------------------------------------
    */

    private function normalizePhone(
        string $phone
    ): string {
        $phone = preg_replace(
            '/\D+/',
            '',
            $phone
        );

        // 07XXXXXXXX -> 2567XXXXXXXX
        if (
            strlen($phone) === 10 &&
            str_starts_with($phone, '0')
        ) {
            return '256' . substr($phone, 1);
        }

        // 7XXXXXXXX -> 2567XXXXXXXX
        if (
            strlen($phone) === 9 &&
            str_starts_with($phone, '7')
        ) {
            return '256' . $phone;
        }

        // Already in international format
        if (
            strlen($phone) === 12 &&
            str_starts_with($phone, '256')
        ) {
            return $phone;
        }

        return $phone;
    }
}

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
                'in:mobile_money,momo_pay,bank_transfer,cash_on_delivery,pay_on_pickup',
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

        $order = DB::transaction(function () use ($validated) {
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

            /*
            |--------------------------------------------------------------------------
            | Normalize Customer Phone Number
            |--------------------------------------------------------------------------
            |
            | New orders are stored in one consistent format.
            |
            | Example:
            | 0706772881      -> 256706772881
            | +256706772881   -> 256706772881
            | 256706772881    -> 256706772881
            |
            */

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
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Guest Customer Orders
    |--------------------------------------------------------------------------
    |
    | Customers are currently checking out as guests.
    |
    | They can enter the same phone number they used during checkout
    | to retrieve their orders.
    |
    */

    public function customerOrders(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:50',
            ],
        ]);

        $normalizedPhone = $this->normalizePhone(
            $validated['phone']
        );

        /*
        |--------------------------------------------------------------------------
        | Phone Variations
        |--------------------------------------------------------------------------
        |
        | Older orders may have been stored before phone normalization
        | was introduced.
        |
        | Therefore we search the common Ugandan formats as well.
        |
        */

        $localPhone = $normalizedPhone;

        if (str_starts_with($normalizedPhone, '256')) {
            $localPhone =
                '0' . substr($normalizedPhone, 3);
        }

        $internationalPhone =
            '+' . $normalizedPhone;

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
            ->with([
                'items.product.images',
                'items.variant',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'count' => $orders->count(),
            'data' => $orders,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Show One Order
    |--------------------------------------------------------------------------
    */

    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->with([
                'items.product.images',
                'items.variant',
                'payments',
            ])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
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
        /*
        |--------------------------------------------------------------------------
        | Remove spaces and other characters
        |--------------------------------------------------------------------------
        */

        $phone = preg_replace(
            '/\D+/',
            '',
            $phone
        );

        /*
        |--------------------------------------------------------------------------
        | 07XXXXXXXX -> 2567XXXXXXXX
        |--------------------------------------------------------------------------
        */

        if (
            strlen($phone) === 10 &&
            str_starts_with($phone, '0')
        ) {
            return '256' . substr($phone, 1);
        }

        /*
        |--------------------------------------------------------------------------
        | 7XXXXXXXX -> 2567XXXXXXXX
        |--------------------------------------------------------------------------
        */

        if (
            strlen($phone) === 9 &&
            str_starts_with($phone, '7')
        ) {
            return '256' . $phone;
        }

        /*
        |--------------------------------------------------------------------------
        | Already 256XXXXXXXXX
        |--------------------------------------------------------------------------
        */

        if (
            strlen($phone) === 12 &&
            str_starts_with($phone, '256')
        ) {
            return $phone;
        }

        /*
        |--------------------------------------------------------------------------
        | Return cleaned number as fallback
        |--------------------------------------------------------------------------
        */

        return $phone;
    }
}
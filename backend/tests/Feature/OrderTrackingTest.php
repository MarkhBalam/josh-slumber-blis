<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    private function createSampleOrder(
        string $orderNumber = 'JSB-TRACK-TEST-001',
        string $phone = '256700123456'
    ): Order {
        return Order::create([
            'order_number' => $orderNumber,
            'customer_name' => 'Private Test Customer',
            'phone' => $phone,
            'email' => 'private@example.com',
            'delivery_address' => 'Private Delivery Address',
            'district' => 'Kampala',
            'delivery_notes' => 'Private delivery instructions',
            'subtotal' => 150000,
            'delivery_fee' => 0,
            'total' => 150000,
            'payment_method' => 'cash_on_delivery',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash(
                'sha256',
                bin2hex(random_bytes(32))
            ),
        ]);
    }

    private function assertPrivateFieldsHidden(array $data): void
    {
        foreach ([
            'customer_name',
            'phone',
            'email',
            'delivery_address',
            'district',
            'delivery_notes',
            'subtotal',
            'delivery_fee',
            'total',
            'payment_method',
            'payment_status',
            'payment_access_token_hash',
            'payments',
        ] as $field) {
            $this->assertArrayNotHasKey($field, $data);
        }
    }

    public function test_customer_can_find_orders_by_phone(): void
    {
        $order = $this->createSampleOrder();

        $response = $this->postJson('/api/orders/customer', [
            'phone' => '0700123456',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath(
            'data.0.order_number',
            $order->order_number
        );

        $this->assertPrivateFieldsHidden(
            $response->json('data.0')
        );
    }

    public function test_customer_can_view_limited_order_tracking(): void
    {
        $order = $this->createSampleOrder();

        $response = $this->getJson(
            '/api/orders/' . $order->order_number
        );

        $response->assertOk();
        $response->assertJsonPath(
            'data.order_number',
            $order->order_number
        );
        $response->assertJsonPath(
            'data.order_status',
            'pending'
        );

        $this->assertPrivateFieldsHidden(
            $response->json('data')
        );
    }

    public function test_unknown_order_returns_not_found(): void
    {
        $response = $this->getJson(
            '/api/orders/JSB-DOES-NOT-EXIST'
        );

        $response->assertNotFound();
    }

    public function test_phone_lookup_requires_phone_number(): void
    {
        $response = $this->postJson(
            '/api/orders/customer',
            []
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('phone');
    }

    public function test_phone_lookup_does_not_return_other_customers_orders(): void
    {
        $this->createSampleOrder(
            'JSB-TRACK-TEST-001',
            '256700123456'
        );

        $this->createSampleOrder(
            'JSB-TRACK-TEST-002',
            '256711222333'
        );

        $response = $this->postJson('/api/orders/customer', [
            'phone' => '0700123456',
        ]);

        $response->assertOk();
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath(
            'data.0.order_number',
            'JSB-TRACK-TEST-001'
        );
    }
}

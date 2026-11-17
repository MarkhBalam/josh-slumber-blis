<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private function createOrder(string $token): Order
    {
        return Order::create([
            'order_number' => 'JSB-CONFIRM-TEST-001',
            'customer_name' => 'Private Test Customer',
            'phone' => '256700123456',
            'email' => 'private@example.com',
            'delivery_address' => 'Private Delivery Address',
            'district' => 'Kampala',
            'delivery_notes' => 'Private instructions',
            'subtotal' => 150000,
            'delivery_fee' => 0,
            'total' => 150000,
            'payment_method' => 'cash_on_delivery',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);
    }

    public function test_valid_token_returns_confirmation_details(): void
    {
        $token = bin2hex(random_bytes(32));
        $order = $this->createOrder($token);

        $response = $this->postJson('/api/orders/confirmation', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_number', $order->order_number)
            ->assertJsonPath('data.payment_method', 'cash_on_delivery')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.order_status', 'pending');

        foreach ([
            'customer_name',
            'phone',
            'email',
            'delivery_address',
            'district',
            'delivery_notes',
            'total',
            'payment_access_token_hash',
        ] as $field) {
            $this->assertArrayNotHasKey($field, $response->json('data'));
        }
    }

    public function test_invalid_token_is_rejected(): void
    {
        $this->createOrder(bin2hex(random_bytes(32)));

        $this->postJson('/api/orders/confirmation', [
            'order_number' => 'JSB-CONFIRM-TEST-001',
            'payment_access_token' => str_repeat('a', 64),
        ])->assertForbidden();
    }

    public function test_unknown_order_is_rejected(): void
    {
        $this->postJson('/api/orders/confirmation', [
            'order_number' => 'JSB-UNKNOWN',
            'payment_access_token' => bin2hex(random_bytes(32)),
        ])->assertForbidden();
    }

    public function test_missing_credentials_are_rejected(): void
    {
        $this->postJson('/api/orders/confirmation', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'order_number',
                'payment_access_token',
            ]);
    }
}

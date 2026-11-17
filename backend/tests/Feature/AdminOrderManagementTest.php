<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrderManagementTest extends TestCase
{
    use RefreshDatabase;

    private function createOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'order_number' => 'JSB-ADMIN-TEST-' . strtoupper(bin2hex(random_bytes(4))),
            'customer_name' => 'Test Customer',
            'phone' => '256700123456',
            'email' => 'test@example.com',
            'delivery_address' => 'Test Address',
            'district' => 'Kampala',
            'delivery_notes' => 'Test order only',
            'subtotal' => 150000,
            'delivery_fee' => 0,
            'total' => 150000,
            'payment_method' => 'cash_on_delivery',
            'payment_status' => 'pending',
            'order_status' => 'pending',
        ], $overrides));
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(
            User::factory()->create(['is_admin' => true])
        );
    }

    public function test_guest_cannot_access_admin_orders(): void
    {
        $this->getJson('/api/admin/orders')
            ->assertUnauthorized();
    }

    public function test_guest_cannot_collect_cod_payment(): void
    {
        $order = $this->createOrder();

        $this->postJson(
            "/api/admin/orders/{$order->id}/collect-payment",
            ['confirm_collected' => true]
        )->assertUnauthorized();

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_non_admin_cannot_access_admin_orders_or_collect_payment(): void
    {
        $order = $this->createOrder();

        Sanctum::actingAs(
            User::factory()->create(['is_admin' => false])
        );

        $this->getJson('/api/admin/orders')
            ->assertForbidden();

        $this->postJson(
            "/api/admin/orders/{$order->id}/collect-payment",
            ['confirm_collected' => true]
        )->assertForbidden();

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_admin_can_view_orders(): void
    {
        $order = $this->createOrder();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'order_number' => $order->order_number,
            ]);
    }

    public function test_valid_order_transition_records_confirmation_timestamp(): void
    {
        $order = $this->createOrder();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/orders/{$order->id}", [
            'order_status' => 'confirmed',
        ])->assertOk()
            ->assertJsonPath('data.order_status', 'confirmed');

        $order->refresh();

        $this->assertNotNull($order->confirmed_at);
    }

    public function test_invalid_order_transition_is_rejected(): void
    {
        $order = $this->createOrder();
        $this->actingAsAdmin();

        $this->putJson("/api/admin/orders/{$order->id}", [
            'order_status' => 'delivered',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('order_status');

        $this->assertSame('pending', $order->fresh()->order_status);
    }

    public function test_payment_status_cannot_be_manually_updated(): void
    {
        $order = $this->createOrder([
            'payment_method' => 'pesapal',
        ]);

        $this->actingAsAdmin();

        $this->putJson("/api/admin/orders/{$order->id}", [
            'order_status' => 'confirmed',
            'payment_status' => 'paid',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('payment_status');

        $order->refresh();

        $this->assertSame('pending', $order->payment_status);
        $this->assertSame('pending', $order->order_status);
    }

    public function test_cod_collection_creates_payment_record(): void
    {
        $order = $this->createOrder();
        $this->actingAsAdmin();

        $this->postJson(
            "/api/admin/orders/{$order->id}/collect-payment",
            ['confirm_collected' => true]
        )->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $order->refresh();
        $payment = Payment::where('order_id', $order->id)->firstOrFail();

        $this->assertSame('paid', $order->payment_status);
        $this->assertNotNull($order->paid_at);
        $this->assertSame('cash_on_delivery', $payment->method);
        $this->assertSame('paid', $payment->status);
        $this->assertSame('manual_cod', $payment->provider);
        $this->assertSame('UGX', $payment->currency);
        $this->assertEquals(150000, $payment->amount);
        $this->assertNotNull($payment->paid_at);
        $this->assertStringStartsWith(
            'JSB-COD-',
            $payment->transaction_reference
        );
    }

    public function test_cod_payment_cannot_be_collected_twice(): void
    {
        $order = $this->createOrder();
        $this->actingAsAdmin();

        $endpoint = "/api/admin/orders/{$order->id}/collect-payment";

        $this->postJson($endpoint, [
            'confirm_collected' => true,
        ])->assertOk();

        $this->postJson($endpoint, [
            'confirm_collected' => true,
        ])->assertUnprocessable();

        $this->assertSame(
            1,
            Payment::where('order_id', $order->id)->count()
        );
    }

    public function test_cancelled_order_cannot_collect_cod_payment(): void
    {
        $order = $this->createOrder([
            'order_status' => 'cancelled',
        ]);

        $this->actingAsAdmin();

        $this->postJson(
            "/api/admin/orders/{$order->id}/collect-payment",
            ['confirm_collected' => true]
        )->assertUnprocessable();

        $this->assertDatabaseCount('payments', 0);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PesapalInitializationTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_order_cannot_initialize_another_payment(): void
    {
        $token = str_repeat('a', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-001',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'paid',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        $response = $this->postJson('/api/payments/initialize', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertStatus(409);

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_failed_payment_can_create_new_attempt_on_same_order(): void
    {
        $token = str_repeat('b', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-002',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        $previous = \App\Models\Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => 100000,
            'transaction_reference' => 'JSB-OLD-ATTEMPT',
            'status' => 'failed',
            'provider' => 'pesapal',
            'provider_transaction_id' =>
                '00000000-0000-4000-8000-000000000001',
            'currency' => 'UGX',
        ]);

        config()->set('services.payment_gateway', 'pesapal');

        $gateway = \Mockery::mock(
            \App\Services\Payments\PesapalGateway::class
        );

        $gateway->shouldReceive('verify')
            ->once()
            ->with($previous->provider_transaction_id)
            ->andReturn([
                'provider' => 'pesapal',
                'provider_transaction_id' =>
                    $previous->provider_transaction_id,
                'transaction_reference' =>
                    $previous->transaction_reference,
                'status' => 'failed',
                'amount' => 100000,
                'currency' => 'UGX',
            ]);

        $gateway->shouldReceive('initialize')
            ->once()
            ->andReturnUsing(function ($receivedOrder, $reference) use ($order) {
                $this->assertSame($order->id, $receivedOrder->id);

                return [
                    'provider' => 'pesapal',
                    'provider_transaction_id' =>
                        '00000000-0000-4000-8000-000000000002',
                    'transaction_reference' => $reference,
                    'checkout_url' =>
                        'https://cybqa.pesapal.com/test-checkout',
                    'status' => 'pending',
                ];
            });

        $this->app->instance(
            \App\Services\Payments\PesapalGateway::class,
            $gateway
        );

        $response = $this->postJson('/api/payments/initialize', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseCount('payments', 2);
        $this->assertSame('failed', $previous->fresh()->status);
    }


    public function test_retry_rechecks_failed_attempt_and_blocks_if_provider_reports_paid(): void
    {
        $token = str_repeat('c', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-003',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        $previous = \App\Models\Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => 100000,
            'transaction_reference' => 'JSB-OLD-ATTEMPT-PAID',
            'status' => 'failed',
            'provider' => 'pesapal',
            'provider_transaction_id' =>
                '00000000-0000-4000-8000-000000000003',
            'currency' => 'UGX',
        ]);

        config()->set('services.payment_gateway', 'pesapal');

        $gateway = \Mockery::mock(
            \App\Services\Payments\PesapalGateway::class
        );

        $gateway->shouldReceive('verify')
            ->once()
            ->with($previous->provider_transaction_id)
            ->andReturn([
                'provider' => 'pesapal',
                'provider_transaction_id' =>
                    $previous->provider_transaction_id,
                'transaction_reference' =>
                    $previous->transaction_reference,
                'status' => 'paid',
                'amount' => 100000,
                'currency' => 'UGX',
            ]);

        $gateway->shouldNotReceive('initialize');

        $this->app->instance(
            \App\Services\Payments\PesapalGateway::class,
            $gateway
        );

        $response = $this->postJson('/api/payments/initialize', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseCount('payments', 1);
        $this->assertSame('paid', $previous->fresh()->status);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }


    public function test_existing_pending_checkout_is_reused_without_creating_another_payment(): void
    {
        $token = str_repeat('d', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-004',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        $checkoutUrl = 'https://cybqa.pesapal.com/existing-checkout';

        $previous = \App\Models\Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => 100000,
            'transaction_reference' => 'JSB-EXISTING-CHECKOUT',
            'status' => 'pending',
            'provider' => 'pesapal',
            'provider_transaction_id' =>
                '00000000-0000-4000-8000-000000000004',
            'checkout_url' => $checkoutUrl,
            'currency' => 'UGX',
        ]);

        config()->set('services.payment_gateway', 'pesapal');

        $gateway = \Mockery::mock(
            \App\Services\Payments\PesapalGateway::class
        );

        $gateway->shouldReceive('verify')
            ->once()
            ->with($previous->provider_transaction_id)
            ->andReturn([
                'provider' => 'pesapal',
                'provider_transaction_id' =>
                    $previous->provider_transaction_id,
                'transaction_reference' =>
                    $previous->transaction_reference,
                'status' => 'pending',
                'amount' => 100000,
                'currency' => 'UGX',
            ]);

        $gateway->shouldNotReceive('initialize');

        $this->app->instance(
            \App\Services\Payments\PesapalGateway::class,
            $gateway
        );

        $response = $this->postJson('/api/payments/initialize', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.checkout_url', $checkoutUrl);

        $this->assertDatabaseCount('payments', 1);
        $this->assertSame('pending', $previous->fresh()->status);
    }


    public function test_initialize_is_blocked_while_another_request_holds_order_lock(): void
    {
        $token = str_repeat('e', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-005',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        config()->set('services.payment_gateway', 'pesapal');

        $gateway = \Mockery::mock(
            \App\Services\Payments\PesapalGateway::class
        );

        $gateway->shouldNotReceive('initialize');
        $gateway->shouldNotReceive('verify');

        $this->app->instance(
            \App\Services\Payments\PesapalGateway::class,
            $gateway
        );

        $lock = \Illuminate\Support\Facades\Cache::lock(
            'jsb:payment-initialize:' . $order->id,
            120
        );

        $this->assertTrue($lock->get());

        try {
            $response = $this->postJson('/api/payments/initialize', [
                'order_number' => $order->order_number,
                'payment_access_token' => $token,
            ]);

            $response->assertStatus(409);
            $this->assertDatabaseCount('payments', 0);
        } finally {
            $lock->release();
        }
    }


    public function test_open_reconciliation_alert_blocks_payment_initialization(): void
    {
        $token = str_repeat('f', 64);

        $order = Order::create([
            'order_number' => 'JSB-RETRY-TEST-006',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_access_token_hash' => hash('sha256', $token),
        ]);

        $payment = \App\Models\Payment::create([
            'order_id' => $order->id,
            'method' => 'card',
            'amount' => 100000,
            'transaction_reference' => 'JSB-ALERT-TEST-001',
            'status' => 'failed',
            'provider' => 'pesapal',
            'provider_transaction_id' =>
                '00000000-0000-4000-8000-000000000006',
            'currency' => 'UGX',
        ]);

        \App\Models\PaymentReconciliationAlert::create([
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'provider' => 'pesapal',
            'provider_transaction_id' =>
                $payment->provider_transaction_id,
            'reported_status' => 'paid',
            'reason' => 'order_already_paid',
            'status' => 'open',
        ]);

        config()->set('services.payment_gateway', 'pesapal');

        $gateway = \Mockery::mock(
            \App\Services\Payments\PesapalGateway::class
        );

        $gateway->shouldNotReceive('initialize');
        $gateway->shouldNotReceive('verify');

        $this->app->instance(
            \App\Services\Payments\PesapalGateway::class,
            $gateway
        );

        $response = $this->postJson('/api/payments/initialize', [
            'order_number' => $order->order_number,
            'payment_access_token' => $token,
        ]);

        $response->assertStatus(409);

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('payment_reconciliation_alerts', 1);
    }

}

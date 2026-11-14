<?php

namespace Tests\Feature;

use App\Services\Payments\PesapalGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class PesapalGatewayTest extends TestCase
{
    private const TRACKING_ID = '00000000-0000-4000-8000-000000000001';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.pesapal.environment', 'sandbox');
        config()->set('services.pesapal.consumer_key', 'test-key');
        config()->set('services.pesapal.consumer_secret', 'test-secret');
        config()->set(
            'services.pesapal.sandbox_url',
            'https://cybqa.pesapal.com/pesapalv3/api'
        );
    }

    private function fakePesapalResponse(array $transaction): void
    {
        Http::preventStrayRequests();

        Http::fake([
            '*/Auth/RequestToken' => Http::response([
                'token' => 'fake-access-token',
            ], 200),

            '*/Transactions/GetTransactionStatus*' =>
                Http::response($transaction, 200),
        ]);
    }

    public function test_successful_payment_initialization(): void
    {
        config()->set(
            'services.pesapal.ipn_id',
            '619e7110-6d4a-40ae-867d-d9aa8ed9126e'
        );

        config()->set(
            'services.pesapal.callback_url',
            'https://example.com/api/payments/callback/pesapal'
        );

        Http::preventStrayRequests();

        Http::fake([
            '*/Auth/RequestToken' => Http::response([
                'token' => 'fake-access-token',
            ], 200),

            '*/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id' => self::TRACKING_ID,
                'merchant_reference' => 'JSB-TEST-REF-001',
                'redirect_url' =>
                    'https://cybqa.pesapal.com/pesapaliframe/checkout',
                'error' => null,
                'status' => '200',
            ], 200),
        ]);

        $order = new \App\Models\Order();

        $order->forceFill([
            'order_number' => 'JSB-TEST-001',
            'customer_name' => 'Pesapal Sandbox Test',
            'phone' => '256700000000',
            'email' => 'sandbox@example.com',
            'delivery_address' => 'Test Address',
            'district' => 'Kampala',
            'total' => 221000,
        ]);

        $result = (new PesapalGateway())->initialize(
            $order,
            'JSB-TEST-REF-001'
        );

        $this->assertSame('pesapal', $result['provider']);
        $this->assertSame('pending', $result['status']);
        $this->assertSame(
            self::TRACKING_ID,
            $result['provider_transaction_id']
        );
        $this->assertSame(
            'JSB-TEST-REF-001',
            $result['transaction_reference']
        );
        $this->assertSame(
            'https://cybqa.pesapal.com/pesapaliframe/checkout',
            $result['checkout_url']
        );
    }

    public function test_initialization_rejects_mismatched_merchant_reference(): void
    {
        config()->set(
            'services.pesapal.ipn_id',
            '619e7110-6d4a-40ae-867d-d9aa8ed9126e'
        );

        config()->set(
            'services.pesapal.callback_url',
            'https://example.com/api/payments/callback/pesapal'
        );

        Http::preventStrayRequests();

        Http::fake([
            '*/Auth/RequestToken' => Http::response([
                'token' => 'fake-access-token',
            ], 200),

            '*/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id' => self::TRACKING_ID,
                'merchant_reference' => 'JSB-WRONG-REFERENCE',
                'redirect_url' =>
                    'https://cybqa.pesapal.com/pesapaliframe/checkout',
                'error' => null,
                'status' => '200',
            ], 200),
        ]);

        $order = new \App\Models\Order();

        $order->forceFill([
            'order_number' => 'JSB-TEST-001',
            'customer_name' => 'Pesapal Sandbox Test',
            'phone' => '256700000000',
            'email' => 'sandbox@example.com',
            'delivery_address' => 'Test Address',
            'district' => 'Kampala',
            'total' => 221000,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Pesapal returned an invalid payment response.'
        );

        (new PesapalGateway())->initialize(
            $order,
            'JSB-TEST-REF-001'
        );
    }

    public function test_initialization_rejects_pesapal_application_error(): void
    {
        Http::preventStrayRequests();

        Http::fake([
            '*/Auth/RequestToken' => Http::response([
                'token' => 'fake-access-token',
            ], 200),

            '*/Transactions/SubmitOrderRequest' => Http::response([
                'error' => [
                    'code' => 'TEST_ERROR',
                    'message' => 'Sandbox test rejection',
                ],
                'status' => '500',
            ], 200),
        ]);

        $order = new \App\Models\Order();

        $order->forceFill([
            'order_number' => 'JSB-TEST-001',
            'customer_name' => 'Pesapal Sandbox Test',
            'phone' => '256700000000',
            'email' => 'sandbox@example.com',
            'delivery_address' => 'Test Address',
            'district' => 'Kampala',
            'total' => 221000,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Pesapal returned an invalid payment response.'
        );

        (new PesapalGateway())->initialize(
            $order,
            'JSB-TEST-REF-001'
        );
    }

    public function test_successful_transaction_is_mapped_to_paid(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 1,
            'payment_status_description' => 'Completed',
            'merchant_reference' => 'JSB-TEST-REF-001',
            'amount' => 100000,
            'currency' => 'UGX',
            'confirmation_code' => 'TEST-CONFIRMATION',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertSame('paid', $result['status']);
        $this->assertSame('pesapal', $result['provider']);
        $this->assertSame(self::TRACKING_ID, $result['provider_transaction_id']);
        $this->assertSame('JSB-TEST-REF-001', $result['transaction_reference']);
        $this->assertEquals(100000, $result['amount']);
        $this->assertSame('UGX', $result['currency']);
    }

    public function test_invalid_transaction_is_mapped_to_unknown(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 0,
            'merchant_reference' => 'JSB-TEST-REF-001',
            'amount' => 100000,
            'currency' => 'UGX',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertSame('unknown', $result['status']);
    }

    public function test_failed_transaction_is_mapped_correctly(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 2,
            'merchant_reference' => 'JSB-TEST-REF-001',
            'amount' => 100000,
            'currency' => 'UGX',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertSame('failed', $result['status']);
    }

    public function test_reversed_transaction_is_mapped_correctly(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 3,
            'merchant_reference' => 'JSB-TEST-REF-001',
            'amount' => 100000,
            'currency' => 'UGX',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertSame('reversed', $result['status']);
    }

    public function test_unknown_status_is_not_treated_as_paid(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 99,
            'merchant_reference' => 'JSB-TEST-REF-001',
            'amount' => 100000,
            'currency' => 'UGX',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertSame('unknown', $result['status']);
    }

    public function test_missing_amount_and_currency_are_not_invented(): void
    {
        $this->fakePesapalResponse([
            'status_code' => 1,
            'merchant_reference' => 'JSB-TEST-REF-001',
        ]);

        $result = (new PesapalGateway())->verify(self::TRACKING_ID);

        $this->assertNull($result['amount']);
        $this->assertNull($result['currency']);
    }

    public function test_invalid_tracking_id_is_rejected(): void
    {
        Http::preventStrayRequests();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Invalid Pesapal tracking ID.');

        (new PesapalGateway())->verify('INVALID-ID');
    }

    public function test_authentication_failure_is_rejected(): void
    {
        Http::preventStrayRequests();

        Http::fake([
            '*/Auth/RequestToken' => Http::response([
                'message' => 'Unauthorized',
            ], 401),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Pesapal authentication failed.');

        (new PesapalGateway())->verify(self::TRACKING_ID);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PesapalGateway;
use App\Services\Payments\PesapalVerificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class PesapalVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function createTestPayment(): Payment
    {
        $order = Order::create([
            'order_number' => 'JSB-TEST-001',
            'customer_name' => 'Test Customer',
            'phone' => '0700000000',
            'email' => 'test@example.com',
            'delivery_address' => 'Kampala',
            'district' => 'Kampala',
            'subtotal' => 100000,
            'delivery_fee' => 0,
            'total' => 100000,
            'payment_method' => 'mtn_mobile_money',
            'payment_status' => 'pending',
            'order_status' => 'pending',
        ]);

        return Payment::create([
            'order_id' => $order->id,
            'method' => 'mtn_mobile_money',
            'amount' => 100000,
            'transaction_reference' => 'JSB-TEST-REF-001',
            'provider' => 'pesapal',
            'provider_transaction_id' => '00000000-0000-4000-8000-000000000001',
            'currency' => 'UGX',
            'status' => 'pending',
        ]);
    }

    private function verifyWithResponse(
        Payment $payment,
        string $status = 'paid',
        float $amount = 100000,
        string $currency = 'UGX'
    ): array {
        $gateway = Mockery::mock(PesapalGateway::class);

        $gateway->shouldReceive('verify')
            ->once()
            ->with($payment->provider_transaction_id)
            ->andReturn([
                'provider' => 'pesapal',
                'provider_transaction_id' => $payment->provider_transaction_id,
                'transaction_reference' => $payment->transaction_reference,
                'status' => $status,
                'amount' => $amount,
                'currency' => $currency,
            ]);

        return (new PesapalVerificationService($gateway))
            ->verify($payment);
    }

    public function test_successful_payment_updates_order_and_payment(): void
    {
        $payment = $this->createTestPayment();

        $result = $this->verifyWithResponse($payment);

        $this->assertSame('paid', $result['status']);
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('paid', $payment->order->fresh()->payment_status);
        $this->assertNotNull($payment->fresh()->paid_at);
        $this->assertNotNull($payment->order->fresh()->paid_at);
    }

    public function test_incorrect_amount_does_not_mark_order_paid(): void
    {
        $payment = $this->createTestPayment();

        try {
            $this->verifyWithResponse($payment, 'paid', 50000);
            $this->fail('Expected amount mismatch exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Pesapal transaction amount mismatch.',
                $exception->getMessage()
            );
        }

        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertSame('pending', $payment->order->fresh()->payment_status);
    }

    public function test_pending_payment_does_not_mark_order_paid(): void
    {
        $payment = $this->createTestPayment();

        $result = $this->verifyWithResponse($payment, 'pending');

        $this->assertSame('pending', $result['status']);
        $this->assertSame('pending', $payment->order->fresh()->payment_status);
    }

    public function test_failed_payment_does_not_mark_order_paid(): void
    {
        $payment = $this->createTestPayment();

        $result = $this->verifyWithResponse($payment, 'failed');

        $this->assertSame('failed', $result['status']);
        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertSame('pending', $payment->order->fresh()->payment_status);
    }

    public function test_repeated_successful_verification_is_idempotent(): void
    {
        $payment = $this->createTestPayment();

        $first = $this->verifyWithResponse($payment);
        $originalPaidAt = $payment->fresh()->paid_at->toDateTimeString();

        $second = $this->verifyWithResponse($payment);

        $this->assertSame('paid', $first['status']);
        $this->assertSame('paid', $second['status']);
        $this->assertSame(
            $originalPaidAt,
            $payment->fresh()->paid_at->toDateTimeString()
        );
        $this->assertSame('paid', $payment->order->fresh()->payment_status);
    }

    public function test_reversed_paid_payment_requires_reconciliation(): void
    {
        $payment = $this->createTestPayment();

        $this->verifyWithResponse($payment, 'paid');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'Previously paid transaction has conflicting provider status; manual reconciliation required.'
        );

        $this->verifyWithResponse($payment, 'reversed');
    }


    public function test_incorrect_currency_does_not_mark_order_paid(): void
    {
        $payment = $this->createTestPayment();

        try {
            $this->verifyWithResponse($payment, 'paid', 100000, 'USD');
            $this->fail('Expected currency mismatch exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Pesapal transaction identity mismatch.',
                $exception->getMessage()
            );
        }

        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertSame('pending', $payment->order->fresh()->payment_status);
    }

    public function test_incorrect_merchant_reference_does_not_mark_order_paid(): void
    {
        $payment = $this->createTestPayment();

        $gateway = Mockery::mock(PesapalGateway::class);

        $gateway->shouldReceive('verify')
            ->once()
            ->with($payment->provider_transaction_id)
            ->andReturn([
                'provider' => 'pesapal',
                'provider_transaction_id' => $payment->provider_transaction_id,
                'transaction_reference' => 'JSB-DIFFERENT-ORDER',
                'status' => 'paid',
                'amount' => 100000,
                'currency' => 'UGX',
            ]);

        try {
            (new PesapalVerificationService($gateway))->verify($payment);
            $this->fail('Expected merchant reference mismatch exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Pesapal transaction identity mismatch.',
                $exception->getMessage()
            );
        }

        $this->assertSame('pending', $payment->fresh()->status);
        $this->assertSame('pending', $payment->order->fresh()->payment_status);
    }


    public function test_failed_after_paid_requires_reconciliation(): void
    {
        $payment = $this->createTestPayment();

        $this->verifyWithResponse($payment, 'paid');

        try {
            $this->verifyWithResponse($payment, 'failed');
            $this->fail('Expected reconciliation exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Previously paid transaction has conflicting provider status; manual reconciliation required.',
                $exception->getMessage()
            );
        }

        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('paid', $payment->order->fresh()->payment_status);
    }

}

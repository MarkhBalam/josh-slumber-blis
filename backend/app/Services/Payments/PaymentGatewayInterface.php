<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Initiate an online payment.
     *
     * Returns normalized payment information,
     * including the provider checkout URL.
     */
    public function initialize(
        Order $order,
        string $transactionReference
    ): array;

    /**
     * Verify a transaction directly with the provider.
     *
     * The returned information must allow our application
     * to verify transaction status, amount, currency,
     * and transaction reference.
     */
    public function verify(
        string $transactionReference
    ): array;
}

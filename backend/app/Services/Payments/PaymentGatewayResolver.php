<?php

namespace App\Services\Payments;

use InvalidArgumentException;
use RuntimeException;

class PaymentGatewayResolver
{
    /**
     * Resolve the currently configured payment gateway.
     *
     * The selected gateway comes from:
     * config('services.payment_gateway')
     */
    public function resolve(): PaymentGatewayInterface
    {
        $gateway = config('services.payment_gateway');

        if (empty($gateway)) {
            throw new RuntimeException(
                'No payment gateway has been configured.'
            );
        }

        return match ($gateway) {
            'flutterwave' => $this->resolveFlutterwave(),
            'pesapal' => $this->resolvePesapal(),

            default => throw new InvalidArgumentException(
                "Unsupported payment gateway: {$gateway}"
            ),
        };
    }

    /**
     * Resolve Flutterwave implementation.
     */
    private function resolveFlutterwave(): PaymentGatewayInterface
    {
        if (! class_exists(FlutterwaveGateway::class)) {
            throw new RuntimeException(
                'Flutterwave integration is not installed yet.'
            );
        }

        return app(FlutterwaveGateway::class);
    }

    /**
     * Resolve Pesapal implementation.
     */
    private function resolvePesapal(): PaymentGatewayInterface
    {
        if (! class_exists(PesapalGateway::class)) {
            throw new RuntimeException(
                'Pesapal integration is not installed yet.'
            );
        }

        return app(PesapalGateway::class);
    }
}

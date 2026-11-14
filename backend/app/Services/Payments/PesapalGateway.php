<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PesapalGateway implements PaymentGatewayInterface
{
    private string $baseUrl;

    public function __construct()
    {
        $environment = config(
            'services.pesapal.environment',
            'sandbox'
        );

        if (! in_array($environment, ['sandbox', 'production'], true)) {
            throw new RuntimeException(
                'Invalid Pesapal environment.'
            );
        }

        $this->baseUrl = rtrim(
            (string) config(
                $environment === 'sandbox'
                    ? 'services.pesapal.sandbox_url'
                    : 'services.pesapal.production_url'
            ),
            '/'
        );

        if ($this->baseUrl === '') {
            throw new RuntimeException(
                'Pesapal API URL is not configured.'
            );
        }
    }

    /**
     * Request a short-lived API access token.
     */
    public function authenticate(): string
    {
        $consumerKey = config(
            'services.pesapal.consumer_key'
        );

        $consumerSecret = config(
            'services.pesapal.consumer_secret'
        );

        if (empty($consumerKey) || empty($consumerSecret)) {
            throw new RuntimeException(
                'Pesapal credentials are missing.'
            );
        }

        $response = Http::acceptJson()
            ->asJson()
            ->timeout(30)
            ->post(
                $this->baseUrl . '/Auth/RequestToken',
                [
                    'consumer_key' => $consumerKey,
                    'consumer_secret' => $consumerSecret,
                ]
            );

        if (! $response->successful()) {
            throw new RuntimeException(
                'Pesapal authentication failed.'
            );
        }

        $token = $response->json('token');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException(
                'Pesapal did not return a valid access token.'
            );
        }

        return $token;
    }

    /**
     * Initialize a Pesapal payment.
     *
     * This method is not yet called by PaymentController.
     */
    public function initialize(
        Order $order,
        string $transactionReference
    ): array {
        $ipnId = config('services.pesapal.ipn_id');

        $callbackUrl = config(
            'services.pesapal.callback_url'
        );

        if (empty($ipnId) || empty($callbackUrl)) {
            throw new RuntimeException(
                'Pesapal IPN ID and callback URL must be configured.'
            );
        }

        if (
            ! filter_var(
                $callbackUrl,
                FILTER_VALIDATE_URL
            ) ||
            ! str_starts_with($callbackUrl, 'https://')
        ) {
            throw new RuntimeException(
                'Pesapal callback URL must be a valid HTTPS URL.'
            );
        }

        if (
            ! preg_match(
                '/\A[A-Za-z0-9_.:-]{1,50}\z/',
                $transactionReference
            )
        ) {
            throw new RuntimeException(
                'Invalid Pesapal transaction reference.'
            );
        }

        $amount = $order->total;

        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new RuntimeException(
                'Order payment amount is invalid.'
            );
        }

        $customerName = trim(
            (string) $order->customer_name
        );

        $nameParts = preg_split(
            '/\s+/',
            $customerName,
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        $nameParts = array_values(array_filter(
            array_map(
                fn ($part) => preg_replace(
                    '/[^A-Za-z0-9_.:-]/',
                    '',
                    $part
                ),
                $nameParts ?: []
            ),
            fn ($part) => $part !== ''
        ));

        $firstName = $nameParts[0] ?? 'Customer';
        $lastName = count($nameParts) > 1
            ? $nameParts[count($nameParts) - 1]
            : $firstName;
        $middleName = count($nameParts) > 2
            ? implode('-', array_slice($nameParts, 1, -1))
            : $firstName;

        $billingAddress = [
            'phone_number' => (string) $order->phone,
            'email_address' => (string) ($order->email ?? ''),
            'country_code' => 'UG',
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'line_1' => substr(
                preg_replace(
                    '/[^A-Za-z0-9_.:-]+/',
                    '-',
                    trim((string) $order->delivery_address)
                ) ?: 'Kampala',
                0,
                100
            ),
            'line_2' => substr(
                preg_replace(
                    '/[^A-Za-z0-9_.:-]+/',
                    '-',
                    trim((string) ($order->district ?? ''))
                ) ?: 'Kampala',
                0,
                100
            ),
            'city' => substr(
                preg_replace(
                    '/[^A-Za-z0-9_.:-]+/',
                    '-',
                    trim((string) ($order->district ?? ''))
                ) ?: 'Kampala',
                0,
                100
            ),
            'state' => 'C',
            'postal_code' => 0,
            'zip_code' => 0,

        ];

        $payload = [
            'id' => $transactionReference,
            'currency' => config(
                'services.payments.currency',
                'UGX'
            ),
            'amount' => (float) $amount,
            'description' => 'Josh Slumber Bliss Order '
                . $order->order_number,
            'callback_url' => $callbackUrl,
            'notification_id' => $ipnId,
            'billing_address' => $billingAddress,
        ];

        $response = Http::withToken(
                $this->authenticate()
            )
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->post(
                $this->baseUrl
                    . '/Transactions/SubmitOrderRequest',
                $payload
            );

        if (! $response->successful()) {
            $body = $response->json();

            \Illuminate\Support\Facades\Log::warning(
                'Pesapal initialization HTTP request failed.',
                [
                    'http_status' => $response->status(),
                    'response_fields' => is_array($body)
                        ? array_keys($body)
                        : [],
                    'pesapal_status' => is_array($body)
                        ? ($body['status'] ?? null)
                        : null,
                    'pesapal_error_present' => is_array($body)
                        && ! empty($body['error']),
                ]
            );

            throw new RuntimeException(
                'Pesapal payment initialization failed.'
            );
        }

        $trackingId = $response->json(
            'order_tracking_id'
        );

        $redirectUrl = $response->json(
            'redirect_url'
        );

        $merchantReference = $response->json(
            'merchant_reference'
        );

        if (
            ! is_string($trackingId) ||
            $trackingId === '' ||
            ! is_string($redirectUrl) ||
            ! filter_var($redirectUrl, FILTER_VALIDATE_URL) ||
            ! str_starts_with($redirectUrl, 'https://') ||
            $merchantReference !== $transactionReference
        ) {
            $diagnostics = [
                'http_status' => $response->status(),
                'response_fields' => array_keys(
                    $response->json() ?? []
                ),
                'tracking_id_valid' => is_string($trackingId)
                    && $trackingId !== '',
                'redirect_url_valid' => is_string($redirectUrl)
                    && filter_var($redirectUrl, FILTER_VALIDATE_URL)
                    && str_starts_with($redirectUrl, 'https://'),
                'merchant_reference_matches' =>
                    $merchantReference === $transactionReference,
                'pesapal_status' => $response->json('status'),
                'pesapal_error_present' =>
                    ! empty($response->json('error')),
                'pesapal_error_type' => get_debug_type(
                    $response->json('error')
                ),
                'pesapal_error_fields' => is_array(
                    $response->json('error')
                ) ? array_keys($response->json('error')) : [],
                'pesapal_error_code' => is_scalar(
                    $response->json('error.code')
                ) ? substr(
                    (string) $response->json('error.code'),
                    0,
                    80
                ) : null,
                'pesapal_error_description' => is_string(
                    $response->json('error.message')
                ) ? preg_replace(
                    '/https?:\/\/\S+|[A-Za-z0-9+\/_=-]{40,}/',
                    '[REDACTED]',
                    substr($response->json('error.message'), 0, 250)
                ) : null,
            ];

            \Illuminate\Support\Facades\Log::warning(
                'Pesapal initialization response validation failed.',
                $diagnostics
            );

            throw new RuntimeException(
                'Pesapal returned an invalid payment response.'
            );
        }

        return [
            'provider' => 'pesapal',
            'transaction_reference' => $transactionReference,
            'provider_transaction_id' => $trackingId,
            'checkout_url' => $redirectUrl,
            'status' => 'pending',
        ];
    }

    /**
     * Independently verify a transaction with Pesapal.
     *
     * The argument is the Pesapal OrderTrackingId,
     * not our internal merchant reference.
     */
    public function verify(
        string $transactionReference
    ): array {
        if (
            ! preg_match(
                '/\A[0-9a-fA-F-]{36}\z/',
                $transactionReference
            )
        ) {
            throw new RuntimeException(
                'Invalid Pesapal tracking ID.'
            );
        }

        $response = Http::withToken(
                $this->authenticate()
            )
            ->acceptJson()
            ->timeout(30)
            ->get(
                $this->baseUrl
                    . '/Transactions/GetTransactionStatus',
                [
                    'orderTrackingId' => $transactionReference,
                ]
            );

        if (! $response->successful()) {
            throw new RuntimeException(
                'Unable to verify Pesapal transaction.'
            );
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new RuntimeException(
                'Invalid Pesapal verification response.'
            );
        }

        $statusCode = (string) (
            $data['status_code'] ?? ''
        );

        $status = match ($statusCode) {
            '1' => 'paid',
            '2' => 'failed',
            '3' => 'reversed',
            '0' => 'unknown',
            default => 'unknown',
        };

        return [
            'provider' => 'pesapal',
            'provider_transaction_id' => $transactionReference,
            'transaction_reference' => $data[
                'merchant_reference'
            ] ?? null,
            'status' => $status,
            'provider_status' => $data[
                'payment_status_description'
            ] ?? null,
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? null,
            'confirmation_code' => $data[
                'confirmation_code'
            ] ?? null,
        ];
    }
}

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | PAYMENT_GATEWAY determines which provider Laravel uses.
    |
    | Keep all credentials in .env.
    |
    */

    'payment_gateway' => env('PAYMENT_GATEWAY'),

    'payments' => [
        'default' => env('PAYMENT_GATEWAY'),
        'currency' => env('PAYMENT_CURRENCY', 'UGX'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Flutterwave
    |--------------------------------------------------------------------------
    */

    'flutterwave' => [
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'secret_hash' => env('FLUTTERWAVE_SECRET_HASH'),
        'base_url' => env(
            'FLUTTERWAVE_BASE_URL',
            'https://api.flutterwave.com/v3'
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pesapal API 3.0
    |--------------------------------------------------------------------------
    |
    | Sandbox is used for testing.
    |
    | Production must only be enabled after merchant
    | verification and successful integration testing.
    |
    */

    'pesapal' => [
        'consumer_key' => env('PESAPAL_CONSUMER_KEY'),

        'consumer_secret' => env('PESAPAL_CONSUMER_SECRET'),

        'ipn_id' => env('PESAPAL_IPN_ID'),

        'callback_url' => env('PESAPAL_CALLBACK_URL'),

        'environment' => env(
            'PESAPAL_ENVIRONMENT',
            'sandbox'
        ),

        'sandbox_url' => 'https://cybqa.pesapal.com/pesapalv3/api',

        'production_url' => 'https://pay.pesapal.com/v3/api',
    ],

];

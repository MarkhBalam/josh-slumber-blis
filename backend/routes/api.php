<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminHeroSlideController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\HeroSlideController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Categories
Route::get('/categories', [CategoryController::class, 'index']);

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);

// Search
Route::get('/search', [SearchController::class, 'index']);

// Homepage hero slides
Route::get('/hero-slides', [HeroSlideController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

Route::post('/orders', [OrderController::class, 'store']);

Route::post(
    '/orders/customer',
    [OrderController::class, 'customerOrders']
)->middleware('throttle:10,1');

Route::get(
    '/orders/{orderNumber}',
    [OrderController::class, 'show']
)->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Gateway-independent Payments
|--------------------------------------------------------------------------
|
| Payment initialization and verification use POST requests.
|
| This allows guest authorization tokens to be submitted
| in the request body rather than URL query parameters.
|
| Actual payment processing remains disabled until a
| supported gateway is fully integrated and configured.
|
| Webhook authenticity and transaction details must be
| verified before updating any payment or order status.
|
*/

// Initialize online payment
Route::post(
    '/payments/initialize',
    [PaymentController::class, 'initialize']
)->middleware('throttle:10,1');

// Verify online payment
Route::post(
    '/payments/verify',
    [PaymentController::class, 'verify']
)->middleware('throttle:30,1');

// Receive payment provider webhook
Route::match(
    ['get', 'post'],
    '/payments/webhook/{provider}',
    [PaymentController::class, 'webhook']
)->whereIn('provider', ['flutterwave', 'pesapal']);

// Pesapal customer return callback.
// A redirect is not proof of payment.
Route::get('/payments/callback/pesapal', function () {
    return redirect()->away(
        'http://localhost:3000/payment-return'
    );
});

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AdminAuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/admin/me', [AdminAuthController::class, 'me']);

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);

    // Product management
    Route::get('/admin/products', [AdminProductController::class, 'index']);

    Route::post('/admin/products', [AdminProductController::class, 'store']);

    Route::get('/admin/products/{product}', [AdminProductController::class, 'show']);

    Route::put('/admin/products/{product}', [AdminProductController::class, 'update']);

    Route::delete('/admin/products/{product}', [AdminProductController::class, 'destroy']);

    // Order management
    Route::get('/admin/orders', [AdminOrderController::class, 'index']);

    Route::get('/admin/orders/{order}', [AdminOrderController::class, 'show']);

    Route::put('/admin/orders/{order}', [AdminOrderController::class, 'update']);

    // Homepage hero slide management
    Route::get('/admin/hero-slides', [AdminHeroSlideController::class, 'index']);

    Route::post('/admin/hero-slides', [AdminHeroSlideController::class, 'store']);

    Route::get('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'show']);

    Route::post('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'update']);

    Route::delete('/admin/hero-slides/{heroSlide}', [AdminHeroSlideController::class, 'destroy']);
});

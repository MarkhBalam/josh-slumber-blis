<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminHeroSlideController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\HeroSlideController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Categories
Route::get(
    '/categories',
    [CategoryController::class, 'index']
);

// Products
Route::get(
    '/products',
    [ProductController::class, 'index']
);

Route::get(
    '/products/{slug}',
    [ProductController::class, 'show']
);

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
|
| Public autocomplete endpoint used by the store search bar.
| Example:
| /api/search?q=matt
|
*/

Route::get(
    '/search',
    [SearchController::class, 'index']
);

/*
|--------------------------------------------------------------------------
| Homepage Hero Slides
|--------------------------------------------------------------------------
*/

// Public homepage highlights
Route::get(
    '/hero-slides',
    [HeroSlideController::class, 'index']
);

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

// Create an order
Route::post(
    '/orders',
    [OrderController::class, 'store']
);

// Guest customer order lookup
Route::get(
    '/orders/customer',
    [OrderController::class, 'customerOrders']
);

// View one order by order number
Route::get(
    '/orders/{orderNumber}',
    [OrderController::class, 'show']
);

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

// Admin Login
Route::post(
    '/admin/login',
    [AdminAuthController::class, 'login']
);

/*
|--------------------------------------------------------------------------
| Protected Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/me',
        [AdminAuthController::class, 'me']
    );

    Route::post(
        '/admin/logout',
        [AdminAuthController::class, 'logout']
    );

    /*
    |--------------------------------------------------------------------------
    | Product Management
    |--------------------------------------------------------------------------
    */

    // View all products
    Route::get(
        '/admin/products',
        [AdminProductController::class, 'index']
    );

    // Create a new product
    Route::post(
        '/admin/products',
        [AdminProductController::class, 'store']
    );

    // View one product
    Route::get(
        '/admin/products/{product}',
        [AdminProductController::class, 'show']
    );

    // Update an existing product
    Route::put(
        '/admin/products/{product}',
        [AdminProductController::class, 'update']
    );

    // Delete a product
    Route::delete(
        '/admin/products/{product}',
        [AdminProductController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Order Management
    |--------------------------------------------------------------------------
    */

    // View all orders
    Route::get(
        '/admin/orders',
        [AdminOrderController::class, 'index']
    );

    // View one order
    Route::get(
        '/admin/orders/{order}',
        [AdminOrderController::class, 'show']
    );

    // Update order status
    Route::put(
        '/admin/orders/{order}',
        [AdminOrderController::class, 'update']
    );

    /*
    |--------------------------------------------------------------------------
    | Homepage Hero Slide Management
    |--------------------------------------------------------------------------
    */

    // View all hero slides
    Route::get(
        '/admin/hero-slides',
        [AdminHeroSlideController::class, 'index']
    );

    // Create a hero slide
    Route::post(
        '/admin/hero-slides',
        [AdminHeroSlideController::class, 'store']
    );

    // View one hero slide
    Route::get(
        '/admin/hero-slides/{heroSlide}',
        [AdminHeroSlideController::class, 'show']
    );

    // Update a hero slide
    //
    // POST is intentional because the admin form can upload
    // a replacement image using multipart/form-data.
    Route::post(
        '/admin/hero-slides/{heroSlide}',
        [AdminHeroSlideController::class, 'update']
    );

    // Delete a hero slide
    Route::delete(
        '/admin/hero-slides/{heroSlide}',
        [AdminHeroSlideController::class, 'destroy']
    );
});
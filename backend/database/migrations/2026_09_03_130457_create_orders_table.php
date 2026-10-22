<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->string('order_number')->unique();

            $table->string('customer_name');
            $table->string('phone');
            $table->string('email')->nullable();

            $table->string('delivery_address');
            $table->string('district')->nullable();
            $table->text('delivery_notes')->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('pending');

            $table->enum('order_status', [
                'pending',
                'confirmed',
                'processing',
                'out_for_delivery',
                'delivered',
                'cancelled'
            ])->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
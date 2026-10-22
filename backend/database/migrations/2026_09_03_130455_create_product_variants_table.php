<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('sku')->nullable()->unique();
            $table->string('label');

            $table->decimal('width_ft', 5, 2)->nullable();
            $table->decimal('length_ft', 5, 2)->nullable();
            $table->decimal('thickness_inches', 5, 2)->nullable();

            $table->string('size_label')->nullable();
            $table->unsignedInteger('package_quantity')->nullable();

            $table->decimal('price', 12, 2)->nullable();

            $table->enum('stock_status', [
                'in_stock',
                'out_of_stock'
            ])->default('in_stock');

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
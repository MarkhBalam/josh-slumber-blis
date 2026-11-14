<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider')->nullable();
            $table->string('provider_transaction_id')->nullable()->unique();
            $table->string('currency', 3)->default('UGX');
            $table->timestamp('verified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['provider_transaction_id']);
            $table->dropColumn([
                'provider',
                'provider_transaction_id',
                'currency',
                'verified_at',
            ]);
        });
    }
};

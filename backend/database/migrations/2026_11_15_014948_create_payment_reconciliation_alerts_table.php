<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_reconciliation_alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('payment_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('provider', 50);
            $table->string('provider_transaction_id')->nullable();

            $table->string('reported_status', 30);
            $table->string('reason', 100);

            $table->string('status', 20)->default('open');

            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['payment_id', 'reported_status', 'reason'],
                'payment_reconciliation_unique_conflict'
            );

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_reconciliation_alerts');
    }
};

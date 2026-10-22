<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();

            // Admin/internal name for identifying the slide.
            $table->string('title');

            // Uploaded banner/highlight image.
            $table->string('image_path');

            // Optional destination when a customer clicks the slide.
            $table->string('link_url')->nullable();

            // Determines the order slides appear in.
            $table->unsignedInteger('sort_order')->default(0);

            // Allows admin to hide a slide without deleting it.
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('service_categories');
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->enum('pricing_type', ['by_weight', 'by_unit']);
            $table->decimal('price_per_kg', 10, 2)->nullable();
            $table->decimal('price_per_unit', 10, 2)->nullable();
            $table->decimal('min_weight_kg', 5, 2)->nullable();
            $table->enum('duration_hours', ['4', '8', '12', '24', '48', '72']);
            $table->string('duration_label', 50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};

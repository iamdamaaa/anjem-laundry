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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services');
            $table->string('service_name_snapshot', 100);
            $table->string('category_name_snapshot', 100);
            $table->enum('pricing_type_snapshot', ['by_weight', 'by_unit']);
            $table->string('duration_hours_snapshot', 5);
            $table->string('duration_label_snapshot', 50);
            $table->decimal('price_per_kg_snapshot', 10, 2)->nullable();
            $table->decimal('price_per_unit_snapshot', 10, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->integer('quantity')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('weight_actual_kg', 5, 2)->nullable();
            $table->integer('quantity_actual')->nullable();
            $table->decimal('subtotal_actual', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};

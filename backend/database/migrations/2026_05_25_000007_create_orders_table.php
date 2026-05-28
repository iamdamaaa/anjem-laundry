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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('order_number', 30)->unique();
            $table->uuid('invoice_token')->unique();
            $table->enum('order_status', [
                'received', 'picked_up', 'in_process', 'waiting_delivery', 'completed'
            ])->default('received');
            $table->decimal('total_price', 12, 2);
            $table->decimal('total_price_actual', 12, 2)->nullable();
            $table->boolean('is_paid')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->json('pickup_address_snapshot');
            $table->json('delivery_address_snapshot');
            $table->text('notes')->nullable();
            $table->timestamp('pickup_done_at')->nullable();
            $table->timestamp('delivery_done_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

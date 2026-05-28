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
        Schema::create('staff_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('period_month', 7); // Format: 'YYYY-MM'
            $table->integer('total_orders_handled')->default(0);
            $table->integer('orders_on_time')->default(0);
            $table->integer('orders_late')->default(0);
            $table->decimal('avg_completion_hours', 8, 2)->nullable();
            $table->decimal('performance_score', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'period_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_metrics');
    }
};

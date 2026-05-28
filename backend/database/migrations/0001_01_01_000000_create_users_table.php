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
        // Migration 1: create_roles_table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique(); // 'admin', 'staff', 'customer'
            $table->string('display_name', 100);
            $table->timestamps();
        });

        // Migration 2: create_users_table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles');
            $table->string('name', 100);
            $table->string('phone', 20)->unique(); // Format: 628xxxxxxxxxx
            $table->string('email', 150)->nullable(); // Opsional, not unique
            $table->boolean('phone_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};

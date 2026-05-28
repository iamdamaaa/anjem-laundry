<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'role_id' => 1, // Admin role
            'name' => 'Laundry Owner Admin',
            'phone' => '6281122334455', // Standard normalized format
            'email' => 'admin@anjemlaundry.com',
            'phone_verified' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

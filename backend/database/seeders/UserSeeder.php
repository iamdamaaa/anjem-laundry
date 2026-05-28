<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Bersihkan data lama jika tidak menggunakan migrate:fresh
        DB::table('users')->delete();

        DB::table('users')->insert([
            [
                'role_id' => 1, // Admin
                'name' => 'admin',
                'phone' => '6281213142727', // Normalized 081213142727
                'email' => 'admin@anjemlaundry.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 2, // Staff
                'name' => 'budi',
                'phone' => '6281234567890', // Normalized 081234567890
                'email' => 'staff_budi@anjemlaundry.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 3, // Customer
                'name' => 'tes',
                'phone' => '6289876543210', // Normalized 089876543210
                'email' => 'customer_tes@gmail.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}

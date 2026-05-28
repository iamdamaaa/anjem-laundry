<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $this->call(RoleSeeder::class);

        // 2. Seed Admin User
        $this->call(AdminUserSeeder::class);

        // 3. Seed some staff and customers for dev purposes
        DB::table('users')->insert([
            [
                'role_id' => 1, // Admin (Tambahan)
                'name' => 'Admin Tambahan',
                'phone' => '6281213142727',
                'email' => 'admin2@anjemlaundry.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 2, // Staff
                'name' => 'Laundry Staff Budi',
                'phone' => '6281234567890',
                'email' => 'budi@anjemlaundry.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 3, // Customer
                'name' => 'Customer Andi',
                'phone' => '6289876543210',
                'email' => 'andi@gmail.com',
                'phone_verified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 4. Seed Service Categories
        DB::table('service_categories')->insert([
            [
                'id' => 1,
                'name' => 'Cuci Kiloan',
                'slug' => 'cuci-kiloan',
                'description' => 'Layanan cuci lipat setrika dengan penimbangan per kilogram.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'name' => 'Cuci Satuan',
                'slug' => 'cuci-satuan',
                'description' => 'Layanan cuci premium untuk pakaian atau barang satuan (sepatu, jas, selimut).',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'name' => 'Dry Cleaning',
                'slug' => 'dry-cleaning',
                'description' => 'Pembersihan pakaian khusus tanpa air (dry clean) untuk menjaga kualitas serat kain.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 5. Seed Services
        DB::table('services')->insert([
            // Kiloan services
            [
                'category_id' => 1,
                'name' => 'Cuci Setrika Reguler',
                'slug' => 'cuci-setrika-reguler',
                'description' => 'Layanan cuci setrika standar selesai dalam 24 jam.',
                'pricing_type' => 'by_weight',
                'price_per_kg' => 8000.00,
                'price_per_unit' => null,
                'min_weight_kg' => 1.00,
                'duration_hours' => '24',
                'duration_label' => '1 Hari (24 Jam)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => 1,
                'name' => 'Cuci Setrika Kilat',
                'slug' => 'cuci-setrika-kilat',
                'description' => 'Layanan cuci setrika cepat selesai dalam 8 jam.',
                'pricing_type' => 'by_weight',
                'price_per_kg' => 15000.00,
                'price_per_unit' => null,
                'min_weight_kg' => 1.00,
                'duration_hours' => '8',
                'duration_label' => '8 Jam',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => 1,
                'name' => 'Cuci Setrika Express',
                'slug' => 'cuci-setrika-express',
                'description' => 'Layanan super cepat selesai dalam 4 jam.',
                'pricing_type' => 'by_weight',
                'price_per_kg' => 20000.00,
                'price_per_unit' => null,
                'min_weight_kg' => 1.00,
                'duration_hours' => '4',
                'duration_label' => '4 Jam',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Satuan services
            [
                'category_id' => 2,
                'name' => 'Cuci Sepatu Canvas',
                'slug' => 'cuci-sepatu-canvas',
                'description' => 'Layanan cuci bersih dan treatment sepatu canvas.',
                'pricing_type' => 'by_unit',
                'price_per_kg' => null,
                'price_per_unit' => 30000.00,
                'min_weight_kg' => null,
                'duration_hours' => '72',
                'duration_label' => '3 Hari (72 Jam)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => 2,
                'name' => 'Cuci Bedcover Kiloan Besar',
                'slug' => 'cuci-bedcover-kiloan-besar',
                'description' => 'Cuci bedcover ukuran King/Queen.',
                'pricing_type' => 'by_unit',
                'price_per_kg' => null,
                'price_per_unit' => 45000.00,
                'min_weight_kg' => null,
                'duration_hours' => '48',
                'duration_label' => '2 Hari (48 Jam)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Dry cleaning services
            [
                'category_id' => 3,
                'name' => 'Dry Clean Jas Lengkap',
                'slug' => 'dry-clean-jas-lengkap',
                'description' => 'Dry cleaning jas pria (satu stel: celana + blazer).',
                'pricing_type' => 'by_unit',
                'price_per_kg' => null,
                'price_per_unit' => 60000.00,
                'min_weight_kg' => null,
                'duration_hours' => '48',
                'duration_label' => '2 Hari (48 Jam)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}

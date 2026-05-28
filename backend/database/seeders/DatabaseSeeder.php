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

        // 2. Seed Users (Admin, Staff, Customer)
        $this->call(UserSeeder::class);

        // 3. Seed Service Categories
        // Kita menggunakan delete agar fresh jika tidak menggunakan migrate:fresh
        DB::table('service_categories')->delete();
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

        // 4. Seed Services (termasuk variasi Cuci Satuan baru)
        $this->call(ServiceSeeder::class);
    }
}

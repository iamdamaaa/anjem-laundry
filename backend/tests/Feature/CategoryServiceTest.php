<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\ServiceCategory;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected string $adminToken;
    protected string $customerToken;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Create Admin
        $this->admin = User::create([
            'role_id'        => 1,
            'name'           => 'Laundry Owner',
            'phone'          => '6281111111111',
            'phone_verified' => true,
            'is_active'      => true
        ]);
        $this->adminToken = $this->admin->createToken('admin_token')->plainTextToken;

        // Create Customer
        $this->customer = User::create([
            'role_id'        => 3,
            'name'           => 'Andi Customer',
            'phone'          => '6289876543210',
            'phone_verified' => true,
            'is_active'      => true
        ]);
        $this->customerToken = $this->customer->createToken('customer_token')->plainTextToken;
    }

    /**
     * Test public category listing only lists active categories.
     */
    public function test_public_category_listing_only_returns_active(): void
    {
        ServiceCategory::create([
            'name' => 'Kiloan Active',
            'slug' => 'kiloan-active',
            'is_active' => true
        ]);

        ServiceCategory::create([
            'name' => 'Satuan Inactive',
            'slug' => 'satuan-inactive',
            'is_active' => false
        ]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.slug', 'kiloan-active');
    }

    /**
     * Test admin can create category.
     */
    public function test_admin_can_create_category(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->postJson('/api/v1/admin/categories', [
            'name'        => 'Dry Cleaning',
            'description' => 'Cuci tanpa air'
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Dry Cleaning');
        $response->assertJsonPath('data.slug', 'dry-cleaning'); // Generated slug

        $this->assertDatabaseHas('service_categories', [
            'name' => 'Dry Cleaning',
            'slug' => 'dry-cleaning'
        ]);
    }

    /**
     * Test customer cannot create category.
     */
    public function test_customer_cannot_create_category(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->customerToken,
        ])->postJson('/api/v1/admin/categories', [
            'name' => 'Hack Category'
        ]);

        $response->assertStatus(403); // Forbidden
    }

    /**
     * Test admin can edit category.
     */
    public function test_admin_can_edit_category(): void
    {
        $cat = ServiceCategory::create([
            'name' => 'Reguler',
            'slug' => 'reguler',
            'is_active' => true
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->patchJson("/api/v1/admin/categories/{$cat->id}", [
            'name' => 'Reguler Edit',
            'slug' => 'reguler-edited'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Reguler Edit', $cat->fresh()->name);
        $this->assertEquals('reguler-edited', $cat->fresh()->slug);
    }

    /**
     * Test admin can disable category.
     */
    public function test_admin_can_disable_category(): void
    {
        $cat = ServiceCategory::create([
            'name' => 'Reguler',
            'slug' => 'reguler',
            'is_active' => true
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->deleteJson("/api/v1/admin/categories/{$cat->id}");

        $response->assertStatus(200);
        $this->assertFalse($cat->fresh()->is_active);
    }

    /**
     * Test listing public services with filters.
     */
    public function test_can_list_and_filter_active_services(): void
    {
        $cat1 = ServiceCategory::create(['name' => 'Kiloan', 'slug' => 'kiloan', 'is_active' => true]);
        $cat2 = ServiceCategory::create(['name' => 'Satuan', 'slug' => 'satuan', 'is_active' => true]);

        Service::create([
            'category_id' => $cat1->id,
            'name' => 'Cuci Setrika',
            'slug' => 'cuci-setrika',
            'pricing_type' => 'by_weight',
            'price_per_kg' => 8000,
            'duration_hours' => '24',
            'duration_label' => '1 Hari',
            'is_active' => true
        ]);

        Service::create([
            'category_id' => $cat2->id,
            'name' => 'Cuci Sepatu',
            'slug' => 'cuci-sepatu',
            'pricing_type' => 'by_unit',
            'price_per_unit' => 30000,
            'duration_hours' => '72',
            'duration_label' => '3 Hari',
            'is_active' => true
        ]);

        // Filter by category slug
        $responseCat = $this->getJson('/api/v1/services?category=satuan');
        $responseCat->assertStatus(200);
        $responseCat->assertJsonCount(1, 'data');
        $responseCat->assertJsonPath('data.0.slug', 'cuci-sepatu');

        // Filter by duration
        $responseDur = $this->getJson('/api/v1/services?duration=24');
        $responseDur->assertStatus(200);
        $responseDur->assertJsonCount(1, 'data');
        $responseDur->assertJsonPath('data.0.slug', 'cuci-setrika');
    }

    /**
     * Test admin can create a service.
     */
    public function test_admin_can_create_service(): void
    {
        $cat = ServiceCategory::create(['name' => 'Kiloan', 'slug' => 'kiloan', 'is_active' => true]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->postJson('/api/v1/admin/services', [
            'category_id' => $cat->id,
            'name' => 'Setrika Saja',
            'pricing_type' => 'by_weight',
            'price_per_kg' => 5000,
            'duration_hours' => '12',
            'duration_label' => '12 Jam'
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.slug', 'setrika-saja');

        $this->assertDatabaseHas('services', [
            'name' => 'Setrika Saja',
            'price_per_kg' => 5000
        ]);
    }
}

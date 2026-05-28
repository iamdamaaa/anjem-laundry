<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\CustomerAddress;
use App\Helpers\PhoneHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileAddressTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Create standard customer
        $this->customer = User::create([
            'role_id'        => 3,
            'name'           => 'Andi Customer',
            'phone'          => '6289876543210',
            'email'          => 'andi@gmail.com',
            'phone_verified' => true,
            'is_active'      => true
        ]);

        $this->token = $this->customer->createToken('auth_token')->plainTextToken;
    }

    /**
     * Test profile can be updated.
     */
    public function test_profile_can_be_updated(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson('/api/v1/profile', [
            'name'  => 'Andi Baru',
            'email' => 'andibaru@gmail.com'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => [
                'name'  => 'Andi Baru',
                'email' => 'andibaru@gmail.com',
                'phone' => '6289876543210'
            ]
        ]);

        $this->assertDatabaseHas('users', [
            'id'    => $this->customer->id,
            'name'  => 'Andi Baru',
            'email' => 'andibaru@gmail.com'
        ]);
    }

    /**
     * Test phone is immutable and cannot be updated.
     */
    public function test_profile_phone_cannot_be_updated(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson('/api/v1/profile', [
            'phone' => '6289999999999' // Forbid updating phone
        ]);

        $response->assertStatus(200);
        // Phone must remain the same
        $this->assertEquals('6289876543210', $this->customer->fresh()->phone);
    }

    /**
     * Test listing customer addresses.
     */
    public function test_can_list_customer_addresses(): void
    {
        // Pre-create addresses
        CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Mawar No. 10',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v1/profile/addresses');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.label', 'Rumah');
    }

    /**
     * Test first address is default automatically.
     */
    public function test_first_address_added_is_default_automatically(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v1/profile/addresses', [
            'label'   => 'Kantor',
            'address' => 'Gedung Cyber Lt 5',
            'city'    => 'Jakarta',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.is_default', true);

        $this->assertDatabaseHas('customer_addresses', [
            'user_id'    => $this->customer->id,
            'label'      => 'Kantor',
            'is_default' => true
        ]);
    }

    /**
     * Test setting a new default unset the old default.
     */
    public function test_setting_new_default_unsets_old_default(): void
    {
        // 1. Create first address (will be default automatically)
        $addr1 = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Mawar No. 10',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        // 2. Add second address with is_default = true
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v1/profile/addresses', [
            'label'      => 'Kantor',
            'address'    => 'Gedung Cyber Lt 5',
            'city'       => 'Jakarta',
            'is_default' => true
        ]);

        $response->assertStatus(201);
        $this->assertTrue($response->json('data.is_default'));

        // Check first address is now false
        $this->assertFalse($addr1->fresh()->is_default);
    }

    /**
     * Test address manual default transition.
     */
    public function test_can_manually_set_address_as_default(): void
    {
        $addr1 = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Mawar No. 10',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        $addr2 = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Kantor',
            'address' => 'Gedung Cyber Lt 5',
            'city' => 'Jakarta',
            'is_default' => false
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/v1/profile/addresses/{$addr2->id}/default");

        $response->assertStatus(200);
        $this->assertTrue($addr2->fresh()->is_default);
        $this->assertFalse($addr1->fresh()->is_default);
    }

    /**
     * Test user cannot update address of another user.
     */
    public function test_user_cannot_access_another_users_address(): void
    {
        $otherUser = User::create([
            'role_id'        => 3,
            'name'           => 'User Lain',
            'phone'          => '6285555555555',
            'phone_verified' => true,
            'is_active'      => true
        ]);

        $otherAddr = CustomerAddress::create([
            'user_id' => $otherUser->id,
            'label' => 'Rumah Orang',
            'address' => 'Jl. Antah Barantah',
            'city' => 'Bandung',
            'is_default' => true
        ]);

        // Attempt to update other users address
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->patchJson("/api/v1/profile/addresses/{$otherAddr->id}", [
            'label' => 'Hacked Label'
        ]);

        $response->assertStatus(404); // Forbidden/not found
        $this->assertDatabaseHas('customer_addresses', [
            'id'    => $otherAddr->id,
            'label' => 'Rumah Orang' // unchanged
        ]);
    }

    /**
     * Test deleting default address nominates next address.
     */
    public function test_deleting_default_address_nominates_new_default(): void
    {
        $addr1 = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Mawar No. 10',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        $addr2 = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Kantor',
            'address' => 'Gedung Cyber Lt 5',
            'city' => 'Jakarta',
            'is_default' => false
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/v1/profile/addresses/{$addr1->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('customer_addresses', ['id' => $addr1->id]);
        
        // Kantor should be promoted to default
        $this->assertTrue($addr2->fresh()->is_default);
    }
}

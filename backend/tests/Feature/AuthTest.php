<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\OtpCode;
use App\Helpers\PhoneHelper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed Roles (needed for registration)
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Test successful registration OTP request.
     */
    public function test_request_otp_for_registration_succeeds(): void
    {
        // Mock Fonnte API response
        Http::fake([
            'api.fonnte.com/*' => Http::response(['status' => true, 'message' => 'OTP sent successfully'], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/request-otp', [
            'phone' => '08123456789',
            'purpose' => 'register',
            'name' => 'Andi'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Kode OTP telah dikirim ke WhatsApp kamu'
        ]);

        $normalizedPhone = PhoneHelper::normalize('08123456789');

        // Check DB has the OTP code
        $this->assertDatabaseHas('otp_codes', [
            'phone' => $normalizedPhone,
            'purpose' => 'register',
            'is_used' => false
        ]);
    }

    /**
     * Test registration request OTP fails if phone already registered.
     */
    public function test_request_otp_for_registration_fails_if_phone_exists(): void
    {
        $normalizedPhone = PhoneHelper::normalize('08123456789');

        User::create([
            'role_id' => 3,
            'name' => 'Andi Existing',
            'phone' => $normalizedPhone,
            'phone_verified' => true,
            'is_active' => true
        ]);

        $response = $this->postJson('/api/v1/auth/request-otp', [
            'phone' => '08123456789',
            'purpose' => 'register',
            'name' => 'Andi New'
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'error' => 'PHONE_ALREADY_REGISTERED'
        ]);
    }

    /**
     * Test verify OTP for successful registration.
     */
    public function test_verify_otp_for_registration_creates_user(): void
    {
        $normalizedPhone = PhoneHelper::normalize('08123456789');

        // Insert mock active OTP
        $otp = OtpCode::create([
            'phone' => $normalizedPhone,
            'code' => '123456',
            'purpose' => 'register',
            'attempts' => 0,
            'is_used' => false,
            'expires_at' => now()->addMinutes(5)
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '08123456789',
            'code' => '123456',
            'purpose' => 'register',
            'name' => 'Andi'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'token',
                'user' => ['id', 'name', 'phone', 'email', 'role']
            ]
        ]);

        // Check user exists in database
        $this->assertDatabaseHas('users', [
            'phone' => $normalizedPhone,
            'name' => 'Andi',
            'role_id' => 3, // Customer
            'phone_verified' => true
        ]);

        // Check OTP marked as used
        $this->assertTrue($otp->fresh()->is_used);
    }

    /**
     * Test verify OTP fails with invalid code.
     */
    public function test_verify_otp_fails_with_invalid_code(): void
    {
        $normalizedPhone = PhoneHelper::normalize('08123456789');

        OtpCode::create([
            'phone' => $normalizedPhone,
            'code' => '123456',
            'purpose' => 'login',
            'attempts' => 0,
            'is_used' => false,
            'expires_at' => now()->addMinutes(5)
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '08123456789',
            'code' => '999999', // Incorrect code
            'purpose' => 'login'
        ]);

        $response->assertStatus(400);
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error', 'AUTH_INVALID_OTP');
    }

    /**
     * Test verify OTP limits attempts and locks code after 3 attempts.
     */
    public function test_verify_otp_locks_after_three_attempts(): void
    {
        $normalizedPhone = PhoneHelper::normalize('08123456789');

        $otp = OtpCode::create([
            'phone' => $normalizedPhone,
            'code' => '123456',
            'purpose' => 'login',
            'attempts' => 2, // 2 failed attempts already
            'is_used' => false,
            'expires_at' => now()->addMinutes(5)
        ]);

        $response = $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '08123456789',
            'code' => '999999', // 3rd attempt
            'purpose' => 'login'
        ]);

        $response->assertStatus(429);
        $response->assertJson([
            'success' => false,
            'error' => 'AUTH_OTP_MAX_ATTEMPTS'
        ]);

        $this->assertTrue($otp->fresh()->is_used);
    }

    /**
     * Test authenticated /auth/me returns details and logout revokes token.
     */
    public function test_auth_me_returns_profile_and_logout_revokes_token(): void
    {
        $normalizedPhone = PhoneHelper::normalize('08123456789');

        $user = User::create([
            'role_id' => 3,
            'name' => 'Andi Profil',
            'phone' => $normalizedPhone,
            'phone_verified' => true,
            'is_active' => true
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Test GET /auth/me
        $responseMe = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/auth/me');

        $responseMe->assertStatus(200);
        $responseMe->assertJson([
            'success' => true,
            'data' => [
                'name' => 'Andi Profil',
                'phone' => $normalizedPhone,
                'role' => 'customer'
            ]
        ]);

        // Test POST /auth/logout
        $responseLogout = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/auth/logout');

        $responseLogout->assertStatus(200);
        $responseLogout->assertJson([
            'success' => true,
            'message' => 'Berhasil logout'
        ]);

        // Clear Sanctum's resolved user in-memory cache for the test
        auth()->forgetGuards();

        // Access me again (should be unauthenticated)
        $responseMe2 = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/auth/me');

        $responseMe2->assertStatus(401); // Sanctum rejected
    }
}

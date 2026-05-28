<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $staff;
    protected User $customer;
    protected string $adminToken;
    protected string $staffToken;
    protected string $customerToken;
    protected CustomerAddress $address;
    protected Service $kiloService;
    protected Service $unitService;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Create Users
        $this->admin = User::create(['role_id' => 1, 'name' => 'Owner', 'phone' => '6281111111111', 'phone_verified' => true, 'is_active' => true]);
        $this->adminToken = $this->admin->createToken('admin')->plainTextToken;

        $this->staff = User::create(['role_id' => 2, 'name' => 'Courier Budi', 'phone' => '6282222222222', 'phone_verified' => true, 'is_active' => true]);
        $this->staffToken = $this->staff->createToken('staff')->plainTextToken;

        $this->customer = User::create(['role_id' => 3, 'name' => 'Andi Customer', 'phone' => '6289876543210', 'email' => 'andi@gmail.com', 'phone_verified' => true, 'is_active' => true]);
        $this->customerToken = $this->customer->createToken('customer')->plainTextToken;

        // Create Address
        $this->address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Kenanga No. 5',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        // Create Category and Services
        $cat = ServiceCategory::create(['name' => 'Kiloan', 'slug' => 'kiloan', 'is_active' => true]);
        
        $this->kiloService = Service::create([
            'category_id' => $cat->id,
            'name' => 'Cuci Setrika Reguler',
            'slug' => 'cuci-setrika-reguler',
            'pricing_type' => 'by_weight',
            'price_per_kg' => 8000,
            'min_weight_kg' => 1.0,
            'duration_hours' => '24',
            'duration_label' => '24 Jam',
            'is_active' => true
        ]);

        $this->unitService = Service::create([
            'category_id' => $cat->id,
            'name' => 'Cuci Jas',
            'slug' => 'cuci-jas',
            'pricing_type' => 'by_unit',
            'price_per_unit' => 25000,
            'duration_hours' => '48',
            'duration_label' => '48 Jam',
            'is_active' => true
        ]);
    }

    /**
     * Test email must exist on profile before order.
     */
    public function test_customer_cannot_order_if_email_is_missing(): void
    {
        $noEmailCustomer = User::create([
            'role_id' => 3,
            'name' => 'No Email Customer',
            'phone' => '6285555555555',
            'email' => null, // missing email!
            'phone_verified' => true,
            'is_active' => true
        ]);
        $token = $noEmailCustomer->createToken('no_email')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/orders', [
            'address_id' => $this->address->id,
            'items' => [
                ['service_id' => $this->kiloService->id, 'weight_kg' => 2.0]
            ]
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'error' => 'EMAIL_REQUIRED'
        ]);
    }

    /**
     * Test successful order placement and backend price validation.
     */
    public function test_customer_can_place_order_successfully(): void
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->customerToken,
        ])->postJson('/api/v1/orders', [
            'address_id' => $this->address->id,
            'items' => [
                ['service_id' => $this->kiloService->id, 'weight_kg' => 2.5], // kilo subtotal = 20000
                ['service_id' => $this->unitService->id, 'quantity' => 2]     // unit subtotal = 50000
            ],
            'notes' => 'Tolong pisahkan pakaian putih'
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.total_price', '70000.00'); // Recalculated correctly

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'total_price' => 70000,
            'order_status' => 'received'
        ]);

        // Verify address snapshots and service snapshots
        $order = Order::first();
        $this->assertNotNull($order->pickup_address_snapshot);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'service_name_snapshot' => 'Cuci Setrika Reguler',
            'subtotal' => 20000
        ]);
    }

    /**
     * Test order status linear transitions.
     */
    public function test_order_status_transitions_are_strictly_linear(): void
    {
        // 1. Create order
        $order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-1',
            'order_status' => 'received',
            'total_price' => 20000,
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => []
        ]);

        // 2. Try transition received -> in_process (Invalid: skips picked_up!)
        $responseInvalid = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->staffToken,
        ])->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'in_process'
        ]);
        $responseInvalid->assertStatus(422);
        $responseInvalid->assertJsonPath('error', 'ORDER_INVALID_TRANSITION');

        // 3. Try received -> picked_up (Valid)
        $responseValid = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->staffToken,
        ])->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'picked_up'
        ]);
        $responseValid->assertStatus(200);
        $this->assertEquals('picked_up', $order->fresh()->order_status);
        $this->assertNotNull($order->fresh()->pickup_done_at);
    }

    /**
     * Test actual weight requirements for transition to in_process.
     */
    public function test_transition_to_in_process_requires_actual_data(): void
    {
        $order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-1',
            'order_status' => 'picked_up',
            'total_price' => 16000,
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => []
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'service_id' => $this->kiloService->id,
            'service_name_snapshot' => 'Cuci Setrika Reguler',
            'category_name_snapshot' => 'Kiloan',
            'pricing_type_snapshot' => 'by_weight',
            'duration_hours_snapshot' => '24',
            'duration_label_snapshot' => '24 Jam',
            'price_per_kg_snapshot' => 8000,
            'weight_kg' => 2.0,
            'subtotal' => 16000,
            'weight_actual_kg' => null // Actual data still empty!
        ]);

        // Transition picked_up -> in_process (Should fail because actual weights are null)
        $responseFail = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->staffToken,
        ])->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'in_process'
        ]);
        $responseFail->assertStatus(422);
        $responseFail->assertJsonPath('error', 'ACTUAL_DATA_REQUIRED');

        // Transition picked_up -> in_process supplying actual data (Should succeed)
        $responseSucceed = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->staffToken,
        ])->patchJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'in_process',
            'actual_items' => [
                [
                    'item_id' => $item->id,
                    'weight_actual_kg' => 2.2 // Staff logs actual penimbangan
                ]
            ]
        ]);

        $responseSucceed->assertStatus(200);
        $this->assertEquals('in_process', $order->fresh()->order_status);
        $this->assertEquals('17600.00', $order->fresh()->total_price_actual); // Price auto-corrected to 17600
    }

    /**
     * Test customer payment proof uploads and admin approvals.
     */
    public function test_payment_proof_upload_lifecycle(): void
    {
        Storage::fake('public');

        $order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-1',
            'order_status' => 'in_process',
            'total_price' => 20000,
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => []
        ]);

        $fakeImage = UploadedFile::fake()->image('proof.jpg');

        // 1. Customer uploads proof (Status goes to pending)
        $responseUpload = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->customerToken,
        ])->postJson("/api/v1/orders/{$order->id}/payment", [
            'method' => 'transfer',
            'amount' => 20000,
            'proof_image' => $fakeImage
        ]);

        $responseUpload->assertStatus(201);
        $responseUpload->assertJsonPath('data.status', 'pending');
        $payment = Payment::first();
        $this->assertNotNull($payment->proof_image_path);
        Storage::disk('public')->assertExists($payment->proof_image_path);

        // Clear Sanctum resolved user cache to allow authenticating as Admin
        auth()->forgetGuards();

        // 2. Admin verifies proof (Status goes to verified, order becomes is_paid)
        $responseVerify = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->patchJson("/api/v1/admin/payments/{$payment->id}/verify");

        $responseVerify->assertStatus(200);
        $this->assertEquals('verified', $payment->fresh()->status);
        $this->assertTrue($order->fresh()->is_paid);
        $this->assertNotNull($order->fresh()->paid_at);
    }
}

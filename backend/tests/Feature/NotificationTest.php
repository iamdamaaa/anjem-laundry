<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $staff;
    protected User $customer;
    protected string $staffToken;
    protected string $customerToken;
    protected Order $order;
    protected OrderItem $item;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->staff = User::create(['role_id' => 2, 'name' => 'Staff Budi', 'phone' => '6282222222222', 'phone_verified' => true, 'is_active' => true]);
        $this->staffToken = $this->staff->createToken('staff')->plainTextToken;

        $this->customer = User::create(['role_id' => 3, 'name' => 'Andi Customer', 'phone' => '6289876543210', 'email' => 'andi@gmail.com', 'phone_verified' => true, 'is_active' => true]);
        $this->customerToken = $this->customer->createToken('customer')->plainTextToken;

        // Create Address
        $address = CustomerAddress::create([
            'user_id' => $this->customer->id,
            'label' => 'Rumah',
            'address' => 'Jl. Kenanga No. 5',
            'city' => 'Jakarta',
            'is_default' => true
        ]);

        $cat = ServiceCategory::create(['name' => 'Kiloan', 'slug' => 'kiloan', 'is_active' => true]);
        $service = Service::create([
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

        // Create Order in picked_up state
        $this->order = Order::create([
            'user_id' => $this->customer->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-123',
            'order_status' => 'picked_up',
            'total_price' => 16000,
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => []
        ]);

        $this->item = OrderItem::create([
            'order_id' => $this->order->id,
            'service_id' => $service->id,
            'service_name_snapshot' => 'Cuci Setrika Reguler',
            'category_name_snapshot' => 'Kiloan',
            'pricing_type_snapshot' => 'by_weight',
            'duration_hours_snapshot' => '24',
            'duration_label_snapshot' => '24 Jam',
            'price_per_kg_snapshot' => 8000,
            'weight_kg' => 2.0,
            'subtotal' => 16000,
            'weight_actual_kg' => null
        ]);
    }

    /**
     * Test status transition picked_up -> in_process triggers WA & Email notifications.
     */
    public function test_picked_up_to_in_process_triggers_notifications(): void
    {
        // Mock WhatsApp API failure to match is_sent => false
        Http::fake([
            'api.fonnte.com/*' => Http::response(['status' => false, 'error' => 'Simulated Failure'], 200),
        ]);

        // Transition order status
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->staffToken,
        ])->patchJson("/api/v1/admin/orders/{$this->order->id}/status", [
            'status' => 'in_process',
            'actual_items' => [
                [
                    'item_id' => $this->item->id,
                    'weight_actual_kg' => 2.0
                ]
            ]
        ]);

        $response->assertStatus(200);

        // Check if database recorded the notifications
        // 1. WhatsApp
        $this->assertDatabaseHas('notifications', [
            'user_id'   => $this->customer->id,
            'order_id'  => $this->order->id,
            'channel'   => 'whatsapp',
            'recipient' => '6289876543210',
            'is_sent'   => false
        ]);

        // 2. Email (runs synchronously in tests and succeeds, so is_sent becomes true)
        $this->assertDatabaseHas('notifications', [
            'user_id'   => $this->customer->id,
            'order_id'  => $this->order->id,
            'channel'   => 'email',
            'recipient' => 'andi@gmail.com',
            'is_sent'   => true
        ]);
    }
}

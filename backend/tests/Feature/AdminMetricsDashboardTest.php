<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ErrorLog;
use App\Models\StaffMetric;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class AdminMetricsDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $adminToken;
    protected User $staff;
    protected string $staffToken;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::insert([
            ['id' => 1, 'name' => 'admin', 'display_name' => 'Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'staff', 'display_name' => 'Laundry Staff', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'customer', 'display_name' => 'Laundry Customer', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->admin = User::create(['role_id' => 1, 'name' => 'Owner', 'phone' => '6281111111111', 'phone_verified' => true, 'is_active' => true]);
        $this->adminToken = $this->admin->createToken('admin')->plainTextToken;

        $this->staff = User::create(['role_id' => 2, 'name' => 'Courier Budi', 'phone' => '6282222222222', 'phone_verified' => true, 'is_active' => true]);
        $this->staffToken = $this->staff->createToken('staff')->plainTextToken;
    }

    /**
     * Test client-side error log ingestion (Public) and admin error log retrieval.
     */
    public function test_error_logging_lifecycle(): void
    {
        // 1. Post a client-side error publicly
        $responsePost = $this->postJson('/api/v1/logs/error', [
            'error_type' => 'ReferenceError',
            'error_message' => 'x is not defined',
            'stack_trace' => 'ReferenceError: x is not defined at window.onload',
            'request_url' => 'http://localhost:3000/orders/new'
        ]);

        $responsePost->assertStatus(201);
        $this->assertDatabaseHas('error_logs', [
            'error_type' => 'ReferenceError',
            'source' => 'client'
        ]);

        // 2. Admin retrieves error logs
        $responseGet = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->getJson('/api/v1/admin/logs/errors');

        $responseGet->assertStatus(200);
        $responseGet->assertJsonCount(1, 'data');
        $responseGet->assertJsonPath('data.0.error_type', 'ReferenceError');
    }

    /**
     * Test admin dashboard analytics.
     */
    public function test_admin_dashboard_analytics(): void
    {
        $customer = User::create(['role_id' => 3, 'name' => 'Customer Andi', 'phone' => '6289876543210', 'phone_verified' => true, 'is_active' => true]);

        // Create a paid order to aggregate revenue
        Order::create([
            'user_id' => $customer->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-1',
            'order_status' => 'completed',
            'total_price' => 50000,
            'total_price_actual' => 45000, // Price adjusted by staff
            'is_paid' => true,
            'paid_at' => now(),
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => []
        ]);

        // Get summary
        $responseSummary = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->getJson('/api/v1/admin/dashboard/summary');

        $responseSummary->assertStatus(200);
        $responseSummary->assertJsonPath('data.total_revenue', 45000); // Evaluates total_price_actual correctly
        $responseSummary->assertJsonPath('data.total_orders', 1);

        // Get charts
        $responseChart = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->getJson('/api/v1/admin/dashboard/orders-chart');

        $responseChart->assertStatus(200);
        $responseChart->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['date', 'label', 'order_count', 'revenue']
            ]
        ]);
    }

    /**
     * Test staff metrics monthly recalculation (Command + Controller).
     */
    public function test_staff_metrics_recalculation(): void
    {
        $customer = User::create(['role_id' => 3, 'name' => 'Customer Andi', 'phone' => '6289876543210', 'phone_verified' => true, 'is_active' => true]);

        // Create completed order assigned to staff in current month
        Order::create([
            'user_id' => $customer->id,
            'assigned_staff_id' => $this->staff->id,
            'order_number' => 'LDR-20260525-0001',
            'invoice_token' => 'uuid-1',
            'order_status' => 'completed',
            'total_price' => 20000,
            'pickup_done_at' => now()->subHours(2),
            'delivery_done_at' => now(), // completed in 2 hours
            'pickup_address_snapshot' => [],
            'delivery_address_snapshot' => [],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Trigger manual recalculation for current month
        $currentMonth = now()->format('Y-m');
        $responseRecalc = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->postJson('/api/v1/admin/staff/metrics/recalculate', [
            'month' => $currentMonth
        ]);

        $responseRecalc->assertStatus(200);

        // Check DB has metrics populated
        $this->assertDatabaseHas('staff_metrics', [
            'user_id' => $this->staff->id,
            'period_month' => $currentMonth,
            'total_orders_handled' => 1,
            'orders_on_time' => 1, // 2 hours <= 24 hours allowed
            'performance_score' => 100
        ]);

        // Fetch metrics listing
        $responseList = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken,
        ])->getJson("/api/v1/admin/staff/metrics?month={$currentMonth}");

        $responseList->assertStatus(200);
        $responseList->assertJsonCount(2, 'data'); // staff + admin included (both roles checked in calculations)
    }
}

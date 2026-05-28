<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display a card summary of key operational metrics.
     * GET /admin/dashboard/summary
     */
    public function summary(): JsonResponse
    {
        // 1. Total orders count
        $totalOrders = Order::count();

        // 2. Total revenue from all PAID orders (evaluating actual price or estimate)
        $totalRevenue = (float) Order::where('is_paid', true)
            ->sum(DB::raw('COALESCE(total_price_actual, total_price)'));

        // 3. Count of pending payments waiting review
        $pendingPayments = Payment::where('status', 'pending')->count();

        // 4. Count of active/in-progress orders (status not completed)
        $activeOrders = Order::where('order_status', '!=', 'completed')->count();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil ringkasan dashboard',
            'data'    => [
                'total_orders'     => $totalOrders,
                'total_revenue'    => $totalRevenue,
                'pending_payments' => $pendingPayments,
                'active_orders'    => $activeOrders,
            ]
        ]);
    }

    /**
     * Display historical chart data of daily orders and revenue for the last 30 days.
     * GET /admin/dashboard/orders-chart
     */
    public function ordersChart(): JsonResponse
    {
        // Fetch last 30 days aggregates grouped by date
        $data = Order::select([
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(COALESCE(total_price_actual, total_price)) as revenue'),
        ])
        ->where('created_at', '>=', now()->subDays(30))
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();

        // Format dates beautifully (e.g. "25 May")
        $formattedData = $data->map(function ($row) {
            return [
                'date'        => $row->date,
                'label'       => date('d M', strtotime($row->date)),
                'order_count' => (int) $row->order_count,
                'revenue'     => (float) $row->revenue,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data chart penjualan',
            'data'    => $formattedData
        ]);
    }

    /**
     * Display top 5 most frequently ordered services.
     * GET /admin/dashboard/top-services
     */
    public function topServices(): JsonResponse
    {
        $top = OrderItem::select([
            'service_name_snapshot as service_name',
            'category_name_snapshot as category_name',
            DB::raw('COUNT(*) as times_ordered'),
            DB::raw('SUM(COALESCE(subtotal_actual, subtotal)) as total_sales'),
        ])
        ->groupBy('service_name', 'category_name')
        ->orderBy('times_ordered', 'desc')
        ->limit(5)
        ->get();

        $formattedTop = $top->map(function ($row) {
            return [
                'service_name'  => $row->service_name,
                'category_name' => $row->category_name,
                'times_ordered' => (int) $row->times_ordered,
                'total_sales'   => (float) $row->total_sales,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data layanan terpopuler',
            'data'    => $formattedTop
        ]);
    }
}

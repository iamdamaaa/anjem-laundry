<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Order;
use App\Models\StaffMetric;
use App\Models\OrderStatusLog;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CalculateStaffMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'metrics:calculate-staff {--month= : The period month in YYYY-MM format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate and upsert performance metrics for laundry staff for a specific month';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // 1. Determine period month (defaults to previous month if not specified)
        $monthOption = $this->option('month');
        if ($monthOption) {
            try {
                $period = Carbon::createFromFormat('Y-m', $monthOption);
            } catch (\Exception $e) {
                $this->error('Format bulan tidak valid. Gunakan format YYYY-MM.');
                return 1;
            }
        } else {
            $period = now()->subMonth();
        }

        $periodMonth = $period->format('Y-m');
        $this->info("Memulai kalkulasi staff metrics untuk periode: {$periodMonth}...");

        // 2. Fetch all staff members (role_id = 2) or anyone who handled orders
        $staffUsers = User::whereHas('role', function ($q) {
            $q->whereIn('name', ['staff', 'admin']);
        })->get();

        $bar = $this->output->createProgressBar(count($staffUsers));
        $bar->start();

        foreach ($staffUsers as $staff) {
            // Get all completed orders assigned to this staff member completed in the target month
            $orders = Order::where('assigned_staff_id', $staff->id)
                ->where('order_status', 'completed')
                ->whereYear('delivery_done_at', $period->year)
                ->whereMonth('delivery_done_at', $period->month)
                ->with('items')
                ->get();

            $totalOrders = count($orders);

            if ($totalOrders === 0) {
                // Keep record or remove, let's upsert with zeros
                StaffMetric::updateOrCreate(
                    ['user_id' => $staff->id, 'period_month' => $periodMonth],
                    [
                        'total_orders_handled' => 0,
                        'orders_on_time'       => 0,
                        'orders_late'          => 0,
                        'avg_completion_hours' => 0.00,
                        'performance_score'    => 100.00, // No orders handled means 100% clean record
                    ]
                );
                $bar->advance();
                continue;
            }

            $ordersOnTime = 0;
            $ordersLate = 0;
            $totalCompletionHours = 0.00;

            foreach ($orders as $order) {
                $pickupTime = $order->pickup_done_at;
                $deliveryTime = $order->delivery_done_at;

                if ($pickupTime && $deliveryTime) {
                    $hours = $deliveryTime->diffInHours($pickupTime);
                    $totalCompletionHours += $hours;

                    // Find max duration in hours allowed for this order's items
                    $maxAllowedHours = 0;
                    foreach ($order->items as $item) {
                        $itemHours = (int) ($item->duration_hours_snapshot ?? 24);
                        if ($itemHours > $maxAllowedHours) {
                            $maxAllowedHours = $itemHours;
                        }
                    }

                    if ($maxAllowedHours === 0) {
                        $maxAllowedHours = 24; // fallback standard 24 hours
                    }

                    if ($hours <= $maxAllowedHours) {
                        $ordersOnTime++;
                    } else {
                        $ordersLate++;
                    }
                } else {
                    // Fallback to on time if timestamps are missing
                    $ordersOnTime++;
                }
            }

            $avgHours = round($totalCompletionHours / $totalOrders, 2);
            $performanceScore = round(($ordersOnTime / $totalOrders) * 100, 2);

            // Upsert metrics
            StaffMetric::updateOrCreate(
                ['user_id' => $staff->id, 'period_month' => $periodMonth],
                [
                    'total_orders_handled' => $totalOrders,
                    'orders_on_time'       => $ordersOnTime,
                    'orders_late'          => $ordersLate,
                    'avg_completion_hours' => $avgHours,
                    'performance_score'    => $performanceScore,
                ]
            );

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Kalkulasi selesai untuk periode: {$periodMonth}!");

        return 0;
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffMetric;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;

class StaffMetricsController extends Controller
{
    /**
     * Get list of all staff metrics, with optional month filter.
     * GET /admin/staff/metrics
     * GET /admin/staff/metrics?month=YYYY-MM
     */
    public function index(Request $request): JsonResponse
    {
        $query = StaffMetric::with('user');

        if ($request->has('month')) {
            $query->where('period_month', $request->query('month'));
        } else {
            // Default to current month or latest
            $query->where('period_month', now()->format('Y-m'));
        }

        $metrics = $query->orderBy('performance_score', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar KPI staf',
            'data'    => $metrics
        ]);
    }

    /**
     * Get specific staff metrics history.
     * GET /admin/staff/{id}/metrics
     */
    public function show(int $id): JsonResponse
    {
        $staff = User::whereHas('role', function ($q) {
            $q->whereIn('name', ['staff', 'admin']);
        })->find($id);

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staf tidak ditemukan.',
                'error'   => 'STAFF_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $metrics = StaffMetric::where('user_id', $id)
            ->orderBy('period_month', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil histori performa staf',
            'data'    => [
                'staff'   => [
                    'id'    => $staff->id,
                    'name'  => $staff->name,
                    'phone' => $staff->phone,
                ],
                'metrics' => $metrics
            ]
        ]);
    }

    /**
     * Trigger manual metrics recalculation for a specific month.
     * POST /admin/staff/metrics/recalculate
     */
    public function recalculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'nullable|string|regex:/^\d{4}-\d{2}$/'
        ], [
            'month.regex' => 'Format bulan harus YYYY-MM.'
        ]);

        $month = $validated['month'] ?? now()->format('Y-m');

        try {
            // Trigger Artisan Command programmatically
            $exitCode = Artisan::call('metrics:calculate-staff', [
                '--month' => $month
            ]);

            if ($exitCode === 0) {
                // Fetch the updated metrics for that month
                $updatedMetrics = StaffMetric::with('user')
                    ->where('period_month', $month)
                    ->get();

                return response()->json([
                    'success' => true,
                    'message' => "Matriks performa staf untuk periode {$month} berhasil dihitung ulang.",
                    'data'    => $updatedMetrics
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung ulang matriks staf.',
                'error'   => 'RECALCULATE_FAILED',
                'details' => null
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menghitung ulang.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}

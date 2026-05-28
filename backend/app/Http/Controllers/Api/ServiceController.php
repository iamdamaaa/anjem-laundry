<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    /**
     * Display a listing of active services, with optional filters.
     * GET /services
     * GET /services?category={slug}
     * GET /services?duration={hours}
     */
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('category')->where('is_active', true);

        // Filter by category slug
        if ($request->has('category')) {
            $categorySlug = $request->query('category');
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug)->where('is_active', true);
            });
        }

        // Filter by duration hours (4, 8, 12, 24, 48, 72)
        if ($request->has('duration')) {
            $duration = $request->query('duration');
            $query->where('duration_hours', $duration);
        }

        $services = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar layanan',
            'data'    => $services
        ]);
    }

    /**
     * Display the specified service.
     * GET /services/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $service = Service::with('category')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan atau tidak aktif.',
                'error'   => 'SERVICE_NOT_FOUND',
                'details' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail layanan',
            'data'    => $service
        ]);
    }
}

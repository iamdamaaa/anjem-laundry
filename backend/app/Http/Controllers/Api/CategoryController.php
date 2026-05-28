<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of active service categories.
     * GET /categories
     */
    public function index(): JsonResponse
    {
        $categories = ServiceCategory::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar kategori',
            'data'    => $categories
        ]);
    }

    /**
     * Display the specified category with its active services.
     * GET /categories/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $category = ServiceCategory::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan atau tidak aktif.',
                'error'   => 'CATEGORY_NOT_FOUND',
                'details' => null
            ], 404);
        }

        // Load active services belonging to this category
        $category->setRelation('services', $category->services()->where('is_active', true)->get());

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail kategori',
            'data'    => $category
        ]);
    }
}

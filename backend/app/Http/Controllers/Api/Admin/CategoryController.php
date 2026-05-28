<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Store a newly created category.
     * POST /admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:service_categories,name',
            'slug'        => 'nullable|string|max:120|unique:service_categories,slug',
            'description' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique'   => 'Nama kategori sudah terdaftar.',
            'slug.unique'   => 'Slug kategori sudah terdaftar.',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        
        // Ensure slug is unique, append unique suffix if needed
        $originalSlug = $slug;
        $count = 1;
        while (ServiceCategory::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        $category = ServiceCategory::create(array_merge($validated, [
            'slug'      => $slug,
            'is_active' => $validated['is_active'] ?? true,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dibuat',
            'data'    => $category
        ], 201);
    }

    /**
     * Update the specified category.
     * PATCH /admin/categories/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = ServiceCategory::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
                'error'   => 'CATEGORY_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:100|unique:service_categories,name,' . $id,
            'slug'        => 'sometimes|required|string|max:120|unique:service_categories,slug,' . $id,
            'description' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.required' => 'Nama kategori tidak boleh kosong.',
            'name.unique'   => 'Nama kategori sudah digunakan.',
            'slug.required' => 'Slug kategori tidak boleh kosong.',
            'slug.unique'   => 'Slug kategori sudah digunakan.',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui',
            'data'    => $category
        ]);
    }

    /**
     * Disable the specified category.
     * DELETE /admin/categories/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $category = ServiceCategory::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
                'error'   => 'CATEGORY_NOT_FOUND',
                'details' => null
            ], 404);
        }

        // Rule: Nonaktifkan kategori (set is_active = false)
        $category->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dinonaktifkan',
            'data'    => null
        ]);
    }
}

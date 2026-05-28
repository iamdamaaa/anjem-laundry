<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    /**
     * Store a newly created service.
     * POST /admin/services
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id'    => 'required|exists:service_categories,id',
            'name'           => 'required|string|max:100|unique:services,name',
            'slug'           => 'nullable|string|max:120|unique:services,slug',
            'description'    => 'nullable|string',
            'pricing_type'   => 'required|string|in:by_weight,by_unit',
            'price_per_kg'   => 'required_if:pricing_type,by_weight|nullable|numeric|min:0',
            'price_per_unit' => 'required_if:pricing_type,by_unit|nullable|numeric|min:0',
            'min_weight_kg'  => 'nullable|numeric|min:0',
            'duration_hours' => 'required|string|in:4,8,12,24,48,72',
            'duration_label' => 'required|string|max:50',
            'is_active'      => 'nullable|boolean',
        ], [
            'category_id.required'   => 'Kategori layanan wajib dipilih.',
            'category_id.exists'     => 'Kategori layanan tidak valid.',
            'name.required'          => 'Nama layanan wajib diisi.',
            'name.unique'            => 'Nama layanan sudah terdaftar.',
            'pricing_type.required'  => 'Tipe penentuan harga wajib diisi.',
            'price_per_kg.required_if' => 'Harga per kg wajib diisi untuk tipe kiloan.',
            'price_per_unit.required_if' => 'Harga per satuan wajib diisi untuk tipe satuan.',
            'duration_hours.required' => 'Durasi layanan wajib diisi.',
            'duration_label.required' => 'Label durasi wajib diisi.',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        
        // Ensure slug is unique, append unique suffix if needed
        $originalSlug = $slug;
        $count = 1;
        while (Service::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        $service = Service::create(array_merge($validated, [
            'slug'      => $slug,
            'is_active' => $validated['is_active'] ?? true,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dibuat',
            'data'    => $service->load('category')
        ], 201);
    }

    /**
     * Update the specified service.
     * PATCH /admin/services/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan.',
                'error'   => 'SERVICE_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'category_id'    => 'sometimes|required|exists:service_categories,id',
            'name'           => 'sometimes|required|string|max:100|unique:services,name,' . $id,
            'slug'           => 'sometimes|required|string|max:120|unique:services,slug,' . $id,
            'description'    => 'nullable|string',
            'pricing_type'   => 'sometimes|required|string|in:by_weight,by_unit',
            'price_per_kg'   => 'required_if:pricing_type,by_weight|nullable|numeric|min:0',
            'price_per_unit' => 'required_if:pricing_type,by_unit|nullable|numeric|min:0',
            'min_weight_kg'  => 'nullable|numeric|min:0',
            'duration_hours' => 'sometimes|required|string|in:4,8,12,24,48,72',
            'duration_label' => 'sometimes|required|string|max:50',
            'is_active'      => 'nullable|boolean',
        ], [
            'name.unique'            => 'Nama layanan sudah digunakan.',
            'slug.unique'            => 'Slug layanan sudah digunakan.',
            'price_per_kg.required_if' => 'Harga per kg wajib diisi untuk tipe kiloan.',
            'price_per_unit.required_if' => 'Harga per satuan wajib diisi untuk tipe satuan.',
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil diperbarui',
            'data'    => $service->load('category')
        ]);
    }

    /**
     * Disable the specified service.
     * DELETE /admin/services/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $service = Service::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan.',
                'error'   => 'SERVICE_NOT_FOUND',
                'details' => null
            ], 404);
        }

        // Rule: Nonaktifkan layanan (set is_active = false)
        $service->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dinonaktifkan',
            'data'    => null
        ]);
    }
}

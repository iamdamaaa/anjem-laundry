<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    /**
     * Get list of addresses for logged-in customer.
     * GET /profile/addresses
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderBy('is_default', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar alamat',
            'data'    => $addresses
        ]);
    }

    /**
     * Add a new address.
     * POST /profile/addresses
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'label'       => 'required|string|max:100',
            'address'     => 'required|string',
            'city'        => 'required|string|max:100',
            'district'    => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'lat'         => 'nullable|string|max:20',
            'lng'         => 'nullable|string|max:20',
            'is_default'  => 'nullable|boolean',
        ], [
            'label.required'   => 'Label alamat (misal: Rumah) wajib diisi.',
            'address.required' => 'Alamat lengkap wajib diisi.',
            'city.required'    => 'Kota wajib diisi.',
        ]);

        $hasAddresses = $user->addresses()->exists();
        $isDefault = $validated['is_default'] ?? false;

        // Rule: If it's their first address, force is_default = true
        if (!$hasAddresses) {
            $isDefault = true;
        }

        DB::transaction(function () use ($user, $isDefault, $validated, &$address) {
            if ($isDefault) {
                // Clear other defaults
                $user->addresses()->update(['is_default' => false]);
            }

            $address = $user->addresses()->create(array_merge($validated, [
                'is_default' => $isDefault
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil ditambahkan',
            'data'    => $address
        ], 201);
    }

    /**
     * Edit an address.
     * PATCH /profile/addresses/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
                'error'   => 'ADDRESS_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'label'       => 'sometimes|required|string|max:100',
            'address'     => 'sometimes|required|string',
            'city'        => 'sometimes|required|string|max:100',
            'district'    => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'lat'         => 'nullable|string|max:20',
            'lng'         => 'nullable|string|max:20',
            'is_default'  => 'nullable|boolean',
        ]);

        $isDefault = $validated['is_default'] ?? $address->is_default;

        DB::transaction(function () use ($user, $address, $isDefault, $validated) {
            if ($isDefault && !$address->is_default) {
                // Set others to false
                $user->addresses()->update(['is_default' => false]);
            } elseif (!$isDefault && $address->is_default) {
                // Cannot unset default if it's the only one
                $otherExists = $user->addresses()->where('id', '!=', $address->id)->exists();
                if (!$otherExists) {
                    $isDefault = true;
                }
            }

            $address->update(array_merge($validated, [
                'is_default' => $isDefault
            ]));
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil diperbarui',
            'data'    => $address->fresh()
        ]);
    }

    /**
     * Set address as default.
     * PATCH /profile/addresses/{id}/default
     */
    public function setDefault(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
                'error'   => 'ADDRESS_NOT_FOUND',
                'details' => null
            ], 404);
        }

        DB::transaction(function () use ($user, $address) {
            $user->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat utama berhasil diperbarui',
            'data'    => $address->fresh()
        ]);
    }

    /**
     * Delete an address.
     * DELETE /profile/addresses/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
                'error'   => 'ADDRESS_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $wasDefault = $address->is_default;

        DB::transaction(function () use ($user, $address, $wasDefault) {
            $address->delete();

            // Rule: If deleted address was default, make another address default
            if ($wasDefault) {
                $nextAddress = $user->addresses()->first();
                if ($nextAddress) {
                    $nextAddress->update(['is_default' => true]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil dihapus',
            'data'    => null
        ]);
    }
}

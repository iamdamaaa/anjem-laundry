<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * Update customer profile name and/or email.
     * PATCH /profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'sometimes|required|string|max:100',
            'email' => 'sometimes|nullable|email|max:150',
        ], [
            'name.required' => 'Nama tidak boleh kosong.',
            'name.max'      => 'Nama maksimal 100 karakter.',
            'email.email'   => 'Format email tidak valid.',
            'email.max'     => 'Email maksimal 150 karakter.',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'role'  => $user->role->name,
            ]
        ]);
    }
}

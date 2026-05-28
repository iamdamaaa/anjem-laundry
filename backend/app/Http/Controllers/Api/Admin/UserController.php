<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Get all users (Admin can view all users: customers, staff, admins)
     * GET /admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('role');

        if ($request->has('role')) {
            $roleName = $request->query('role');
            $query->whereHas('role', function($q) use ($roleName) {
                $q->where('name', $roleName);
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar pengguna',
            'data'    => $users
        ]);
    }

    /**
     * Store a new user (Staff or Admin)
     * POST /admin/users
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'phone'     => 'required|string|max:20|unique:users,phone',
            'email'     => 'nullable|email|max:255|unique:users,email',
            'role_id'   => 'required|exists:roles,id',
            'password'  => 'required|string|min:6',
            'is_active' => 'nullable|boolean'
        ], [
            'name.required'    => 'Nama wajib diisi.',
            'phone.required'   => 'Nomor telepon wajib diisi.',
            'phone.unique'     => 'Nomor telepon sudah terdaftar.',
            'role_id.required' => 'Peran (Role) wajib dipilih.',
            'password.required'=> 'Password wajib diisi.'
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'phone'          => $validated['phone'],
            'email'          => $validated['email'] ?? null,
            'role_id'        => $validated['role_id'],
            'password'       => Hash::make($validated['password']),
            'phone_verified' => true,
            'is_active'      => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan',
            'data'    => $user->load('role')
        ], 201);
    }

    /**
     * Update an existing user.
     * PATCH /admin/users/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan',
                'error'   => 'USER_NOT_FOUND'
            ], 404);
        }

        $validated = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'phone'     => 'sometimes|required|string|max:20|unique:users,phone,' . $id,
            'email'     => 'nullable|email|max:255|unique:users,email,' . $id,
            'role_id'   => 'sometimes|required|exists:roles,id',
            'password'  => 'nullable|string|min:6',
            'is_active' => 'nullable|boolean'
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui',
            'data'    => $user->load('role')
        ]);
    }

    /**
     * Delete / Disable a user.
     * DELETE /admin/users/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan',
                'error'   => 'USER_NOT_FOUND'
            ], 404);
        }

        // Prevent admin from deleting themselves
        if (auth()->id() === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak bisa menonaktifkan akun Anda sendiri.',
                'error'   => 'CANNOT_DELETE_SELF'
            ], 422);
        }

        // Soft disable
        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dinonaktifkan',
            'data'    => null
        ]);
    }
}

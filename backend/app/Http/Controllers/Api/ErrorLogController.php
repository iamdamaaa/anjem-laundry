<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ErrorLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ErrorLogController extends Controller
{
    /**
     * Ingest error logs from frontend client.
     * POST /logs/error
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'error_type'    => 'required|string|max:100',
            'error_message' => 'required|string',
            'stack_trace'   => 'nullable|string',
            'request_url'   => 'nullable|string|max:255',
        ], [
            'error_type.required'    => 'Tipe error wajib diisi.',
            'error_message.required' => 'Pesan error wajib diisi.',
        ]);

        // Capture user if authenticated (optional)
        $userId = null;
        if (auth('sanctum')->check()) {
            $userId = auth('sanctum')->id();
        }

        $log = ErrorLog::create(array_merge($validated, [
            'user_id'    => $userId,
            'ip_address' => $request->ip(),
            'source'     => 'client',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Error log berhasil dikirim.',
            'data'    => $log
        ], 201);
    }
}

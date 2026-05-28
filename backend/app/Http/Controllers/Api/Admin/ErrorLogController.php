<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ErrorLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ErrorLogController extends Controller
{
    /**
     * Get list of all error logs (Admin Only).
     * GET /admin/logs/errors
     * GET /admin/logs/errors?type={type}
     */
    public function index(Request $request): JsonResponse
    {
        $query = ErrorLog::with('user');

        if ($request->has('type')) {
            $query->where('error_type', $request->query('type'));
        }

        if ($request->has('source')) {
            $query->where('source', $request->query('source'));
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil logs error',
            'data'    => $logs
        ]);
    }
}

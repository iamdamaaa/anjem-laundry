<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->role || !in_array($user->role->name, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak',
                'error'   => 'AUTH_FORBIDDEN',
                'details' => null
            ], 403);
        }

        return $next($request);
    }
}

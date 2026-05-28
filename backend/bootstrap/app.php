<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\App\Http\Middleware\ForceJsonResponse::class);
        $middleware->alias([
            'role' => \App\Http\Middleware\AuthorizeRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            $details = [];
            foreach ($e->errors() as $field => $messages) {
                foreach ($messages as $message) {
                    $details[] = [
                        'field' => $field,
                        'message' => $message,
                    ];
                }
            }
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'error'   => 'VALIDATION_ERROR',
                'details' => $details
            ], 422);
        });
    })->create();

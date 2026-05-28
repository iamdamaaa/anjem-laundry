<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    
    // ==========================================
    // AUTHENTICATION (Public Endpoints)
    // ==========================================
    Route::post('/auth/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

    // ==========================================
    // PUBLIC CATEGORIES & SERVICES
    // ==========================================
    Route::get('/categories', [\App\Http\Controllers\Api\CategoryController::class, 'index']);
    Route::get('/categories/{slug}', [\App\Http\Controllers\Api\CategoryController::class, 'show']);
    Route::get('/services', [\App\Http\Controllers\Api\ServiceController::class, 'index']);
    Route::get('/services/{slug}', [\App\Http\Controllers\Api\ServiceController::class, 'show']);
    Route::get('/invoice/{invoiceToken}', [\App\Http\Controllers\Api\OrderController::class, 'showPublicInvoice']);
    
    // Ingest client-side error reports (Public)
    Route::post('/logs/error', [\App\Http\Controllers\Api\ErrorLogController::class, 'store']);

    // ==========================================
    // AUTHENTICATION (Protected Endpoints)
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
    });

    // ==========================================
    // CUSTOMER PROFILE & ADDRESSES & ORDERS
    // ==========================================
    Route::middleware(['auth:sanctum', 'role:customer'])->group(function () {
        // Profile
        Route::patch('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
        
        // Addresses
        Route::get('/profile/addresses', [\App\Http\Controllers\Api\AddressController::class, 'index']);
        Route::post('/profile/addresses', [\App\Http\Controllers\Api\AddressController::class, 'store']);
        Route::patch('/profile/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'update']);
        Route::delete('/profile/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'destroy']);
        Route::patch('/profile/addresses/{id}/default', [\App\Http\Controllers\Api\AddressController::class, 'setDefault']);

        // Orders
        Route::post('/orders', [\App\Http\Controllers\Api\OrderController::class, 'store']);
        Route::get('/orders', [\App\Http\Controllers\Api\OrderController::class, 'index']);
        Route::get('/orders/{orderNumber}', [\App\Http\Controllers\Api\OrderController::class, 'show']);
        
        // Payments
        Route::post('/orders/{id}/payment', [\App\Http\Controllers\Api\PaymentController::class, 'customerUpload']);
    });

    // ==========================================
    // STAFF & ADMIN ORDER & PAYMENT OPERATIONS
    // ==========================================
    Route::middleware(['auth:sanctum', 'role:admin,staff'])->group(function () {
        // Orders
        Route::get('/admin/orders', [\App\Http\Controllers\Api\Admin\OrderController::class, 'index']);
        Route::get('/admin/orders/{id}', [\App\Http\Controllers\Api\Admin\OrderController::class, 'show']);
        Route::patch('/admin/orders/{id}/status', [\App\Http\Controllers\Api\Admin\OrderController::class, 'updateStatus']);
        Route::patch('/admin/orders/{id}/actual', [\App\Http\Controllers\Api\Admin\OrderController::class, 'inputActual']);
        Route::get('/admin/orders/{id}/logs', [\App\Http\Controllers\Api\Admin\OrderController::class, 'getLogs']);
        
        // Auto-verified Payment Upload
        Route::post('/admin/orders/{id}/payment', [\App\Http\Controllers\Api\PaymentController::class, 'adminUpload']);

        // Payments Approvals
        Route::get('/admin/payments', [\App\Http\Controllers\Api\PaymentController::class, 'index']);
        Route::patch('/admin/payments/{id}/verify', [\App\Http\Controllers\Api\PaymentController::class, 'verify']);
        Route::patch('/admin/payments/{id}/reject', [\App\Http\Controllers\Api\PaymentController::class, 'reject']);
    });

    // ==========================================
    // ADMIN ONLY MANAGEMENT
    // ==========================================
    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        // Staff Assignment
        Route::patch('/admin/orders/{id}/assign', [\App\Http\Controllers\Api\Admin\OrderController::class, 'assignStaff']);

        // Categories CRUD
        Route::post('/admin/categories', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'store']);
        Route::patch('/admin/categories/{id}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'update']);
        Route::delete('/admin/categories/{id}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'destroy']);

        // Services CRUD
        Route::post('/admin/services', [\App\Http\Controllers\Api\Admin\ServiceController::class, 'store']);
        Route::patch('/admin/services/{id}', [\App\Http\Controllers\Api\Admin\ServiceController::class, 'update']);
        Route::delete('/admin/services/{id}', [\App\Http\Controllers\Api\Admin\ServiceController::class, 'destroy']);

        // Staff Metrics
        Route::get('/admin/staff/metrics', [\App\Http\Controllers\Api\Admin\StaffMetricsController::class, 'index']);
        Route::get('/admin/staff/{id}/metrics', [\App\Http\Controllers\Api\Admin\StaffMetricsController::class, 'show']);
        Route::post('/admin/staff/metrics/recalculate', [\App\Http\Controllers\Api\Admin\StaffMetricsController::class, 'recalculate']);

        // Notifications Logs
        Route::get('/admin/notifications', [\App\Http\Controllers\Api\Admin\NotificationController::class, 'index']);
        Route::post('/admin/notifications/{id}/retry', [\App\Http\Controllers\Api\Admin\NotificationController::class, 'retry']);

        // Error Logs Admin
        Route::get('/admin/logs/errors', [\App\Http\Controllers\Api\Admin\ErrorLogController::class, 'index']);

        // Dashboard Analytics
        Route::get('/admin/dashboard/summary', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'summary']);
        Route::get('/admin/dashboard/orders-chart', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'ordersChart']);
        Route::get('/admin/dashboard/top-services', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'topServices']);
    });

});

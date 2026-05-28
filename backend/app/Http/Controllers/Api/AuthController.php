<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RequestOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Helpers\PhoneHelper;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Request an OTP (Registration or Login)
     * POST /auth/request-otp
     */
    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $phone = PhoneHelper::normalize($request->phone);
        $purpose = $request->purpose;

        $user = User::where('phone', $phone)->first();

        if ($purpose === 'register') {
            if ($user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor telepon sudah terdaftar. Silakan login.',
                    'error'   => 'PHONE_ALREADY_REGISTERED',
                    'details' => null
                ], 422);
            }
        } elseif ($purpose === 'login') {
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor telepon tidak ditemukan. Silakan registrasi terlebih dahulu.',
                    'error'   => 'PHONE_NOT_FOUND',
                    'details' => null
                ], 404);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda dinonaktifkan. Silakan hubungi admin.',
                    'error'   => 'ACCOUNT_INACTIVE',
                    'details' => null
                ], 403);
            }
        }

        // Trigger OTP generation and dispatch via OtpService
        $result = $this->otpService->requestOtp($phone, $purpose);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'error'   => $result['error'],
                'details' => null
            ], 429);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data'    => null
        ]);
    }

    /**
     * Verify OTP (Completes Registration or Login)
     * POST /auth/verify-otp
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = PhoneHelper::normalize($request->phone);
        $code = $request->code;
        $purpose = $request->purpose;

        // Verify OTP code
        $verification = $this->otpService->verifyOtp($phone, $code, $purpose);

        if (!$verification['success']) {
            $status = 400;
            if ($verification['error'] === 'AUTH_OTP_EXPIRED') {
                $status = 410;
            } elseif ($verification['error'] === 'AUTH_OTP_MAX_ATTEMPTS') {
                $status = 429;
            }

            return response()->json([
                'success' => false,
                'message' => $verification['message'],
                'error'   => $verification['error'],
                'details' => null
            ], $status);
        }

        // OTP is valid! Proceed with Registration/Login
        $user = User::where('phone', $phone)->first();

        if ($purpose === 'register') {
            if ($user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor telepon sudah terdaftar.',
                    'error'   => 'PHONE_ALREADY_REGISTERED',
                    'details' => null
                ], 422);
            }

            // Create new customer account
            $user = User::create([
                'role_id'        => 3, // Customer
                'name'           => $request->name,
                'phone'          => $phone,
                'email'          => null, // Can be updated in profile
                'phone_verified' => true,
                'is_active'      => true,
            ]);
        } elseif ($purpose === 'login') {
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor telepon tidak ditemukan.',
                    'error'   => 'PHONE_NOT_FOUND',
                    'details' => null
                ], 404);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda dinonaktifkan.',
                    'error'   => 'ACCOUNT_INACTIVE',
                    'details' => null
                ], 403);
            }
        }

        // Load role relationship
        $user->load('role');

        // Create Sanctum plain text token (expires in 7 days)
        $token = $user->createToken('auth_token', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi berhasil',
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'role'  => $user->role->name,
                ]
            ]
        ]);
    }

    /**
     * Logout user
     * POST /auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout',
            'data'    => null
        ]);
    }

    /**
     * Get currently logged-in user profile
     * GET /auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data profil',
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

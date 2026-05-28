<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Models\Notification;
use App\Helpers\PhoneHelper;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OtpService
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Request an OTP code (sends OTP via WhatsApp Fonnte).
     */
    public function requestOtp(string $phone, string $purpose): array
    {
        $normalizedPhone = PhoneHelper::normalize($phone);

        $ttl = (int) env('OTP_TTL_SECONDS', 300);
        $maxAttempts = (int) env('OTP_MAX_ATTEMPTS', 3);
        $rateLimitCount = (int) env('OTP_RATE_LIMIT_COUNT', 3);
        $rateLimitWindow = (int) env('OTP_RATE_LIMIT_WINDOW', 600); // 10 minutes

        // 1. Rate Limit Check: Max N requests per phone in last M minutes
        $recentRequestsCount = OtpCode::where('phone', $normalizedPhone)
            ->where('created_at', '>=', now()->subSeconds($rateLimitWindow))
            ->count();

        if ($recentRequestsCount >= $rateLimitCount) {
            return [
                'success' => false,
                'error'   => 'AUTH_OTP_RATE_LIMIT',
                'message' => 'Terlalu sering meminta OTP. Silakan tunggu beberapa menit.'
            ];
        }

        // 2. Invalidate all existing active OTPs for this phone
        OtpCode::where('phone', $normalizedPhone)
            ->where('is_used', false)
            ->update(['is_used' => true]);

        // 3. Generate a new 6-digit OTP code
        // For development, if we want to run unit tests easily or have a fallback,
        // let's use standard random generator.
        try {
            $code = (string) random_int(100000, 999999);
        } catch (\Exception $e) {
            $code = (string) rand(100000, 999999);
        }

        // 4. Save to database
        $otp = OtpCode::create([
            'phone'      => $normalizedPhone,
            'code'       => $code,
            'purpose'    => $purpose,
            'attempts'   => 0,
            'is_used'    => false,
            'expires_at' => now()->addSeconds($ttl),
        ]);

        // 5. Send OTP via WhatsApp
        $message = "Kode OTP Anda untuk login/register Laundry App adalah: {$code}. Rahasiakan kode ini. Kode berlaku selama 5 menit.";
        
        $whatsappResult = $this->whatsappService->send($normalizedPhone, $message);
        
        $isSent = isset($whatsappResult['status']) && $whatsappResult['status'];
        $sentError = !$isSent ? ($whatsappResult['error'] ?? $whatsappResult['reason'] ?? 'Gateway returned false status') : null;

        // 6. Log notification
        Notification::create([
            'user_id'    => null,
            'order_id'   => null,
            'channel'    => 'whatsapp',
            'recipient'  => $normalizedPhone,
            'subject'    => 'OTP Code Request',
            'message'    => "Kode OTP Anda adalah: {$code}.",
            'is_sent'    => $isSent,
            'sent_error' => $sentError,
            'sent_at'    => $isSent ? now() : null,
        ]);

        return [
            'success' => true,
            'message' => 'Kode OTP telah dikirim ke WhatsApp kamu'
        ];
    }

    /**
     * Verify an OTP code.
     */
    public function verifyOtp(string $phone, string $code, string $purpose): array
    {
        $normalizedPhone = PhoneHelper::normalize($phone);
        $maxAttempts = (int) env('OTP_MAX_ATTEMPTS', 3);

        // Fetch latest active OTP code for this phone and purpose
        $otp = OtpCode::where('phone', $normalizedPhone)
            ->where('purpose', $purpose)
            ->where('is_used', false)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$otp) {
            return [
                'success' => false,
                'error'   => 'AUTH_OTP_EXPIRED',
                'message' => 'Kode OTP salah atau sudah kedaluwarsa. Silakan minta kode OTP baru.'
            ];
        }

        if ($otp->isExpired()) {
            $otp->update(['is_used' => true]);
            return [
                'success' => false,
                'error'   => 'AUTH_OTP_EXPIRED',
                'message' => 'Kode OTP sudah kedaluwarsa. Silakan minta kode OTP baru.'
            ];
        }

        // Increment attempts
        $otp->attempts += 1;
        $otp->save();

        if ($otp->attempts >= $maxAttempts) {
            $otp->update(['is_used' => true]);
            return [
                'success' => false,
                'error'   => 'AUTH_OTP_MAX_ATTEMPTS',
                'message' => 'Terlalu banyak percobaan yang salah. Silakan minta kode OTP baru.'
            ];
        }

        // Check matching code
        if ($otp->code === $code) {
            $otp->update(['is_used' => true]);
            return [
                'success' => true,
                'message' => 'OTP berhasil diverifikasi.'
            ];
        }

        $remaining = $maxAttempts - $otp->attempts;
        return [
            'success' => false,
            'error'   => 'AUTH_INVALID_OTP',
            'message' => "Kode OTP salah. Sisa percobaan: {$remaining} kali."
        ];
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailNotificationService
{
    /**
     * Send an email notification using Laravel Mail.
     */
    public function send(string $email, $mailable): bool
    {
        try {
            Mail::to($email)->send($mailable);
            return true;
        } catch (\Exception $e) {
            // Catat error, jangan lempar exception ke caller
            Log::error('Email send failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return false;
        }
    }
}

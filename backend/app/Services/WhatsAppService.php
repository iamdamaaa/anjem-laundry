<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send a WhatsApp message via Fonnte API.
     */
    public function send(string $phone, string $message): array
    {
        try {
            $token = config('services.fonnte.token');
            $url = config('services.fonnte.url', 'https://api.fonnte.com/send');

            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post($url, [
                'target'  => $phone,
                'message' => $message,
            ]);

            $result = $response->json();

            // Log raw response if there's an error status returned by Fonnte
            if (!$response->successful() || (isset($result['status']) && !$result['status'])) {
                Log::warning('WhatsApp gateway warning response: ', ['body' => $response->body()]);
            }

            return $result ?? ['status' => false, 'message' => 'Empty response from gateway'];
        } catch (\Exception $e) {
            // Catat error, jangan lempar exception ke caller
            Log::error('WhatsApp send failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return ['error' => $e->getMessage(), 'status' => false];
        }
    }
}

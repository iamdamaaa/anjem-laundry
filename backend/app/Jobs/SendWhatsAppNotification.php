<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Notification $notification;

    /**
     * Create a new job instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsappService): void
    {
        try {
            $response = $whatsappService->send(
                $this->notification->recipient,
                $this->notification->message
            );

            $isSent = isset($response['status']) && $response['status'];
            
            if ($isSent) {
                $this->notification->update([
                    'is_sent' => true,
                    'sent_at' => now(),
                    'sent_error' => null
                ]);
            } else {
                $errorMsg = $response['error'] ?? $response['message'] ?? 'Gateway returned false status';
                $this->notification->update([
                    'is_sent' => false,
                    'sent_error' => $errorMsg
                ]);
            }
        } catch (\Exception $e) {
            $this->notification->update([
                'is_sent' => false,
                'sent_error' => $e->getMessage()
            ]);
            Log::error('SendWhatsAppNotification Job failed: ' . $e->getMessage());
        }
    }
}

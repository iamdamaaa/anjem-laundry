<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Notification $notification;
    protected $mailable;

    /**
     * Create a new job instance.
     */
    public function __construct(Notification $notification, $mailable)
    {
        $this->notification = $notification;
        $this->mailable = $mailable;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Mail::to($this->notification->recipient)->send($this->mailable);

            $this->notification->update([
                'is_sent'    => true,
                'sent_at'    => now(),
                'sent_error' => null
            ]);
        } catch (\Exception $e) {
            $this->notification->update([
                'is_sent'    => false,
                'sent_error' => $e->getMessage()
            ]);
            Log::error('SendEmailNotification Job failed: ' . $e->getMessage());
        }
    }
}

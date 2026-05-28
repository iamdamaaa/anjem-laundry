<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Jobs\SendWhatsAppNotification;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Display a listing of notification history.
     * GET /admin/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::with(['user', 'order']);

        if ($request->has('channel')) {
            $query->where('channel', $request->query('channel'));
        }

        if ($request->has('is_sent')) {
            $query->where('is_sent', $request->query('is_sent'));
        }

        $notifications = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil riwayat notifikasi',
            'data'    => $notifications
        ]);
    }

    /**
     * Retry sending a failed notification.
     * POST /admin/notifications/{id}/retry
     */
    public function retry(int $id): JsonResponse
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Data notifikasi tidak ditemukan.',
                'error'   => 'NOTIFICATION_NOT_FOUND',
                'details' => null
            ], 404);
        }

        try {
            if ($notification->channel === 'whatsapp') {
                // WhatsApp Retry: Dispatch Queue Job again
                $notification->update(['is_sent' => false, 'sent_error' => 'Retrying...', 'sent_at' => null]);
                SendWhatsAppNotification::dispatch($notification);
            } else {
                // Email Retry: Resend via clean direct mailer
                $notification->update(['is_sent' => false, 'sent_error' => 'Retrying...', 'sent_at' => null]);
                
                Mail::html($notification->message, function ($m) use ($notification) {
                    $m->to($notification->recipient)
                      ->subject($notification->subject ?? 'Notifikasi Laundry');
                });

                $notification->update([
                    'is_sent'    => true,
                    'sent_at'    => now(),
                    'sent_error' => null
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi berhasil dimasukkan antrean pengiriman ulang.',
                'data'    => $notification->fresh()
            ]);
        } catch (\Exception $e) {
            $notification->update([
                'is_sent'    => false,
                'sent_error' => 'Retry failed: ' . $e->getMessage()
            ]);
            Log::error('Retrying notification failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim ulang notifikasi.',
                'error'   => 'RETRY_FAILED',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}

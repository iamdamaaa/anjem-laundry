<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Notification;
use App\Jobs\SendWhatsAppNotification;
use App\Jobs\SendEmailNotification;
use App\Mail\OrderReceivedMail;
use App\Mail\OrderPickedUpMail;
use App\Mail\OrderInProcessMail;
use App\Mail\OrderWaitingDeliveryMail;
use App\Mail\OrderCompletedMail;
use App\Mail\PaymentPendingMail;
use App\Mail\PaymentVerifiedMail;
use App\Mail\PaymentRejectedMail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Trigger notification on Order Created (Received)
     * Email ONLY to Customer
     */
    public function sendOrderReceivedNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user || empty($user->email)) return;

            $notification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'email',
                'recipient'  => $user->email,
                'subject'    => "Pesanan Laundry #{$order->order_number} Diterima",
                'message'    => "Pesanan laundry Anda telah diterima oleh sistem kami.",
                'is_sent'    => false,
            ]);

            SendEmailNotification::dispatch($notification, new OrderReceivedMail($order));
        } catch (\Exception $e) {
            Log::error('NotificationService received error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Order Picked Up
     * WA + Email to Customer
     */
    public function sendOrderPickedUpNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user) return;

            // 1. WhatsApp
            $waMessage = "Halo {$user->name}! Laundry kamu sudah kami ambil. Sedang dalam perjalanan ke tempat kami.";
            $waNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'whatsapp',
                'recipient'  => $user->phone,
                'message'    => $waMessage,
                'is_sent'    => false,
            ]);
            SendWhatsAppNotification::dispatch($waNotification);

            // 2. Email
            if (!empty($user->email)) {
                $emailNotification = Notification::create([
                    'user_id'    => $user->id,
                    'order_id'   => $order->id,
                    'channel'    => 'email',
                    'recipient'  => $user->email,
                    'subject'    => "Pesanan Laundry #{$order->order_number} Telah Diambil",
                    'message'    => $waMessage,
                    'is_sent'    => false,
                ]);
                SendEmailNotification::dispatch($emailNotification, new OrderPickedUpMail($order));
            }
        } catch (\Exception $e) {
            Log::error('NotificationService picked_up error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Order In Process
     * WA + Email to Customer (includes public invoice link with actual weights)
     */
    public function sendOrderInProcessNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user) return;

            $invoiceUrl = env('INVOICE_BASE_URL', 'http://localhost:3000/invoice') . '/' . $order->invoice_token;
            $duration = $order->items->first()?->duration_label_snapshot ?? 'Reguler';

            // 1. WhatsApp
            $waMessage = "Halo {$user->name}! Laundry kamu sedang kami proses. Cek detail & invoice terbaru: {$invoiceUrl}. Estimasi selesai: {$duration}.";
            $waNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'whatsapp',
                'recipient'  => $user->phone,
                'message'    => $waMessage,
                'is_sent'    => false,
            ]);
            SendWhatsAppNotification::dispatch($waNotification);

            // 2. Email
            if (!empty($user->email)) {
                $emailNotification = Notification::create([
                    'user_id'    => $user->id,
                    'order_id'   => $order->id,
                    'channel'    => 'email',
                    'recipient'  => $user->email,
                    'subject'    => "Pesanan Laundry #{$order->order_number} Sedang Diproses",
                    'message'    => $waMessage,
                    'is_sent'    => false,
                ]);
                SendEmailNotification::dispatch($emailNotification, new OrderInProcessMail($order));
            }
        } catch (\Exception $e) {
            Log::error('NotificationService in_process error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Order Waiting Delivery
     * Email ONLY to Customer
     */
    public function sendOrderWaitingDeliveryNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user || empty($user->email)) return;

            $emailNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'email',
                'recipient'  => $user->email,
                'subject'    => "Pesanan Laundry #{$order->order_number} Selesai Diproses",
                'message'    => "Laundry Anda telah selesai diproses dan sedang menunggu pengiriman kembali.",
                'is_sent'    => false,
            ]);
            SendEmailNotification::dispatch($emailNotification, new OrderWaitingDeliveryMail($order));
        } catch (\Exception $e) {
            Log::error('NotificationService waiting_delivery error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Order Completed
     * WA + Email to Customer
     */
    public function sendOrderCompletedNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user) return;

            // 1. WhatsApp
            $waMessage = "Halo {$user->name}! Laundry kamu sudah selesai dan dikirim. Terima kasih sudah menggunakan layanan kami!";
            $waNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'whatsapp',
                'recipient'  => $user->phone,
                'message'    => $waMessage,
                'is_sent'    => false,
            ]);
            SendWhatsAppNotification::dispatch($waNotification);

            // 2. Email
            if (!empty($user->email)) {
                $emailNotification = Notification::create([
                    'user_id'    => $user->id,
                    'order_id'   => $order->id,
                    'channel'    => 'email',
                    'recipient'  => $user->email,
                    'subject'    => "Pesanan Laundry #{$order->order_number} Selesai & Dikirim",
                    'message'    => $waMessage,
                    'is_sent'    => false,
                ]);
                SendEmailNotification::dispatch($emailNotification, new OrderCompletedMail($order));
            }
        } catch (\Exception $e) {
            Log::error('NotificationService completed error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Payment Proof Uploaded (Pending)
     * Email ONLY to Customer
     */
    public function sendPaymentPendingNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user || empty($user->email)) return;

            $emailNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'email',
                'recipient'  => $user->email,
                'subject'    => "Bukti Pembayaran untuk Pesanan #{$order->order_number} Sedang Diverifikasi",
                'message'    => "Bukti transfer Anda telah kami terima dan sedang diverifikasi.",
                'is_sent'    => false,
            ]);
            SendEmailNotification::dispatch($emailNotification, new PaymentPendingMail($order));
        } catch (\Exception $e) {
            Log::error('NotificationService payment_pending error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Payment Proof Verified
     * Email ONLY to Customer
     */
    public function sendPaymentVerifiedNotification(Order $order): void
    {
        try {
            $user = $order->user;
            if (!$user || empty($user->email)) return;

            $emailNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'email',
                'recipient'  => $user->email,
                'subject'    => "Pembayaran untuk Pesanan #{$order->order_number} Berhasil Dikonfirmasi",
                'message' => "Pembayaran Anda telah berhasil kami konfirmasi lunas.",
                'is_sent' => false,
            ]);
            SendEmailNotification::dispatch($emailNotification, new PaymentVerifiedMail($order));
        } catch (\Exception $e) {
            Log::error('NotificationService payment_verified error: ' . $e->getMessage());
        }
    }

    /**
     * Trigger notification on Payment Proof Rejected
     * Email ONLY to Customer
     */
    public function sendPaymentRejectedNotification(Order $order, string $rejectionReason): void
    {
        try {
            $user = $order->user;
            if (!$user || empty($user->email)) return;

            $emailNotification = Notification::create([
                'user_id'    => $user->id,
                'order_id'   => $order->id,
                'channel'    => 'email',
                'recipient'  => $user->email,
                'subject'    => "Pembayaran untuk Pesanan #{$order->order_number} Ditolak",
                'message'    => "Pembayaran ditolak. Alasan: {$rejectionReason}",
                'is_sent'    => false,
            ]);
            SendEmailNotification::dispatch($emailNotification, new PaymentRejectedMail($order, $rejectionReason));
        } catch (\Exception $e) {
            Log::error('NotificationService payment_rejected error: ' . $e->getMessage());
        }
    }
}

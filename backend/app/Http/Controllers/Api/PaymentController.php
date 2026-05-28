<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\OrderStatusLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Customer uploads payment proof.
     * POST /orders/{id}/payment
     */
    public function customerUpload(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::where('id', $id)->where('user_id', $user->id)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'method'      => 'required|string|in:cash,transfer,ewallet',
            'amount'      => 'required|numeric|min:1',
            'proof_image' => 'required_if:method,transfer,ewallet|nullable|image|mimes:jpeg,png,webp|max:5120',
        ], [
            'method.required'      => 'Metode pembayaran wajib diisi.',
            'amount.required'      => 'Jumlah pembayaran wajib diisi.',
            'proof_image.required_if' => 'Bukti pembayaran wajib diunggah untuk metode transfer atau ewallet.',
            'proof_image.image'    => 'File harus berupa gambar.',
            'proof_image.mimes'    => 'Format gambar harus jpeg, png, atau webp.',
            'proof_image.max'      => 'Ukuran gambar maksimal 5MB.',
        ]);

        DB::beginTransaction();
        try {
            $proofPath = null;
            if ($request->hasFile('proof_image')) {
                $file = $request->file('proof_image');
                $uuid = Str::uuid();
                $ext = $file->getClientOriginalExtension();
                $filename = "{$uuid}.{$ext}";
                
                // Store in public disk under uploads/payments/
                $proofPath = $file->storeAs('uploads/payments', $filename, 'public');
            }

            $payment = Payment::create([
                'order_id'         => $order->id,
                'uploaded_by'      => $user->id,
                'verified_by'      => null,
                'method'           => $validated['method'],
                'amount'           => $validated['amount'],
                'proof_image_path' => $proofPath,
                'status'           => 'pending',
                'rejection_reason' => null,
                'verified_at'      => null,
            ]);

            DB::commit();

            // Trigger Email Notification
            try {
                app(\App\Services\NotificationService::class)->sendPaymentPendingNotification($order);
            } catch (\Exception $ne) {
                Log::error('Failed to trigger payment pending notification: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah dan sedang menunggu verifikasi.',
                'data'    => $payment
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah pembayaran.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Staff/Admin uploads payment proof (AUTO-VERIFIED).
     * POST /admin/orders/{id}/payment
     */
    public function adminUpload(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'method'      => 'required|string|in:cash,transfer,ewallet',
            'amount'      => 'required|numeric|min:1',
            'proof_image' => 'nullable|image|mimes:jpeg,png,webp|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $proofPath = null;
            if ($request->hasFile('proof_image')) {
                $file = $request->file('proof_image');
                $uuid = Str::uuid();
                $ext = $file->getClientOriginalExtension();
                $filename = "{$uuid}.{$ext}";
                $proofPath = $file->storeAs('uploads/payments', $filename, 'public');
            }

            // Save payments record directly as VERIFIED
            $payment = Payment::create([
                'order_id'         => $order->id,
                'uploaded_by'      => $user->id,
                'verified_by'      => $user->id,
                'method'           => $validated['method'],
                'amount'           => $validated['amount'],
                'proof_image_path' => $proofPath,
                'status'           => 'verified',
                'rejection_reason' => null,
                'verified_at'      => now(),
            ]);

            // Update order pay state
            $order->update([
                'is_paid' => true,
                'paid_at' => now(),
            ]);

            // Log status
            OrderStatusLog::create([
                'order_id'   => $order->id,
                'actor_id'   => $user->id,
                'actor_type' => $user->role->name === 'admin' ? 'admin' : 'staff',
                'old_status' => $order->order_status,
                'new_status' => $order->order_status,
                'notes'      => "Pembayaran langsung lunas dikonfirmasi oleh Staf '{$user->name}' (Metode: {$validated['method']}).",
            ]);

            DB::commit();

            // Trigger Email Notification
            try {
                app(\App\Services\NotificationService::class)->sendPaymentVerifiedNotification($order);
            } catch (\Exception $ne) {
                Log::error('Failed to trigger payment verified notification: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil diverifikasi secara otomatis.',
                'data'    => [
                    'payment' => $payment,
                    'order'   => $order->fresh()
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Admin payment upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah pembayaran.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all payments (Admin & Staff).
     * GET /admin/payments
     */
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with(['order.user', 'uploader'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar pembayaran',
            'data'    => $payments
        ]);
    }

    /**
     * Verify customer payment proof (Admin & Staff).
     * PATCH /admin/payments/{id}/verify
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.',
                'error'   => 'PAYMENT_NOT_FOUND',
                'details' => null
            ], 404);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Pembayaran tidak dapat diverifikasi karena status saat ini adalah '{$payment->status}'.",
                'error'   => 'INVALID_PAYMENT_STATUS',
                'details' => null
            ], 422);
        }

        DB::beginTransaction();
        try {
            $payment->update([
                'status'      => 'verified',
                'verified_by' => $user->id,
                'verified_at' => now(),
            ]);

            $order = $payment->order;
            $order->update([
                'is_paid' => true,
                'paid_at' => now(),
            ]);

            // Log status
            OrderStatusLog::create([
                'order_id'   => $order->id,
                'actor_id'   => $user->id,
                'actor_type' => $user->role->name === 'admin' ? 'admin' : 'staff',
                'old_status' => $order->order_status,
                'new_status' => $order->order_status,
                'notes'      => "Bukti transfer pembayaran berhasil dikonfirmasi lunas oleh Staf '{$user->name}'.",
            ]);

            DB::commit();

            // Trigger Email Notification
            try {
                app(\App\Services\NotificationService::class)->sendPaymentVerifiedNotification($order);
            } catch (\Exception $ne) {
                Log::error('Failed to trigger payment verified notification: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil disetujui.',
                'data'    => $payment->load('order')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Verifying payment failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi pembayaran.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject customer payment proof (Admin & Staff).
     * PATCH /admin/payments/{id}/reject
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembayaran tidak ditemukan.',
                'error'   => 'PAYMENT_NOT_FOUND',
                'details' => null
            ], 404);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Pembayaran tidak dapat ditolak karena status saat ini adalah '{$payment->status}'.",
                'error'   => 'INVALID_PAYMENT_STATUS',
                'details' => null
            ], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:255',
        ], [
            'rejection_reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        DB::beginTransaction();
        try {
            $payment->update([
                'status'           => 'rejected',
                'verified_by'      => $user->id,
                'verified_at'      => now(),
                'rejection_reason' => $validated['rejection_reason'],
            ]);

            $order = $payment->order;

            // Log status
            OrderStatusLog::create([
                'order_id'   => $order->id,
                'actor_id'   => $user->id,
                'actor_type' => $user->role->name === 'admin' ? 'admin' : 'staff',
                'old_status' => $order->order_status,
                'new_status' => $order->order_status,
                'notes'      => "Bukti pembayaran ditolak oleh Staf '{$user->name}'. Alasan: {$validated['rejection_reason']}.",
            ]);

            DB::commit();

            // Trigger Email Notification
            try {
                app(\App\Services\NotificationService::class)->sendPaymentRejectedNotification($order, $validated['rejection_reason']);
            } catch (\Exception $ne) {
                Log::error('Failed to trigger payment rejected notification: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil ditolak.',
                'data'    => $payment->load('order')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Rejecting payment failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak pembayaran.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}

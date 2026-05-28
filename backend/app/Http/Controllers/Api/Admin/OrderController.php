<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Get all orders with filtering and search (Admin & Staff).
     * GET /admin/orders
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Order::with(['user', 'staff', 'items']);

        // Staff can only see orders assigned to them
        if ($user->role->name === 'staff') {
            $query->where('assigned_staff_id', $user->id);
        } else {
            // Admin filters
            if ($request->has('staff_id')) {
                $query->where('assigned_staff_id', $request->query('staff_id'));
            }
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('order_status', $request->query('status'));
        }

        // Search by order_number, customer name, or phone number
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar semua pesanan',
            'data'    => $orders
        ]);
    }

    /**
     * Get specific order details (Admin & Staff).
     * GET /admin/orders/{id}
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['user', 'staff', 'items', 'statusLogs.actor', 'payments'])
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail pesanan',
            'data'    => $order
        ]);
    }

    /**
     * Assign staff to order (Admin Only).
     * PATCH /admin/orders/{id}/assign
     */
    public function assignStaff(Request $request, int $id): JsonResponse
    {
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
            'assigned_staff_id' => 'required|exists:users,id',
        ], [
            'assigned_staff_id.required' => 'ID staff wajib diisi.',
            'assigned_staff_id.exists'   => 'Staff tidak ditemukan.',
        ]);

        // Verify that the assigned user actually has the staff role
        $staff = User::find($validated['assigned_staff_id']);
        if ($staff->role->name !== 'staff' && $staff->role->name !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'User yang dipilih bukan merupakan Staff atau Admin.',
                'error'   => 'INVALID_STAFF_ROLE',
                'details' => null
            ], 422);
        }

        $order->update([
            'assigned_staff_id' => $staff->id
        ]);

        // Log staff assignment
        OrderStatusLog::create([
            'order_id'   => $order->id,
            'actor_id'   => $request->user()->id,
            'actor_type' => 'admin',
            'old_status' => $order->order_status,
            'new_status' => $order->order_status,
            'notes'      => "Pesanan ditugaskan kepada Staf '{$staff->name}'.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff berhasil ditugaskan',
            'data'    => $order->load('staff')
        ]);
    }

    /**
     * Input actual weights/quantities and auto-recalculate total price (Admin & Staff).
     * PATCH /admin/orders/{id}/actual
     */
    public function inputActual(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'items'                     => 'required|array|min:1',
            'items.*.item_id'           => 'required|exists:order_items,id',
            'items.*.weight_actual_kg'  => 'nullable|numeric|min:0.1',
            'items.*.quantity_actual'   => 'nullable|integer|min:1',
            'items.*.notes'             => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $totalActual = 0.00;

            // First pass: Build item map and calculate
            $orderItems = $order->items->keyBy('id');

            foreach ($validated['items'] as $inputItem) {
                $orderItem = $orderItems->get($inputItem['item_id']);

                if (!$orderItem || $orderItem->order_id !== $order->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Item laundry tidak sesuai dengan pesanan.',
                        'error'   => 'INVALID_ORDER_ITEM',
                        'details' => null
                    ], 422);
                }

                $subtotalActual = 0.00;

                if ($orderItem->pricing_type_snapshot === 'by_weight') {
                    if (empty($inputItem['weight_actual_kg'])) {
                        return response()->json([
                            'success' => false,
                            'message' => "Layanan kiloan '{$orderItem->service_name_snapshot}' wajib mengisi berat aktual.",
                            'error'   => 'WEIGHT_ACTUAL_REQUIRED'
                        ], 422);
                    }
                    $subtotalActual = (float) $orderItem->price_per_kg_snapshot * (float) $inputItem['weight_actual_kg'];
                    
                    $orderItem->update([
                        'weight_actual_kg' => $inputItem['weight_actual_kg'],
                        'subtotal_actual'  => $subtotalActual,
                        'notes'            => $inputItem['notes'] ?? $orderItem->notes,
                    ]);
                } else {
                    if (empty($inputItem['quantity_actual'])) {
                        return response()->json([
                            'success' => false,
                            'message' => "Layanan satuan '{$orderItem->service_name_snapshot}' wajib mengisi jumlah barang aktual.",
                            'error'   => 'QUANTITY_ACTUAL_REQUIRED'
                        ], 422);
                    }
                    $subtotalActual = (float) $orderItem->price_per_unit_snapshot * (int) $inputItem['quantity_actual'];

                    $orderItem->update([
                        'quantity_actual' => $inputItem['quantity_actual'],
                        'subtotal_actual' => $subtotalActual,
                        'notes'           => $inputItem['notes'] ?? $orderItem->notes,
                    ]);
                }
            }

            // Recalculate orders actual total
            $order->refresh();
            $totalActual = $order->items->sum('subtotal_actual');

            $order->update([
                'total_price_actual' => $totalActual
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data aktual berhasil disimpan dan harga diperbarui',
                'data'    => $order->load('items')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Saving actual details failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan detail aktual.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status linearly (Admin & Staff).
     * PATCH /admin/orders/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items')->find($id);
        $user = $request->user();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:received,picked_up,in_process,waiting_delivery,completed',
            'notes'  => 'nullable|string',
            // Allow sending actual parameters alongside transition to 'in_process'
            'actual_items' => 'nullable|array',
        ], [
            'status.required' => 'Status baru wajib diisi.',
            'status.in'       => 'Status tidak valid.',
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $order->order_status;

        // 1. Business Rule: Strict Linear Transitions
        $validTransitions = [
            'received'         => 'picked_up',
            'picked_up'        => 'in_process',
            'in_process'       => 'waiting_delivery',
            'waiting_delivery' => 'completed',
        ];

        if (!isset($validTransitions[$oldStatus]) || $validTransitions[$oldStatus] !== $newStatus) {
            return response()->json([
                'success' => false,
                'error'   => 'ORDER_INVALID_TRANSITION',
                'message' => "Perubahan status dari '{$oldStatus}' ke '{$newStatus}' tidak valid (Alur status harus runtut/linear)."
            ], 422);
        }

        // 2. Business Rule: Actual parameters must be logged before/during in_process
        if ($newStatus === 'in_process') {
            // Process actual parameters in this request if provided
            if (!empty($validated['actual_items'])) {
                $actualRequest = new Request(['items' => $validated['actual_items']]);
                $actualResponse = $this->inputActual($actualRequest, $order->id);
                if ($actualResponse->getStatusCode() !== 200) {
                    return $actualResponse; // Return the validation error directly
                }
                $order->refresh();
            }

            // Verify that all items have actual values populated
            foreach ($order->items as $item) {
                if ($item->subtotal_actual === null) {
                    return response()->json([
                        'success' => false,
                        'error'   => 'ACTUAL_DATA_REQUIRED',
                        'message' => 'Semua item laundry wajib diisi data timbang/cek aktualnya sebelum status diubah menjadi dalam proses (in_process).'
                    ], 422);
                }
            }
        }

        // 3. Complete transitions
        DB::beginTransaction();
        try {
            $updateData = ['order_status' => $newStatus];

            if ($newStatus === 'picked_up') {
                $updateData['pickup_done_at'] = now();
            } elseif ($newStatus === 'completed') {
                $updateData['delivery_done_at'] = now();
            }

            $order->update($updateData);

            // Log transitions
            OrderStatusLog::create([
                'order_id'   => $order->id,
                'actor_id'   => $user->id,
                'actor_type' => $user->role->name === 'admin' ? 'admin' : 'staff',
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'notes'      => $validated['notes'] ?? "Status diubah dari '{$oldStatus}' ke '{$newStatus}'.",
            ]);

            DB::commit();

            // Trigger Email/WA Notifications
            try {
                $notifService = app(\App\Services\NotificationService::class);
                if ($newStatus === 'picked_up') {
                    $notifService->sendOrderPickedUpNotification($order);
                } elseif ($newStatus === 'in_process') {
                    $notifService->sendOrderInProcessNotification($order);
                } elseif ($newStatus === 'waiting_delivery') {
                    $notifService->sendOrderWaitingDeliveryNotification($order);
                } elseif ($newStatus === 'completed') {
                    $notifService->sendOrderCompletedNotification($order);
                }
            } catch (\Exception $ne) {
                Log::error('Failed to trigger transition notifications: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => "Status pesanan berhasil diubah menjadi '{$newStatus}'",
                'data'    => $order->load(['items', 'statusLogs'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Updating status failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status pesanan.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order status transition logs (Admin & Staff).
     * GET /admin/orders/{id}/logs
     */
    public function getLogs(int $id): JsonResponse
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
                'error'   => 'ORDER_NOT_FOUND',
                'details' => null
            ], 404);
        }

        $logs = $order->statusLogs()->with('actor')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil logs status pesanan',
            'data'    => $logs
        ]);
    }
}

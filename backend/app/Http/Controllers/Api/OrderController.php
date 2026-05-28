<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusLog;
use App\Models\Service;
use App\Models\CustomerAddress;
use App\Helpers\OrderNumberHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Create a new order (Customer).
     * POST /orders
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Business Rule: Email is required before creating orders
        if (empty($user->email)) {
            return response()->json([
                'success' => false,
                'error'   => 'EMAIL_REQUIRED',
                'message' => 'Harap lengkapi email di profil sebelum membuat pesanan.'
            ], 422);
        }

        // 2. Validate request parameters
        $validated = $request->validate([
            'address_id' => 'required|integer',
            'notes'      => 'nullable|string',
            'items'      => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.weight_kg'  => 'required_without:items.*.quantity|nullable|numeric|min:0.1',
            'items.*.quantity'   => 'required_without:items.*.weight_kg|nullable|integer|min:1',
            'items.*.notes'      => 'nullable|string',
        ], [
            'address_id.required' => 'Alamat penjemputan wajib diisi.',
            'items.required'      => 'Keranjang belanja tidak boleh kosong.',
            'items.min'           => 'Minimal harus ada 1 layanan yang dipesan.',
        ]);

        // 3. Verify address ownership
        $address = CustomerAddress::where('id', $validated['address_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'error'   => 'ADDRESS_NOT_OWNED',
                'message' => 'Alamat tidak ditemukan atau bukan milik Anda.'
            ], 403);
        }

        // Snapshot address details
        $addressSnapshot = [
            'label'       => $address->label,
            'address'     => $address->address,
            'city'        => $address->city,
            'district'    => $address->district,
            'postal_code' => $address->postal_code,
            'lat'         => $address->lat,
            'lng'         => $address->lng,
        ];

        // 4. Calculate prices on the backend & verify service pricing types
        $itemsData = [];
        $totalPrice = 0.00;

        foreach ($validated['items'] as $item) {
            $service = Service::with('category')->find($item['service_id']);

            if (!$service->is_active) {
                return response()->json([
                    'success' => false,
                    'error'   => 'SERVICE_INACTIVE',
                    'message' => "Layanan '{$service->name}' sedang tidak aktif."
                ], 422);
            }

            $weight = null;
            $quantity = null;
            $subtotal = 0.00;

            if ($service->pricing_type === 'by_weight') {
                if (empty($item['weight_kg'])) {
                    return response()->json([
                        'success' => false,
                        'error'   => 'WEIGHT_REQUIRED',
                        'message' => "Layanan kiloan '{$service->name}' wajib mengisi berat (kg)."
                    ], 422);
                }
                
                // Enforce minimum weight if configured on service
                $weight = (float) $item['weight_kg'];
                if ($service->min_weight_kg && $weight < $service->min_weight_kg) {
                    $weight = (float) $service->min_weight_kg;
                }

                $subtotal = (float) $service->price_per_kg * $weight;
            } else {
                if (empty($item['quantity'])) {
                    return response()->json([
                        'success' => false,
                        'error'   => 'QUANTITY_REQUIRED',
                        'message' => "Layanan satuan '{$service->name}' wajib mengisi jumlah barang."
                    ], 422);
                }

                $quantity = (int) $item['quantity'];
                $subtotal = (float) $service->price_per_unit * $quantity;
            }

            $totalPrice += $subtotal;

            $itemsData[] = [
                'service_id'              => $service->id,
                'service_name_snapshot'   => $service->name,
                'category_name_snapshot'  => $service->category->name,
                'pricing_type_snapshot'   => $service->pricing_type,
                'duration_hours_snapshot' => $service->duration_hours,
                'duration_label_snapshot' => $service->duration_label,
                'price_per_kg_snapshot'   => $service->price_per_kg,
                'price_per_unit_snapshot' => $service->price_per_unit,
                'weight_kg'               => $weight,
                'quantity'                => $quantity,
                'subtotal'                => $subtotal,
                'notes'                   => $item['notes'] ?? null,
            ];
        }

        // 5. DB Transaction to write order and order items
        DB::beginTransaction();
        try {
            $orderNumber = OrderNumberHelper::generate();
            $invoiceToken = Str::uuid();

            $order = Order::create([
                'user_id'                   => $user->id,
                'assigned_staff_id'         => null,
                'order_number'              => $orderNumber,
                'invoice_token'             => $invoiceToken,
                'order_status'              => 'received',
                'total_price'               => $totalPrice,
                'total_price_actual'        => null,
                'is_paid'                   => false,
                'pickup_address_snapshot'   => $addressSnapshot,
                'delivery_address_snapshot' => $addressSnapshot,
                'notes'                     => $validated['notes'] ?? null,
            ]);

            // Save order items
            foreach ($itemsData as $itemData) {
                $order->items()->create($itemData);
            }

            // Write Status Log
            OrderStatusLog::create([
                'order_id'   => $order->id,
                'actor_id'   => $user->id,
                'actor_type' => 'system',
                'old_status' => null,
                'new_status' => 'received',
                'notes'      => 'Pesanan berhasil dibuat oleh pelanggan.',
            ]);

            DB::commit();

            // Trigger Email Notification
            try {
                app(\App\Services\NotificationService::class)->sendOrderReceivedNotification($order);
            } catch (\Exception $ne) {
                Log::error('Failed to trigger email notification: ' . $ne->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat',
                'data'    => $order->load('items')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pesanan. Terjadi kesalahan internal.',
                'error'   => 'SERVER_ERROR',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order history of logged-in customer.
     * GET /orders
     */
    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar pesanan',
            'data'    => $orders
        ]);
    }

    /**
     * Get specific order details of logged-in customer.
     * GET /orders/{orderNumber}
     */
    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->with(['items', 'statusLogs.actor', 'payments'])
            ->first();

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
     * Get public invoice details (No Authentication).
     * GET /invoice/{invoiceToken}
     */
    public function showPublicInvoice(string $invoiceToken): JsonResponse
    {
        $order = Order::where('invoice_token', $invoiceToken)
            ->with(['items', 'statusLogs', 'user'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan.',
                'error'   => 'INVOICE_NOT_FOUND',
                'details' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data invoice',
            'data'    => $order
        ]);
    }
}

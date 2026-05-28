<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'assigned_staff_id',
        'order_number',
        'invoice_token',
        'order_status',
        'total_price',
        'total_price_actual',
        'is_paid',
        'paid_at',
        'pickup_address_snapshot',
        'delivery_address_snapshot',
        'notes',
        'pickup_done_at',
        'delivery_done_at',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'paid_at' => 'datetime',
        'pickup_address_snapshot' => 'array',
        'delivery_address_snapshot' => 'array',
        'pickup_done_at' => 'datetime',
        'delivery_done_at' => 'datetime',
        'total_price' => 'decimal:2',
        'total_price_actual' => 'decimal:2',
    ];

    /**
     * Relationship: Order belongs to a Customer (User).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relationship: Order belongs to an assigned Staff (User).
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    /**
     * Relationship: Order has many OrderItems.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Relationship: Order has many Status Logs.
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Relationship: Order has many Payments.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Relationship: Order has many Notifications.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}

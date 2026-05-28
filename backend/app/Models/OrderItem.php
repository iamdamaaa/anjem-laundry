<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'service_id',
        'service_name_snapshot',
        'category_name_snapshot',
        'pricing_type_snapshot',
        'duration_hours_snapshot',
        'duration_label_snapshot',
        'price_per_kg_snapshot',
        'price_per_unit_snapshot',
        'weight_kg',
        'quantity',
        'subtotal',
        'weight_actual_kg',
        'quantity_actual',
        'subtotal_actual',
        'notes',
    ];

    protected $casts = [
        'price_per_kg_snapshot' => 'decimal:2',
        'price_per_unit_snapshot' => 'decimal:2',
        'weight_kg' => 'decimal:2',
        'quantity' => 'integer',
        'subtotal' => 'decimal:2',
        'weight_actual_kg' => 'decimal:2',
        'quantity_actual' => 'integer',
        'subtotal_actual' => 'decimal:2',
    ];

    /**
     * Relationship: OrderItem belongs to an Order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relationship: OrderItem belongs to a Service.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}

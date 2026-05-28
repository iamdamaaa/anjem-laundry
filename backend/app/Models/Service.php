<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Service extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'pricing_type',
        'price_per_kg',
        'price_per_unit',
        'min_weight_kg',
        'duration_hours',
        'duration_label',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price_per_kg' => 'decimal:2',
        'price_per_unit' => 'decimal:2',
        'min_weight_kg' => 'decimal:2',
    ];

    /**
     * Relationship: Service belongs to a Category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }
}

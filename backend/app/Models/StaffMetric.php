<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffMetric extends Model
{
    protected $fillable = [
        'user_id',
        'period_month',
        'total_orders_handled',
        'orders_on_time',
        'orders_late',
        'avg_completion_hours',
        'performance_score',
    ];

    protected $casts = [
        'total_orders_handled' => 'integer',
        'orders_on_time' => 'integer',
        'orders_late' => 'integer',
        'avg_completion_hours' => 'decimal:2',
        'performance_score' => 'decimal:2',
    ];

    /**
     * Relationship: Metric belongs to a Staff User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

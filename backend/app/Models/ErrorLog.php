<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorLog extends Model
{
    protected $fillable = [
        'user_id',
        'error_type',
        'error_message',
        'stack_trace',
        'request_url',
        'ip_address',
        'source',
    ];

    /**
     * Relationship: ErrorLog belongs to a User (nullable).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

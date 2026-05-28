<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = [
        'phone',
        'code',
        'purpose',
        'attempts',
        'is_used',
        'expires_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'expires_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /**
     * Check if the OTP is currently expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}

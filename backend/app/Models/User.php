<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_id',
        'name',
        'phone',
        'email',
        'phone_verified',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'phone_verified' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Relationship: User belongs to a Role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Relationship: User has many CustomerAddresses.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Relationship: User has many Orders.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    /**
     * Relationship: Staff user has many assigned Orders.
     */
    public function assignedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'assigned_staff_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string|array $roleName): bool
    {
        if (is_array($roleName)) {
            return in_array($this->role->name, $roleName);
        }
        return $this->role->name === $roleName;
    }
}

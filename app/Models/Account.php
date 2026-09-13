<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'primary_currency',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get all transactions for this account.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get all balances for this account.
     */
    public function balances(): HasMany
    {
        return $this->hasMany(AccountBalance::class);
    }

    /**
     * Get balance for a specific period.
     */
    public function balanceForPeriod(string $period)
    {
        return $this->balances()->where('period', $period)->first();
    }

    /**
     * Scope to get only active accounts.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get asset accounts (bank + investment + receivable).
     */
    public function scopeAssets($query)
    {
        return $query->whereIn('type', ['bank', 'investment', 'receivable']);
    }

    /**
     * Scope to get liability accounts.
     */
    public function scopeLiabilities($query)
    {
        return $query->where('type', 'liability');
    }

    /**
     * Check if account is an asset.
     */
    public function isAsset(): bool
    {
        return in_array($this->type, ['bank', 'investment', 'receivable']);
    }

    /**
     * Check if account is a liability.
     */
    public function isLiability(): bool
    {
        return $this->type === 'liability';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'period',
        'recorded_balance_cad',
        'recorded_balance_usd',
        'recorded_balance_cop',
        'notes',
    ];

    protected $casts = [
        'recorded_balance_cad' => 'decimal:2',
        'recorded_balance_usd' => 'decimal:2',
        'recorded_balance_cop' => 'decimal:2',
    ];

    /**
     * Get the account that owns this balance.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope to filter by period.
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
}

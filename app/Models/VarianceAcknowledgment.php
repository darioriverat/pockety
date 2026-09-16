<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VarianceAcknowledgment extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'period',
        'note',
        'acknowledged_at',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
    ];

    /**
     * Get the account this acknowledgment belongs to.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Scope to filter by period.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<VarianceAcknowledgment>  $query
     * @return \Illuminate\Database\Eloquent\Builder<VarianceAcknowledgment>
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
};

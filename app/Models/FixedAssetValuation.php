<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAssetValuation extends Model
{
    use HasFactory;

    protected $fillable = [
        'fixed_asset_id',
        'period',
        'book_value_cad',
        'depreciation_cad',
    ];

    protected $casts = [
        'book_value_cad' => 'decimal:2',
        'depreciation_cad' => 'decimal:2',
    ];

    /**
     * Get the fixed asset that owns this valuation.
     */
    public function fixedAsset(): BelongsTo
    {
        return $this->belongsTo(FixedAsset::class);
    }

    /**
     * Scope to filter by period.
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAssetValuation extends Model
{
    use BelongsToOwner;
    use HasFactory;

    protected $fillable = [
        'user_id',
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

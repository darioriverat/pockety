<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FixedAsset extends Model
{
    use BelongsToOwner;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'acquisition_date',
        'initial_value_cad',
        'is_active',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'initial_value_cad' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get all valuations for this asset.
     */
    public function valuations(): HasMany
    {
        return $this->hasMany(FixedAssetValuation::class);
    }

    /**
     * Get valuation for a specific period.
     */
    public function valuationForPeriod(string $period)
    {
        return $this->valuations()->where('period', $period)->first();
    }

    /**
     * Scope to get only active assets.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

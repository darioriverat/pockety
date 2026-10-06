<?php

namespace App\Models;

use Database\Factories\ExchangeRateSnapshotFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $rate_date
 * @property string $source
 * @property int|null $user_id
 * @property string $cad_per_usd
 * @property string $cop_per_usd
 */
class ExchangeRateSnapshot extends Model
{
    /** @use HasFactory<ExchangeRateSnapshotFactory> */
    use HasFactory;

    public const SOURCE_OPEN_EXCHANGE_RATES = 'openexchangerates';

    public const SOURCE_MANUAL = 'manual';

    protected $fillable = [
        'rate_date',
        'source',
        'user_id',
        'cad_per_usd',
        'cop_per_usd',
    ];

    protected $casts = [
        'rate_date' => 'date:Y-m-d',
        'cad_per_usd' => 'decimal:8',
        'cop_per_usd' => 'decimal:8',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<ExchangeRate, $this>
     */
    public function exchangeRates(): HasMany
    {
        return $this->hasMany(ExchangeRate::class, 'snapshot_id');
    }

    public function isGlobalFeed(): bool
    {
        return $this->source === self::SOURCE_OPEN_EXCHANGE_RATES && $this->user_id === null;
    }

    /**
     * Derived CAD/COP cross rate (COP per 1 CAD).
     */
    public function cadCop(): float
    {
        $cad = (float) $this->cad_per_usd;
        if ($cad == 0.0) {
            return 0.0;
        }

        return (float) $this->cop_per_usd / $cad;
    }
}

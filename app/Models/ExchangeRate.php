<?php

namespace App\Models;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Concerns\BelongsToOwner;
use Database\Factories\ExchangeRateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $user_id
 * @property string $period
 * @property int $snapshot_id
 * @property ExchangeRateSnapshot|null $snapshot
 */
class ExchangeRate extends Model
{
    use BelongsToOwner;

    /** @use HasFactory<ExchangeRateFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'period',
        'snapshot_id',
    ];

    protected $appends = [
        'usd_cop',
        'usd_cad',
        'cad_cop',
        'cad_per_usd',
        'cop_per_usd',
    ];

    protected $with = [
        'snapshot',
    ];

    /**
     * @return BelongsTo<ExchangeRateSnapshot, $this>
     */
    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(ExchangeRateSnapshot::class, 'snapshot_id');
    }

    /**
     * Get exchange rate for a specific period for the authenticated owner.
     */
    public static function forPeriod(string $period): ?self
    {
        $userId = app(OwnerResolverInterface::class)->id();

        return static::query()
            ->forUser($userId)
            ->where('period', $period)
            ->first();
    }

    public function hasSnapshot(): bool
    {
        return $this->snapshot !== null;
    }

    public function getCadPerUsdAttribute(): ?string
    {
        if (! $this->snapshot) {
            return null;
        }

        return (string) $this->snapshot->cad_per_usd;
    }

    public function getCopPerUsdAttribute(): ?string
    {
        if (! $this->snapshot) {
            return null;
        }

        return (string) $this->snapshot->cop_per_usd;
    }

    /**
     * Derived: COP per 1 USD.
     */
    public function getUsdCopAttribute(): ?string
    {
        return $this->cop_per_usd;
    }

    /**
     * Derived: CAD per 1 USD.
     */
    public function getUsdCadAttribute(): ?string
    {
        return $this->cad_per_usd;
    }

    /**
     * Derived: COP per 1 CAD.
     */
    public function getCadCopAttribute(): ?string
    {
        if (! $this->snapshot) {
            return null;
        }

        return number_format($this->snapshot->cadCop(), 8, '.', '');
    }

    public function usdToCop(float $amount): float
    {
        return round($amount * $this->quote('cop_per_usd'), 2);
    }

    /**
     * Convert USD to CAD by multiplying by cad_per_usd.
     */
    public function usdToCad(float $amount): float
    {
        return round($amount * $this->quote('cad_per_usd'), 2);
    }

    public function copToCad(float $amount): float
    {
        $copPerUsd = $this->quote('cop_per_usd');
        $cadPerUsd = $this->quote('cad_per_usd');

        if ($copPerUsd == 0.0) {
            return 0.0;
        }

        return round($amount / $copPerUsd * $cadPerUsd, 2);
    }

    public function cadToCop(float $amount): float
    {
        $copPerUsd = $this->quote('cop_per_usd');
        $cadPerUsd = $this->quote('cad_per_usd');

        if ($cadPerUsd == 0.0) {
            return 0.0;
        }

        return round($amount / $cadPerUsd * $copPerUsd, 2);
    }

    public function cadToUsd(float $amount): float
    {
        $cadPerUsd = $this->quote('cad_per_usd');

        if ($cadPerUsd == 0.0) {
            return 0.0;
        }

        return round($amount / $cadPerUsd, 2);
    }

    public function toCad(float $amount, string $currency): float
    {
        return match ($currency) {
            'CAD' => $amount,
            'USD' => $this->usdToCad($amount),
            'COP' => $this->copToCad($amount),
            default => 0,
        };
    }

    private function quote(string $field): float
    {
        if (! $this->snapshot) {
            return 0.0;
        }

        return (float) $this->snapshot->{$field};
    }
}

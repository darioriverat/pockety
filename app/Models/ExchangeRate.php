<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'period',
        'usd_cop',
        'usd_cad',
        'cad_cop',
    ];

    protected $casts = [
        'usd_cop' => 'decimal:4',
        'usd_cad' => 'decimal:4',
        'cad_cop' => 'decimal:4',
    ];

    /**
     * Get exchange rate for a specific period.
     */
    public static function forPeriod(string $period): ?self
    {
        return static::where('period', $period)->first();
    }

    /**
     * Convert USD to COP.
     */
    public function usdToCop(float $amount): float
    {
        return round($amount * (float) $this->usd_cop, 2);
    }

    /**
     * Convert USD to CAD.
     */
    public function usdToCad(float $amount): float
    {
        return round($amount / (float) $this->usd_cad, 2);
    }

    /**
     * Convert COP to CAD.
     */
    public function copToCad(float $amount): float
    {
        return round($amount / (float) $this->cad_cop, 2);
    }

    /**
     * Convert CAD to COP.
     */
    public function cadToCop(float $amount): float
    {
        return round($amount * (float) $this->cad_cop, 2);
    }

    /**
     * Convert any currency to CAD equivalent.
     */
    public function toCad(float $amount, string $currency): float
    {
        return match ($currency) {
            'CAD' => $amount,
            'USD' => $this->usdToCad($amount),
            'COP' => $this->copToCad($amount),
            default => 0,
        };
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Income extends Model
{
    use HasFactory;

    protected $table = 'income';

    protected $fillable = [
        'period',
        'description',
        'line_number',
        'amount_cad',
        'amount_usd',
        'amount_cop',
        'notes',
    ];

    protected $casts = [
        'line_number' => 'integer',
        'amount_cad' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'amount_cop' => 'decimal:2',
    ];

    /**
     * Scope to filter by period.
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }

    /**
     * Get the total amount for this income line in CAD equivalent.
     * This requires exchange rates for the period.
     * 
     * Per app spec: "For USD/CAD rate X, 1 USD = X CAD, multiply USD by rate.
     * For CAD/COP rate, divide COP by rate to get CAD."
     */
    public function getTotalCadEquivalent(ExchangeRate $exchangeRate): float
    {
        $total = (float) $this->amount_cad;

        if ($this->amount_usd > 0) {
            // Convert USD to CAD: USD * USD_CAD rate
            $total += $exchangeRate->usdToCad((float) $this->amount_usd);
        }

        if ($this->amount_cop > 0) {
            // Convert COP to CAD: COP / CAD_COP rate
            $total += $exchangeRate->copToCad((float) $this->amount_cop);
        }

        return round($total, 2);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PeriodBalance extends Model
{
    protected $fillable = [
        'period',
        'assets_cad',
        'liabilities_cad',
        'equity_cad',
        'income_cad',
        'net_operating_expenses_cad',
        'records_check_result_cad',
        'reconciliation_status',
    ];

    protected $casts = [
        'assets_cad' => 'decimal:2',
        'liabilities_cad' => 'decimal:2',
        'equity_cad' => 'decimal:2',
        'income_cad' => 'decimal:2',
        'net_operating_expenses_cad' => 'decimal:2',
        'records_check_result_cad' => 'decimal:2',
    ];

    /**
     * @param  Builder<PeriodBalance>  $query
     * @return Builder<PeriodBalance>
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
}

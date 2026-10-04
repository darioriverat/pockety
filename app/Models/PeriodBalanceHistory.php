<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PeriodBalanceHistory extends Model
{
    use BelongsToOwner;

    protected $fillable = [
        'user_id',
        'period',
        'assets_cad',
        'liabilities_cad',
        'equity_cad',
        'income_cad',
        'net_operating_expenses_cad',
        'records_check_result_cad',
        'reconciliation_status',
        'recorded_at',
        'replaced_at',
    ];

    protected $casts = [
        'assets_cad' => 'decimal:2',
        'liabilities_cad' => 'decimal:2',
        'equity_cad' => 'decimal:2',
        'income_cad' => 'decimal:2',
        'net_operating_expenses_cad' => 'decimal:2',
        'records_check_result_cad' => 'decimal:2',
        'recorded_at' => 'datetime',
        'replaced_at' => 'datetime',
    ];

    /**
     * @param  Builder<PeriodBalanceHistory>  $query
     * @return Builder<PeriodBalanceHistory>
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
}

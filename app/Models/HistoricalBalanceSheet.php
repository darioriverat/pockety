<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoricalBalanceSheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'period',
        'assets_cad',
        'liabilities_cad',
        'equity_cad',
        'source_row',
    ];

    protected $casts = [
        'assets_cad' => 'decimal:6',
        'liabilities_cad' => 'decimal:6',
        'equity_cad' => 'decimal:6',
        'source_row' => 'integer',
    ];

    public static function forPeriod(string $period): ?self
    {
        return static::where('period', $period)->first();
    }
}

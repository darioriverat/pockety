<?php

namespace App\Models;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoricalBalanceSheet extends Model
{
    use BelongsToOwner;
    use HasFactory;

    protected $fillable = [
        'user_id',
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
        $userId = app(OwnerResolverInterface::class)->id();

        return static::query()
            ->forUser($userId)
            ->where('period', $period)
            ->first();
    }
}

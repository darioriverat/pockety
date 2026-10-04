<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    use BelongsToOwner;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'period',
        'amount_cad',
        'notes',
    ];

    protected $casts = [
        'amount_cad' => 'decimal:2',
    ];

    /**
     * Get the category that owns this budget.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Scope to filter by period.
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }
}

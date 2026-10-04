<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOwner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use BelongsToOwner;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'is_debt_category',
        'is_income_category',
        'is_active',
        'status',
    ];

    protected $casts = [
        'is_debt_category' => 'boolean',
        'is_income_category' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get all transactions for this category.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get all budgets for this category.
     */
    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    /**
     * Scope to get only active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only debt categories.
     */
    public function scopeDebtCategories($query)
    {
        return $query->where('is_debt_category', true);
    }

    /**
     * Scope to get only income categories.
     */
    public function scopeIncomeCategories($query)
    {
        return $query->where('is_income_category', true);
    }
}

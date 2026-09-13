<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name_es',
        'name_en',
        'is_debt_category',
        'is_active',
        'status',
    ];

    protected $casts = [
        'is_debt_category' => 'boolean',
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
     * Get the display name based on locale.
     */
    public function getDisplayNameAttribute(): string
    {
        $locale = app()->getLocale();
        return $locale === 'es' ? $this->name_es : $this->name_en;
    }

    /**
     * Get both Spanish and English names formatted.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->name_es} / {$this->name_en}";
    }
}

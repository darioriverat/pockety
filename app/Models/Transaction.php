<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'period',
        'quincena',
        'category_id',
        'account_id',
        'amount_cad',
        'amount_usd',
        'amount_cop',
        'comments',
        'is_recurring',
        'debt_component',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
        'amount_cad' => 'decimal:2',
        'amount_usd' => 'decimal:2',
        'amount_cop' => 'decimal:2',
    ];

    /**
     * Get the category that owns the transaction.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the account that owns the transaction.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the currency used in this transaction.
     */
    public function getCurrencyAttribute(): ?string
    {
        if ($this->amount_cad !== null && $this->amount_cad != 0) {
            return 'CAD';
        }
        if ($this->amount_usd !== null && $this->amount_usd != 0) {
            return 'USD';
        }
        if ($this->amount_cop !== null && $this->amount_cop != 0) {
            return 'COP';
        }

        return null;
    }

    /**
     * Get the amount for this transaction (in its currency).
     */
    public function getAmountAttribute(): ?float
    {
        return match ($this->currency) {
            'CAD' => (float) $this->amount_cad,
            'USD' => (float) $this->amount_usd,
            'COP' => (float) $this->amount_cop,
            default => null,
        };
    }

    /**
     * Scope to filter by period.
     */
    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }

    /**
     * Scope to filter by category.
     */
    public function scopeForCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope to filter by account.
     */
    public function scopeForAccount($query, int $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to filter by quincena.
     */
    public function scopeForQuincena($query, string $quincena)
    {
        return $query->where('quincena', $quincena);
    }

    /**
     * Scope to filter by currency.
     */
    public function scopeForCurrency($query, string $currency)
    {
        return $query->whereNotNull("amount_{$currency}")
            ->where("amount_{$currency}", '!=', 0);
    }

    /**
     * Scope to get only recurring transactions.
     */
    public function scopeRecurring($query)
    {
        return $query->where('is_recurring', true);
    }

    /**
     * Scope to get debt principal transactions.
     */
    public function scopePrincipal($query)
    {
        return $query->where('debt_component', 'principal');
    }

    /**
     * Scope to get debt interest transactions.
     */
    public function scopeInterest($query)
    {
        return $query->where('debt_component', 'interest');
    }
}

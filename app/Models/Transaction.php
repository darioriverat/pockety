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
        'is_credit',
        'debt_component',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
        'is_credit' => 'boolean',
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

    /**
     * Scope to expense (non-income) transactions.
     */
    public function scopeExpenses($query)
    {
        return $query->whereHas('category', function ($categoryQuery) {
            $categoryQuery->where('is_income_category', false);
        });
    }

    /**
     * Scope to income-category deposit transactions.
     */
    public function scopeIncome($query)
    {
        return $query->whereHas('category', function ($categoryQuery) {
            $categoryQuery->where('is_income_category', true);
        });
    }

    /**
     * Whether this transaction is tagged with an income category.
     */
    public function isIncome(): bool
    {
        if ($this->relationLoaded('category')) {
            return (bool) $this->category?->is_income_category;
        }

        return (bool) $this->category()->value('is_income_category');
    }

    /**
     * Whether this transaction increases an account balance (deposit, refund, or income).
     */
    public function isInflow(): bool
    {
        return $this->is_credit || $this->isIncome();
    }

    /**
     * Whether this transaction is a debt principal (down) payment.
     */
    public function isPrincipal(): bool
    {
        return $this->debt_component === 'principal';
    }

    /**
     * Direction this transaction moves an account's displayed balance.
     * +1 increases it, -1 decreases it.
     *
     * Asset accounts: income and credits increase cash; spend and principal decrease it.
     * Liability accounts: regular charges increase the amount owed; principal
     * payments and credits decrease it.
     */
    public function balanceSign(bool $isLiability): int
    {
        if ($isLiability) {
            if ($this->isPrincipal() || $this->isInflow()) {
                return -1;
            }

            return 1;
        }

        return $this->isInflow() ? 1 : -1;
    }

    /**
     * Signed amount in the transaction's own currency for an asset or liability ledger.
     */
    public function signedAmountFor(bool $isLiability): float
    {
        return $this->balanceSign($isLiability) * abs((float) ($this->amount ?? 0));
    }

    /**
     * CAD-equivalent amount using the given exchange rates.
     */
    public function cadEquivalent(ExchangeRate $exchangeRate): float
    {
        $cadEquivalent = 0.0;

        if ($this->amount_cad !== null && (float) $this->amount_cad != 0) {
            $cadEquivalent += (float) $this->amount_cad;
        }

        if ($this->amount_usd !== null && (float) $this->amount_usd != 0) {
            $cadEquivalent += $exchangeRate->usdToCad((float) $this->amount_usd);
        }

        if ($this->amount_cop !== null && (float) $this->amount_cop != 0) {
            $cadEquivalent += $exchangeRate->copToCad((float) $this->amount_cop);
        }

        return $cadEquivalent;
    }
}

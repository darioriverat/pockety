<?php

namespace App\Models\Concerns;

use App\Models\Account;
use App\Models\Category;
use App\Models\FixedAsset;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Ownership helpers for financial rows.
 *
 * Does not register a global query scope. Seeders and factories should set
 * user_id explicitly; authenticated creates fill it when omitted. Child rows
 * may inherit user_id from category/account/fixed_asset parents.
 */
trait BelongsToOwner
{
    public static function bootBelongsToOwner(): void
    {
        static::creating(function (Model $model): void {
            if ($model->getAttribute('user_id') !== null) {
                return;
            }

            if (Auth::check()) {
                $model->setAttribute('user_id', Auth::id());

                return;
            }

            foreach ([
                'category_id' => Category::class,
                'account_id' => Account::class,
                'fixed_asset_id' => FixedAsset::class,
            ] as $foreignKey => $relatedClass) {
                $relatedId = $model->getAttribute($foreignKey);
                if (! $relatedId) {
                    continue;
                }

                $ownerId = $relatedClass::query()->whereKey($relatedId)->value('user_id');
                if ($ownerId !== null) {
                    $model->setAttribute('user_id', $ownerId);

                    return;
                }
            }
        });
    }

    public function initializeBelongsToOwner(): void
    {
        if (! in_array('user_id', $this->fillable, true)) {
            $this->fillable[] = 'user_id';
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where($this->getTable().'.user_id', $userId);
    }
}

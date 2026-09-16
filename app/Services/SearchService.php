<?php

namespace App\Services;

use App\Domain\Collections\SearchHitCollection;
use App\Domain\Entities\SearchHitEntity;
use App\Domain\Entities\SearchResultsEntity;
use App\Domain\Services\Contracts\SearchServiceInterface;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;

class SearchService implements SearchServiceInterface
{
    public function search(string $query, int $limit = 10): SearchResultsEntity
    {
        $term = trim($query);
        $limit = max(1, min($limit, 25));

        if ($term === '') {
            return new SearchResultsEntity(
                query: '',
                accounts: new SearchHitCollection,
                transactions: new SearchHitCollection,
                categories: new SearchHitCollection,
            );
        }

        return new SearchResultsEntity(
            query: $term,
            accounts: $this->searchAccounts($term, $limit),
            transactions: $this->searchTransactions($term, $limit),
            categories: $this->searchCategories($term, $limit),
        );
    }

    private function searchAccounts(string $term, int $limit): SearchHitCollection
    {
        $collection = new SearchHitCollection;
        $like = '%'.$term.'%';

        $accounts = Account::query()
            ->active()
            ->where(function ($query) use ($like) {
                $query
                    ->where('name', 'like', $like)
                    ->orWhere('notes', 'like', $like);
            })
            ->orderBy('name')
            ->limit($limit)
            ->get();

        foreach ($accounts as $account) {
            $collection->add(new SearchHitEntity(
                type: 'account',
                id: $account->id,
                title: $account->name,
                subtitle: ucfirst($account->type).($account->primary_currency ? ' · '.$account->primary_currency : ''),
                url: '/accounts/'.$account->id,
            ));
        }

        return $collection;
    }

    private function searchTransactions(string $term, int $limit): SearchHitCollection
    {
        $collection = new SearchHitCollection;
        $like = '%'.$term.'%';

        $transactions = Transaction::query()
            ->with(['category', 'account'])
            ->where('comments', 'like', $like)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        foreach ($transactions as $transaction) {
            $amount = $transaction->amount;
            $currency = $transaction->currency;
            $amountLabel = $amount !== null && $currency !== null
                ? number_format((float) $amount, 2).' '.$currency
                : null;

            $subtitleParts = array_filter([
                $transaction->date?->format('Y-m-d'),
                $transaction->category?->code,
                $amountLabel,
            ]);

            $collection->add(new SearchHitEntity(
                type: 'transaction',
                id: $transaction->id,
                title: $transaction->comments ?: 'Transaction #'.$transaction->id,
                subtitle: $subtitleParts !== [] ? implode(' · ', $subtitleParts) : null,
                url: '/transactions?search='.urlencode($term),
            ));
        }

        return $collection;
    }

    private function searchCategories(string $term, int $limit): SearchHitCollection
    {
        $collection = new SearchHitCollection;
        $like = '%'.$term.'%';

        $categories = Category::query()
            ->active()
            ->where(function ($query) use ($like) {
                $query
                    ->where('code', 'like', $like)
                    ->orWhere('name_en', 'like', $like)
                    ->orWhere('name_es', 'like', $like);
            })
            ->orderBy('code')
            ->limit($limit)
            ->get();

        foreach ($categories as $category) {
            $collection->add(new SearchHitEntity(
                type: 'category',
                id: $category->code,
                title: $category->code.' — '.$category->name_en,
                subtitle: $category->name_es,
                url: '/categories/'.$category->code,
            ));
        }

        return $collection;
    }
}

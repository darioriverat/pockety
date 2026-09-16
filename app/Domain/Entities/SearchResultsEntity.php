<?php

namespace App\Domain\Entities;

use App\Domain\Collections\SearchHitCollection;

readonly class SearchResultsEntity
{
    public function __construct(
        public string $query,
        public SearchHitCollection $accounts,
        public SearchHitCollection $transactions,
        public SearchHitCollection $categories,
    ) {}

    /**
     * @return array{
     *     query: string,
     *     accounts: list<array{type: string, id: int|string, title: string, subtitle: string|null, url: string}>,
     *     transactions: list<array{type: string, id: int|string, title: string, subtitle: string|null, url: string}>,
     *     categories: list<array{type: string, id: int|string, title: string, subtitle: string|null, url: string}>,
     *     total: int
     * }
     */
    public function toArray(): array
    {
        return [
            'query' => $this->query,
            'accounts' => $this->accounts->toArray(),
            'transactions' => $this->transactions->toArray(),
            'categories' => $this->categories->toArray(),
            'total' => $this->accounts->count()
                + $this->transactions->count()
                + $this->categories->count(),
        ];
    }
}

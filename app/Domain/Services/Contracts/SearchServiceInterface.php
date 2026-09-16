<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\SearchResultsEntity;

interface SearchServiceInterface
{
    /**
     * Search accounts, transactions, and categories for the given query.
     */
    public function search(string $query, int $limit = 10): SearchResultsEntity;
}

<?php

namespace App\Domain\Collections;

use App\Domain\Entities\PeriodBalanceHistoryEntity;

class PeriodBalanceHistoryCollection implements \Countable
{
    /** @var list<PeriodBalanceHistoryEntity> */
    private array $items = [];

    public function add(PeriodBalanceHistoryEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<PeriodBalanceHistoryEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?PeriodBalanceHistoryEntity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}

<?php

namespace App\Domain\Collections;

use App\Domain\Entities\PeriodSummaryEntity;

class PeriodSummaryCollection implements \Countable
{
    /** @var list<PeriodSummaryEntity> */
    private array $items = [];

    public function add(PeriodSummaryEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<PeriodSummaryEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?PeriodSummaryEntity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}

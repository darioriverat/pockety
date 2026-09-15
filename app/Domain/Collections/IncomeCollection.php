<?php

namespace App\Domain\Collections;

use App\Domain\Entities\IncomeEntity;

class IncomeCollection implements \Countable
{
    /** @var list<IncomeEntity> */
    private array $items = [];

    public function add(IncomeEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<IncomeEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?IncomeEntity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}

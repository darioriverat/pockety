<?php

namespace App\Domain\Collections;

use App\Domain\Entities\TransactionEntity;

class TransactionCollection implements \Countable
{
    /** @var list<TransactionEntity> */
    private array $items = [];

    public function add(TransactionEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<TransactionEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?TransactionEntity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}

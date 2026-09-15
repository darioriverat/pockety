<?php

namespace App\Domain\Collections;

use App\Domain\Entities\CategoryActualEntity;

class CategoryActualCollection implements \Countable
{
    /** @var list<CategoryActualEntity> */
    private array $items = [];

    public function add(CategoryActualEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<CategoryActualEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?CategoryActualEntity
    {
        return $this->items[0] ?? null;
    }

    public function findByCode(string $code): ?CategoryActualEntity
    {
        foreach ($this->items as $item) {
            if ($item->categoryCode === $code) {
                return $item;
            }
        }

        return null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}

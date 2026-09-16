<?php

namespace App\Domain\Collections;

use App\Domain\Entities\SearchHitEntity;

class SearchHitCollection implements \Countable
{
    /** @var list<SearchHitEntity> */
    private array $items = [];

    public function add(SearchHitEntity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<SearchHitEntity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?SearchHitEntity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }

    /**
     * @return list<array{type: string, id: int|string, title: string, subtitle: string|null, url: string}>
     */
    public function toArray(): array
    {
        return array_map(
            static fn (SearchHitEntity $hit) => $hit->toArray(),
            $this->items,
        );
    }
}

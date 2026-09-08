---
name: domain-collections
description: Use typed Domain collections instead of plain arrays when service methods return multiple entities. Use when creating list endpoints, service interfaces, or replacing array return types with entity-specific collection classes.
---

# Domain Collections

Use a dedicated collection class when a service returns multiple entities. Do **not** return `array` with a `/** @return Entity[] */` docblock — return a typed `{Resource}Collection` instead.

## Why

- `add()` enforces the element type at runtime (`CategoryEntity` only)
- Service interfaces declare a concrete return type, not `array`
- Controllers map `->all()` through `{Resource}Resource::collection()` for list endpoints

## Directory

```
app/Domain/Collections/
└── {Resource}Collection.php
```

Keep collections in the Domain layer alongside entities. One collection per entity type.

## Collection class

Start with the methods needed for the current feature. The baseline set:

| Method | Purpose |
|--------|---------|
| `add(Entity $entity): self` | Append a typed entity |
| `all(): array` | Return `list<Entity>` for callers that need a plain array |
| `first(): ?Entity` | First item or null |
| `count(): int` | Item count (`Countable`) |

Template (replace `{Resource}` / `{Resource}Entity`):

```php
<?php

namespace App\Domain\Collections;

use App\Domain\Entities\{Resource}Entity;

class {Resource}Collection implements \Countable
{
    /** @var list<{Resource}Entity> */
    private array $items = [];

    public function add({Resource}Entity $entity): self
    {
        $this->items[] = $entity;

        return $this;
    }

    /** @return list<{Resource}Entity> */
    public function all(): array
    {
        return $this->items;
    }

    public function first(): ?{Resource}Entity
    {
        return $this->items[0] ?? null;
    }

    public function count(): int
    {
        return count($this->items);
    }
}
```

Do **not** add API response shaping (`items`, pagination) to the collection — that belongs in the HTTP layer.

Add extra methods (e.g. `filter`, `findBySlug`) only when the current task needs them.

## Service interface

Return the collection type from list methods:

```php
use App\Domain\Collections\{Resource}Collection;

public function listActive(): {Resource}Collection;
```

Do not use `public function listActive(): array`.

## Service implementation

Build the collection explicitly with `add()`:

```php
public function listActive(): CategoryCollection
{
    $collection = new CategoryCollection();

    foreach (Category::sorted()->get() as $model) {
        $collection->add($this->toEntity($model));
    }

    return $collection;
}
```

Prefer `foreach` + `add()` over `map()->all()` so every item passes through the typed `add()` method.

## Controller

Map entities to API resources in the HTTP layer — not in the domain collection:

```php
use App\Http\Resources\CategoryResource;

public function index(): CategoryResourceCollection
{
    return CategoryResource::collection($this->service->listActive()->all());
}
```

Use a `{Resource}ResourceCollection` (in `app/Http/Resources/`) to shape list responses, e.g. `{ "items": [...] }`. Add pagination metadata there when needed.

## Single vs multiple results

| Case | Return type |
|------|-------------|
| One record (show, create, update) | `?{Resource}Entity` or `{Resource}Entity` |
| Multiple records (index, list) | `{Resource}Collection` |

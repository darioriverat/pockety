---
name: soft-deletes
description: Use Laravel soft deletes (deleted_at) instead of is_active flags for deactivating records. Use when creating models, migrations, entities, or API endpoints that need to hide or archive records without hard deletion.
---

# Soft Deletes (deleted_at)

This project uses Laravel soft deletes to deactivate records. Do **not** add `is_active` boolean columns.

## Migration

Add a nullable `deleted_at` timestamp via `softDeletes()`:

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    // ... columns ...
    $table->timestamps();
    $table->softDeletes();
});
```

For existing tables, add a migration with `$table->softDeletes()` and remove any `is_active` column.

## Model

Use the `SoftDeletes` trait. Do not add `is_active` to fillable, casts, or scopes.

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;
}
```

Soft-deleted rows are excluded from queries automatically. Use `withTrashed()`, `onlyTrashed()`, or `restore()` when admin behavior needs trashed records.

## Deactivation

- **Deactivate** → call `$model->delete()` (sets `deleted_at`)
- **Do not** accept `is_active` in request payloads or service methods
- **DELETE** endpoint should soft-delete, not hard-delete

## Entity / API response

Expose `deleted_at` as a nullable ISO 8601 timestamp. Public list/show endpoints should only return non-deleted records (default Eloquent behavior).

```php
readonly class CategoryEntity implements \JsonSerializable
{
    public function __construct(
        // ...
        public ?\DateTimeImmutable $deletedAt = null,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            // ...
            'deleted_at' => $this->deletedAt?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
```

Map from the model in the service:

```php
deletedAt: $model->deleted_at?->toDateTimeImmutable(),
```

## Factory & tests

Factory state for soft-deleted records:

```php
public function trashed(): static
{
    return $this->state(fn (array $attributes) => [
        'deleted_at' => now(),
    ]);
}
```

Assertions:

```php
$this->assertSoftDeleted('categories', ['id' => $category->id]);
```

## Frontend

The public API already excludes soft-deleted records. Do not filter client-side on `is_active`; rely on the API response.

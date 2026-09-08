# CRUD Template

Use this template when creating a new resource endpoint. Replace `{Resource}` with the resource name (e.g., `Product`, `Customer`).

## Files to Create

Copy this checklist:

```
- [ ] app/Domain/Entities/{Resource}Entity.php
- [ ] app/Domain/Requests/Contracts/{Resource}/Store{Resource}RequestInterface.php
- [ ] app/Domain/Requests/Contracts/{Resource}/Update{Resource}RequestInterface.php
- [ ] app/Domain/Services/Contracts/{Resource}ServiceInterface.php
- [ ] app/Http/Requests/{Resource}/Store{Resource}Request.php
- [ ] app/Http/Requests/{Resource}/Update{Resource}Request.php
- [ ] app/Services/{Resource}Service.php
- [ ] app/Http/Controllers/{Resource}Controller.php
- [ ] Update app/Providers/AppServiceProvider.php (bindings)
- [ ] Update routes/api.php
```

## Template: Entity (DTO)

```php
<?php

namespace App\Domain\Entities;

readonly class {Resource}Entity
{
    public function __construct(
        public int $id,
        // Add properties for each field
        public \DateTimeImmutable $createdAt,
    ) {}
}
```

## Template: Store Request Interface

```php
<?php

namespace App\Domain\Requests\Contracts\{Resource};

interface Store{Resource}RequestInterface
{
    // Define getters for each field - return NATIVE types only
}
```

## Template: Update Request Interface

```php
<?php

namespace App\Domain\Requests\Contracts\{Resource};

interface Update{Resource}RequestInterface
{
    // Define getters for each field - return NATIVE types only
}
```

## Template: Service Contract

Service methods receive only what they need (not request interfaces). This makes them reusable from controllers, CLI commands, jobs, etc.

```php
<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\{Resource}Entity;

interface {Resource}ServiceInterface
{
    // Pass individual parameters, not request interfaces
    public function create(string $param1, ?string $param2 = null): {Resource}Entity;

    public function update(int $id, ?string $param1 = null): {Resource}Entity;

    public function findById(int $id): ?{Resource}Entity;

    /** @return {Resource}Entity[] */
    public function list(int $page = 1, int $perPage = 15): array;

    public function count(): int;
}
```

## Template: Store Form Request

```php
<?php

namespace App\Http\Requests\{Resource};

use App\Domain\Requests\Contracts\{Resource}\Store{Resource}RequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class Store{Resource}Request extends FormRequest implements Store{Resource}RequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Define validation rules
        ];
    }

    // Implement interface getters
}
```

## Template: Update Form Request

```php
<?php

namespace App\Http\Requests\{Resource};

use App\Domain\Requests\Contracts\{Resource}\Update{Resource}RequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class Update{Resource}Request extends FormRequest implements Update{Resource}RequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Define validation rules (often same as store, with nullable)
        ];
    }

    // Implement interface getters
}
```

## Template: Service Implementation

```php
<?php

namespace App\Services;

use App\Domain\Entities\{Resource}Entity;
use App\Domain\Services\Contracts\{Resource}ServiceInterface;
use App\Models\{Resource};

class {Resource}Service implements {Resource}ServiceInterface
{
    public function create(string $param1, ?string $param2 = null): {Resource}Entity
    {
        $model = {Resource}::create([
            'field1' => $param1,
            'field2' => $param2,
        ]);

        return $this->toEntity($model);
    }

    public function update(int $id, ?string $param1 = null): {Resource}Entity
    {
        $model = {Resource}::findOrFail($id);

        $model->update([
            'field1' => $param1,
        ]);

        return $this->toEntity($model->fresh());
    }

    public function findById(int $id): ?{Resource}Entity
    {
        $model = {Resource}::find($id);

        return $model ? $this->toEntity($model) : null;
    }

    public function list(int $page = 1, int $perPage = 15): array
    {
        return {Resource}::skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(fn ($model) => $this->toEntity($model))
            ->all();
    }

    public function count(): int
    {
        return {Resource}::count();
    }

    private function toEntity({Resource} $model): {Resource}Entity
    {
        return new {Resource}Entity(
            id: $model->id,
            // Map model attributes to entity properties
            createdAt: $model->created_at->toDateTimeImmutable(),
        );
    }
}
```

## Template: Controller

Controllers extract data from request interfaces and pass individual parameters to services:

```php
<?php

namespace App\Http\Controllers;

use App\Domain\Requests\Contracts\{Resource}\Store{Resource}RequestInterface;
use App\Domain\Requests\Contracts\{Resource}\Update{Resource}RequestInterface;
use App\Domain\Services\Contracts\{Resource}ServiceInterface;
use Illuminate\Http\JsonResponse;

class {Resource}Controller extends Controller
{
    public function __construct(
        private readonly {Resource}ServiceInterface $service
    ) {}

    public function index(): JsonResponse
    {
        $page = request()->integer('page', 1);
        $perPage = 15;
        ${resources} = $this->service->list($page, $perPage);
        $total = $this->service->count();
        $lastPage = (int) ceil($total / $perPage);

        return response()->json([
            'data' => ${resources},
            'links' => [
                'self' => route('{resources}.index', ['page' => $page]),
                'first' => route('{resources}.index', ['page' => 1]),
                'last' => route('{resources}.index', ['page' => $lastPage]),
                'prev' => $page > 1 ? route('{resources}.index', ['page' => $page - 1]) : null,
                'next' => $page < $lastPage ? route('{resources}.index', ['page' => $page + 1]) : null,
            ],
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
    }

    public function store(Store{Resource}RequestInterface $request): JsonResponse
    {
        ${resource} = $this->service->create(
            param1: $request->getParam1(),
            param2: $request->getParam2(),
        );

        return response()->json([
            'data' => ${resource},
            'links' => [
                'self' => route('{resources}.show', ${resource}->id),
            ],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        ${resource} = $this->service->findById($id);

        if (!${resource}) {
            return response()->json(['error' => '{Resource} not found'], 404);
        }

        return response()->json([
            'data' => ${resource},
            'links' => [
                'self' => route('{resources}.show', ${resource}->id),
            ],
        ]);
    }

    public function update(Update{Resource}RequestInterface $request, int $id): JsonResponse
    {
        ${resource} = $this->service->update(
            id: $id,
            param1: $request->getParam1(),
        );

        return response()->json([
            'data' => ${resource},
            'links' => [
                'self' => route('{resources}.show', ${resource}->id),
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        // Delegate to service if needed
        return response()->json(null, 204);
    }
}
```

## Template: Service Provider Bindings

Add to `app/Providers/AppServiceProvider.php`:

```php
public function register(): void
{
    // Request bindings
    $this->app->bind(
        \App\Domain\Requests\Contracts\{Resource}\Store{Resource}RequestInterface::class,
        \App\Http\Requests\{Resource}\Store{Resource}Request::class
    );
    $this->app->bind(
        \App\Domain\Requests\Contracts\{Resource}\Update{Resource}RequestInterface::class,
        \App\Http\Requests\{Resource}\Update{Resource}Request::class
    );

    // Service binding
    $this->app->bind(
        \App\Domain\Services\Contracts\{Resource}ServiceInterface::class,
        \App\Services\{Resource}Service::class
    );
}
```

## Template: Routes

Add to `routes/api.php`:

```php
use App\Http\Controllers\{Resource}Controller;

Route::apiResource('{resources}', {Resource}Controller::class);
```

## Common Validation Rules

| Type | Rule |
|------|------|
| Required string | `'required\|string\|max:255'` |
| Optional string | `'nullable\|string\|max:255'` |
| Required integer | `'required\|integer'` |
| Foreign key | `'required\|integer\|exists:table,id'` |
| Email | `'required\|email\|max:255'` |
| Date | `'required\|date'` |
| Future date | `'required\|date\|after:today'` |
| Enum | `'required\|in:value1,value2,value3'` |
| Array | `'required\|array\|min:1'` |
| Nested array item | `'items.*.field' => 'required\|string'` |
| Decimal | `'required\|numeric\|min:0'` |
| Boolean | `'required\|boolean'` |

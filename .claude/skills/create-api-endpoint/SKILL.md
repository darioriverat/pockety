---
name: create-api-endpoint
description: Create Laravel API endpoints following clean architecture and HATEOAS principles. Use when creating controllers, endpoints, form requests, or when the user mentions API, endpoint, controller, or CRUD operations.
---

# Create API Endpoint

This skill guides the creation of Laravel API endpoints following clean architecture principles, HATEOAS responses, and the Dependency Inversion Principle.

## Directory Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── {Resource}Controller.php
│   └── Requests/
│       └── {Resource}/
│           ├── Store{Resource}Request.php
│           └── Update{Resource}Request.php
├── Domain/                              # Framework-agnostic layer
│   ├── Entities/
│   │   └── {Resource}Entity.php         # DTOs / Core business objects
│   ├── Requests/
│   │   └── Contracts/
│   │       └── {Resource}/
│   │           ├── Store{Resource}RequestInterface.php
│   │           └── Update{Resource}RequestInterface.php
│   └── Services/
│       └── Contracts/
│           └── {Resource}ServiceInterface.php
├── Services/                            # Implementation layer (uses Models)
│   └── {Resource}Service.php
└── Providers/
    └── AppServiceProvider.php (bind interfaces)
```

## Core Rule: Domain Layer Isolation

**Interfaces in Domain must NOT return framework objects.** They return only:
- Native types (`string`, `int`, `array`, `bool`, etc.)
- Native PHP objects
- Entities (DTOs defined in `Domain/Entities/`)

This keeps the Domain layer framework-agnostic and testable.

## Workflow

### Step 1: Create the Entity (DTO)

Create the entity in `app/Domain/Entities/`:

```php
<?php

namespace App\Domain\Entities;

readonly class {Resource}Entity
{
    public function __construct(
        public int $id,
        public string $fieldName,
        public \DateTimeImmutable $createdAt,
    ) {}
}
```

### Step 2: Create the Request Interface

Create the contract in `app/Domain/Requests/Contracts/{Resource}/`:

```php
<?php

namespace App\Domain\Requests\Contracts\{Resource};

interface Store{Resource}RequestInterface
{
    public function getFieldName(): string;
    // Add getter for each field - return native types only
}
```

### Step 3: Create the Form Request

Create the implementation in `app/Http/Requests/{Resource}/`:

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
            'field_name' => 'required|string|max:255',
        ];
    }

    public function getFieldName(): string
    {
        return $this->input('field_name');
    }
}
```

### Step 4: Create the Service Contract

Create the contract in `app/Domain/Services/Contracts/`. Service methods receive only what they need (not request interfaces):

```php
<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\{Resource}Entity;

interface {Resource}ServiceInterface
{
    public function create(string $fieldName): {Resource}Entity;
}
```

This makes services reusable from controllers, CLI commands, jobs, or any other context.

### Step 5: Create the Service Implementation

Create the service in `app/Services/` (implementation layer, uses Models):

```php
<?php

namespace App\Services;

use App\Domain\Entities\{Resource}Entity;
use App\Domain\Services\Contracts\{Resource}ServiceInterface;
use App\Models\{Resource};

class {Resource}Service implements {Resource}ServiceInterface
{
    public function create(string $fieldName): {Resource}Entity
    {
        $model = {Resource}::create([
            'field_name' => $fieldName,
        ]);

        return new {Resource}Entity(
            id: $model->id,
            fieldName: $model->field_name,
            createdAt: $model->created_at->toDateTimeImmutable(),
        );
    }
}
```

### Step 6: Create the Controller

Controllers extract data from request interfaces and pass individual parameters to services:

```php
<?php

namespace App\Http\Controllers;

use App\Domain\Requests\Contracts\{Resource}\Store{Resource}RequestInterface;
use App\Domain\Services\Contracts\{Resource}ServiceInterface;
use Illuminate\Http\JsonResponse;

class {Resource}Controller extends Controller
{
    public function __construct(
        private readonly {Resource}ServiceInterface $service
    ) {}

    public function store(Store{Resource}RequestInterface $request): JsonResponse
    {
        $entity = $this->service->create(
            fieldName: $request->getFieldName(),
        );

        return response()->json([
            'data' => $entity,
            'links' => [
                'self' => route('{resources}.show', $entity->id),
            ],
        ], 201);
    }
}
```

### Step 7: Bind Interfaces to Implementations

In `app/Providers/AppServiceProvider.php`:

```php
public function register(): void
{
    // Request bindings
    $this->app->bind(
        \App\Domain\Requests\Contracts\{Resource}\Store{Resource}RequestInterface::class,
        \App\Http\Requests\{Resource}\Store{Resource}Request::class
    );

    // Service bindings
    $this->app->bind(
        \App\Domain\Services\Contracts\{Resource}ServiceInterface::class,
        \App\Services\{Resource}Service::class
    );
}
```

### Step 8: Add Route

In `routes/api.php`:

```php
use App\Http\Controllers\{Resource}Controller;

Route::apiResource('{resources}', {Resource}Controller::class);
```

## HATEOAS Response Format

Always include `links` in responses for discoverability:

```json
{
    "data": {
        "id": 1,
        "name": "Example"
    },
    "links": {
        "self": "/api/resources/1",
        "related": "/api/resources/1/related"
    }
}
```

For collections:

```json
{
    "data": [...],
    "links": {
        "self": "/api/resources",
        "first": "/api/resources?page=1",
        "last": "/api/resources?page=10",
        "prev": null,
        "next": "/api/resources?page=2"
    },
    "meta": {
        "current_page": 1,
        "total": 100
    }
}
```

## Key Principles

1. **Domain Layer Isolation**: Interfaces in `Domain/` never return framework objects (Models, Request, Response). Return native types or Entities only.

2. **Thin Controllers**: Controllers only direct data flow. Business logic goes in services.

3. **Request Interfaces**: Controllers depend on interfaces, not concrete FormRequest classes.

4. **Service Interfaces**: Controllers depend on service contracts from Domain, not implementations.

5. **No validate() in Controllers**: Validation rules live in FormRequest classes.

6. **Law of Demeter**: Don't access nested objects. Encapsulate in request methods:
   ```php
   // Bad
   $request->getSession()->forget('cache-key');
   
   // Good - encapsulate in interface
   $request->forgetCache();
   ```

7. **HATEOAS Links**: Every response includes relevant navigation links.

## Layer Responsibilities

| Layer | Location | Returns | Depends On |
|-------|----------|---------|------------|
| Domain | `app/Domain/` | Native types, Entities | Nothing (framework-agnostic) |
| Services | `app/Services/` | Entities | Domain contracts, Models |
| Http | `app/Http/` | JsonResponse | Domain contracts, Service contracts |

## Testing

Services are easy to test since they receive primitive parameters:

```php
$service = new OrderService();
$entity = $service->create(
    customerId: 1,
    items: [['product_id' => 1, 'quantity' => 2]],
    notes: 'Test order',
    deliveryDate: '2025-01-15',
);

$this->assertInstanceOf(OrderEntity::class, $entity);
$this->assertEquals(1, $entity->customerId);
```

Request interfaces simplify controller testing:

```php
$request = Mockery::mock(StoreOrderRequestInterface::class);
$request->shouldReceive('getCustomerId')->andReturn(1);
$request->shouldReceive('getItems')->andReturn([...]);
```

## Additional Resources

- For detailed examples, see [examples.md](examples.md)
- For CRUD operations template, see [crud-template.md](crud-template.md)

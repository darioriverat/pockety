# API Endpoint Examples

## Example: Order Endpoint

This example demonstrates creating an Order endpoint with full clean architecture.

### Entity (DTO)

```php
<?php

namespace App\Domain\Entities;

readonly class OrderEntity
{
    public function __construct(
        public int $id,
        public int $customerId,
        public ?string $notes,
        public ?string $deliveryDate,
        public string $status,
        public \DateTimeImmutable $createdAt,
        /** @var OrderItemEntity[] */
        public array $items = [],
    ) {}
}
```

```php
<?php

namespace App\Domain\Entities;

readonly class OrderItemEntity
{
    public function __construct(
        public int $id,
        public int $productId,
        public int $quantity,
    ) {}
}
```

### Request Interface

```php
<?php

namespace App\Domain\Requests\Contracts\Order;

interface StoreOrderRequestInterface
{
    public function getCustomerId(): int;

    /** @return array<array{product_id: int, quantity: int}> */
    public function getItems(): array;

    public function getNotes(): ?string;

    public function getDeliveryDate(): ?string;
}
```

### Form Request Implementation

```php
<?php

namespace App\Http\Requests\Order;

use App\Domain\Requests\Contracts\Order\StoreOrderRequestInterface;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest implements StoreOrderRequestInterface
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:1000',
            'delivery_date' => 'nullable|date|after:today',
        ];
    }

    public function getCustomerId(): int
    {
        return (int) $this->input('customer_id');
    }

    public function getItems(): array
    {
        return $this->input('items', []);
    }

    public function getNotes(): ?string
    {
        return $this->input('notes');
    }

    public function getDeliveryDate(): ?string
    {
        return $this->input('delivery_date');
    }
}
```

### Service Contract

Service methods receive only what they need (not request interfaces). This makes them reusable from controllers, CLI commands, jobs, etc.

```php
<?php

namespace App\Domain\Services\Contracts;

use App\Domain\Entities\OrderEntity;

interface OrderServiceInterface
{
    /**
     * @param array<array{product_id: int, quantity: int}> $items
     */
    public function create(
        int $customerId,
        array $items,
        ?string $notes = null,
        ?string $deliveryDate = null,
    ): OrderEntity;

    public function update(
        int $orderId,
        ?string $notes = null,
        ?string $deliveryDate = null,
    ): OrderEntity;

    public function findById(int $orderId): ?OrderEntity;

    /** @return OrderEntity[] */
    public function list(int $page = 1, int $perPage = 15): array;

    public function count(): int;
}
```

### Service Implementation

```php
<?php

namespace App\Services;

use App\Domain\Entities\OrderEntity;
use App\Domain\Entities\OrderItemEntity;
use App\Domain\Services\Contracts\OrderServiceInterface;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderService implements OrderServiceInterface
{
    public function create(
        int $customerId,
        array $items,
        ?string $notes = null,
        ?string $deliveryDate = null,
    ): OrderEntity {
        return DB::transaction(function () use ($customerId, $items, $notes, $deliveryDate) {
            $order = Order::create([
                'customer_id' => $customerId,
                'notes' => $notes,
                'delivery_date' => $deliveryDate,
                'status' => 'pending',
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return $this->toEntity($order->load('items'));
        });
    }

    public function update(
        int $orderId,
        ?string $notes = null,
        ?string $deliveryDate = null,
    ): OrderEntity {
        $order = Order::findOrFail($orderId);

        $order->update([
            'notes' => $notes,
            'delivery_date' => $deliveryDate,
        ]);

        return $this->toEntity($order->fresh('items'));
    }

    public function findById(int $orderId): ?OrderEntity
    {
        $order = Order::with('items')->find($orderId);

        return $order ? $this->toEntity($order) : null;
    }

    public function list(int $page = 1, int $perPage = 15): array
    {
        $orders = Order::with('items')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $orders->map(fn ($order) => $this->toEntity($order))->all();
    }

    public function count(): int
    {
        return Order::count();
    }

    private function toEntity(Order $order): OrderEntity
    {
        return new OrderEntity(
            id: $order->id,
            customerId: $order->customer_id,
            notes: $order->notes,
            deliveryDate: $order->delivery_date,
            status: $order->status,
            createdAt: $order->created_at->toDateTimeImmutable(),
            items: $order->items->map(fn ($item) => new OrderItemEntity(
                id: $item->id,
                productId: $item->product_id,
                quantity: $item->quantity,
            ))->all(),
        );
    }
}
```

### Controller

Controllers extract data from request interfaces and pass individual parameters to services:

```php
<?php

namespace App\Http\Controllers;

use App\Domain\Requests\Contracts\Order\StoreOrderRequestInterface;
use App\Domain\Requests\Contracts\Order\UpdateOrderRequestInterface;
use App\Domain\Services\Contracts\OrderServiceInterface;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderServiceInterface $orderService
    ) {}

    public function index(): JsonResponse
    {
        $page = request()->integer('page', 1);
        $perPage = 15;
        $orders = $this->orderService->list($page, $perPage);
        $total = $this->orderService->count();
        $lastPage = (int) ceil($total / $perPage);

        return response()->json([
            'data' => $orders,
            'links' => [
                'self' => route('orders.index', ['page' => $page]),
                'first' => route('orders.index', ['page' => 1]),
                'last' => route('orders.index', ['page' => $lastPage]),
                'prev' => $page > 1 ? route('orders.index', ['page' => $page - 1]) : null,
                'next' => $page < $lastPage ? route('orders.index', ['page' => $page + 1]) : null,
            ],
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
    }

    public function store(StoreOrderRequestInterface $request): JsonResponse
    {
        $order = $this->orderService->create(
            customerId: $request->getCustomerId(),
            items: $request->getItems(),
            notes: $request->getNotes(),
            deliveryDate: $request->getDeliveryDate(),
        );

        return response()->json([
            'data' => $order,
            'links' => [
                'self' => route('orders.show', $order->id),
                'items' => route('orders.items.index', $order->id),
                'cancel' => route('orders.cancel', $order->id),
            ],
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $order = $this->orderService->findById($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json([
            'data' => $order,
            'links' => [
                'self' => route('orders.show', $order->id),
                'items' => route('orders.items.index', $order->id),
            ],
        ]);
    }

    public function update(UpdateOrderRequestInterface $request, int $id): JsonResponse
    {
        $order = $this->orderService->update(
            orderId: $id,
            notes: $request->getNotes(),
            deliveryDate: $request->getDeliveryDate(),
        );

        return response()->json([
            'data' => $order,
            'links' => [
                'self' => route('orders.show', $order->id),
            ],
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        // Delegate to service if soft delete or business logic needed
        return response()->json(null, 204);
    }
}
```

### Service Provider Bindings

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Order Request Bindings
        $this->app->bind(
            \App\Domain\Requests\Contracts\Order\StoreOrderRequestInterface::class,
            \App\Http\Requests\Order\StoreOrderRequest::class
        );
        $this->app->bind(
            \App\Domain\Requests\Contracts\Order\UpdateOrderRequestInterface::class,
            \App\Http\Requests\Order\UpdateOrderRequest::class
        );

        // Order Service Binding
        $this->app->bind(
            \App\Domain\Services\Contracts\OrderServiceInterface::class,
            \App\Services\OrderService::class
        );
    }
}
```

### Routes

```php
use App\Http\Controllers\OrderController;

Route::apiResource('orders', OrderController::class);
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
```

## Testing Example

Services are easy to test since they receive primitive parameters (no mocking needed):

```php
<?php

namespace Tests\Unit\Services;

use App\Domain\Entities\OrderEntity;
use App\Services\OrderService;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    public function test_creates_order_and_returns_entity(): void
    {
        $service = new OrderService();

        $order = $service->create(
            customerId: 1,
            items: [
                ['product_id' => 1, 'quantity' => 2],
                ['product_id' => 2, 'quantity' => 1],
            ],
            notes: 'Test order',
            deliveryDate: '2025-01-15',
        );

        $this->assertInstanceOf(OrderEntity::class, $order);
        $this->assertEquals(1, $order->customerId);
        $this->assertCount(2, $order->items);
        $this->assertEquals('pending', $order->status);
    }
}
```

Request interfaces are useful for controller testing:

```php
<?php

namespace Tests\Feature;

use App\Domain\Requests\Contracts\Order\StoreOrderRequestInterface;
use Mockery;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    public function test_store_creates_order(): void
    {
        $response = $this->postJson('/api/orders', [
            'customer_id' => 1,
            'items' => [['product_id' => 1, 'quantity' => 2]],
            'notes' => 'Test',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'customerId', 'status'],
                'links' => ['self'],
            ]);
    }
}
```

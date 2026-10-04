<?php

namespace Tests\Feature;

use App\Domain\Requests\Contracts\Category\StoreCategoryRequestInterface;
use App\Domain\Requests\Contracts\Category\UpdateCategoryRequestInterface;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryFormRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that StoreCategoryRequest implements the domain interface.
     *
     * @test
     */
    public function test_store_category_request_implements_domain_interface(): void
    {
        $request = new StoreCategoryRequest();

        $this->assertInstanceOf(
            StoreCategoryRequestInterface::class,
            $request,
            'StoreCategoryRequest must implement StoreCategoryRequestInterface'
        );
    }

    /**
     * Test that UpdateCategoryRequest implements the domain interface.
     *
     * @test
     */
    public function test_update_category_request_implements_domain_interface(): void
    {
        $request = new UpdateCategoryRequest();

        $this->assertInstanceOf(
            UpdateCategoryRequestInterface::class,
            $request,
            'UpdateCategoryRequest must implement UpdateCategoryRequestInterface'
        );
    }

    /**
     * Test that StoreCategoryRequest validates required fields.
     *
     * @test
     */
    public function test_store_category_request_validates_required_fields(): void
    {
        $user = User::factory()->create();

        // Missing name
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // Missing is_debt_category
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Test Category',
            'is_income_category' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_debt_category']);

        // Missing is_income_category
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Test Category',
            'is_debt_category' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_income_category']);
    }

    /**
     * Test that UpdateCategoryRequest accepts optional fields.
     *
     * @test
     */
    public function test_update_category_request_accepts_optional_fields(): void
    {
        $user = User::factory()->create();

        // Create a category first
        $category = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Original Name',
            'is_debt_category' => false,
            'is_income_category' => false,
        ])->json('data');

        // Update with just name
        $response = $this->actingAs($user)->putJson("/api/categories/{$category['code']}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.name', 'Updated Name');

        // Update with just is_active
        $response = $this->actingAs($user)->putJson("/api/categories/{$category['code']}", [
            'is_active' => false,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.is_active', false);
    }

    /**
     * Test that form request methods return correct data.
     *
     * @test
     */
    public function test_store_request_interface_methods_return_correct_data(): void
    {
        $user = User::factory()->create();

        // Create a mock request with data
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Test Category',
            'is_debt_category' => true,
            'is_income_category' => false,
        ]);

        $response->assertStatus(201);

        // Verify the data was processed correctly through the interface
        $data = $response->json('data');
        $this->assertEquals('Test Category', $data['name']);
        $this->assertTrue($data['is_debt_category']);
        $this->assertFalse($data['is_income_category']);
    }

    /**
     * Test that form requests handle HTTP validation correctly.
     *
     * @test
     */
    public function test_form_requests_handle_http_validation(): void
    {
        $user = User::factory()->create();

        // Invalid name (too long)
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => str_repeat('a', 256), // Exceeds max:255
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);

        // Invalid boolean type
        $response = $this->actingAs($user)->postJson('/api/categories', [
            'name' => 'Test',
            'is_debt_category' => 'not-a-boolean',
            'is_income_category' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['is_debt_category']);
    }

    /**
     * Test that service methods accept domain interfaces, not form requests directly.
     *
     * @test
     */
    public function test_service_methods_accept_domain_interfaces(): void
    {
        // This test verifies architectural constraint by checking service interface
        $serviceInterface = new \ReflectionClass(\App\Domain\Services\Contracts\CategoryServiceInterface::class);
        
        $createMethod = $serviceInterface->getMethod('create');
        $createParams = $createMethod->getParameters();

        // Service should accept scalar parameters, not request objects
        $this->assertEquals('name', $createParams[0]->getName());
        $this->assertEquals('isDebtCategory', $createParams[1]->getName());
        $this->assertEquals('isIncomeCategory', $createParams[2]->getName());

        // None of the parameters should type-hint a request interface
        foreach ($createParams as $param) {
            $type = $param->getType();
            if ($type !== null) {
                $typeName = $type->getName();
                $this->assertStringNotContainsString(
                    'Request',
                    $typeName,
                    "Service method should not depend on Request types, found: {$typeName}"
                );
            }
        }
    }

    /**
     * Test that controller depends on request interfaces, not concrete classes.
     *
     * @test
     */
    public function test_controller_depends_on_request_interfaces(): void
    {
        $controller = new \ReflectionClass(\App\Http\Controllers\CategoryController::class);
        
        $storeMethod = $controller->getMethod('store');
        $storeParams = $storeMethod->getParameters();
        
        $requestParam = $storeParams[0];
        $requestType = $requestParam->getType();
        
        $this->assertNotNull($requestType, 'Store method should type-hint request parameter');
        $this->assertEquals(
            StoreCategoryRequestInterface::class,
            $requestType->getName(),
            'Controller should depend on interface, not concrete class'
        );

        $updateMethod = $controller->getMethod('update');
        $updateParams = $updateMethod->getParameters();
        
        $updateRequestParam = $updateParams[0];
        $updateRequestType = $updateRequestParam->getType();
        
        $this->assertEquals(
            UpdateCategoryRequestInterface::class,
            $updateRequestType->getName(),
            'Update method should depend on interface, not concrete class'
        );
    }

    /**
     * Test that interface bindings are registered in AppServiceProvider.
     *
     * @test
     */
    public function test_request_interfaces_are_bound_in_service_provider(): void
    {
        // Test StoreCategoryRequestInterface binding
        $storeRequest = app(StoreCategoryRequestInterface::class);
        $this->assertInstanceOf(
            StoreCategoryRequest::class,
            $storeRequest,
            'StoreCategoryRequestInterface should be bound to StoreCategoryRequest'
        );

        // Test UpdateCategoryRequestInterface binding
        $updateRequest = app(UpdateCategoryRequestInterface::class);
        $this->assertInstanceOf(
            UpdateCategoryRequest::class,
            $updateRequest,
            'UpdateCategoryRequestInterface should be bound to UpdateCategoryRequest'
        );
    }
}

<?php

namespace Tests\Feature;

use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use Illuminate\Database\Eloquent\Model;
use Tests\TestCase;

class DomainArchitectureTest extends TestCase
{
    /**
     * Test that CategoryServiceInterface returns entities, not Eloquent models.
     *
     * @test
     */
    public function test_category_service_interface_returns_entities_not_models(): void
    {
        $service = app(CategoryServiceInterface::class);
        
        // Get all active categories
        $categories = $service->getAllActive();
        
        $this->assertIsArray($categories);
        
        if (count($categories) > 0) {
            $firstCategory = $categories[0];
            
            // Should be an entity, not an Eloquent model
            $this->assertNotInstanceOf(Model::class, $firstCategory);
            
            // Should have toArray method (entity interface)
            $this->assertTrue(method_exists($firstCategory, 'toArray'));
            
            // Verify it's a CategoryEntity by checking expected properties
            $array = $firstCategory->toArray();
            $this->assertArrayHasKey('id', $array);
            $this->assertArrayHasKey('code', $array);
            $this->assertArrayHasKey('name', $array);
            $this->assertArrayHasKey('is_debt_category', $array);
            $this->assertArrayHasKey('is_income_category', $array);
            $this->assertArrayHasKey('is_active', $array);
        }
        
        // Test getByCode
        $category = $service->getByCode('C001');
        if ($category !== null) {
            $this->assertNotInstanceOf(Model::class, $category);
            $this->assertTrue(method_exists($category, 'toArray'));
        }
    }

    /**
     * Test that AccountServiceInterface returns entities, not Eloquent models.
     *
     * @test
     */
    public function test_account_service_interface_returns_entities_not_models(): void
    {
        $service = app(AccountServiceInterface::class);
        
        // Get all active accounts
        $accounts = $service->getAllActive();
        
        $this->assertIsArray($accounts);
        
        if (count($accounts) > 0) {
            $firstAccount = $accounts[0];
            
            // Should be an entity, not an Eloquent model
            $this->assertNotInstanceOf(Model::class, $firstAccount);
            
            // Should have toArray method (entity interface)
            $this->assertTrue(method_exists($firstAccount, 'toArray'));
            
            // Verify it's an AccountEntity by checking expected properties
            $array = $firstAccount->toArray();
            $this->assertArrayHasKey('id', $array);
            $this->assertArrayHasKey('name', $array);
            $this->assertArrayHasKey('type', $array);
        }
    }

    /**
     * Test that TransactionServiceInterface returns entities, not Eloquent models.
     *
     * @test
     */
    public function test_transaction_service_interface_returns_entities_not_models(): void
    {
        $service = app(TransactionServiceInterface::class);
        
        // Get all transactions
        $transactions = $service->getAll();
        
        $this->assertIsArray($transactions);
        
        if (count($transactions) > 0) {
            $firstTransaction = $transactions[0];
            
            // Should be an entity, not an Eloquent model
            $this->assertNotInstanceOf(Model::class, $firstTransaction);
            
            // Should have toArray method (entity interface)
            $this->assertTrue(method_exists($firstTransaction, 'toArray'));
            
            // Verify it's a TransactionEntity by checking expected properties
            $array = $firstTransaction->toArray();
            $this->assertArrayHasKey('id', $array);
            $this->assertArrayHasKey('date', $array);
            $this->assertArrayHasKey('period', $array);
            $this->assertArrayHasKey('category_id', $array);
        }
    }

    /**
     * Test that HTTP controllers receive entities from services.
     *
     * @test
     */
    public function test_http_controllers_receive_entities_from_services(): void
    {
        // Create a test user
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);
        
        // Call the categories endpoint
        $response = $this->getJson('/api/categories');
        
        $response->assertOk();
        $data = $response->json('data');
        
        $this->assertIsArray($data);
        
        // The response should contain plain arrays (from entity->toArray()),
        // not Eloquent model attributes
        if (count($data) > 0) {
            $firstCategory = $data[0];
            
            // Should have entity fields
            $this->assertArrayHasKey('code', $firstCategory);
            $this->assertArrayHasKey('name', $firstCategory);
            $this->assertArrayHasKey('is_active', $firstCategory);
            
            // Should NOT have Eloquent timestamps in raw format
            $this->assertArrayNotHasKey('created_at', $firstCategory);
            $this->assertArrayNotHasKey('updated_at', $firstCategory);
        }
    }

    /**
     * Test that service implementations transform models to entities.
     *
     * @test
     */
    public function test_service_implementations_transform_models_to_entities(): void
    {
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);
        
        $categoryService = app(CategoryServiceInterface::class);
        
        // Create a category through the service
        $entity = $categoryService->create(
            name: 'Domain Test Category',
            isDebtCategory: false,
            isIncomeCategory: false
        );
        
        // Verify we got an entity back
        $this->assertNotInstanceOf(Model::class, $entity);
        $this->assertTrue(method_exists($entity, 'toArray'));
        
        // Verify the entity has the expected data
        $this->assertEquals('Domain Test Category', $entity->name);
        $this->assertFalse($entity->isDebtCategory);
        $this->assertFalse($entity->isIncomeCategory);
        $this->assertTrue($entity->isActive);
        
        // Verify code was assigned
        $this->assertNotEmpty($entity->code);
        $this->assertMatchesRegularExpression('/^C\d{3}$/', $entity->code);
    }
}

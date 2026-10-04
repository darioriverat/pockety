<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->seed(CategorySeeder::class);
    }

    public function test_create_expense_category(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Test Expense',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Expense')
            ->assertJsonPath('data.is_debt_category', false)
            ->assertJsonPath('data.is_income_category', false)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonStructure([
                'data' => ['id', 'code', 'name', 'is_debt_category', 'is_income_category', 'is_active'],
                'links' => ['self'],
            ]);

        $code = $response->json('data.code');
        $this->assertMatchesRegularExpression('/^C\d{3}$/', $code);
        $this->assertEquals('C047', $code); // First custom category after template C001-C046
    }

    public function test_create_debt_category(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Test Debt',
            'is_debt_category' => true,
            'is_income_category' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_debt_category', true)
            ->assertJsonPath('data.is_income_category', false);

        $code = $response->json('data.code');
        $this->assertMatchesRegularExpression('/^C\d{3}$/', $code);
    }

    public function test_create_income_category(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Test Income',
            'is_debt_category' => false,
            'is_income_category' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_debt_category', false)
            ->assertJsonPath('data.is_income_category', true);

        $code = $response->json('data.code');
        $this->assertMatchesRegularExpression('/^I\d{2,}$/', $code);
        $this->assertEquals('I02', $code); // First custom income after template I01
    }

    public function test_income_code_sequence(): void
    {
        // Create first income category
        $response1 = $this->postJson('/api/categories', [
            'name' => 'Income 1',
            'is_debt_category' => false,
            'is_income_category' => true,
        ]);
        $this->assertEquals('I02', $response1->json('data.code'));

        // Create second income category
        $response2 = $this->postJson('/api/categories', [
            'name' => 'Income 2',
            'is_debt_category' => false,
            'is_income_category' => true,
        ]);
        $this->assertEquals('I03', $response2->json('data.code'));
    }

    public function test_expense_code_sequence(): void
    {
        // Create first expense category
        $response1 = $this->postJson('/api/categories', [
            'name' => 'Expense 1',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);
        $this->assertEquals('C047', $response1->json('data.code'));

        // Create second expense category
        $response2 = $this->postJson('/api/categories', [
            'name' => 'Expense 2',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);
        $this->assertEquals('C048', $response2->json('data.code'));
    }

    public function test_create_rejects_both_flags_true(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Invalid Category',
            'is_debt_category' => true,
            'is_income_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'A category cannot be both debt and income');
    }

    public function test_create_validates_required_fields(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['error', 'messages']);
    }

    public function test_create_trims_name(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => '  Trimmed Name  ',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Trimmed Name');
    }

    public function test_update_category_name(): void
    {
        $category = Category::where('code', 'C001')->first();

        $response = $this->putJson("/api/categories/C001", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.code', 'C001')
            ->assertJsonStructure([
                'data',
                'links' => ['self', 'index'],
            ]);

        $this->assertDatabaseHas('categories', [
            'code' => 'C001',
            'name' => 'Updated Name',
        ]);
    }

    public function test_update_inactivate_category(): void
    {
        $response = $this->putJson("/api/categories/C001", [
            'is_active' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('categories', [
            'code' => 'C001',
            'is_active' => false,
        ]);
    }

    public function test_update_reactivate_category(): void
    {
        // First inactivate
        Category::where('code', 'C001')->update(['is_active' => false]);

        // Then reactivate
        $response = $this->putJson("/api/categories/C001", [
            'is_active' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    public function test_update_flags_when_no_transactions(): void
    {
        $category = Category::where('code', 'C001')->first();
        $this->assertFalse($category->is_debt_category);

        $response = $this->putJson("/api/categories/C001", [
            'is_debt_category' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_debt_category', true);

        $this->assertDatabaseHas('categories', [
            'code' => 'C001',
            'is_debt_category' => true,
        ]);
    }

    public function test_update_rejects_flag_change_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction for this category
        Transaction::factory()->create([
            'category_id' => $category->id,
        ]);

        $response = $this->putJson("/api/categories/C001", [
            'is_debt_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Debt and income settings cannot be changed because this category has transactions');

        // Verify category unchanged
        $category->refresh();
        $this->assertFalse($category->is_debt_category);
    }

    public function test_update_allows_name_change_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction
        Transaction::factory()->create([
            'category_id' => $category->id,
        ]);

        $response = $this->putJson("/api/categories/C001", [
            'name' => 'New Name With Transactions',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name With Transactions');
    }

    public function test_update_allows_inactivate_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction
        Transaction::factory()->create([
            'category_id' => $category->id,
        ]);

        $response = $this->putJson("/api/categories/C001", [
            'is_active' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_update_rejects_both_flags_true(): void
    {
        $response = $this->putJson("/api/categories/C001", [
            'is_debt_category' => true,
            'is_income_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'A category cannot be both debt and income');
    }

    public function test_update_requires_at_least_one_field(): void
    {
        $response = $this->putJson("/api/categories/C001", []);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'At least one field must be provided');
    }

    public function test_update_returns_404_for_nonexistent_category(): void
    {
        $response = $this->putJson("/api/categories/NONEXISTENT", [
            'name' => 'Test',
        ]);

        $response->assertNotFound();
    }

    public function test_delete_succeeds_when_no_dependencies(): void
    {
        // Create a new category with no transactions or budgets
        $response = $this->postJson('/api/categories', [
            'name' => 'To Delete',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $code = $response->json('data.code');

        // Delete it
        $deleteResponse = $this->deleteJson("/api/categories/{$code}");

        $deleteResponse->assertOk()
            ->assertJsonPath('message', 'Category deleted successfully')
            ->assertJsonStructure(['links' => ['index']]);

        $this->assertDatabaseMissing('categories', ['code' => $code]);
    }

    public function test_delete_blocked_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction
        Transaction::factory()->create([
            'category_id' => $category->id,
        ]);

        $response = $this->deleteJson("/api/categories/C001");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This category has associated transactions and cannot be deleted')
            ->assertJsonPath('has_transactions', true);

        $this->assertDatabaseHas('categories', ['code' => 'C001']);
    }

    public function test_delete_blocked_when_budgets_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a budget
        Budget::factory()->create([
            'category_id' => $category->id,
        ]);

        $response = $this->deleteJson("/api/categories/C001");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This category has associated budgets and cannot be deleted')
            ->assertJsonPath('has_budgets', true);

        $this->assertDatabaseHas('categories', ['code' => 'C001']);
    }

    public function test_delete_returns_404_for_nonexistent_category(): void
    {
        $response = $this->deleteJson("/api/categories/NONEXISTENT");

        $response->assertNotFound();
    }

    public function test_get_categories_returns_only_active_by_default(): void
    {
        // Inactivate C040
        $this->assertTrue(Category::where('code', 'C040')->exists());

        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonPath('meta.total', 46);

        $codes = array_column($response->json('data'), 'code');
        $this->assertNotContains('C040', $codes);
        $this->assertContains('C001', $codes);
        $this->assertContains('I01', $codes);
    }

    public function test_get_categories_with_include_inactive_returns_all(): void
    {
        $response = $this->getJson('/api/categories?include_inactive=1');

        $response->assertOk();

        $data = $response->json('data');
        $total = $response->json('meta.total');
        $this->assertEquals(47, $total); // 46 active + 1 inactive (C040)

        $codes = array_column($data, 'code');
        $this->assertContains('C040', $codes);
        $this->assertContains('C001', $codes);
        $this->assertContains('I01', $codes);
    }

    public function test_categories_ordered_by_code(): void
    {
        $response = $this->getJson('/api/categories?include_inactive=1');

        $codes = array_column($response->json('data'), 'code');

        // Verify ordering
        $sortedCodes = $codes;
        sort($sortedCodes);
        $this->assertEquals($sortedCodes, $codes);
    }
}

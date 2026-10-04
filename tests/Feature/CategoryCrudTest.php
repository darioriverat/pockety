<?php

namespace Tests\Feature;

use App\Models\Account;
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

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->seed(CategorySeeder::class);

        // Create a test account for transactions
        $this->account = Account::create([
            'name' => 'Test Account',
            'type' => 'bank',
            'currency' => 'CAD',
        ]);
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

        $this->assertDatabaseMissing('categories', ['name' => 'Invalid Category']);
    }

    public function test_create_validates_required_fields(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
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

        $response = $this->putJson('/api/categories/C001', [
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
        $response = $this->putJson('/api/categories/C001', [
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
        $response = $this->putJson('/api/categories/C001', [
            'is_active' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    public function test_update_flags_when_no_transactions(): void
    {
        $category = Category::where('code', 'C001')->first();
        $this->assertFalse($category->is_debt_category);

        $response = $this->putJson('/api/categories/C001', [
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
        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        $response = $this->putJson('/api/categories/C001', [
            'is_debt_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Debt and income settings cannot be changed because this category has transactions');

        // Verify category unchanged
        $category->refresh();
        $this->assertFalse($category->is_debt_category);
    }

    public function test_update_rejects_income_flag_change_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();
        $this->assertFalse($category->is_income_category);
        $this->assertFalse($category->is_debt_category);

        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 55.00,
            'comments' => 'Locks income flag change',
        ]);

        $response = $this->putJson('/api/categories/C001', [
            'is_income_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Debt and income settings cannot be changed because this category has transactions');

        $category->refresh();
        $this->assertFalse($category->is_income_category);
        $this->assertFalse($category->is_debt_category);
    }

    public function test_update_allows_name_change_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction
        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        $response = $this->putJson('/api/categories/C001', [
            'name' => 'New Name With Transactions',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name With Transactions');
    }

    public function test_update_allows_inactivate_when_transactions_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a transaction
        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        $response = $this->putJson('/api/categories/C001', [
            'is_active' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_existing_transaction_remains_valid_after_category_inactivation(): void
    {
        // Step 1: Create category C047
        $create = $this->postJson('/api/categories', [
            'name' => 'Keep Transaction Category',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);
        $create->assertCreated()->assertJsonPath('data.code', 'C047');
        $categoryId = (int) $create->json('data.id');

        // Step 2: Create transaction with category_id for C047
        $txnCreate = $this->postJson('/api/transactions', [
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $categoryId,
            'account_id' => $this->account->id,
            'amount_cad' => 87.25,
            'comments' => 'survives-inactivation',
        ]);
        $txnCreate->assertCreated();
        $transactionId = (int) $txnCreate->json('data.id');

        // Step 3: Inactivate C047
        $this->putJson('/api/categories/C047', ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        // Steps 4-6: Query transaction — still exists and points to C047
        $show = $this->getJson('/api/transactions/'.$transactionId);
        $show->assertOk()
            ->assertJsonPath('data.id', $transactionId)
            ->assertJsonPath('data.category_id', $categoryId)
            ->assertJsonPath('data.category.code', 'C047')
            ->assertJsonPath('data.category.name', 'Keep Transaction Category')
            ->assertJsonPath('data.category.is_active', false)
            ->assertJsonPath('data.comments', 'survives-inactivation');

        $this->assertDatabaseHas('transactions', [
            'id' => $transactionId,
            'category_id' => $categoryId,
            'comments' => 'survives-inactivation',
        ]);

        // Step 8: Reports include this transaction
        $this->getJson('/api/financial-summary?period=202601')
            ->assertOk()
            ->assertJsonFragment([
                'category_code' => 'C047',
                'category_name' => 'Keep Transaction Category',
                'total_cad' => 87.25,
            ]);

        $this->getJson('/api/category-actuals?period=202601')
            ->assertOk()
            ->assertJsonFragment([
                'category_code' => 'C047',
                'actual_cad' => 87.25,
                'transaction_count' => 1,
            ]);
    }

    public function test_update_rejects_both_flags_true(): void
    {
        $response = $this->putJson('/api/categories/C001', [
            'is_debt_category' => true,
            'is_income_category' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'A category cannot be both debt and income');
    }

    public function test_update_requires_at_least_one_field(): void
    {
        $response = $this->putJson('/api/categories/C001', []);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'At least one field must be provided');
    }

    public function test_update_returns_404_for_nonexistent_category(): void
    {
        $response = $this->putJson('/api/categories/NONEXISTENT', [
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
        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        $response = $this->deleteJson('/api/categories/C001');

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This category has associated transactions and cannot be deleted')
            ->assertJsonPath('has_transactions', true);

        $this->assertDatabaseHas('categories', ['code' => 'C001']);
    }

    public function test_delete_blocked_when_budgets_exist(): void
    {
        $category = Category::where('code', 'C001')->first();

        // Create a budget
        Budget::create([
            'category_id' => $category->id,
            'period' => '202601',
            'amount_cad' => 500.00,
        ]);

        $response = $this->deleteJson('/api/categories/C001');

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This category has associated budgets and cannot be deleted')
            ->assertJsonPath('has_budgets', true);

        $this->assertDatabaseHas('categories', ['code' => 'C001']);
    }

    public function test_delete_returns_404_for_nonexistent_category(): void
    {
        $response = $this->deleteJson('/api/categories/NONEXISTENT');

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

    public function test_show_returns_404_for_nonexistent_category(): void
    {
        $response = $this->getJson('/api/categories/NONEXISTENT');

        $response->assertNotFound();
    }

    public function test_create_validates_name_is_required(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => '',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_create_validates_name_max_length(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => str_repeat('a', 256), // 256 characters, exceeds 255 limit
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_create_validates_debt_flag_is_required(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Test Category',
            'is_income_category' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_create_validates_income_flag_is_required(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Test Category',
            'is_debt_category' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_create_response_includes_hateoas_self_link(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'HATEOAS Create Link',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'code', 'name', 'is_debt_category', 'is_income_category', 'is_active'],
                'links' => ['self'],
            ]);

        $code = $response->json('data.code');
        $self = $response->json('links.self');

        $this->assertIsString($code);
        $this->assertIsString($self);
        $this->assertNotEmpty($self);
        $this->assertStringContainsString($code, $self);
        $this->assertStringContainsString('/api/categories/'.$code, $self);
        $this->assertEquals(
            route('categories.show', $code),
            $self
        );

        $followPath = parse_url($self, PHP_URL_PATH);
        $this->assertIsString($followPath);

        $follow = $this->getJson($followPath);
        $follow->assertOk()
            ->assertJsonPath('data.code', $code)
            ->assertJsonPath('data.name', 'HATEOAS Create Link')
            ->assertJsonPath('data.id', $response->json('data.id'));
    }

    public function test_update_response_includes_hateoas_links(): void
    {
        // Create a category first
        $createResponse = $this->postJson('/api/categories', [
            'name' => 'HATEOAS Update Test',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $createResponse->assertStatus(201);
        $code = $createResponse->json('data.code');

        // Update the category
        $updateResponse = $this->putJson('/api/categories/'.$code, [
            'name' => 'HATEOAS Updated Name',
        ]);

        // Verify response structure
        $updateResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'code', 'name', 'is_debt_category', 'is_income_category', 'is_active'],
                'links' => ['self', 'index'],
            ]);

        // Verify links.self
        $self = $updateResponse->json('links.self');
        $this->assertIsString($self);
        $this->assertNotEmpty($self);
        $this->assertStringContainsString($code, $self);
        $this->assertEquals(
            route('categories.show', $code),
            $self
        );

        // Verify links.index
        $index = $updateResponse->json('links.index');
        $this->assertIsString($index);
        $this->assertNotEmpty($index);
        $this->assertEquals(
            route('categories.index'),
            $index
        );

        // Follow links.self and verify it returns the same category
        $followSelfPath = parse_url($self, PHP_URL_PATH);
        $this->assertIsString($followSelfPath);

        $followSelf = $this->getJson($followSelfPath);
        $followSelf->assertOk()
            ->assertJsonPath('data.code', $code)
            ->assertJsonPath('data.name', 'HATEOAS Updated Name')
            ->assertJsonPath('data.id', $updateResponse->json('data.id'));

        // Follow links.index and verify it returns the category list
        $followIndexPath = parse_url($index, PHP_URL_PATH);
        $this->assertIsString($followIndexPath);

        $followIndex = $this->getJson($followIndexPath);
        $followIndex->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'code', 'name'],
                ],
                'meta' => ['total'],
            ]);

        // Verify the updated category is in the list
        $categories = $followIndex->json('data');
        $found = false;
        foreach ($categories as $category) {
            if ($category['code'] === $code) {
                $found = true;
                $this->assertEquals('HATEOAS Updated Name', $category['name']);
                break;
            }
        }
        $this->assertTrue($found, "Updated category {$code} should be present in the index response");
    }

    public function test_delete_response_includes_hateoas_index_link(): void
    {
        // Create a category without dependencies
        $createResponse = $this->postJson('/api/categories', [
            'name' => 'HATEOAS Delete Test',
            'is_debt_category' => false,
            'is_income_category' => false,
        ]);

        $createResponse->assertStatus(201);
        $code = $createResponse->json('data.code');

        // Delete the category
        $deleteResponse = $this->deleteJson('/api/categories/'.$code);

        // Verify response structure
        $deleteResponse->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'links' => ['index'],
            ]);

        // Verify links.index
        $index = $deleteResponse->json('links.index');
        $this->assertIsString($index);
        $this->assertNotEmpty($index);
        $this->assertEquals(
            route('categories.index'),
            $index
        );

        // Follow links.index and verify the list endpoint works
        $followIndexPath = parse_url($index, PHP_URL_PATH);
        $this->assertIsString($followIndexPath);

        $followIndex = $this->getJson($followIndexPath);
        $followIndex->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'code', 'name'],
                ],
                'meta' => ['total'],
            ]);

        // Verify the deleted category is NOT in the list
        $categories = $followIndex->json('data');
        $found = false;
        foreach ($categories as $category) {
            if ($category['code'] === $code) {
                $found = true;
                break;
            }
        }
        $this->assertFalse($found, "Deleted category {$code} should not be present in the index response");
    }
}

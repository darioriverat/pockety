<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->category = Category::factory()->create([
            'code' => 'C001',
            'name' => 'Groceries',
            'is_active' => true,
        ]);

        $this->seedExchangeRate([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_authenticated_users_can_visit_budgets_page(): void
    {
        $response = $this->get(route('budgets'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('budgets'));
    }

    public function test_guests_are_redirected_from_budgets_page(): void
    {
        auth()->logout();

        $response = $this->get(route('budgets'));

        $response->assertRedirect(route('login'));
    }

    public function test_user_can_set_monthly_budget_for_category_and_period(): void
    {
        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_code' => 'C001',
            'amount_cad' => 800.00,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('data.amount_cad', '800.00')
            ->assertJsonPath('data.category_id', $this->category->id);

        $this->assertDatabaseHas('budgets', [
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);
    }

    public function test_user_can_update_existing_budget(): void
    {
        Budget::create([
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);

        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 900.00,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.amount_cad', '900.00');

        $this->assertEquals(1, Budget::count());
        $this->assertDatabaseHas('budgets', [
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 900.00,
        ]);
    }

    public function test_budget_amount_validation_rejects_negative(): void
    {
        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_code' => 'C001',
            'amount_cad' => -100,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount_cad'])
            ->assertJsonFragment([
                'amount_cad' => ['Budget amount must be a positive number.'],
            ]);

        $this->assertDatabaseMissing('budgets', [
            'period' => '202501',
            'category_id' => $this->category->id,
        ]);
    }

    public function test_budget_amount_validation_rejects_zero(): void
    {
        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_code' => 'C001',
            'amount_cad' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount_cad'])
            ->assertJsonFragment([
                'amount_cad' => ['Budget amount must be a positive number.'],
            ]);

        $this->assertDatabaseMissing('budgets', [
            'period' => '202501',
            'category_id' => $this->category->id,
        ]);
    }

    public function test_budget_amount_validation_accepts_positive(): void
    {
        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_code' => 'C001',
            'amount_cad' => 500.00,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('budgets', [
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 500.00,
        ]);
    }

    public function test_budget_amount_validation_accepts_small_positive(): void
    {
        $response = $this->postJson('/api/budgets', [
            'period' => '202501',
            'category_code' => 'C001',
            'amount_cad' => 0.01,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('budgets', [
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 0.01,
        ]);
    }

    public function test_can_list_budgets_for_period(): void
    {
        Budget::create([
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);

        $response = $this->getJson('/api/budgets?period=202501');

        $response->assertOk()
            ->assertJsonPath('meta.period', '202501')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.amount_cad', '800.00');
    }

    public function test_report_calculates_actual_from_transactions(): void
    {
        Budget::create([
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 400.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => 'Groceries 1',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 350.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => 'Groceries 2',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $response->assertOk();

        $row = collect($response->json('data'))->firstWhere('category_code', 'C001');

        $this->assertNotNull($row);
        $this->assertEquals(800.0, $row['budget_cad']);
        $this->assertEquals(750.0, $row['actual_cad']);
        $this->assertEquals(-50.0, $row['variance_cad']);
        $this->assertEquals(93.75, $row['percentage']);
        $this->assertFalse($row['is_over_budget']);
    }

    public function test_report_highlights_over_budget_categories(): void
    {
        Budget::create([
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 900.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => 'Overspend',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $row = collect($response->json('data'))->firstWhere('category_code', 'C001');

        $this->assertEquals(900.0, $row['actual_cad']);
        $this->assertEquals(100.0, $row['variance_cad']);
        $this->assertEquals(112.5, $row['percentage']);
        $this->assertTrue($row['is_over_budget']);
    }

    public function test_report_converts_multi_currency_actuals_to_cad(): void
    {
        Budget::create([
            'category_id' => $this->category->id,
            'period' => '202501',
            'amount_cad' => 800.00,
        ]);

        // CAD 300
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 300.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => 'CAD spend',
            'is_recurring' => false,
        ]);

        // USD 200 → 200 / 0.75 = 266.67 CAD
        Transaction::create([
            'date' => '2025-01-06',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 0,
            'amount_usd' => 200.00,
            'amount_cop' => 0,
            'comments' => 'USD spend',
            'is_recurring' => false,
        ]);

        // COP 500,000 → 500000 / 4400 * 0.75 = 85.23 CAD
        Transaction::create([
            'date' => '2025-01-07',
            'period' => '202501',
            'category_id' => $this->category->id,
            'amount_cad' => 0,
            'amount_usd' => 0,
            'amount_cop' => 500000.00,
            'comments' => 'COP spend',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $row = collect($response->json('data'))->firstWhere('category_code', 'C001');

        // 300 + (200 * 0.75) + 85.23 = 535.23; budget 800 → variance actual-budget
        $this->assertEquals(535.23, $row['actual_cad']);
        $this->assertEquals(-264.77, $row['variance_cad']);
        $this->assertFalse($row['is_over_budget']);
    }

    public function test_report_requires_period(): void
    {
        $response = $this->getJson('/api/budgets/report');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }

    public function test_budget_report_includes_all_active_categories_even_with_no_activity(): void
    {
        // Feature #28: Active categories appear even without transactions or budgets
        $activeCategory = Category::factory()->create([
            'code' => 'C002',
            'name' => 'Active No Activity',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $response->assertOk();

        $row = collect($response->json('data'))->firstWhere('category_code', 'C002');

        $this->assertNotNull($row, 'Active category should appear in report even with no activity');
        $this->assertEquals('Active No Activity', $row['category_name']);
        $this->assertNull($row['budget_cad']);
        $this->assertEquals(0.0, $row['actual_cad']);
    }

    public function test_budget_report_includes_inactive_categories_with_transactions_in_period(): void
    {
        // Feature #29: Inactive categories with transactions appear in report
        $inactiveCategory = Category::factory()->create([
            'code' => 'C003',
            'name' => 'Inactive With Transactions',
            'is_active' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $inactiveCategory->id,
            'amount_cad' => 250.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'comments' => 'Transaction on inactive category',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $response->assertOk();

        $row = collect($response->json('data'))->firstWhere('category_code', 'C003');

        $this->assertNotNull($row, 'Inactive category with transactions should appear in report');
        $this->assertEquals('Inactive With Transactions', $row['category_name']);
        $this->assertEquals(250.0, $row['actual_cad']);

        // Verify actual is counted toward report total
        $totals = $response->json('meta.totals');
        $this->assertGreaterThanOrEqual(250.0, $totals['actual_cad']);
    }

    public function test_budget_report_includes_inactive_categories_with_budgets_in_period(): void
    {
        // Feature #30: Inactive categories with budgets appear in report
        $inactiveCategory = Category::factory()->create([
            'code' => 'C004',
            'name' => 'Inactive With Budget',
            'is_active' => false,
        ]);

        Budget::create([
            'category_id' => $inactiveCategory->id,
            'period' => '202501',
            'amount_cad' => 500.00,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $response->assertOk();

        $row = collect($response->json('data'))->firstWhere('category_code', 'C004');

        $this->assertNotNull($row, 'Inactive category with budget should appear in report');
        $this->assertEquals('Inactive With Budget', $row['category_name']);
        $this->assertEquals(500.0, $row['budget_cad']);
        $this->assertEquals(0.0, $row['actual_cad']);
    }

    public function test_budget_report_omits_inactive_categories_without_activity_in_period(): void
    {
        // Inactive categories without transactions or budgets should not appear
        $inactiveCategory = Category::factory()->create([
            'code' => 'C005',
            'name' => 'Inactive No Activity',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $response->assertOk();

        $row = collect($response->json('data'))->firstWhere('category_code', 'C005');

        $this->assertNull($row, 'Inactive category without activity should not appear in report');
    }
}

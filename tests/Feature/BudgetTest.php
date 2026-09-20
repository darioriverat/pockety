<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\Category;
use App\Models\ExchangeRate;
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
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        ExchangeRate::create([
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
            'quincena' => 'Q1',
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
            'quincena' => 'Q2',
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
            'quincena' => 'Q1',
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
            'quincena' => 'Q1',
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
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 0,
            'amount_usd' => 200.00,
            'amount_cop' => 0,
            'comments' => 'USD spend',
            'is_recurring' => false,
        ]);

        // COP 500,000 → 500000 / 3000 = 166.67 CAD
        Transaction::create([
            'date' => '2025-01-07',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 0,
            'amount_usd' => 0,
            'amount_cop' => 500000.00,
            'comments' => 'COP spend',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/budgets/report?period=202501');

        $row = collect($response->json('data'))->firstWhere('category_code', 'C001');

        // 300 + 266.67 + 166.67 = 733.34
        $this->assertEquals(733.34, $row['actual_cad']);
        $this->assertEquals(-66.66, $row['variance_cad']);
        $this->assertFalse($row['is_over_budget']);
    }

    public function test_report_requires_period(): void
    {
        $response = $this->getJson('/api/budgets/report');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }
}

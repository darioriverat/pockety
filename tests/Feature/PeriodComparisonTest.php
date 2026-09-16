<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodComparisonTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Account $bank;

    private Account $loan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->groceries = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $this->bank = Account::factory()->create([
            'name' => 'RBC Checking Compare',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $this->loan = Account::factory()->create([
            'name' => 'Personal LOAN Compare',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        foreach (['202501', '202502'] as $period) {
            ExchangeRate::create([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }
    }

    public function test_authenticated_users_can_visit_period_comparison_page(): void
    {
        $response = $this->get(route('periods-compare'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('period-comparison'));
    }

    public function test_guests_are_redirected_from_period_comparison_page(): void
    {
        auth()->logout();

        $response = $this->get(route('periods-compare'));

        $response->assertRedirect();
    }

    public function test_period_comparison_requires_both_periods(): void
    {
        $this->getJson('/api/periods/compare')
            ->assertStatus(422);

        $this->getJson('/api/periods/compare?period_a=202501')
            ->assertStatus(422);

        $this->getJson('/api/periods/compare?period_b=202502')
            ->assertStatus(422);
    }

    public function test_period_comparison_returns_side_by_side_metrics_and_differences(): void
    {
        Income::create([
            'period' => '202501',
            'description' => 'Salary Jan',
            'line_number' => 1,
            'amount_cad' => 5000,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Income::create([
            'period' => '202502',
            'description' => 'Salary Feb',
            'line_number' => 1,
            'amount_cad' => 5500,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 1000,
            'comments' => 'Jan groceries',
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 800,
            'comments' => 'Feb groceries',
        ]);

        AccountBalance::create([
            'account_id' => $this->bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 10000,
        ]);
        AccountBalance::create([
            'account_id' => $this->loan->id,
            'period' => '202501',
            'recorded_balance_cad' => 4000,
        ]);

        AccountBalance::create([
            'account_id' => $this->bank->id,
            'period' => '202502',
            'recorded_balance_cad' => 12000,
        ]);
        AccountBalance::create([
            'account_id' => $this->loan->id,
            'period' => '202502',
            'recorded_balance_cad' => 3500,
        ]);

        $response = $this->getJson('/api/periods/compare?period_a=202501&period_b=202502');

        $response->assertOk()
            ->assertJsonPath('data.period_a', '202501')
            ->assertJsonPath('data.period_b', '202502')
            ->assertJsonPath('data.period_a_summary.total_income_cad', 5000)
            ->assertJsonPath('data.period_b_summary.total_income_cad', 5500)
            ->assertJsonPath('data.period_a_summary.total_expenses_cad', 1000)
            ->assertJsonPath('data.period_b_summary.total_expenses_cad', 800)
            ->assertJsonPath('data.period_a_summary.total_assets_cad', 10000)
            ->assertJsonPath('data.period_b_summary.total_assets_cad', 12000)
            ->assertJsonPath('data.period_a_summary.total_liabilities_cad', 4000)
            ->assertJsonPath('data.period_b_summary.total_liabilities_cad', 3500)
            ->assertJsonPath('meta.currency', 'CAD');

        $metrics = collect($response->json('data.metrics'))->keyBy('key');

        $this->assertSame(500.0, (float) $metrics['income']['difference_cad']);
        $this->assertSame(10.0, (float) $metrics['income']['percent_change']);
        $this->assertSame(-200.0, (float) $metrics['expenses']['difference_cad']);
        $this->assertSame(2000.0, (float) $metrics['assets']['difference_cad']);
        $this->assertSame(-500.0, (float) $metrics['liabilities']['difference_cad']);
        $this->assertSame(2500.0, (float) $metrics['equity']['difference_cad']);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

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

        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        ExchangeRate::create([
            'period' => '202502',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_authenticated_users_can_visit_periods_history_page(): void
    {
        $response = $this->get(route('periods-history'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('periods-history'));
    }

    public function test_guests_are_redirected_from_periods_history_page(): void
    {
        auth()->logout();

        $response = $this->get(route('periods-history'));

        $response->assertRedirect();
    }

    public function test_periods_history_lists_default_range_chronologically(): void
    {
        $response = $this->getJson('/api/periods/history');

        $response->assertOk()
            ->assertJsonPath('meta.period_count', 21)
            ->assertJsonPath('data.from', '202501')
            ->assertJsonPath('data.to', '202609')
            ->assertJsonPath('data.periods.0.period', '202501')
            ->assertJsonPath('data.periods.20.period', '202609');

        $periods = collect($response->json('data.periods'))->pluck('period');
        $this->assertSame($periods->sort()->values()->all(), $periods->all());
        $this->assertCount(21, $periods);
    }

    public function test_periods_history_includes_transaction_income_and_expense_stats(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 125.50,
            'comments' => 'Jan groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'amount_cad' => 74.50,
            'comments' => 'More groceries',
        ]);

        Transaction::create([
            'date' => '2025-02-05',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 40.00,
            'comments' => 'Feb groceries',
        ]);

        Income::create([
            'period' => '202501',
            'description' => 'Salary',
            'line_number' => 1,
            'amount_cad' => 5000,
            'amount_usd' => 0,
            'amount_cop' => 0,
            'notes' => null,
        ]);

        $response = $this->getJson('/api/periods/history?from=202501&to=202502');

        $response->assertOk()
            ->assertJsonPath('meta.period_count', 2)
            ->assertJsonPath('data.periods.0.period', '202501')
            ->assertJsonPath('data.periods.0.transaction_count', 2)
            ->assertJsonPath('data.periods.0.income_total_cad', 5000)
            ->assertJsonPath('data.periods.0.expenses_total_cad', 200)
            ->assertJsonPath('data.periods.1.period', '202502')
            ->assertJsonPath('data.periods.1.transaction_count', 1)
            ->assertJsonPath('data.periods.1.income_total_cad', 0)
            ->assertJsonPath('data.periods.1.expenses_total_cad', 40);
    }

    public function test_periods_history_rejects_invalid_period_format(): void
    {
        $response = $this->getJson('/api/periods/history?from=2025-01&to=202609');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['from']);
    }
}

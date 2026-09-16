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

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->actingAs(new User); // Unauthenticated
        auth()->logout();

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_displays_income_expenses_and_net()
    {
        $period = '202601';

        // Create exchange rate
        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        // Create income
        Income::create([
            'period' => $period,
            'description' => 'Salary',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        // Create category and account
        $category = Category::factory()->create(['code' => 'C001', 'name_en' => 'Groceries']);
        $account = Account::factory()->create(['type' => 'bank', 'name' => 'Test Bank']);

        // Create expense transaction
        Transaction::create([
            'date' => '2026-01-15',
            'period' => $period,
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 1500.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.period', $period)
            ->where('summary.total_income_cad', 5000)
            ->where('summary.total_expenses_cad', 1500)
            ->where('summary.net_cad', 3500)
        );
    }

    public function test_dashboard_displays_assets_liabilities_and_equity()
    {
        $period = '202601';

        // Create exchange rate
        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        // Create asset account
        $assetAccount = Account::factory()->create([
            'type' => 'bank',
            'name' => 'Checking Account',
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => $period,
            'recorded_balance_cad' => 10000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        // Create liability account
        $liabilityAccount = Account::factory()->create([
            'type' => 'liability',
            'name' => 'Credit Card',
        ]);

        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => $period,
            'recorded_balance_cad' => 2000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.period', $period)
            ->where('summary.total_assets_cad', 10000)
            ->where('summary.total_liabilities_cad', 2000)
            ->where('summary.equity_cad', 8000)
        );
    }

    public function test_dashboard_displays_reconciliation_status()
    {
        $period = '202601';

        // Create exchange rate
        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        // Create balanced account
        $balancedAccount = Account::factory()->create([
            'type' => 'bank',
            'name' => 'Balanced Account',
        ]);

        AccountBalance::create([
            'account_id' => $balancedAccount->id,
            'period' => $period,
            'recorded_balance_cad' => 1000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        // Create unbalanced account with variance
        $unbalancedAccount = Account::factory()->create([
            'type' => 'bank',
            'name' => 'Unbalanced Account',
        ]);

        AccountBalance::create([
            'account_id' => $unbalancedAccount->id,
            'period' => $period,
            'recorded_balance_cad' => 500.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        // Create a transaction that will cause variance
        $category = Category::factory()->create();
        Transaction::create([
            'date' => '2026-01-15',
            'period' => $period,
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $unbalancedAccount->id,
            'amount_cad' => 100.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.reconciliation_status', 'unbalanced')
            ->where('summary.reconciliation_summary.total_count', 2)
            ->where('summary.reconciliation_summary.unbalanced_count', 1)
        );
    }

    public function test_dashboard_defaults_to_current_period_if_not_specified()
    {
        $currentPeriod = now()->format('Ym');

        ExchangeRate::create([
            'period' => $currentPeriod,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response = $this->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.period', $currentPeriod)
        );
    }

    public function test_dashboard_uses_default_exchange_rates_if_none_exist()
    {
        $period = '202601';

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.period', $period)
        );
    }

    public function test_dashboard_includes_income_vs_expenses_chart_for_last_12_months()
    {
        $endPeriod = '202606';

        ExchangeRate::create([
            'period' => '202601',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
        ExchangeRate::create([
            'period' => '202606',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        Income::create([
            'period' => '202601',
            'description' => 'Jan salary',
            'line_number' => 1,
            'amount_cad' => 4000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Income::create([
            'period' => '202606',
            'description' => 'Jun salary',
            'line_number' => 1,
            'amount_cad' => 5500.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        $category = Category::factory()->create(['code' => 'C001']);
        $account = Account::factory()->create(['type' => 'bank']);

        Transaction::create([
            'date' => '2026-01-10',
            'period' => '202601',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 1200.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        Transaction::create([
            'date' => '2026-06-10',
            'period' => '202606',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 1800.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        $response = $this->get(route('dashboard', ['period' => $endPeriod]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('income_expense_chart.months', 12)
            ->where('income_expense_chart.from', '202507')
            ->where('income_expense_chart.to', '202606')
            ->has('income_expense_chart.periods', 12)
            ->where('income_expense_chart.periods.11.period', '202606')
            ->where('income_expense_chart.periods.11.income_cad', 5500)
            ->where('income_expense_chart.periods.11.expenses_cad', 1800)
            ->where('income_expense_chart.periods.6.period', '202601')
            ->where('income_expense_chart.periods.6.income_cad', 4000)
            ->where('income_expense_chart.periods.6.expenses_cad', 1200)
        );
    }

    public function test_dashboard_displays_assets_vs_liabilities_chart_over_time(): void
    {
        $endPeriod = '202606';

        ExchangeRate::create([
            'period' => '202601',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
        ExchangeRate::create([
            'period' => '202606',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $assetAccount = Account::factory()->create([
            'type' => 'bank',
            'name' => 'Chart Asset Account',
        ]);
        $liabilityAccount = Account::factory()->create([
            'type' => 'liability',
            'name' => 'Chart Liability Account',
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202601',
            'recorded_balance_cad' => 10000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);
        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => '202601',
            'recorded_balance_cad' => 2000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202606',
            'recorded_balance_cad' => 15000.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);
        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => '202606',
            'recorded_balance_cad' => 3500.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $response = $this->get(route('dashboard', ['period' => $endPeriod]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('assets_liabilities_chart.months', 12)
            ->where('assets_liabilities_chart.from', '202507')
            ->where('assets_liabilities_chart.to', '202606')
            ->has('assets_liabilities_chart.periods', 12)
            ->where('assets_liabilities_chart.periods.11.period', '202606')
            ->where('assets_liabilities_chart.periods.11.assets_cad', 15000)
            ->where('assets_liabilities_chart.periods.11.liabilities_cad', 3500)
            ->where('assets_liabilities_chart.periods.11.equity_cad', 11500)
            ->where('assets_liabilities_chart.periods.6.period', '202601')
            ->where('assets_liabilities_chart.periods.6.assets_cad', 10000)
            ->where('assets_liabilities_chart.periods.6.liabilities_cad', 2000)
            ->where('assets_liabilities_chart.periods.6.equity_cad', 8000)
        );
    }

    public function test_dashboard_displays_top_spending_categories_for_current_period(): void
    {
        $period = '202601';

        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $account = Account::factory()->create(['type' => 'bank']);

        $c001 = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
        ]);
        $c006 = Category::factory()->create([
            'code' => 'C006',
            'name_es' => 'COMIDAS CALLE',
            'name_en' => 'Dining Out',
        ]);
        $c004 = Category::factory()->create([
            'code' => 'C004',
            'name_es' => 'TRANSPORTES',
            'name_en' => 'Transportation',
        ]);
        $c008 = Category::factory()->create([
            'code' => 'C008',
            'name_es' => 'SERVICIOS',
            'name_en' => 'Utilities',
        ]);
        $c005 = Category::factory()->create([
            'code' => 'C005',
            'name_es' => 'HOGAR',
            'name_en' => 'Household',
        ]);
        $c007 = Category::factory()->create([
            'code' => 'C007',
            'name_es' => 'JUGUETES NIÑAS',
            'name_en' => "Kids' Toys",
        ]);

        $spendByCategory = [
            [$c001, 800.00],
            [$c006, 500.00],
            [$c004, 350.00],
            [$c008, 250.00],
            [$c005, 100.00],
            [$c007, 50.00],
        ];

        foreach ($spendByCategory as [$category, $amount]) {
            Transaction::create([
                'date' => '2026-01-15',
                'period' => $period,
                'quincena' => 'Q1',
                'category_id' => $category->id,
                'account_id' => $account->id,
                'amount_cad' => $amount,
                'amount_usd' => null,
                'amount_cop' => null,
            ]);
        }

        // Other-period spend must not appear in this period's top list
        Transaction::create([
            'date' => '2026-02-15',
            'period' => '202602',
            'quincena' => 'Q1',
            'category_id' => $c001->id,
            'account_id' => $account->id,
            'amount_cad' => 9999.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('top_spending_categories.period', $period)
            ->where('top_spending_categories.limit', 10)
            ->where('top_spending_categories.total_expenses_cad', 2050)
            ->has('top_spending_categories.categories', 6)
            ->where('top_spending_categories.categories.0.category_code', 'C001')
            ->where('top_spending_categories.categories.0.amount_cad', 800)
            ->where('top_spending_categories.categories.0.percentage', 39)
            ->where('top_spending_categories.categories.1.category_code', 'C006')
            ->where('top_spending_categories.categories.1.amount_cad', 500)
            ->where('top_spending_categories.categories.2.category_code', 'C004')
            ->where('top_spending_categories.categories.5.category_code', 'C007')
            ->where('top_spending_categories.categories.5.amount_cad', 50)
        );
    }

    public function test_dashboard_displays_recent_activity_feed(): void
    {
        $period = '202601';

        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $account = Account::factory()->create([
            'type' => 'bank',
            'name' => 'RBC Chequing',
        ]);
        $category = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
        ]);

        $older = Transaction::create([
            'date' => '2026-01-10',
            'period' => $period,
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 20.00,
            'amount_usd' => null,
            'amount_cop' => null,
            'comments' => 'Older activity',
        ]);

        $newer = Transaction::create([
            'date' => '2026-01-22',
            'period' => $period,
            'quincena' => 'Q2',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 55.25,
            'amount_usd' => null,
            'amount_cop' => null,
            'comments' => 'Recent activity seed',
        ]);

        $income = Income::create([
            'period' => $period,
            'description' => 'Salary',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('recent_activity.limit', 15)
            ->has('recent_activity.items', 3)
            ->where('recent_activity.items', function ($items) use ($newer, $older, $income) {
                $byKey = collect($items)->keyBy(fn ($item) => $item['type'].'-'.$item['id']);

                return $byKey->has('expense-'.$newer->id)
                    && $byKey->has('expense-'.$older->id)
                    && $byKey->has('income-'.$income->id)
                    && str_contains((string) $byKey['expense-'.$newer->id]['summary'], 'Recent activity seed')
                    && $byKey['expense-'.$newer->id]['date'] === '2026-01-22'
                    && $byKey['expense-'.$newer->id]['detail_url'] === '/transactions?period=202601&highlight='.$newer->id
                    && $byKey['income-'.$income->id]['type'] === 'income'
                    && $byKey['income-'.$income->id]['summary'] === 'Salary'
                    && $byKey['income-'.$income->id]['detail_url'] === '/income';
            })
        );
    }

    public function test_dashboard_recent_activity_respects_limit_between_10_and_20(): void
    {
        $period = '202601';
        $account = Account::factory()->create(['type' => 'bank']);
        $category = Category::factory()->create(['code' => 'C001']);

        for ($i = 1; $i <= 25; $i++) {
            Transaction::create([
                'date' => sprintf('2026-01-%02d', min($i, 28)),
                'period' => $period,
                'quincena' => $i <= 15 ? 'Q1' : 'Q2',
                'category_id' => $category->id,
                'account_id' => $account->id,
                'amount_cad' => 10 + $i,
                'amount_usd' => null,
                'amount_cop' => null,
                'comments' => "Activity item {$i}",
            ]);
        }

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('recent_activity.limit', 15)
            ->has('recent_activity.items', 15)
        );
    }

    public function test_dashboard_includes_default_currency_and_multi_currency_amounts(): void
    {
        $period = '202601';
        $this->user->update(['default_currency' => 'USD']);

        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        Income::create([
            'period' => $period,
            'description' => 'Salary',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        $response = $this->get(route('dashboard', ['period' => $period]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('default_currency', 'USD')
            ->where('display_currency', 'USD')
            ->where('available_currencies', ['CAD', 'USD', 'COP'])
            ->where('summary.total_income_cad', 5000)
            ->where('summary.total_income_usd', 6666.67)
            ->where('summary.total_income_cop', 15000000)
            ->has('summary.exchange_rates')
        );
    }

    public function test_dashboard_currency_query_overrides_default_display_currency(): void
    {
        $this->user->update(['default_currency' => 'CAD']);

        $response = $this->get(route('dashboard', ['currency' => 'COP']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('default_currency', 'CAD')
            ->where('display_currency', 'COP')
        );
    }
}

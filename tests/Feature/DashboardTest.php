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
            ->where('summary.total_income_cad', 5000.00)
            ->where('summary.total_expenses_cad', 1500.00)
            ->where('summary.net_cad', 3500.00)
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
            ->where('summary.total_assets_cad', 10000.00)
            ->where('summary.total_liabilities_cad', 2000.00)
            ->where('summary.equity_cad', 8000.00)
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
}

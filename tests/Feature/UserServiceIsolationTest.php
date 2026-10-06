<?php

namespace Tests\Feature;

use App\Actions\Fortify\CreateNewUser;
use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Domain\Services\Contracts\AvailablePeriodServiceInterface;
use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Domain\Services\Contracts\PeriodBalanceServiceInterface;
use App\Domain\Services\Contracts\SearchServiceInterface;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Budget;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use App\Models\HistoricalBalanceSheet;
use App\Models\Income;
use App\Models\PeriodBalance;
use App\Models\PeriodBalanceHistory;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BalanceSheetImportService;
use App\Services\BalanceSheetService;
use App\Services\BudgetService;
use App\Services\CategoryActualsService;
use App\Services\DashboardService;
use App\Services\FinancialSummaryService;
use App\Services\TransactionImportService;
use App\Support\CategoryTemplate;
use Database\Seeders\BrowserTestSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class UserServiceIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;

    private User $userB;

    private Category $categoryA;

    private Category $categoryB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userA = User::factory()->create(['email' => 'owner-a@example.com']);
        $this->userB = User::factory()->create(['email' => 'owner-b@example.com']);

        CategoryTemplate::seedForUser((int) $this->userA->id);
        CategoryTemplate::seedForUser((int) $this->userB->id);

        $this->categoryA = Category::query()
            ->forUser((int) $this->userA->id)
            ->where('code', 'C001')
            ->firstOrFail();
        $this->categoryB = Category::query()
            ->forUser((int) $this->userB->id)
            ->where('code', 'C001')
            ->firstOrFail();
    }

    public function test_transaction_service_scopes_queries_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        $txA = app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-10',
            'period' => '202601',
            'category_id' => $this->categoryA->id,
            'amount_cad' => 11.11,
            'comments' => 'user-a-tx',
        ]);

        $this->actingAs($this->userB);
        $txB = app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-11',
            'period' => '202601',
            'category_id' => $this->categoryB->id,
            'amount_cad' => 22.22,
            'comments' => 'user-b-tx',
        ]);

        $this->actingAs($this->userA);
        $forA = app(TransactionServiceInterface::class)->getAll(['period' => '202601']);
        $idsA = collect($forA)->pluck('id')->all();
        $this->assertContains($txA->id, $idsA);
        $this->assertNotContains($txB->id, $idsA);

        $this->actingAs($this->userB);
        $forB = app(TransactionServiceInterface::class)->getAll(['period' => '202601']);
        $idsB = collect($forB)->pluck('id')->all();
        $this->assertContains($txB->id, $idsB);
        $this->assertNotContains($txA->id, $idsB);

        $this->actingAs($this->userA);
        $this->getJson('/api/transactions/'.$txB->id)->assertNotFound();
    }

    public function test_account_service_scopes_accounts_and_balances(): void
    {
        $this->actingAs($this->userA);
        $accountA = app(AccountServiceInterface::class)->create([
            'name' => 'A Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        AccountBalance::factory()->create([
            'user_id' => $this->userA->id,
            'account_id' => $accountA->id,
            'period' => '202601',
            'recorded_balance_cad' => 100,
        ]);

        $this->actingAs($this->userB);
        $accountB = app(AccountServiceInterface::class)->create([
            'name' => 'B Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        AccountBalance::factory()->create([
            'user_id' => $this->userB->id,
            'account_id' => $accountB->id,
            'period' => '202601',
            'recorded_balance_cad' => 200,
        ]);

        $this->actingAs($this->userA);
        $accounts = app(AccountServiceInterface::class)->getAll();
        $names = collect($accounts)->pluck('name')->all();
        $this->assertContains('A Checking', $names);
        $this->assertNotContains('B Checking', $names);

        $balances = $this->getJson('/api/accounts/'.$accountA->id.'/balances')->assertOk()->json('data');
        $this->assertCount(1, $balances);
        $this->assertSame(100.0, (float) $balances[0]['recorded_balance_cad']);

        $this->getJson('/api/accounts/'.$accountB->id)->assertNotFound();
        $this->getJson('/api/accounts/'.$accountB->id.'/balances')->assertNotFound();
    }

    public function test_budget_service_scopes_budgets_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        app(BudgetService::class)->upsert((int) $this->categoryA->id, '202601', 50, 'a-budget');

        $this->actingAs($this->userB);
        app(BudgetService::class)->upsert((int) $this->categoryB->id, '202601', 75, 'b-budget');

        $this->actingAs($this->userA);
        $forA = app(BudgetService::class)->listForPeriod('202601');
        $this->assertCount(1, $forA);
        $this->assertSame('a-budget', $forA->first()->notes);

        $this->actingAs($this->userB);
        $forB = app(BudgetService::class)->listForPeriod('202601');
        $this->assertCount(1, $forB);
        $this->assertSame('b-budget', $forB->first()->notes);
    }

    public function test_income_service_max_lines_is_per_user_period(): void
    {
        $this->actingAs($this->userA);
        $income = app(IncomeServiceInterface::class);
        for ($i = 1; $i <= 6; $i++) {
            $income->create([
                'period' => '202601',
                'description' => "A line {$i}",
                'amount_cad' => 10 * $i,
            ]);
        }

        try {
            $income->create([
                'period' => '202601',
                'description' => 'A line 7',
                'amount_cad' => 70,
            ]);
            $this->fail('Expected ValidationException for 7th income line');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('period', $e->errors());
        }

        $this->actingAs($this->userB);
        $incomeB = app(IncomeServiceInterface::class);
        for ($i = 1; $i <= 6; $i++) {
            $incomeB->create([
                'period' => '202601',
                'description' => "B line {$i}",
                'amount_cad' => 20 * $i,
            ]);
        }

        $this->assertCount(6, $incomeB->getForPeriod('202601'));
        $this->assertSame(6, Income::query()->forUser((int) $this->userA->id)->forPeriod('202601')->count());
        $this->assertSame(6, Income::query()->forUser((int) $this->userB->id)->forPeriod('202601')->count());
    }

    public function test_exchange_rates_are_scoped_and_unique_per_user_period(): void
    {
        $this->seedExchangeRate([
            'user_id' => $this->userA->id,
            'period' => '202601',
            'usd_cop' => 4000,
            'usd_cad' => 0.7,
        ]);
        $this->seedExchangeRate([
            'user_id' => $this->userB->id,
            'period' => '202601',
            'usd_cop' => 4500,
            'usd_cad' => 0.8,
        ]);

        $this->actingAs($this->userA);
        $rateA = ExchangeRate::forPeriod('202601');
        $this->assertNotNull($rateA);
        $this->assertSame(4000.0, (float) $rateA->usd_cop);

        $indexA = $this->getJson('/api/exchange-rates')->assertOk()->json('data');
        $this->assertCount(1, $indexA);
        $this->assertSame(4000.0, (float) $indexA[0]['usd_cop']);

        $this->actingAs($this->userB);
        $rateB = ExchangeRate::forPeriod('202601');
        $this->assertNotNull($rateB);
        $this->assertSame(4500.0, (float) $rateB->usd_cop);
    }

    public function test_fixed_assets_and_valuations_are_scoped(): void
    {
        $assetA = FixedAsset::factory()->create([
            'user_id' => $this->userA->id,
            'name' => 'A Car',
        ]);
        FixedAssetValuation::factory()->create([
            'user_id' => $this->userA->id,
            'fixed_asset_id' => $assetA->id,
            'period' => '202601',
            'book_value_cad' => 1000,
        ]);

        $assetB = FixedAsset::factory()->create([
            'user_id' => $this->userB->id,
            'name' => 'B Bike',
        ]);
        FixedAssetValuation::factory()->create([
            'user_id' => $this->userB->id,
            'fixed_asset_id' => $assetB->id,
            'period' => '202601',
            'book_value_cad' => 2000,
        ]);

        $this->actingAs($this->userA);
        $assets = $this->getJson('/api/fixed-assets')->assertOk()->json('data');
        $names = collect($assets)->pluck('name')->all();
        $this->assertContains('A Car', $names);
        $this->assertNotContains('B Bike', $names);

        $valuations = $this->getJson('/api/fixed-assets/'.$assetA->id.'/valuations')->assertOk()->json('data');
        $this->assertCount(1, $valuations);
        $this->assertSame(1000.0, (float) $valuations[0]['book_value_cad']);

        $this->getJson('/api/fixed-assets/'.$assetB->id)->assertNotFound();
    }

    public function test_period_balance_service_scopes_balances_and_histories(): void
    {
        PeriodBalance::factory()->create([
            'user_id' => $this->userA->id,
            'period' => '202601',
            'assets_cad' => 111,
        ]);
        PeriodBalanceHistory::factory()->create([
            'user_id' => $this->userA->id,
            'period' => '202601',
            'assets_cad' => 100,
        ]);
        PeriodBalance::factory()->create([
            'user_id' => $this->userB->id,
            'period' => '202601',
            'assets_cad' => 222,
        ]);
        PeriodBalanceHistory::factory()->create([
            'user_id' => $this->userB->id,
            'period' => '202601',
            'assets_cad' => 200,
        ]);

        $this->actingAs($this->userA);
        $registered = app(PeriodBalanceServiceInterface::class)->findRegistered('202601');
        $this->assertNotNull($registered);
        $this->assertSame(111.0, $registered->assetsCad);

        $history = app(PeriodBalanceServiceInterface::class)->historyForPeriod('202601');
        $this->assertCount(1, $history);
        $this->assertSame(100.0, $history->first()->assetsCad);

        $this->actingAs($this->userB);
        $registeredB = app(PeriodBalanceServiceInterface::class)->findRegistered('202601');
        $this->assertNotNull($registeredB);
        $this->assertSame(222.0, $registeredB->assetsCad);
    }

    public function test_historical_balance_sheets_are_scoped_per_user(): void
    {
        HistoricalBalanceSheet::factory()->create([
            'user_id' => $this->userA->id,
            'period' => '202601',
            'assets_cad' => 500,
        ]);
        HistoricalBalanceSheet::factory()->create([
            'user_id' => $this->userB->id,
            'period' => '202601',
            'assets_cad' => 900,
        ]);

        $this->actingAs($this->userA);
        $sheet = HistoricalBalanceSheet::forPeriod('202601');
        $this->assertNotNull($sheet);
        $this->assertSame(500.0, (float) $sheet->assets_cad);

        $stats = app(BalanceSheetImportService::class)->getImportStatistics();
        $this->assertSame(1, $stats['total']);
        $this->assertSame(500.0, (float) $stats['snapshots'][0]['assets_cad']);

        $this->actingAs($this->userB);
        $sheetB = HistoricalBalanceSheet::forPeriod('202601');
        $this->assertNotNull($sheetB);
        $this->assertSame(900.0, (float) $sheetB->assets_cad);
    }

    public function test_available_period_service_scopes_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-05',
            'period' => '202601',
            'category_id' => $this->categoryA->id,
            'amount_cad' => 5,
            'comments' => 'a-period',
        ]);

        $this->actingAs($this->userB);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-02-05',
            'period' => '202602',
            'category_id' => $this->categoryB->id,
            'amount_cad' => 6,
            'comments' => 'b-period',
        ]);

        $this->travelTo('2026-01-20 12:00:00');
        $this->actingAs($this->userA);
        $periodsA = app(AvailablePeriodServiceInterface::class)->selectable();
        $this->assertSame(['202601'], $periodsA);

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('availablePeriods', ['202601'])
        );

        $this->travelTo('2026-02-20 12:00:00');
        $this->actingAs($this->userB);
        $periodsB = app(AvailablePeriodServiceInterface::class)->selectable();
        $this->assertSame(['202602'], $periodsB);
        $this->assertNotContains('202601', $periodsB);

        $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('availablePeriods', ['202602'])
        );

        $this->travelBack();
    }

    public function test_financial_summary_scopes_hardcoded_codes_and_data(): void
    {
        $depA = Category::query()->forUser((int) $this->userA->id)->where('code', 'C045')->firstOrFail();
        $depB = Category::query()->forUser((int) $this->userB->id)->where('code', 'C045')->firstOrFail();

        $this->actingAs($this->userA);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-12',
            'period' => '202601',
            'category_id' => $depA->id,
            'amount_cad' => 40,
            'comments' => 'a-depreciation',
        ]);

        $this->actingAs($this->userB);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-13',
            'period' => '202601',
            'category_id' => $depB->id,
            'amount_cad' => 90,
            'comments' => 'b-depreciation',
        ]);

        $this->actingAs($this->userA);
        $summaryA = app(FinancialSummaryService::class)->getSummary('202601');
        $this->assertSame(40.0, (float) $summaryA['depreciation_excluded_cad']);

        $this->actingAs($this->userB);
        $summaryB = app(FinancialSummaryService::class)->getSummary('202601');
        $this->assertSame(90.0, (float) $summaryB['depreciation_excluded_cad']);
    }

    public function test_dashboard_and_search_scope_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        app(AccountServiceInterface::class)->create([
            'name' => 'UniqueAlphaAccount',
            'type' => 'bank',
        ]);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-08',
            'period' => '202601',
            'category_id' => $this->categoryA->id,
            'amount_cad' => 33,
            'comments' => 'UniqueAlphaTxn',
        ]);

        $this->actingAs($this->userB);
        app(AccountServiceInterface::class)->create([
            'name' => 'UniqueBetaAccount',
            'type' => 'bank',
        ]);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-09',
            'period' => '202601',
            'category_id' => $this->categoryB->id,
            'amount_cad' => 44,
            'comments' => 'UniqueBetaTxn',
        ]);

        $this->actingAs($this->userA);
        $dashboard = app(DashboardService::class)->getSummary('202601');
        $this->assertSame(33.0, (float) $dashboard['total_expenses_cad']);

        $searchA = app(SearchServiceInterface::class)->search('UniqueAlpha');
        $this->assertGreaterThanOrEqual(1, $searchA->accounts->count() + $searchA->transactions->count());
        $searchLeak = app(SearchServiceInterface::class)->search('UniqueBeta');
        $this->assertSame(0, $searchLeak->accounts->count());
        $this->assertSame(0, $searchLeak->transactions->count());

        $this->actingAs($this->userB);
        $dashboardB = app(DashboardService::class)->getSummary('202601');
        $this->assertSame(44.0, (float) $dashboardB['total_expenses_cad']);
    }

    public function test_factories_set_user_id_on_financial_models(): void
    {
        $this->actingAs($this->userA);

        $category = Category::factory()->create();
        $account = Account::factory()->create();
        $transaction = Transaction::factory()->create();
        $budget = Budget::factory()->create();
        $income = Income::factory()->create();
        $rate = ExchangeRate::factory()->create(['period' => '202603']);
        $balance = AccountBalance::factory()->create(['period' => '202603']);
        $periodBalance = PeriodBalance::factory()->create(['period' => '202603']);
        $history = PeriodBalanceHistory::factory()->create(['period' => '202603']);
        $sheet = HistoricalBalanceSheet::factory()->create(['period' => '202603']);
        $asset = FixedAsset::factory()->create();
        $valuation = FixedAssetValuation::factory()->create([
            'fixed_asset_id' => $asset->id,
            'period' => '202603',
        ]);

        foreach ([
            $category, $account, $transaction, $budget, $income, $rate,
            $balance, $periodBalance, $history, $sheet, $asset, $valuation,
        ] as $model) {
            $this->assertSame((int) $this->userA->id, (int) $model->user_id);
        }
    }

    public function test_import_scopes_transactions_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        $result = app(TransactionImportService::class)->importTransactions([
            [
                'fecha' => '2026-01-07',
                'periodo' => '202601',
                'concepto_code' => 'C001',
                'cad' => ['value' => 15.5],
                'usd' => ['value' => null],
                'cop' => ['value' => null],
                'comentarios' => 'imported-for-a',
            ],
        ]);

        $this->assertSame(1, $result['imported']);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->userA->id,
            'comments' => 'imported-for-a',
        ]);

        $this->actingAs($this->userB);
        $visible = app(TransactionServiceInterface::class)->getAll([
            'period' => '202601',
            'search' => 'imported-for-a',
        ]);
        $this->assertCount(0, $visible);
    }

    public function test_reports_scope_to_authenticated_user(): void
    {
        $this->actingAs($this->userA);
        $accountA = app(AccountServiceInterface::class)->create([
            'name' => 'Report A Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        AccountBalance::factory()->create([
            'user_id' => $this->userA->id,
            'account_id' => $accountA->id,
            'period' => '202601',
            'recorded_balance_cad' => 250,
        ]);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-14',
            'period' => '202601',
            'category_id' => $this->categoryA->id,
            'amount_cad' => 18,
            'comments' => 'report-a',
        ]);
        app(BudgetService::class)->upsert((int) $this->categoryA->id, '202601', 40);

        $this->actingAs($this->userB);
        $accountB = app(AccountServiceInterface::class)->create([
            'name' => 'Report B Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        AccountBalance::factory()->create([
            'user_id' => $this->userB->id,
            'account_id' => $accountB->id,
            'period' => '202601',
            'recorded_balance_cad' => 900,
        ]);
        app(TransactionServiceInterface::class)->create([
            'date' => '2026-01-14',
            'period' => '202601',
            'category_id' => $this->categoryB->id,
            'amount_cad' => 77,
            'comments' => 'report-b',
        ]);
        app(BudgetService::class)->upsert((int) $this->categoryB->id, '202601', 120);

        $this->actingAs($this->userA);
        $sheet = app(BalanceSheetService::class)->getBalanceSheet('202601');
        $this->assertSame(250.0, (float) $sheet['total_assets']['cad']);

        $actuals = app(CategoryActualsService::class)->getReport('202601');
        $row = $actuals->findByCode('C001');
        $this->assertNotNull($row);
        $this->assertSame(18.0, $row->actualCad);

        $budgetReport = app(BudgetService::class)->getBudgetVsActualReport('202601');
        $budgetRow = collect($budgetReport['rows'])->firstWhere('category_code', 'C001');
        $this->assertNotNull($budgetRow);
        $this->assertSame(40.0, (float) $budgetRow['budget_cad']);
        $this->assertSame(18.0, (float) $budgetRow['actual_cad']);
    }

    public function test_browser_test_seeder_assigns_template_to_browser_user(): void
    {
        $this->seed(BrowserTestSeeder::class);

        $user = User::query()->where('email', 'test@example.com')->firstOrFail();
        $this->assertSame(
            46,
            Category::query()->forUser((int) $user->id)->where('is_active', true)->count()
        );
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'code' => 'C040',
            'is_active' => false,
        ]);
    }

    public function test_two_user_isolation_allows_duplicate_category_names_and_template_on_register(): void
    {
        $this->actingAs($this->userA);
        $this->postJson('/api/categories', [
            'name' => 'Custom Expense A',
            'is_debt_category' => false,
            'is_income_category' => false,
        ])->assertCreated();

        $this->actingAs($this->userB);
        $this->postJson('/api/categories', [
            'name' => 'Custom Expense A',
            'is_debt_category' => false,
            'is_income_category' => false,
        ])->assertCreated();

        $this->assertSame(
            2,
            Category::query()->where('name', 'Custom Expense A')->count()
        );

        $action = app(CreateNewUser::class);
        $userC = $action->create([
            'name' => 'User C',
            'email' => 'owner-c-'.uniqid().'@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ]);

        $this->actingAs($userC);
        $all = $this->getJson('/api/categories?include_inactive=1')->assertOk()->json('data');
        $codes = collect($all)->pluck('code')->all();
        $this->assertContains('C040', $codes);
        $this->assertContains('I01', $codes);
        $c040 = collect($all)->firstWhere('code', 'C040');
        $this->assertFalse((bool) $c040['is_active']);
        $this->assertSame('retired_merged_into_C031', $c040['status']);
        $this->assertSame(
            46,
            Category::query()->forUser((int) $userC->id)->where('is_active', true)->count()
        );
        // userC gets the template, not userA or userB's custom categories
        $this->assertTrue(collect($all)->contains(fn ($row) => $row['name'] === 'Groceries'));
        $this->assertFalse(collect($all)->contains(fn ($row) => $row['name'] === 'Custom Expense A'));
    }
}

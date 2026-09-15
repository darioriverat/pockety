<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\ExchangeRate;
use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BalanceSheetTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_authenticated_users_can_visit_balance_sheet_page(): void
    {
        $response = $this->get(route('balance-sheet'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('balance-sheet'));
    }

    public function test_guests_are_redirected_from_balance_sheet_page(): void
    {
        auth()->logout();

        $response = $this->get(route('balance-sheet'));

        $response->assertRedirect(route('login'));
    }

    public function test_total_assets_sums_accounts_investments_receivables_and_fixed_assets(): void
    {
        $bank = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        $investment = Account::factory()->create([
            'name' => 'TD Brokerage',
            'type' => 'investment',
            'primary_currency' => 'CAD',
        ]);
        $receivable = Account::factory()->create([
            'name' => 'Loan to Diana',
            'type' => 'receivable',
            'primary_currency' => 'CAD',
        ]);

        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000.00,
        ]);
        AccountBalance::create([
            'account_id' => $investment->id,
            'period' => '202501',
            'recorded_balance_cad' => 5000.00,
        ]);
        AccountBalance::create([
            'account_id' => $receivable->id,
            'period' => '202501',
            'recorded_balance_cad' => 250.00,
        ]);

        $fixedAsset = FixedAsset::create([
            'name' => 'Ford Escape',
            'initial_value_cad' => 25000.00,
            'is_active' => true,
        ]);
        FixedAssetValuation::create([
            'fixed_asset_id' => $fixedAsset->id,
            'period' => '202501',
            'book_value_cad' => 25000.00,
        ]);

        $response = $this->getJson('/api/balance-sheet?period=202501');

        $response->assertOk();
        $response->assertJsonPath('data.total_assets.cad', 31250);
        $response->assertJsonPath('data.total_assets.accounts_cad', 6250);
        $response->assertJsonPath('data.total_assets.fixed_assets_cad', 25000);
    }

    public function test_total_liabilities_sums_credit_cards_and_loans(): void
    {
        $card = Account::factory()->create([
            'name' => 'CIBC Visa',
            'type' => 'liability',
            'primary_currency' => 'CAD',
        ]);
        $loan = Account::factory()->create([
            'name' => 'Personal LOAN CIBC',
            'type' => 'liability',
            'primary_currency' => 'CAD',
        ]);

        AccountBalance::create([
            'account_id' => $card->id,
            'period' => '202501',
            'recorded_balance_cad' => 1200.00,
        ]);
        AccountBalance::create([
            'account_id' => $loan->id,
            'period' => '202501',
            'recorded_balance_cad' => 18000.00,
        ]);

        $response = $this->getJson('/api/balance-sheet?period=202501');

        $response->assertOk();
        $response->assertJsonPath('data.total_liabilities.cad', 19200);
    }

    public function test_equity_equals_assets_minus_liabilities(): void
    {
        $bank = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        $loan = Account::factory()->create([
            'name' => 'Personal LOAN CIBC',
            'type' => 'liability',
            'primary_currency' => 'CAD',
        ]);

        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 10000.00,
        ]);
        AccountBalance::create([
            'account_id' => $loan->id,
            'period' => '202501',
            'recorded_balance_cad' => 4000.00,
        ]);

        $response = $this->getJson('/api/balance-sheet?period=202501');

        $response->assertOk();
        $response->assertJsonPath('data.total_assets.cad', 10000);
        $response->assertJsonPath('data.total_liabilities.cad', 4000);
        $response->assertJsonPath('data.equity.cad', 6000);
    }

    public function test_balance_sheet_includes_cad_usd_and_cop_equivalents(): void
    {
        $bank = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 750.00,
        ]);

        $response = $this->getJson('/api/periods/202501/balance-sheet');

        $response->assertOk();
        // CAD 750 / 0.75 USD/CAD = USD 1000
        $response->assertJsonPath('data.total_assets.cad', 750);
        $response->assertJsonPath('data.total_assets.usd', 1000);
        // CAD 750 * 3000 = COP 2,250,000
        $response->assertJsonPath('data.total_assets.cop', 2250000);
        $response->assertJsonPath('data.equity.cad', 750);
        $response->assertJsonPath('data.equity.usd', 1000);
        $response->assertJsonPath('data.equity.cop', 2250000);
        $response->assertJsonPath('data.exchange_rates.usd_cad', 0.75);
        $response->assertJsonPath('data.exchange_rates.cad_cop', 3000);
    }

    public function test_multi_currency_account_balances_convert_to_cad(): void
    {
        $wise = Account::factory()->create([
            'name' => 'Wise USD',
            'type' => 'bank',
            'primary_currency' => 'USD',
        ]);
        AccountBalance::create([
            'account_id' => $wise->id,
            'period' => '202501',
            'recorded_balance_usd' => 100.00,
        ]);

        $response = $this->getJson('/api/balance-sheet?period=202501');

        $response->assertOk();
        // 100 USD * 0.75 = 75 CAD
        $response->assertJsonPath('data.total_assets.cad', 75);
    }

    public function test_period_query_is_required_for_query_string_endpoint(): void
    {
        $response = $this->getJson('/api/balance-sheet');

        $response->assertStatus(422);
    }
}

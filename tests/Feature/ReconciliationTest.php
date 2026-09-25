<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use App\Models\Income;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconciliationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reconciliation_endpoint_computes_expected_balance_from_transactions(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 100,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();
        $response->assertJsonPath('data.period', '202501');

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertNotNull($accountData);
        $this->assertEquals(1000, $accountData['recorded']['cad']);
        $this->assertEquals(1000, $accountData['initial']['cad']);
        $this->assertEquals(900, $accountData['computed']['cad']);
        $this->assertEquals(100, $accountData['variance']['cad']);
        $this->assertFalse($accountData['is_balanced']);

        $check = $response->json('data.records_check');
        $this->assertEquals(0, $check['income_cad']);
        $this->assertEquals(100, $check['net_operating_expenses_cad']);
        $this->assertEquals(100, $check['assets_difference_cad']);
        $this->assertEquals(0, $check['liabilities_difference_cad']);
        $this->assertEquals(0, $check['down_payments_cad']);
        $this->assertEquals(0, $check['interest_cad']);
        $this->assertEquals(0, $check['debt_payments_cad']);
        // 0 − 100 + 100 − 0 + 0 + 0 − 0 = 0
        $this->assertEquals(0, $check['result_cad']);
        $this->assertTrue($check['is_balanced']);
    }

    public function test_reconciliation_rolls_forward_from_prior_period_balance(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 900,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202502',
            'recorded_balance_cad' => 850,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 50,
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertEquals(850, $accountData['recorded']['cad']);
        $this->assertEquals(900, $accountData['initial']['cad']);
        $this->assertEquals(850, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
        $this->assertEquals('balanced', $response->json('data.status'));
    }

    public function test_reconciliation_adds_income_and_omits_debt_on_asset_accounts(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Income Debt Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $expenseCategory = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
        ]);

        $incomeCategory = Category::factory()->income()->create([
            'code' => 'I02',
            'name_es' => 'SALARIO',
            'name_en' => 'Salary',
        ]);

        $debtCategory = Category::factory()->debt()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $expenseCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 100,
        ]);

        Transaction::create([
            'date' => '2025-01-12',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $incomeCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 500,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $debtCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 200,
            'debt_component' => 'principal',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $debtCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 50,
            'debt_component' => 'interest',
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        // 1000 - 100 spend + 500 income = 1400 (principal and interest omitted on assets)
        $this->assertEquals(1000, $accountData['recorded']['cad']);
        $this->assertEquals(1400, $accountData['computed']['cad']);
        $this->assertEquals(-400, $accountData['variance']['cad']);
        $this->assertFalse($accountData['is_balanced']);
    }

    public function test_reconciliation_omits_debt_interest_from_computed_balance(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Interest Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $debtCategory = Category::factory()->debt()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $debtCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 50,
            'debt_component' => 'interest',
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertEquals(1000, $accountData['recorded']['cad']);
        $this->assertEquals(1000, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
    }

    public function test_liability_reconciliation_adds_charges_and_subtracts_principal(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'CIBC Visa',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $expenseCategory = Category::factory()->create([
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
        ]);

        $debtCategory = Category::factory()->debt()->create([
            'name_es' => 'CREDITO VISA',
            'name_en' => 'Visa Payment',
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202502',
            'recorded_balance_cad' => 900,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $expenseCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 100,
            'comments' => 'card-charge',
        ]);

        Transaction::create([
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $debtCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 200,
            'debt_component' => 'principal',
            'comments' => 'down-payment',
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        // 1000 + 100 charge - 200 principal = 900
        $this->assertEquals(900, $accountData['recorded']['cad']);
        $this->assertEquals(900, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
        $this->assertTrue($accountData['is_liability']);
    }

    public function test_reconciliation_rejects_invalid_period_format(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->getJson('/api/periods/abc123/reconciliation');

        $response->assertStatus(422);
    }

    public function test_reconciliation_includes_accounting_equation_check(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $assetAccount = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $liabilityAccount = Account::create([
            'name' => 'Test Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => -500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'accounting_equation' => [
                    'assets_cad',
                    'liabilities_cad',
                    'equity_cad',
                    'residual_cad',
                    'is_balanced',
                    'recorded' => [
                        'assets_cad',
                        'liabilities_cad',
                        'equity_cad',
                    ],
                    'computed' => [
                        'assets_cad',
                        'liabilities_cad',
                        'equity_cad',
                    ],
                    'variance' => [
                        'assets_cad',
                        'liabilities_cad',
                        'equity_cad',
                    ],
                ],
            ],
        ]);

        $equation = $response->json('data.accounting_equation');
        $this->assertEquals(1000, $equation['assets_cad']);
        $this->assertEquals(500, $equation['liabilities_cad']);
        $this->assertEquals(500, $equation['equity_cad']);
        $this->assertEquals(0, $equation['residual_cad']);
        $this->assertTrue($equation['is_balanced']);
        $this->assertEquals(1000, $equation['computed']['assets_cad']);
        $this->assertEquals(1000, $equation['recorded']['assets_cad']);
        $this->assertEquals(0, $equation['variance']['assets_cad']);
    }

    public function test_accounting_equation_sums_computed_account_conciliations(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $assetAccount = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $liabilityAccount = Account::create([
            'name' => 'Test Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 3750,
            'usd_cad' => 1.5,
            'cad_cop' => 2500,
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 200,
            'recorded_balance_cop' => 500000,
        ]);

        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => -500,
            'recorded_balance_usd' => -50,
            'recorded_balance_cop' => -100000,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $assetAccount->id,
            'amount_cad' => 100,
            'amount_usd' => 20,
            'amount_cop' => 50000,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();

        $equation = $response->json('data.accounting_equation');

        // CAD equivalent: USD / usd_cad, COP / cad_cop (1.5 and 2500).
        // Recorded assets: 1000 + 200/1.5 + 500000/2500 = 1333.33
        // Recorded liabilities: abs(-500 + -50/1.5 + -100000/2500) = 573.33
        $this->assertEquals(1333.33, $equation['recorded']['assets_cad']);
        $this->assertEquals(573.33, $equation['recorded']['liabilities_cad']);
        $this->assertEquals(760.0, $equation['recorded']['equity_cad']);

        // Computed includes operations: 900 + 180/1.5 + 450000/2500 = 1200
        $this->assertEquals(1200, $equation['assets_cad']);
        $this->assertEquals(573.33, $equation['liabilities_cad']);
        $this->assertEquals(626.67, $equation['equity_cad']);
        $this->assertEquals(1200, $equation['computed']['assets_cad']);
        $this->assertEquals(573.33, $equation['computed']['liabilities_cad']);
        $this->assertEquals(626.67, $equation['computed']['equity_cad']);
        $this->assertEquals(133.33, $equation['variance']['assets_cad']);
        $this->assertEquals(0, $equation['variance']['liabilities_cad']);
        $this->assertEquals(133.33, $equation['variance']['equity_cad']);
        $this->assertEquals(0, $equation['residual_cad']);
        $this->assertTrue($equation['is_balanced']);
    }

    public function test_accounting_equation_includes_fixed_assets_in_assets(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $assetAccount = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $liabilityAccount = Account::create([
            'name' => 'Test Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $liabilityAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => -500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $valuedAsset = FixedAsset::create([
            'name' => 'Ford Escape',
            'initial_value_cad' => 30000,
            'is_active' => true,
        ]);
        FixedAssetValuation::create([
            'fixed_asset_id' => $valuedAsset->id,
            'period' => '202501',
            'book_value_cad' => 25000,
        ]);

        FixedAsset::create([
            'name' => 'Laptop',
            'initial_value_cad' => 2000,
            'is_active' => true,
        ]);

        FixedAsset::create([
            'name' => 'Sold Car',
            'initial_value_cad' => 9000,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();

        $equation = $response->json('data.accounting_equation');

        // Account assets 1000 + Ford Escape book value 25000 + Laptop initial 2000.
        // Inactive Sold Car is excluded. Liabilities stay 500.
        $this->assertEquals(28000, $equation['assets_cad']);
        $this->assertEquals(28000, $equation['recorded']['assets_cad']);
        $this->assertEquals(28000, $equation['computed']['assets_cad']);
        $this->assertEquals(0, $equation['variance']['assets_cad']);
        $this->assertEquals(500, $equation['liabilities_cad']);
        $this->assertEquals(27500, $equation['equity_cad']);
        $this->assertEquals(27500, $equation['recorded']['equity_cad']);
        $this->assertEquals(27500, $equation['computed']['equity_cad']);
        $this->assertEquals(0, $equation['residual_cad']);
        $this->assertTrue($equation['is_balanced']);
    }

    public function test_reconciliation_includes_balance_changes_in_cad_equivalent(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $checking = Account::create([
            'name' => 'Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $savings = Account::create([
            'name' => 'Savings',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $creditCard = Account::create([
            'name' => 'Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        ExchangeRate::create([
            'period' => '202502',
            'usd_cop' => 3750,
            'usd_cad' => 1.5,
            'cad_cop' => 2500,
        ]);

        AccountBalance::create([
            'account_id' => $checking->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 150,
            'recorded_balance_cop' => 250000,
        ]);

        AccountBalance::create([
            'account_id' => $savings->id,
            'period' => '202501',
            'recorded_balance_cad' => 500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $creditCard->id,
            'period' => '202501',
            'recorded_balance_cad' => 400,
            'recorded_balance_usd' => 60,
            'recorded_balance_cop' => 50000,
        ]);

        AccountBalance::create([
            'account_id' => $checking->id,
            'period' => '202502',
            'recorded_balance_cad' => 800,
            'recorded_balance_usd' => 150,
            'recorded_balance_cop' => 250000,
        ]);

        AccountBalance::create([
            'account_id' => $savings->id,
            'period' => '202502',
            'recorded_balance_cad' => 500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $creditCard->id,
            'period' => '202502',
            'recorded_balance_cad' => 450,
            'recorded_balance_usd' => 60,
            'recorded_balance_cop' => 50000,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $checking->id,
            'amount_cad' => 100,
        ]);

        Transaction::create([
            'date' => '2025-02-12',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $creditCard->id,
            'amount_cad' => 50,
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'balance_changes' => [
                    'accounts' => [
                        [
                            'account_id',
                            'account_name',
                            'account_type',
                            'is_asset',
                            'is_liability',
                            'initial_cad',
                            'computed_cad',
                            'difference_cad',
                        ],
                    ],
                    'assets' => [
                        'initial_cad',
                        'computed_cad',
                        'difference_cad',
                    ],
                    'liabilities' => [
                        'initial_cad',
                        'computed_cad',
                        'difference_cad',
                    ],
                ],
            ],
        ]);

        $changes = $response->json('data.balance_changes');
        $checkingChange = collect($changes['accounts'])->firstWhere('account_id', $checking->id);
        $savingsChange = collect($changes['accounts'])->firstWhere('account_id', $savings->id);
        $creditChange = collect($changes['accounts'])->firstWhere('account_id', $creditCard->id);

        // CAD equivalent: USD / usd_cad, COP / cad_cop (1.5 and 2500).
        // Checking initial: 1000 + 150/1.5 + 250000/2500 = 1200
        // Checking computed: 900 + 100 + 100 = 1100, difference 100 (initial − computed)
        $this->assertNotNull($checkingChange);
        $this->assertTrue($checkingChange['is_asset']);
        $this->assertEquals(1200.0, $checkingChange['initial_cad']);
        $this->assertEquals(1100.0, $checkingChange['computed_cad']);
        $this->assertEquals(100.0, $checkingChange['difference_cad']);

        $this->assertNotNull($savingsChange);
        $this->assertEquals(500.0, $savingsChange['initial_cad']);
        $this->assertEquals(500.0, $savingsChange['computed_cad']);
        $this->assertEquals(0.0, $savingsChange['difference_cad']);

        // Credit card initial: abs(400 + 60/1.5 + 50000/2500) = 460
        // Charge +50 CAD → computed abs(450 + 40 + 20) = 510, difference -50
        $this->assertNotNull($creditChange);
        $this->assertTrue($creditChange['is_liability']);
        $this->assertEquals(460.0, $creditChange['initial_cad']);
        $this->assertEquals(510.0, $creditChange['computed_cad']);
        $this->assertEquals(-50.0, $creditChange['difference_cad']);

        $this->assertEquals(1700.0, $changes['assets']['initial_cad']);
        $this->assertEquals(1600.0, $changes['assets']['computed_cad']);
        $this->assertEquals(100.0, $changes['assets']['difference_cad']);
        $this->assertEquals(460.0, $changes['liabilities']['initial_cad']);
        $this->assertEquals(510.0, $changes['liabilities']['computed_cad']);
        $this->assertEquals(-50.0, $changes['liabilities']['difference_cad']);
    }

    public function test_records_check_applies_month_close_formula_with_down_payments(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $bank = Account::create([
            'name' => 'Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $creditCard = Account::create([
            'name' => 'Visa',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $grocery = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $debt = Category::factory()->debt()->create([
            'code' => 'C010',
            'name_es' => 'CREDITO VISA',
            'name_en' => 'Visa Payment',
        ]);

        ExchangeRate::create([
            'period' => '202502',
            'usd_cop' => 3750,
            'usd_cad' => 1.5,
            'cad_cop' => 2500,
        ]);

        Income::create([
            'period' => '202502',
            'description' => 'Salary',
            'line_number' => 1,
            'amount_cad' => 1000,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 2000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $creditCard->id,
            'period' => '202501',
            'recorded_balance_cad' => 800,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-05',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $grocery->id,
            'account_id' => $bank->id,
            'amount_cad' => 300,
        ]);

        Transaction::create([
            'date' => '2025-02-08',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $grocery->id,
            'account_id' => $creditCard->id,
            'amount_cad' => 50,
        ]);

        Transaction::create([
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $debt->id,
            'account_id' => $creditCard->id,
            'amount_cad' => 100,
            'debt_component' => 'principal',
        ]);

        Transaction::create([
            'date' => '2025-02-21',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $debt->id,
            'account_id' => $creditCard->id,
            'amount_usd' => 150,
            'debt_component' => 'principal',
        ]);

        Transaction::create([
            'date' => '2025-02-22',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $debt->id,
            'account_id' => $creditCard->id,
            'amount_cad' => 40,
            'debt_component' => 'interest',
        ]);

        Transaction::create([
            'date' => '2025-02-23',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $debt->id,
            'account_id' => $creditCard->id,
            'amount_usd' => 90,
            'debt_component' => 'interest',
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'records_check' => [
                    'formula',
                    'income_cad',
                    'net_operating_expenses_cad',
                    'assets_difference_cad',
                    'liabilities_difference_cad',
                    'down_payments_cad',
                    'interest_cad',
                    'debt_payments_cad',
                    'result_cad',
                    'is_balanced',
                ],
            ],
        ]);

        $check = $response->json('data.records_check');

        // Down payments: 100 CAD + 150 USD / 1.5 = 200
        // Interest: 40 CAD + 90 USD / 1.5 = 100
        $this->assertEquals(1000.0, $check['income_cad']);
        $this->assertEquals(450.0, $check['net_operating_expenses_cad']);
        $this->assertEquals(300.0, $check['assets_difference_cad']);
        $this->assertEquals(150.0, $check['liabilities_difference_cad']);
        $this->assertEquals(200.0, $check['down_payments_cad']);
        $this->assertEquals(100.0, $check['interest_cad']);
        $this->assertEquals(300.0, $check['debt_payments_cad']);
        // 1000 − 450 + 300 − 150 + 200 + 100 − 300 = 700
        $this->assertEquals(700.0, $check['result_cad']);
        $this->assertFalse($check['is_balanced']);
        $this->assertStringContainsString('Down payments', $check['formula']);
        $this->assertStringContainsString('Interest', $check['formula']);
        $this->assertStringContainsString('Debt payments', $check['formula']);
        $this->assertStringContainsString('Net Operating Expenses', $check['formula']);
    }

    public function test_reconciliation_detects_unbalanced_accounting_equation(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $assetAccount = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        // Create asset without corresponding liability/equity
        // This simulates an unbalanced equation
        AccountBalance::create([
            'account_id' => $assetAccount->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();

        $equation = $response->json('data.accounting_equation');
        $this->assertEquals(1000, $equation['assets_cad']);
        $this->assertEquals(0, $equation['liabilities_cad']);
        $this->assertEquals(1000, $equation['equity_cad']);
        // Residual should be: 1000 - (0 + 1000) = 0
        $this->assertEquals(0, $equation['residual_cad']);
    }

    public function test_reconciliation_includes_income_and_expense_totals(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'amount_cad' => 250,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();
        $response->assertJsonPath('data.expenses_total_cad', 250);
        $response->assertJsonPath('data.net_operating_expenses_cad', 250);
    }

    public function test_user_can_acknowledge_account_variance_with_optional_note(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Ack Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 100,
        ]);

        $response = $this->postJson(
            "/api/periods/202501/reconciliation/{$account->id}/acknowledge",
            ['note' => 'Timing difference on bank statement']
        );

        $response->assertOk();
        $response->assertJsonPath('data.account_id', $account->id);
        $response->assertJsonPath('data.period', '202501');
        $response->assertJsonPath('data.is_reviewed', true);
        $response->assertJsonPath('data.review_note', 'Timing difference on bank statement');
        $this->assertNotNull($response->json('data.reviewed_at'));

        $report = $this->getJson('/api/periods/202501/reconciliation');
        $report->assertOk();

        $accountData = collect($report->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertNotNull($accountData);
        $this->assertFalse($accountData['is_balanced']);
        $this->assertTrue($accountData['is_reviewed']);
        $this->assertEquals('Timing difference on bank statement', $accountData['review_note']);
        $this->assertEquals(100, $accountData['variance']['cad']);
    }

    public function test_cannot_acknowledge_balanced_account_variance(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Balanced Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        $response = $this->postJson(
            "/api/periods/202501/reconciliation/{$account->id}/acknowledge",
            ['note' => 'Should fail']
        );

        $response->assertStatus(422);
        $response->assertJsonPath(
            'error',
            'Cannot acknowledge a balanced account with zero variance'
        );
    }

    public function test_records_check_closes_when_debt_cash_source_is_flagged(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $bank = Account::create([
            'name' => 'Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $loan = Account::create([
            'name' => 'Auto Loan',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $expense = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
        ]);

        $debt = Category::factory()->debt()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
        ]);

        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $loan->id,
            'period' => '202501',
            'recorded_balance_cad' => 500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $debt->id,
            'account_id' => $loan->id,
            'amount_cad' => 100,
            'debt_component' => 'principal',
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $debt->id,
            'account_id' => $loan->id,
            'amount_cad' => 10,
            'debt_component' => 'interest',
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $expense->id,
            'account_id' => $bank->id,
            'amount_cad' => 110,
            'is_debt_payment' => true,
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $check = $response->json('data.records_check');

        $this->assertEquals(10.0, $check['net_operating_expenses_cad']);
        $this->assertEquals(110.0, $check['assets_difference_cad']);
        $this->assertEquals(100.0, $check['liabilities_difference_cad']);
        $this->assertEquals(100.0, $check['down_payments_cad']);
        $this->assertEquals(10.0, $check['interest_cad']);
        $this->assertEquals(110.0, $check['debt_payments_cad']);
        // 0 − 10 + 110 − 100 + 100 + 10 − 110 = 0
        $this->assertEquals(0.0, $check['result_cad']);
        $this->assertTrue($check['is_balanced']);
    }

    public function test_records_check_detects_missing_debt_cash_source(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $bank = Account::create([
            'name' => 'Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $loan = Account::create([
            'name' => 'Auto Loan',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $debt = Category::factory()->debt()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
        ]);

        AccountBalance::create([
            'account_id' => $bank->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $loan->id,
            'period' => '202501',
            'recorded_balance_cad' => 500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $debt->id,
            'account_id' => $loan->id,
            'amount_cad' => 100,
            'debt_component' => 'principal',
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $debt->id,
            'account_id' => $loan->id,
            'amount_cad' => 10,
            'debt_component' => 'interest',
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $check = $response->json('data.records_check');

        $this->assertEquals(10.0, $check['net_operating_expenses_cad']);
        $this->assertEquals(0.0, $check['assets_difference_cad']);
        $this->assertEquals(100.0, $check['liabilities_difference_cad']);
        $this->assertEquals(110.0, $check['debt_payments_cad']);
        // 0 − 10 + 0 − 100 + 100 + 10 − 110 = -110
        $this->assertEquals(-110.0, $check['result_cad']);
        $this->assertFalse($check['is_balanced']);
    }
}

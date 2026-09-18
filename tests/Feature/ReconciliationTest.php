<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
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
        $this->assertEquals(900, $accountData['computed']['cad']);
        $this->assertEquals(100, $accountData['variance']['cad']);
        $this->assertFalse($accountData['is_balanced']);
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
        $this->assertEquals(850, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
        $this->assertEquals('balanced', $response->json('data.status'));
    }

    public function test_reconciliation_adds_income_and_subtracts_principal_from_computed_balance(): void
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

        // 1000 - 100 spend + 500 income - 200 principal = 1200 (interest omitted)
        $this->assertEquals(1000, $accountData['recorded']['cad']);
        $this->assertEquals(1200, $accountData['computed']['cad']);
        $this->assertEquals(-200, $accountData['variance']['cad']);
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
                ],
            ],
        ]);

        $equation = $response->json('data.accounting_equation');
        $this->assertEquals(1000, $equation['assets_cad']);
        $this->assertEquals(500, $equation['liabilities_cad']);
        $this->assertEquals(500, $equation['equity_cad']);
        $this->assertEquals(0, $equation['residual_cad']);
        $this->assertTrue($equation['is_balanced']);
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
}

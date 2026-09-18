<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeCategoryTransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $incomeCategory;

    private Category $expenseCategory;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->incomeCategory = Category::query()->where('code', 'I01')->firstOrFail();

        $this->expenseCategory = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        $this->account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        ExchangeRate::create([
            'period' => '202502',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_income_category_is_exposed_on_the_categories_api(): void
    {
        $this->assertTrue($this->incomeCategory->is_income_category);

        $response = $this->getJson('/api/categories/I01');

        $response->assertOk()
            ->assertJsonPath('data.code', 'I01')
            ->assertJsonPath('data.is_income_category', true)
            ->assertJsonPath('data.is_debt_category', false);
    }

    public function test_income_transaction_requires_a_deposit_account(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'amount_cad' => 500,
            'comments' => 'salary-no-account',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Income transactions must be assigned to a deposit account.');
    }

    public function test_income_transaction_can_be_created_with_a_deposit_account(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 2500.50,
            'comments' => 'salary-deposit',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.account_id', $this->account->id)
            ->assertJsonPath('data.category.is_income_category', true)
            ->assertJsonPath('data.amount_cad', 2500.5);

        $this->assertDatabaseHas('transactions', [
            'comments' => 'salary-deposit',
            'account_id' => $this->account->id,
            'category_id' => $this->incomeCategory->id,
        ]);
    }

    public function test_income_transaction_increases_computed_account_balance(): void
    {
        AccountBalance::create([
            'account_id' => $this->account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $this->account->id,
            'period' => '202502',
            'recorded_balance_cad' => 1500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 500,
            'comments' => 'salary-inflow',
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $this->account->id);

        $this->assertNotNull($accountData);
        $this->assertEquals(1500, $accountData['recorded']['cad']);
        $this->assertEquals(1500, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
        $this->assertEquals(500, $response->json('data.income_total_cad'));
    }

    public function test_income_transaction_appears_as_a_deposit_on_account_history(): void
    {
        AccountBalance::create([
            'account_id' => $this->account->id,
            'period' => '202502',
            'recorded_balance_cad' => 1500,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 500,
            'comments' => 'salary-history',
        ]);

        $response = $this->getJson("/api/accounts/{$this->account->id}/transactions");

        $response->assertOk()
            ->assertJsonPath('meta.starting_balance', 1000)
            ->assertJsonPath('meta.current_balance', 1500)
            ->assertJsonPath('data.0.comments', 'salary-history')
            ->assertJsonPath('data.0.signed_amount', 500)
            ->assertJsonPath('data.0.is_income', true)
            ->assertJsonPath('data.0.running_balance', 1500);
    }

    public function test_income_transaction_counts_as_income_not_expense(): void
    {
        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->expenseCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 200,
            'comments' => 'groceries',
        ]);

        Transaction::create([
            'date' => '2025-02-12',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 800,
            'comments' => 'salary',
        ]);

        $dashboard = $this->get(route('dashboard', ['period' => '202502']));
        $dashboard->assertOk();
        $dashboard->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('summary.total_income_cad', 800)
            ->where('summary.total_expenses_cad', 200)
            ->where('summary.net_cad', 600)
        );

        $summary = $this->getJson('/api/financial-summary?period=202502');
        $summary->assertOk()
            ->assertJsonPath('data.total_income_cad', 800)
            ->assertJsonPath('data.total_recorded_disbursements_cad', 200);

        $incomeLines = collect($summary->json('data.income_lines'));
        $this->assertTrue($incomeLines->contains(
            fn (array $line) => ($line['source'] ?? null) === 'transaction'
                && (float) $line['total_cad_equivalent'] === 800.0
        ));
    }

    public function test_updating_to_income_category_requires_an_account(): void
    {
        $created = $this->postJson('/api/transactions', [
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->expenseCategory->id,
            'amount_cad' => 100,
            'comments' => 'needs-account-later',
        ])->json('data');

        $response = $this->putJson('/api/transactions/'.$created['id'], [
            'category_id' => $this->incomeCategory->id,
            'account_id' => null,
            'amount_cad' => 100,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Income transactions must be assigned to a deposit account.');
    }

    public function test_income_category_actuals_are_excluded_from_expense_total(): void
    {
        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->expenseCategory->id,
            'amount_cad' => 200,
            'comments' => 'groceries-actual',
        ]);

        Transaction::create([
            'date' => '2025-02-12',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->incomeCategory->id,
            'account_id' => $this->account->id,
            'amount_cad' => 800,
            'comments' => 'salary-actual',
        ]);

        $response = $this->getJson('/api/category-actuals?period=202502');

        $response->assertOk();

        $categories = collect($response->json('data.categories'));
        $income = $categories->firstWhere('category_code', 'I01');

        $this->assertNotNull($income);
        $this->assertTrue($income['is_income_category']);
        $this->assertEquals(800.0, $income['actual_cad']);
        $this->assertEquals(200.0, $response->json('meta.total_actual_cad'));
        $this->assertEquals(2, $response->json('meta.total_transactions'));
    }
}

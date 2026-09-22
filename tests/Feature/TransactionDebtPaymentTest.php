<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionDebtPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Category $debt;

    private Category $income;

    private Account $bank;

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

        $this->debt = Category::factory()->debt()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
        ]);

        $this->income = Category::query()->where('code', 'I01')->firstOrFail();

        $this->bank = Account::create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);
    }

    public function test_user_can_mark_a_regular_spend_as_a_debt_payment(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 110,
            'is_debt_payment' => true,
            'comments' => 'visa-cash-source',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.is_debt_payment', true)
            ->assertJsonPath('data.account_id', $this->bank->id)
            ->assertJsonPath('data.debt_component', null);

        $this->assertDatabaseHas('transactions', [
            'id' => $response->json('data.id'),
            'is_debt_payment' => true,
            'account_id' => $this->bank->id,
        ]);
    }

    public function test_debt_payment_requires_the_account_the_money_left(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'amount_cad' => 110,
            'is_debt_payment' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath(
                'error',
                'Debt payment transactions must be assigned to the account the money left.',
            );
    }

    public function test_income_transactions_cannot_be_debt_payments(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->income->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 500,
            'is_debt_payment' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Income transactions cannot be marked as debt payments.');
    }

    public function test_credit_transactions_cannot_also_be_debt_payments(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 25,
            'is_credit' => true,
            'is_debt_payment' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'A credit transaction cannot also be a debt payment.');
    }

    public function test_principal_records_cannot_also_be_marked_as_cash_debt_payments(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->debt->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 100,
            'debt_component' => 'principal',
            'is_debt_payment' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath(
                'error',
                'Debt-category transactions use principal or interest, not the debt payment flag.',
            );
    }

    public function test_duplicate_copies_the_debt_payment_flag(): void
    {
        $source = Transaction::create([
            'date' => '2025-02-20',
            'period' => '202502',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'account_id' => $this->bank->id,
            'amount_cad' => 110,
            'is_debt_payment' => true,
            'comments' => 'source-debt-payment',
        ]);

        $response = $this->postJson("/api/transactions/{$source->id}/duplicate");

        $response->assertCreated()
            ->assertJsonPath('data.is_debt_payment', true)
            ->assertJsonPath('data.account_id', $this->bank->id);

        $this->assertNotSame($source->id, $response->json('data.id'));
    }
}

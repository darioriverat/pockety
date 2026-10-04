<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Support\CategoryTemplate;
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
        CategoryTemplate::seedForUser((int) $this->user->id);

        $this->groceries = Category::query()
            ->forUser((int) $this->user->id)
            ->where('code', 'C001')
            ->firstOrFail();

        $this->debt = Category::query()
            ->forUser((int) $this->user->id)
            ->where('code', 'C044')
            ->firstOrFail();

        $this->income = Category::query()
            ->forUser((int) $this->user->id)
            ->where('code', 'I01')
            ->firstOrFail();

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

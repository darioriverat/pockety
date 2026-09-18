<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountTransactionHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_running_balance_shows_starting_and_matches_current_balance(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $category = Category::factory()->create([
            'code' => 'C001',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        // Current recorded balance after all transactions
        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 700.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        // Chronological expenses: 100 then 200 → starting should be 1000
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 100.00,
            'comments' => 'first-expense',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 200.00,
            'comments' => 'second-expense',
            'is_recurring' => false,
        ]);

        $response = $this->getJson("/api/accounts/{$account->id}/transactions");

        $response->assertOk();
        $response->assertJsonPath('meta.starting_balance', 1000);
        $response->assertJsonPath('meta.current_balance', 700);
        $response->assertJsonPath('meta.currency', 'CAD');
        $response->assertJsonPath('meta.total_count', 2);

        $data = $response->json('data');

        // Newest first
        $this->assertSame('second-expense', $data[0]['comments']);
        $this->assertEquals(700.0, $data[0]['running_balance']);
        $this->assertSame('first-expense', $data[1]['comments']);
        $this->assertEquals(900.0, $data[1]['running_balance']);

        // Final (newest) running balance matches current balance
        $this->assertEquals(
            $response->json('meta.current_balance'),
            $data[0]['running_balance']
        );
    }

    public function test_running_balance_starts_at_zero_without_recorded_balance(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'name' => 'Cash',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $category = Category::factory()->create([
            'code' => 'C002',
            'is_active' => true,
        ]);

        Transaction::create([
            'date' => '2025-02-01',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 50.00,
            'comments' => 'only-tx',
            'is_recurring' => false,
        ]);

        $response = $this->getJson("/api/accounts/{$account->id}/transactions");

        $response->assertOk();
        $response->assertJsonPath('meta.starting_balance', 0);
        $response->assertJsonPath('meta.current_balance', -50);
        $response->assertJsonPath('data.0.running_balance', -50);
        $response->assertJsonPath('data.0.comments', 'only-tx');
    }

    public function test_date_range_filter_limits_transactions_and_adjusts_starting_balance(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'name' => 'RBC Checking Filter',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $category = Category::factory()->create([
            'code' => 'C001',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        // Ledger: start 1000 → after Dec 50 = 950 → after Jan 100 = 850 → after Jan 200 = 650 → after Feb 50 = 600
        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202502',
            'recorded_balance_cad' => 600.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2024-12-15',
            'period' => '202412',
            'quincena' => 'Q2',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 50.00,
            'comments' => 'dec-expense',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 100.00,
            'comments' => 'jan-first',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 200.00,
            'comments' => 'jan-second',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 50.00,
            'comments' => 'feb-expense',
            'is_recurring' => false,
        ]);

        $response = $this->getJson(
            "/api/accounts/{$account->id}/transactions?start_date=2025-01-01&end_date=2025-01-31"
        );

        $response->assertOk();
        $response->assertJsonPath('meta.is_filtered', true);
        $response->assertJsonPath('meta.filters.start_date', '2025-01-01');
        $response->assertJsonPath('meta.filters.end_date', '2025-01-31');
        $response->assertJsonPath('meta.total_count', 2);
        // Balance at start of Jan = 1000 - 50 (Dec) = 950
        $response->assertJsonPath('meta.starting_balance', 950);
        // Balance after last Jan tx = 950 - 100 - 200 = 650
        $response->assertJsonPath('meta.current_balance', 650);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertSame('jan-second', $data[0]['comments']);
        $this->assertEquals(650.0, $data[0]['running_balance']);
        $this->assertSame('jan-first', $data[1]['comments']);
        $this->assertEquals(850.0, $data[1]['running_balance']);

        $comments = array_column($data, 'comments');
        $this->assertNotContains('dec-expense', $comments);
        $this->assertNotContains('feb-expense', $comments);
    }

    public function test_date_range_validation_rejects_invalid_range(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);

        $response = $this->getJson(
            "/api/accounts/{$account->id}/transactions?start_date=2025-02-01&end_date=2025-01-01"
        );

        $response->assertStatus(422);
    }

    public function test_liability_charges_increase_balance_and_principal_decreases_it(): void
    {
        $this->actingAs(User::factory()->create());

        $account = Account::factory()->create([
            'name' => 'CIBC Visa',
            'type' => 'liability',
            'primary_currency' => 'CAD',
        ]);

        $expenseCategory = Category::factory()->create([
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        $debtCategory = Category::factory()->debt()->create([
            'name_en' => 'Visa Payment',
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 900.00,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $expenseCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 100.00,
            'comments' => 'card-charge',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $debtCategory->id,
            'account_id' => $account->id,
            'amount_cad' => 200.00,
            'debt_component' => 'principal',
            'comments' => 'down-payment',
            'is_recurring' => false,
        ]);

        $response = $this->getJson("/api/accounts/{$account->id}/transactions");

        $response->assertOk();
        $response->assertJsonPath('meta.starting_balance', 1000);
        $response->assertJsonPath('meta.current_balance', 900);
        $response->assertJsonPath('meta.is_liability', true);

        $data = $response->json('data');

        $this->assertSame('down-payment', $data[0]['comments']);
        $this->assertEquals(-200.0, $data[0]['signed_amount']);
        $this->assertEquals(900.0, $data[0]['running_balance']);

        $this->assertSame('card-charge', $data[1]['comments']);
        $this->assertEquals(100.0, $data[1]['signed_amount']);
        $this->assertEquals(1100.0, $data[1]['running_balance']);
    }
}

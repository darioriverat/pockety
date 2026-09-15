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
}

<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTransactionHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Account $account;

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

        $this->account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
        ]);
    }

    public function test_category_transaction_history_returns_all_periods_with_total(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'jan-groceries',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 250.50,
            'comments' => 'feb-groceries',
            'is_recurring' => false,
        ]);

        $other = Category::factory()->create([
            'code' => 'C004',
            'is_active' => true,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $other->id,
            'account_id' => $this->account->id,
            'amount_cad' => 999.00,
            'comments' => 'other-category',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/categories/C001/transactions');

        $response->assertOk();
        $response->assertJsonPath('meta.category.code', 'C001');
        $response->assertJsonPath('meta.total_count', 2);
        $response->assertJsonPath('meta.period_count', 2);
        $response->assertJsonPath('meta.total_spending_cad', 350.5);
        $response->assertJsonPath('meta.average_per_period_cad', 175.25);
        $response->assertJsonPath('meta.is_filtered', false);
        $response->assertJsonPath('meta.available_periods', ['202502', '202501']);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertSame('feb-groceries', $data[0]['comments']);
        $this->assertSame('jan-groceries', $data[1]['comments']);

        $comments = array_column($data, 'comments');
        $this->assertNotContains('other-category', $comments);
    }

    public function test_category_transaction_history_can_filter_by_period(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100.00,
            'comments' => 'jan-only',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 200.00,
            'comments' => 'feb-only',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/categories/C001/transactions?period=202501');

        $response->assertOk();
        $response->assertJsonPath('meta.is_filtered', true);
        $response->assertJsonPath('meta.filters.period', '202501');
        $response->assertJsonPath('meta.total_count', 1);
        $response->assertJsonPath('meta.period_count', 1);
        $response->assertJsonPath('meta.total_spending_cad', 100);
        $response->assertJsonPath('meta.average_per_period_cad', 100);
        // Available periods still lists all periods for the category
        $response->assertJsonPath('meta.available_periods', ['202502', '202501']);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('jan-only', $data[0]['comments']);
    }

    public function test_category_transaction_history_rejects_invalid_period(): void
    {
        $response = $this->getJson('/api/categories/C001/transactions?period=2025');

        $response->assertStatus(422);
    }

    public function test_category_transaction_history_returns_404_for_unknown_category(): void
    {
        $response = $this->getJson('/api/categories/C999/transactions');

        $response->assertStatus(404)
            ->assertJson(['error' => 'Category not found']);
    }

    public function test_category_transaction_history_empty_when_no_transactions(): void
    {
        $response = $this->getJson('/api/categories/C001/transactions');

        $response->assertOk();
        $response->assertJsonPath('meta.total_count', 0);
        $response->assertJsonPath('meta.total_spending_cad', 0);
        $response->assertJsonPath('meta.period_count', 0);
        $response->assertJsonPath('meta.average_per_period_cad', 0);
        $response->assertJsonPath('data', []);
    }
}

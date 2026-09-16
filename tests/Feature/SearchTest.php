<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_search_requires_query_parameter(): void
    {
        $this->getJson('/api/search')
            ->assertStatus(422)
            ->assertJsonPath('error', 'Validation failed');
    }

    public function test_search_returns_accounts_transactions_and_categories_grouped_by_type(): void
    {
        $rbc = Account::factory()->create([
            'name' => 'RBC Chequing',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        Account::factory()->create([
            'name' => 'TD Savings',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $groceries = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Category::factory()->create([
            'code' => 'C002',
            'name_es' => 'REPOSTERÍA',
            'name_en' => 'Baking Supplies',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $matchingTxn = Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $groceries->id,
            'account_id' => $rbc->id,
            'amount_cad' => 42.5,
            'comments' => 'Transfer from RBC online',
        ]);

        Transaction::create([
            'date' => '2025-01-16',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $groceries->id,
            'account_id' => $rbc->id,
            'amount_cad' => 10,
            'comments' => 'Coffee shop',
        ]);

        $response = $this->getJson('/api/search?q=RBC');

        $response->assertOk();
        $response->assertJsonPath('data.query', 'RBC');
        $response->assertJsonPath('meta.account_count', 1);
        $response->assertJsonPath('meta.transaction_count', 1);
        $response->assertJsonPath('meta.category_count', 0);

        $accounts = $response->json('data.accounts');
        $this->assertCount(1, $accounts);
        $this->assertSame('account', $accounts[0]['type']);
        $this->assertSame($rbc->id, $accounts[0]['id']);
        $this->assertSame('RBC Chequing', $accounts[0]['title']);
        $this->assertSame('/accounts/'.$rbc->id, $accounts[0]['url']);

        $transactions = $response->json('data.transactions');
        $this->assertCount(1, $transactions);
        $this->assertSame('transaction', $transactions[0]['type']);
        $this->assertSame($matchingTxn->id, $transactions[0]['id']);
        $this->assertStringContainsString('RBC', $transactions[0]['title']);
        $this->assertStringContainsString('/transactions?search=', $transactions[0]['url']);

        $this->assertIsArray($response->json('data.categories'));
        $this->assertSame([], $response->json('data.categories'));
    }

    public function test_search_finds_categories_by_code_or_name(): void
    {
        Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/search?q=Groceries');

        $response->assertOk();
        $response->assertJsonPath('meta.category_count', 1);
        $response->assertJsonPath('data.categories.0.type', 'category');
        $response->assertJsonPath('data.categories.0.id', 'C001');
        $response->assertJsonPath('data.categories.0.url', '/categories/C001');
    }

    public function test_search_ignores_inactive_accounts_and_categories(): void
    {
        Account::factory()->create([
            'name' => 'RBC Closed',
            'type' => 'bank',
            'is_active' => false,
        ]);

        Category::factory()->create([
            'code' => 'C099',
            'name_en' => 'RBC Fee',
            'name_es' => 'COMISION RBC',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/search?q=RBC');

        $response->assertOk();
        $response->assertJsonPath('meta.account_count', 0);
        $response->assertJsonPath('meta.category_count', 0);
        $response->assertJsonPath('data.total', 0);
    }
}

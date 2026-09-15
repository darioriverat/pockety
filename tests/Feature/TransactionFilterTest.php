<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionFilterTest extends TestCase
{
    use RefreshDatabase;

    private Category $groceries;

    private Category $transport;

    private Account $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());

        $this->groceries = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);

        $this->transport = Category::factory()->create([
            'code' => 'C004',
            'name_es' => 'TRANSPORTES',
            'name_en' => 'Transportation',
            'is_active' => true,
        ]);

        $this->account = Account::factory()->create([
            'name' => 'RBC Checking',
            'type' => 'bank',
        ]);
    }

    public function test_index_filters_by_category_code_and_period(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 40.00,
            'comments' => 'c001-jan',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->transport->id,
            'account_id' => $this->account->id,
            'amount_cad' => 20.00,
            'comments' => 'c004-jan',
            'is_recurring' => false,
        ]);

        Transaction::create([
            'date' => '2025-02-05',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 15.00,
            'comments' => 'c001-feb',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/transactions?period=202501&category=C001');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.comments', 'c001-jan')
            ->assertJsonPath('data.0.category.code', 'C001')
            ->assertJsonPath('data.0.account.name', 'RBC Checking')
            ->assertJsonPath('data.0.date', '2025-01-05')
            ->assertJsonPath('data.0.amount', 40);

        $this->assertSame('C001', $response->json('meta.filters.category'));
    }

    public function test_index_returns_empty_for_unknown_category_code(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 10.00,
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/transactions?period=202501&category=C999');

        $response->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'data');
    }

    public function test_index_includes_complete_detail_fields(): void
    {
        Transaction::create([
            'date' => '2025-01-12',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'account_id' => $this->account->id,
            'amount_cad' => 88.25,
            'comments' => 'detail-check',
            'is_recurring' => false,
        ]);

        $response = $this->getJson('/api/transactions?period=202501&category=C001');

        $response->assertOk();
        $row = $response->json('data.0');

        $this->assertSame('2025-01-12', $row['date']);
        $this->assertSame(88.25, $row['amount']);
        $this->assertSame('detail-check', $row['comments']);
        $this->assertSame('RBC Checking', $row['account']['name']);
        $this->assertSame('C001', $row['category']['code']);
    }
}

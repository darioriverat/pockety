<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionPaginationTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());

        $this->category = Category::factory()->create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_active' => true,
        ]);
    }

    public function test_index_paginates_transactions_with_page_and_per_page(): void
    {
        for ($i = 1; $i <= 55; $i++) {
            Transaction::create([
                'date' => sprintf('2026-09-%02d', min($i, 28)),
                'period' => '202609',
                'quincena' => $i <= 15 ? 'Q1' : 'Q2',
                'category_id' => $this->category->id,
                'amount_cad' => $i,
                'comments' => "pagination-tx-{$i}",
                'is_recurring' => false,
            ]);
        }

        $pageOne = $this->getJson('/api/transactions?period=202609&page=1&per_page=50');

        $pageOne->assertOk()
            ->assertJsonPath('meta.total', 55)
            ->assertJsonPath('meta.page', 1)
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(50, 'data');

        $pageTwo = $this->getJson('/api/transactions?period=202609&page=2&per_page=50');

        $pageTwo->assertOk()
            ->assertJsonPath('meta.total', 55)
            ->assertJsonPath('meta.page', 2)
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(5, 'data');

        $pageOneIds = collect($pageOne->json('data'))->pluck('id')->all();
        $pageTwoIds = collect($pageTwo->json('data'))->pluck('id')->all();

        $this->assertEmpty(array_intersect($pageOneIds, $pageTwoIds));
    }

    public function test_index_accepts_page_size_options(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            Transaction::create([
                'date' => '2026-09-01',
                'period' => '202609',
                'quincena' => 'Q1',
                'category_id' => $this->category->id,
                'amount_cad' => 10,
                'comments' => "size-tx-{$i}",
                'is_recurring' => false,
            ]);
        }

        $this->getJson('/api/transactions?period=202609&page=1&per_page=25')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 25)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(25, 'data');

        $this->getJson('/api/transactions?period=202609&page=1&per_page=100')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100)
            ->assertJsonPath('meta.last_page', 1)
            ->assertJsonCount(30, 'data');
    }

    public function test_index_rejects_invalid_per_page(): void
    {
        $this->getJson('/api/transactions?page=1&per_page=10')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_index_without_pagination_params_returns_all(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            Transaction::create([
                'date' => '2026-09-01',
                'period' => '202609',
                'quincena' => 'Q1',
                'category_id' => $this->category->id,
                'amount_cad' => 10,
                'comments' => "all-tx-{$i}",
                'is_recurring' => false,
            ]);
        }

        $this->getJson('/api/transactions?period=202609')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonCount(3, 'data')
            ->assertJsonMissingPath('meta.page');
    }
}

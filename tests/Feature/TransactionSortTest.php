<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionSortTest extends TestCase
{
    use RefreshDatabase;

    private Category $groceries;

    private Category $transport;

    private Category $utilities;

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

        $this->utilities = Category::factory()->create([
            'code' => 'C010',
            'name_es' => 'SERVICIOS',
            'name_en' => 'Utilities',
            'is_active' => true,
        ]);
    }

    public function test_index_sorts_by_date_ascending_and_descending(): void
    {
        Transaction::create([
            'date' => '2026-09-10',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 10,
            'comments' => 'mid',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-01',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 20,
            'comments' => 'early',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-20',
            'period' => '202609',
            'quincena' => 'Q2',
            'category_id' => $this->groceries->id,
            'amount_cad' => 30,
            'comments' => 'late',
            'is_recurring' => false,
        ]);

        $asc = $this->getJson('/api/transactions?period=202609&sort_by=date&sort_dir=asc&page=1&per_page=25');
        $asc->assertOk();
        $this->assertSame(
            ['2026-09-01', '2026-09-10', '2026-09-20'],
            collect($asc->json('data'))->pluck('date')->all()
        );
        $asc->assertJsonPath('meta.sort_by', 'date')
            ->assertJsonPath('meta.sort_dir', 'asc');

        $desc = $this->getJson('/api/transactions?period=202609&sort_by=date&sort_dir=desc&page=1&per_page=25');
        $desc->assertOk();
        $this->assertSame(
            ['2026-09-20', '2026-09-10', '2026-09-01'],
            collect($desc->json('data'))->pluck('date')->all()
        );
    }

    public function test_index_sorts_by_amount_ascending_and_descending(): void
    {
        Transaction::create([
            'date' => '2026-09-01',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 50,
            'comments' => 'fifty',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-02',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_usd' => 10,
            'comments' => 'ten-usd',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-03',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 25,
            'comments' => 'twenty-five',
            'is_recurring' => false,
        ]);

        $asc = $this->getJson('/api/transactions?period=202609&sort_by=amount&sort_dir=asc&page=1&per_page=25');
        $asc->assertOk();
        $this->assertSame(
            [10.0, 25.0, 50.0],
            collect($asc->json('data'))->pluck('amount')->map(fn ($v) => (float) $v)->all()
        );

        $desc = $this->getJson('/api/transactions?period=202609&sort_by=amount&sort_dir=desc&page=1&per_page=25');
        $desc->assertOk();
        $this->assertSame(
            [50.0, 25.0, 10.0],
            collect($desc->json('data'))->pluck('amount')->map(fn ($v) => (float) $v)->all()
        );
    }

    public function test_index_sorts_by_category_alphabetically(): void
    {
        Transaction::create([
            'date' => '2026-09-01',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->utilities->id,
            'amount_cad' => 5,
            'comments' => 'utilities',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-02',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 5,
            'comments' => 'groceries',
            'is_recurring' => false,
        ]);
        Transaction::create([
            'date' => '2026-09-03',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->transport->id,
            'amount_cad' => 5,
            'comments' => 'transport',
            'is_recurring' => false,
        ]);

        $asc = $this->getJson('/api/transactions?period=202609&sort_by=category&sort_dir=asc&page=1&per_page=25');
        $asc->assertOk();
        $this->assertSame(
            ['Groceries', 'Transportation', 'Utilities'],
            collect($asc->json('data'))->pluck('category.name_en')->all()
        );

        $desc = $this->getJson('/api/transactions?period=202609&sort_by=category&sort_dir=desc&page=1&per_page=25');
        $desc->assertOk();
        $this->assertSame(
            ['Utilities', 'Transportation', 'Groceries'],
            collect($desc->json('data'))->pluck('category.name_en')->all()
        );
    }

    public function test_index_rejects_invalid_sort_params(): void
    {
        $this->getJson('/api/transactions?page=1&per_page=25&sort_by=invalid')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sort_by']);

        $this->getJson('/api/transactions?page=1&per_page=25&sort_dir=sideways')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sort_dir']);
    }
}

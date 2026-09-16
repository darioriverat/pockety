<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionBulkUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Category $baking;

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

        $this->baking = Category::factory()->create([
            'code' => 'C002',
            'name_es' => 'REPOSTERÍA',
            'name_en' => 'Baking Supplies',
            'is_debt_category' => false,
            'is_active' => true,
        ]);
    }

    public function test_bulk_update_changes_category_for_selected_transactions(): void
    {
        $first = Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 25.5,
            'comments' => 'Bulk A',
        ]);

        $second = Transaction::create([
            'date' => '2025-01-11',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 40,
            'comments' => 'Bulk B',
        ]);

        $untouched = Transaction::create([
            'date' => '2025-01-12',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 15,
            'comments' => 'Leave alone',
        ]);

        $response = $this->postJson('/api/transactions/bulk', [
            'ids' => [$first->id, $second->id],
            'category_id' => $this->baking->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('meta.updated_count', 2);
        $response->assertJsonPath('message', 'Transactions updated successfully');

        $this->assertSame($this->baking->id, $first->fresh()->category_id);
        $this->assertSame($this->baking->id, $second->fresh()->category_id);
        $this->assertSame($this->groceries->id, $untouched->fresh()->category_id);

        $codes = collect($response->json('data'))->pluck('category.code')->all();
        $this->assertSame(['C002', 'C002'], $codes);
    }

    public function test_bulk_update_requires_ids_and_category(): void
    {
        $this->postJson('/api/transactions/bulk', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ids', 'category_id']);
    }

    public function test_bulk_update_rejects_unknown_transaction_ids(): void
    {
        $this->postJson('/api/transactions/bulk', [
            'ids' => [999999],
            'category_id' => $this->baking->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ids.0']);
    }
}

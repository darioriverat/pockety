<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionDuplicateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

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
    }

    public function test_duplicate_creates_copy_with_same_details(): void
    {
        $source = Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 42.75,
            'comments' => 'Original for duplicate',
            'is_recurring' => true,
        ]);

        $response = $this->postJson("/api/transactions/{$source->id}/duplicate");

        $response->assertCreated();
        $response->assertJsonPath('message', 'Transaction duplicated successfully');
        $response->assertJsonPath('data.category_id', $this->groceries->id);
        $response->assertJsonPath('data.amount_cad', 42.75);
        $response->assertJsonPath('data.comments', 'Original for duplicate');
        $response->assertJsonPath('data.is_recurring', true);
        $response->assertJsonPath('data.date', '2025-01-10');
        $response->assertJsonPath('data.period', '202501');

        $newId = $response->json('data.id');
        $this->assertNotSame($source->id, $newId);
        $this->assertDatabaseHas('transactions', [
            'id' => $newId,
            'comments' => 'Original for duplicate',
            'amount_cad' => 42.75,
            'category_id' => $this->groceries->id,
        ]);
        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_duplicate_can_override_date_and_period(): void
    {
        $source = Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_usd' => 15.5,
            'comments' => 'Override date',
        ]);

        $response = $this->postJson("/api/transactions/{$source->id}/duplicate", [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q2',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.date', '2026-09-15');
        $response->assertJsonPath('data.period', '202609');
        $response->assertJsonPath('data.quincena', 'Q2');
        $response->assertJsonPath('data.amount_usd', 15.5);
        $response->assertJsonPath('data.comments', 'Override date');
        $response->assertJsonPath('data.category.code', 'C001');
    }

    public function test_duplicate_returns_404_for_missing_transaction(): void
    {
        $this->postJson('/api/transactions/999999/duplicate')
            ->assertNotFound()
            ->assertJsonPath('error', 'Transaction not found');
    }
}

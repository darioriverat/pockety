<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Category $transport;

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

        $this->transport = Category::factory()->create([
            'code' => 'C004',
            'name_es' => 'TRANSPORTES',
            'name_en' => 'Transportation',
            'is_debt_category' => false,
            'is_active' => true,
        ]);
    }

    public function test_cannot_delete_category_with_transactions(): void
    {
        // Create a transaction with category C001
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        // Attempt to delete category C001
        $response = $this->deleteJson("/api/categories/{$this->groceries->code}");

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Cannot delete category',
                'has_transactions' => true,
            ])
            ->assertJsonFragment([
                'message' => 'This category has associated transactions and cannot be deleted',
            ]);

        // Verify category still exists
        $this->assertDatabaseHas('categories', [
            'id' => $this->groceries->id,
            'code' => 'C001',
        ]);
    }

    public function test_can_delete_category_without_transactions(): void
    {
        // Verify no transactions exist for this category
        $this->assertEquals(0, $this->transport->transactions()->count());

        // Attempt to delete category C004
        $response = $this->deleteJson("/api/categories/{$this->transport->code}");

        $response->assertOk()
            ->assertJson([
                'message' => 'Category deleted successfully',
            ]);

        // Verify category no longer exists
        $this->assertDatabaseMissing('categories', [
            'id' => $this->transport->id,
            'code' => 'C004',
        ]);
    }

    public function test_delete_returns_404_for_nonexistent_category(): void
    {
        $response = $this->deleteJson('/api/categories/C999');

        $response->assertStatus(404)
            ->assertJson([
                'error' => 'Category with code C999 not found',
            ]);
    }

    public function test_category_with_transactions_message_indicates_transactions_exist(): void
    {
        // Create a transaction with category C001
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Test transaction',
        ]);

        // Attempt to delete category C001
        $response = $this->deleteJson("/api/categories/{$this->groceries->code}");

        $response->assertStatus(422);

        // Verify message indicates transactions exist for this category
        $responseData = $response->json();
        $this->assertStringContainsString('transactions', strtolower($responseData['message']));
        $this->assertTrue($responseData['has_transactions']);
    }
}

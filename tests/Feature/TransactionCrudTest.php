<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class TransactionCrudTest extends TestCase
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

    public function test_post_creates_transaction_with_201_and_id(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 42.50,
            'comments' => 'crud-create',
        ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Transaction created successfully')
            ->assertJsonPath('data.comments', 'crud-create')
            ->assertJsonPath('data.amount_cad', 42.5)
            ->assertJsonStructure([
                'data' => ['id', 'date', 'period', 'quincena', 'category_id'],
                'links' => ['self', 'index'],
            ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $response->json('data.id'),
            'comments' => 'crud-create',
        ]);
    }

    public function test_get_returns_single_transaction(): void
    {
        $created = $this->postJson('/api/transactions', [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 10,
            'comments' => 'crud-show',
        ])->json('data');

        $response = $this->getJson('/api/transactions/'.$created['id']);

        $response->assertOk()
            ->assertJsonPath('data.id', $created['id'])
            ->assertJsonPath('data.comments', 'crud-show')
            ->assertJsonPath('data.date', '2026-09-15')
            ->assertJsonPath('data.period', '202609');
    }

    #[TestWith(['PUT'])]
    #[TestWith(['PATCH'])]
    public function test_update_verbs_persist_transaction_changes(string $method): void
    {
        $created = $this->postJson('/api/transactions', [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 10,
            'comments' => 'crud-before',
        ])->json('data');

        $response = $this->json($method, '/api/transactions/'.$created['id'], [
            'date' => '2026-09-16',
            'period' => '202609',
            'quincena' => 'Q2',
            'category_id' => $this->category->id,
            'amount_cad' => 99.99,
            'comments' => 'crud-after',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Transaction updated successfully')
            ->assertJsonPath('data.comments', 'crud-after')
            ->assertJsonPath('data.amount_cad', 99.99)
            ->assertJsonPath('data.quincena', 'Q2');

        $this->assertDatabaseHas('transactions', [
            'id' => $created['id'],
            'comments' => 'crud-after',
        ]);
    }

    public function test_delete_removes_transaction_and_get_returns_404(): void
    {
        $created = $this->postJson('/api/transactions', [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 10,
            'comments' => 'crud-delete',
        ])->json('data');

        $delete = $this->deleteJson('/api/transactions/'.$created['id']);
        $delete->assertOk()
            ->assertJsonPath('message', 'Transaction deleted successfully');

        $this->assertDatabaseMissing('transactions', [
            'id' => $created['id'],
        ]);

        $this->getJson('/api/transactions/'.$created['id'])
            ->assertNotFound()
            ->assertJsonPath('error', 'Transaction not found');
    }

    public function test_get_missing_transaction_returns_404(): void
    {
        $this->getJson('/api/transactions/999999')
            ->assertNotFound()
            ->assertJsonPath('error', 'Transaction not found');
    }

    public function test_update_can_clear_account_id(): void
    {
        $account = Account::factory()->create([
            'name' => 'RBC Checking Unset',
            'type' => 'bank',
        ]);

        $created = $this->postJson('/api/transactions', [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'account_id' => $account->id,
            'amount_cad' => 10,
            'comments' => 'crud-unset-account',
        ])->json('data');

        $this->assertSame($account->id, $created['account_id']);

        $response = $this->putJson('/api/transactions/'.$created['id'], [
            'date' => '2026-09-15',
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'account_id' => null,
            'amount_cad' => 10,
            'comments' => 'crud-unset-account',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.account_id', null);

        $this->assertDatabaseHas('transactions', [
            'id' => $created['id'],
            'account_id' => null,
        ]);
    }

    public function test_post_missing_required_field_returns_422(): void
    {
        $response = $this->postJson('/api/transactions', [
            'period' => '202609',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date']);
    }
}

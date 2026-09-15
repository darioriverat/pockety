<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionValidationTest extends TestCase
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

    public function test_period_must_be_yyyymm_format_rejects_dashed_date(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '2025-01',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 100.50,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);

        $this->assertStringContainsString(
            'YYYYMM',
            $response->json('errors.period.0')
        );
    }

    public function test_period_must_be_yyyymm_format_rejects_slash_date(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '01/2025',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 100.50,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }

    public function test_period_accepts_valid_yyyymm_format(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 100.50,
            'comments' => 'valid-period-format',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.period', '202501');
    }

    public function test_quincena_must_be_q1_or_q2(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q3',
            'category_id' => $this->category->id,
            'amount_cad' => 50,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quincena']);
    }

    public function test_amount_must_be_positive_rejects_negative(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => -100,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount_cad']);

        $this->assertStringContainsString(
            'positive',
            strtolower($response->json('errors.amount_cad.0'))
        );
    }

    public function test_amount_must_be_positive_rejects_zero(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_usd' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount_usd']);
    }

    public function test_amount_accepts_positive_decimal(): void
    {
        $response = $this->postJson('/api/transactions', [
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->category->id,
            'amount_cad' => 100.50,
            'comments' => 'positive-amount-ok',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.amount', 100.5)
            ->assertJsonPath('data.currency', 'CAD');
    }
}

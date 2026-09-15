<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconciliationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reconciliation_endpoint_computes_expected_balance_from_transactions(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 100,
        ]);

        $response = $this->getJson('/api/periods/202501/reconciliation');

        $response->assertOk();
        $response->assertJsonPath('data.period', '202501');

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertNotNull($accountData);
        $this->assertEquals(1000, $accountData['recorded']['cad']);
        $this->assertEquals(900, $accountData['computed']['cad']);
        $this->assertEquals(100, $accountData['variance']['cad']);
        $this->assertFalse($accountData['is_balanced']);
    }

    public function test_reconciliation_rolls_forward_from_prior_period_balance(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $account = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $category = Category::create([
            'code' => 'C001',
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202501',
            'recorded_balance_cad' => 900,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        AccountBalance::create([
            'account_id' => $account->id,
            'period' => '202502',
            'recorded_balance_cad' => 850,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 50,
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $account->id);

        $this->assertEquals(850, $accountData['recorded']['cad']);
        $this->assertEquals(850, $accountData['computed']['cad']);
        $this->assertEquals(0, $accountData['variance']['cad']);
        $this->assertTrue($accountData['is_balanced']);
        $this->assertEquals('balanced', $response->json('data.status'));
    }

    public function test_reconciliation_rejects_invalid_period_format(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->getJson('/api/periods/abc123/reconciliation');

        $response->assertStatus(422);
    }
}

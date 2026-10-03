<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Category;
use App\Models\PeriodBalance;
use App\Models\PeriodBalanceHistory;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodBalanceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Account $account;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_authenticated_users_can_visit_period_balances_page(): void
    {
        $response = $this->get(route('period-balances'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('period-balances'));
    }

    public function test_guests_are_redirected_from_period_balances_page(): void
    {
        auth()->logout();

        $response = $this->get(route('period-balances'));

        $response->assertRedirect();
    }

    public function test_preview_uses_computed_reconciliation_figures(): void
    {
        $this->seedJanuaryActivity();

        $response = $this->getJson('/api/period-balances?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('data.proposed.assets_cad', 900)
            ->assertJsonPath('data.proposed.liabilities_cad', 0)
            ->assertJsonPath('data.proposed.equity_cad', 900)
            ->assertJsonPath('data.proposed.income_cad', 0)
            ->assertJsonPath('data.proposed.net_operating_expenses_cad', 100)
            ->assertJsonPath('data.proposed.records_check_result_cad', 0)
            ->assertJsonPath('data.proposed.reconciliation_status', 'unbalanced')
            ->assertJsonPath('data.registered', null)
            ->assertJsonPath('meta.has_registered_balance', false)
            ->assertJsonPath('meta.history_count', 0)
            ->assertJsonPath('links.reconciliation', route('periods.reconciliation', '202501'));
    }

    public function test_register_creates_a_period_balance_from_reconciliation(): void
    {
        $this->seedJanuaryActivity();

        $response = $this->postJson('/api/period-balances', [
            'period' => '202501',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('data.assets_cad', 900)
            ->assertJsonPath('data.equity_cad', 900)
            ->assertJsonPath('meta.overwritten', false)
            ->assertJsonPath('meta.message', 'Balance registered successfully');

        $this->assertDatabaseHas('period_balances', [
            'period' => '202501',
            'assets_cad' => 900,
            'liabilities_cad' => 0,
            'equity_cad' => 900,
        ]);
        $this->assertDatabaseHas('account_balances', [
            'account_id' => $this->account->id,
            'period' => '202501',
            'recorded_balance_cad' => 900,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);
        $this->assertDatabaseCount('period_balance_histories', 0);
    }

    public function test_registering_an_existing_period_requires_overwrite(): void
    {
        $this->seedJanuaryActivity();

        $this->postJson('/api/period-balances', [
            'period' => '202501',
        ])->assertCreated();

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 50,
        ]);

        $conflict = $this->postJson('/api/period-balances', [
            'period' => '202501',
            'overwrite' => false,
        ]);

        $conflict->assertStatus(409)
            ->assertJsonPath('error', 'A balance already exists for this period.')
            ->assertJsonPath('data.existing.assets_cad', 900)
            ->assertJsonPath('data.proposed.assets_cad', 750);

        $this->assertDatabaseHas('period_balances', [
            'period' => '202501',
            'assets_cad' => 900,
        ]);
        $this->assertDatabaseHas('account_balances', [
            'account_id' => $this->account->id,
            'period' => '202501',
            'recorded_balance_cad' => 900,
        ]);
        $this->assertDatabaseCount('period_balance_histories', 0);
    }

    public function test_overwrite_replaces_the_balance_and_keeps_history(): void
    {
        $this->seedJanuaryActivity();

        $this->postJson('/api/period-balances', [
            'period' => '202501',
        ])->assertCreated();

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 50,
        ]);

        $response = $this->postJson('/api/period-balances', [
            'period' => '202501',
            'overwrite' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.assets_cad', 750)
            ->assertJsonPath('data.equity_cad', 750)
            ->assertJsonPath('meta.overwritten', true);

        $this->assertSame(1, PeriodBalance::query()->count());
        $this->assertDatabaseHas('period_balances', [
            'period' => '202501',
            'assets_cad' => 750,
        ]);
        $this->assertDatabaseHas('account_balances', [
            'account_id' => $this->account->id,
            'period' => '202501',
            'recorded_balance_cad' => 750,
        ]);

        $history = PeriodBalanceHistory::query()->where('period', '202501')->first();
        $this->assertNotNull($history);
        $this->assertEquals(900, (float) $history->assets_cad);
        $this->assertEquals(900, (float) $history->equity_cad);
        $this->assertNotNull($history->recorded_at);
        $this->assertNotNull($history->replaced_at);

        $show = $this->getJson('/api/period-balances?period=202501');
        $show->assertOk()
            ->assertJsonPath('data.registered.assets_cad', 750)
            ->assertJsonPath('meta.history_count', 1)
            ->assertJsonPath('data.history.0.assets_cad', 900);
    }

    public function test_registered_account_balance_rolls_forward_to_the_next_period(): void
    {
        $this->seedJanuaryActivity();

        $this->postJson('/api/period-balances', [
            'period' => '202501',
        ])->assertCreated();

        Transaction::create([
            'date' => '2025-02-10',
            'period' => '202502',
            'category_id' => $this->category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 40,
        ]);

        $response = $this->getJson('/api/periods/202502/reconciliation');

        $response->assertOk();

        $accountData = collect($response->json('data.accounts'))
            ->firstWhere('account_id', $this->account->id);

        $this->assertNotNull($accountData);
        $this->assertEquals(900, $accountData['initial']['cad']);
        $this->assertEquals(860, $accountData['computed']['cad']);
    }

    public function test_invalid_period_is_rejected(): void
    {
        $this->getJson('/api/period-balances?period=2025')->assertStatus(422);
        $this->postJson('/api/period-balances', [
            'period' => 'January',
        ])->assertStatus(422);
    }

    private function seedJanuaryActivity(): void
    {
        $this->account = Account::create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        $this->category = Category::factory()->create([
            'code' => 'C001',
            'name' => 'Groceries',
        ]);

        AccountBalance::create([
            'account_id' => $this->account->id,
            'period' => '202501',
            'recorded_balance_cad' => 1000,
            'recorded_balance_usd' => 0,
            'recorded_balance_cop' => 0,
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->category->id,
            'account_id' => $this->account->id,
            'amount_cad' => 100,
        ]);
    }
}

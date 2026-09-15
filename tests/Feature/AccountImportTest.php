<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AccountImportService;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $fixtureDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->seed(CategorySeeder::class);
        $this->fixtureDir = base_path('tests/fixtures/month_sheets');
    }

    public function test_import_creates_canadian_and_colombian_accounts(): void
    {
        $service = app(AccountImportService::class);
        $result = $service->importFromMonthSheets($this->fixtureDir);

        $this->assertGreaterThan(0, $result['accounts_created']);
        $this->assertContains('RBC Checking', $result['accounts']);
        $this->assertContains('CIBC Checking', $result['accounts']);
        $this->assertContains('TD Bank Diana', $result['accounts']);
        $this->assertContains('Wise', $result['accounts']);
        $this->assertContains('Bancolombia', $result['accounts']);
        $this->assertContains('Davivienda', $result['accounts']);
        $this->assertContains('Nequi', $result['accounts']);
        $this->assertContains('Éxito', $result['accounts']);

        $this->assertDatabaseHas('accounts', [
            'name' => 'RBC Checking',
            'type' => 'bank',
        ]);
        $this->assertDatabaseHas('accounts', [
            'name' => 'Éxito',
            'type' => 'liability',
        ]);
    }

    public function test_import_renames_stale_credito_movil_to_personal_loan_cibc(): void
    {
        $service = app(AccountImportService::class);
        $service->importFromMonthSheets($this->fixtureDir);

        $this->assertDatabaseHas('accounts', [
            'name' => 'Personal LOAN CIBC',
            'type' => 'liability',
        ]);
        $this->assertDatabaseMissing('accounts', [
            'name' => 'Crédito Móvil **6174',
        ]);

        $loan = Account::query()->where('name', 'Personal LOAN CIBC')->first();
        $this->assertNotNull($loan);
        $this->assertStringContainsString('Ford Escape', (string) $loan->notes);
    }

    public function test_import_normalizes_floating_point_noise_in_balances(): void
    {
        $service = app(AccountImportService::class);
        $service->importFromMonthSheets($this->fixtureDir);

        $nequi = Account::query()->where('name', 'Nequi')->firstOrFail();
        $balance = $nequi->balances()->where('period', '202501')->firstOrFail();

        $this->assertSame('3456.59', (string) $balance->recorded_balance_cop);
    }

    public function test_import_links_ford_escape_transactions_to_personal_loan(): void
    {
        $service = app(AccountImportService::class);
        $service->importFromMonthSheets($this->fixtureDir);

        $category = Category::query()->where('code', 'C044')->firstOrFail();
        $loan = Account::query()->where('name', 'Personal LOAN CIBC')->firstOrFail();

        $tx = Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => null,
            'amount_cad' => 500.00,
            'comments' => 'FORD ESC CAPITAL',
            'is_recurring' => false,
            'debt_component' => 'principal',
        ]);

        $linked = $service->linkFordEscapeTransactions();

        $this->assertSame(1, $linked);
        $this->assertDatabaseHas('transactions', [
            'id' => $tx->id,
            'account_id' => $loan->id,
        ]);
    }

    public function test_accounts_api_returns_imported_accounts_with_type_and_currencies(): void
    {
        app(AccountImportService::class)->importFromMonthSheets($this->fixtureDir);

        $response = $this->getJson('/api/accounts');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();

        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'RBC')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'CIBC')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'TD Bank')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'Wise')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'Bancolombia')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'Davivienda')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'Nequi')));
        $this->assertTrue(collect($names)->contains(fn ($n) => str_contains($n, 'Éxito')));
        $this->assertContains('Personal LOAN CIBC', $names);
        $this->assertNotContains('Crédito Móvil **6174', $names);

        $wise = collect($response->json('data'))->firstWhere('name', 'Wise');
        $this->assertNotNull($wise);
        $this->assertContains('CAD', $wise['currencies']);
        $this->assertContains('USD', $wise['currencies']);
        $this->assertSame('bank', $wise['type']);

        $loan = collect($response->json('data'))->firstWhere('name', 'Personal LOAN CIBC');
        $this->assertTrue($loan['is_liability']);
    }

    public function test_accounts_page_loads_for_authenticated_users(): void
    {
        $response = $this->get(route('accounts'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('accounts'));
    }
}

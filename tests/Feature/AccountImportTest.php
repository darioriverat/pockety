<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AccountImportService;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $fixtureDir;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
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

    public function test_import_api_accepts_multiple_uploaded_month_sheets(): void
    {
        $response = $this->post('/api/accounts/import', [
            'files' => [
                $this->fixtureUpload('month_sheets/202501_sample.json'),
                $this->fixtureUpload('month_sheets/202502_sample.json'),
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('message', 'Account import completed');
        $this->assertGreaterThan(0, $response->json('data.accounts_created'));
        $this->assertDatabaseHas('accounts', [
            'user_id' => $this->user->id,
            'name' => 'RBC Checking',
        ]);
        $this->assertSame([], Storage::disk('local')->allFiles('tmp/imports'));
    }

    public function test_import_api_rejects_directory_and_invalid_month_sheets(): void
    {
        $directory = $this->postJson('/api/accounts/import', [
            'directory' => 'month_sheets',
        ]);
        $directory->assertStatus(422);

        $noPeriod = $this->post('/api/accounts/import', [
            'files' => [$this->fixtureUpload('invalid/month_sheet_no_period.json')],
        ]);
        $noPeriod->assertStatus(422);
        $this->assertStringContainsString('header.period.value', (string) $noPeriod->json('message'));

        $noAccounts = $this->post('/api/accounts/import', [
            'files' => [$this->fixtureUpload('invalid/month_sheet_no_accounts.json')],
        ]);
        $noAccounts->assertStatus(422);
        $this->assertStringContainsString('sections.Accounts.items', (string) $noAccounts->json('message'));

        $this->assertDatabaseCount('accounts', 0);
    }

    public function test_import_api_is_owner_scoped(): void
    {
        $other = User::factory()->create();

        $this->post('/api/accounts/import', [
            'files' => [$this->fixtureUpload('month_sheets/202501_sample.json')],
        ])->assertOk();

        $this->assertGreaterThan(
            0,
            Account::query()->where('user_id', $this->user->id)->count()
        );
        $this->assertSame(
            0,
            Account::query()->where('user_id', $other->id)->count()
        );
    }

    private function fixtureUpload(string $relativePath): UploadedFile
    {
        $absolute = base_path('tests/fixtures/'.$relativePath);

        return new UploadedFile(
            $absolute,
            basename($relativePath),
            'application/json',
            null,
            true
        );
    }
}

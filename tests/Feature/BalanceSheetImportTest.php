<?php

namespace Tests\Feature;

use App\Models\HistoricalBalanceSheet;
use App\Models\User;
use App\Services\BalanceSheetImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BalanceSheetImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $sourceFile;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->sourceFile = base_path('tests/fixtures/balance_sheet_sample.json');
    }

    public function test_import_loads_all_periods_from_fixture(): void
    {
        $source = json_decode(file_get_contents($this->sourceFile), true);
        $this->assertIsArray($source);
        $this->assertCount(2, $source);

        $service = app(BalanceSheetImportService::class);
        $result = $service->importFromFile($this->sourceFile);

        $this->assertSame(2, $result['periods_imported']);
        $this->assertSame([], $result['errors']);
        $this->assertDatabaseCount('historical_balance_sheets', 2);
    }

    public function test_import_values_match_fixture_for_january_2025(): void
    {
        $service = app(BalanceSheetImportService::class);
        $service->importFromFile($this->sourceFile);

        $row = HistoricalBalanceSheet::forPeriod('202501');
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(10000.5, (float) $row->assets_cad, 0.000001);
        $this->assertEqualsWithDelta(4000.25, (float) $row->liabilities_cad, 0.000001);
        $this->assertEqualsWithDelta(6000.25, (float) $row->equity_cad, 0.000001);
    }

    public function test_import_api_endpoint_imports_uploaded_file(): void
    {
        $response = $this->post('/api/balance-sheet/import', [
            'file' => $this->fixtureUpload('balance_sheet_sample.json'),
        ]);

        $response->assertOk();
        $response->assertJsonPath('message', 'Balance sheet history import completed');
        $response->assertJsonPath('data.periods_imported', 2);
        $response->assertJsonPath('data.errors', []);
        $this->assertDatabaseHas('historical_balance_sheets', [
            'user_id' => $this->user->id,
            'period' => '202501',
        ]);
        $this->assertSame([], Storage::disk('local')->allFiles('tmp/imports'));
    }

    public function test_import_api_rejects_file_path_and_directory(): void
    {
        $pathResponse = $this->postJson('/api/balance-sheet/import', [
            'file_path' => 'plan/extracted/estado_financiero_2025_2026.json',
        ]);
        $pathResponse->assertStatus(422);

        $dirResponse = $this->postJson('/api/balance-sheet/import', [
            'directory' => 'month_sheets',
        ]);
        $dirResponse->assertStatus(422);

        $this->assertDatabaseCount('historical_balance_sheets', 0);
    }

    public function test_import_api_rejects_invalid_json_and_extensions(): void
    {
        $invalid = $this->post('/api/balance-sheet/import', [
            'file' => $this->fixtureUpload('invalid/broken.json'),
        ]);
        $invalid->assertStatus(422);

        $extension = $this->post('/api/balance-sheet/import', [
            'file' => UploadedFile::fake()->create('sheet.txt', 10, 'text/plain'),
        ]);
        $extension->assertStatus(422);

        $missingPeriodo = $this->post('/api/balance-sheet/import', [
            'file' => $this->fixtureUpload('invalid/balance_sheet_missing_periodo.json'),
        ]);
        $missingPeriodo->assertStatus(422);
        $this->assertStringContainsString('periodo', (string) $missingPeriodo->json('message'));

        $missingActivo = $this->post('/api/balance-sheet/import', [
            'file' => $this->fixtureUpload('invalid/balance_sheet_missing_activo.json'),
        ]);
        $missingActivo->assertStatus(422);
        $this->assertStringContainsString('activo_value', (string) $missingActivo->json('message'));

        $this->assertDatabaseCount('historical_balance_sheets', 0);
    }

    public function test_import_statistics_endpoint_returns_snapshots(): void
    {
        app(BalanceSheetImportService::class)->importFromFile($this->sourceFile);

        $response = $this->getJson('/api/balance-sheet/import/statistics');

        $response->assertOk();
        $response->assertJsonPath('data.total', 2);
        $response->assertJsonPath('data.periods_covered.min', '202501');
        $response->assertJsonPath('data.periods_covered.max', '202502');
        $response->assertJsonPath('data.snapshots.0.period', '202501');
        $response->assertJsonPath('data.snapshots.0.assets_cad', 10000.5);
    }

    public function test_import_is_idempotent(): void
    {
        $service = app(BalanceSheetImportService::class);
        $first = $service->importFromFile($this->sourceFile);
        $second = $service->importFromFile($this->sourceFile);

        $this->assertSame($first['periods_imported'], $second['periods_imported']);
        $this->assertDatabaseCount('historical_balance_sheets', $first['periods_imported']);
    }

    public function test_import_normalizes_floating_point_noise_to_zero(): void
    {
        $tmp = tempnam(sys_get_temp_dir(), 'bs_import_');
        $this->assertNotFalse($tmp);

        file_put_contents($tmp, json_encode([
            [
                'row' => 1,
                'periodo' => 202501,
                'activo_value' => -1.19e-10,
                'pasivo_value' => 100.0,
                'patrimonio_value' => -100.0,
            ],
        ], JSON_THROW_ON_ERROR));

        try {
            $result = app(BalanceSheetImportService::class)->importFromFile($tmp);
            $this->assertSame(1, $result['periods_imported']);

            $row = HistoricalBalanceSheet::forPeriod('202501');
            $this->assertNotNull($row);
            $this->assertSame(0.0, (float) $row->assets_cad);
        } finally {
            @unlink($tmp);
        }
    }

    public function test_authenticated_users_can_visit_import_page(): void
    {
        $response = $this->get(route('import'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('import'));
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

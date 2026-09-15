<?php

namespace Tests\Feature;

use App\Models\HistoricalBalanceSheet;
use App\Models\User;
use App\Services\BalanceSheetImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BalanceSheetImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $sourceFile;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->sourceFile = base_path('plan/extracted/estado_financiero_2025_2026.json');
    }

    public function test_import_loads_all_periods_from_estado_financiero(): void
    {
        $source = json_decode(file_get_contents($this->sourceFile), true);
        $this->assertIsArray($source);
        $this->assertGreaterThanOrEqual(19, count($source));

        $service = app(BalanceSheetImportService::class);
        $result = $service->importFromFile($this->sourceFile);

        $this->assertSame(count($source), $result['periods_imported']);
        $this->assertCount(count($source), $result['periods']);
        $this->assertSame([], $result['errors']);
        $this->assertDatabaseCount('historical_balance_sheets', count($source));
    }

    public function test_import_values_match_source_for_january_2025(): void
    {
        $service = app(BalanceSheetImportService::class);
        $service->importFromFile($this->sourceFile);

        $row = HistoricalBalanceSheet::forPeriod('202501');
        $this->assertNotNull($row);
        $this->assertEqualsWithDelta(24595.72549, (float) $row->assets_cad, 0.000001);
        $this->assertEqualsWithDelta(35730.77158, (float) $row->liabilities_cad, 0.000001);
        $this->assertEqualsWithDelta(-11135.04609, (float) $row->equity_cad, 0.000001);
    }

    public function test_import_api_endpoint_imports_selected_file(): void
    {
        $source = json_decode(file_get_contents($this->sourceFile), true);

        $response = $this->postJson('/api/balance-sheet/import', [
            'file_path' => 'estado_financiero_2025_2026.json',
        ]);

        $response->assertOk();
        $response->assertJsonPath('message', 'Balance sheet history import completed');
        $response->assertJsonPath('data.periods_imported', count($source));
        $response->assertJsonPath('data.errors', []);
        $this->assertDatabaseHas('historical_balance_sheets', [
            'period' => '202501',
        ]);
    }

    public function test_import_api_rejects_path_traversal(): void
    {
        $response = $this->postJson('/api/balance-sheet/import', [
            'file_path' => '../composer.json',
        ]);

        $response->assertStatus(400);
        $response->assertJsonPath('message', 'Invalid file path');
    }

    public function test_import_statistics_endpoint_returns_snapshots(): void
    {
        app(BalanceSheetImportService::class)->importFromFile($this->sourceFile);

        $response = $this->getJson('/api/balance-sheet/import/statistics');

        $response->assertOk();
        $response->assertJsonPath('data.total', 19);
        $response->assertJsonPath('data.periods_covered.min', '202501');
        $response->assertJsonPath('data.periods_covered.max', '202607');
        $response->assertJsonPath('data.snapshots.0.period', '202501');
        $response->assertJsonPath('data.snapshots.0.assets_cad', 24595.72549);
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
}

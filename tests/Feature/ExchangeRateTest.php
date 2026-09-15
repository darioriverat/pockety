<?php

namespace Tests\Feature;

use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExchangeRateTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_create_exchange_rate_for_period(): void
    {
        $response = $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'period',
                    'usd_cop',
                    'usd_cad',
                    'cad_cop',
                ],
            ]);

        $this->assertDatabaseHas('exchange_rates', [
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_can_update_existing_exchange_rate(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response = $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'usd_cop' => 4500,
            'usd_cad' => 0.80,
            'cad_cop' => 3100,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('exchange_rates', [
            'period' => '202501',
            'usd_cop' => 4500,
            'usd_cad' => 0.80,
            'cad_cop' => 3100,
        ]);
    }

    public function test_can_get_exchange_rate_for_specific_period(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response = $this->getJson('/api/exchange-rates/show?period=202501');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'period' => '202501',
                    'usd_cop' => '4400.0000',
                    'usd_cad' => '0.7500',
                    'cad_cop' => '3000.0000',
                ],
            ]);
    }

    public function test_returns_404_when_exchange_rate_not_found(): void
    {
        $response = $this->getJson('/api/exchange-rates/show?period=202599');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Exchange rates not found for period 202599',
            ]);
    }

    public function test_can_list_all_exchange_rates(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        ExchangeRate::create([
            'period' => '202502',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response = $this->getJson('/api/exchange-rates');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'period',
                        'usd_cop',
                        'usd_cad',
                        'cad_cop',
                    ],
                ],
            ]);
    }

    public function test_usd_cop_rate_is_fixed_at_4400_across_all_months(): void
    {
        // Import rates from month sheets
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $result = $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        $this->assertEquals(21, $result['rates_imported']);

        // Verify USD/COP is fixed at 4400 for all periods
        $rates = ExchangeRate::all();
        foreach ($rates as $rate) {
            $this->assertEquals(4400, (float) $rate->usd_cop, "USD/COP should be 4400 for period {$rate->period}");
        }
    }

    public function test_usd_cad_rate_is_fixed_at_0_75_across_all_months(): void
    {
        // Import rates from month sheets
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $result = $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        $this->assertEquals(21, $result['rates_imported']);

        // Verify USD/CAD is fixed at 0.75 for all periods
        $rates = ExchangeRate::all();
        foreach ($rates as $rate) {
            $this->assertEquals(0.75, (float) $rate->usd_cad, "USD/CAD should be 0.75 for period {$rate->period}");
        }
    }

    public function test_cad_cop_rate_varies_across_months(): void
    {
        // Import rates from month sheets
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $result = $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        $this->assertEquals(21, $result['rates_imported']);

        // Verify CAD/COP varies
        $rates = ExchangeRate::orderBy('period')->get();

        // Early 2025 should be around 3000
        $jan2025 = $rates->where('period', '202501')->first();
        $this->assertEquals(3000, (float) $jan2025->cad_cop);

        // Mid 2026 should be around 2550
        $jun2026 = $rates->where('period', '202606')->first();
        $this->assertEquals(2550, (float) $jun2026->cad_cop);

        // Late 2026 should be around 2200
        $sep2026 = $rates->where('period', '202609')->first();
        $this->assertEquals(2200, (float) $sep2026->cad_cop);

        // Verify not all rates are the same
        $uniqueRates = $rates->pluck('cad_cop')->unique();
        $this->assertGreaterThan(1, $uniqueRates->count(), 'CAD/COP rate should vary across months');
    }

    public function test_import_creates_21_exchange_rate_records(): void
    {
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $result = $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        $this->assertEquals(21, $result['rates_imported']);
        $this->assertEquals(21, ExchangeRate::count());
        $this->assertCount(21, $result['periods']);
        $this->assertEmpty($result['errors']);
    }

    public function test_import_statistics_returns_correct_data(): void
    {
        // Import rates first
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        $response = $this->getJson('/api/exchange-rates/import/statistics');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_rates' => 21,
                    'periods_covered' => [
                        'min' => '202501',
                        'max' => '202609',
                    ],
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'total_rates',
                    'periods_covered',
                    'rates_by_month',
                ],
            ]);
    }

    public function test_three_rate_series_are_independent(): void
    {
        // Import rates from month sheets
        $importService = app(\App\Services\ExchangeRateImportService::class);
        $importService->importFromMonthSheets(base_path('plan/extracted/month_sheets'));

        // Get a sample rate
        $rate = ExchangeRate::where('period', '202501')->first();

        // If CAD/COP were derived from USD/COP and USD/CAD, it would be:
        // USD/COP / USD/CAD = 4400 / 0.75 = 5866.67
        // But the actual stored value is 3000, confirming independence
        $derivedCadCop = (float) $rate->usd_cop / (float) $rate->usd_cad;
        $actualCadCop = (float) $rate->cad_cop;

        $this->assertNotEquals(
            round($derivedCadCop, 2),
            round($actualCadCop, 2),
            'CAD/COP should NOT be derived from USD/COP and USD/CAD. The three rates must be independent.'
        );
    }

    public function test_exchange_rate_validation_requires_all_fields(): void
    {
        $response = $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            // Missing usd_cop, usd_cad, cad_cop
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['usd_cop', 'usd_cad', 'cad_cop']);
    }

    public function test_exchange_rate_validation_requires_valid_period_format(): void
    {
        $response = $this->postJson('/api/exchange-rates', [
            'period' => '2025', // Invalid format (should be YYYYMM)
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }
}

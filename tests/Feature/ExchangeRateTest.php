<?php

namespace Tests\Feature;

use App\Models\ExchangeRate;
use App\Models\ExchangeRateSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ExchangeRateTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_snapshots_table_has_expected_columns(): void
    {
        $this->assertTrue(\Schema::hasTable('exchange_rate_snapshots'));
        foreach (['id', 'rate_date', 'source', 'user_id', 'cad_per_usd', 'cop_per_usd', 'created_at', 'updated_at'] as $column) {
            $this->assertTrue(\Schema::hasColumn('exchange_rate_snapshots', $column), $column);
        }
        $this->assertFalse(\Schema::hasColumn('exchange_rates', 'usd_cop'));
        $this->assertFalse(\Schema::hasColumn('exchange_rates', 'usd_cad'));
        $this->assertFalse(\Schema::hasColumn('exchange_rates', 'cad_cop'));
        $this->assertTrue(\Schema::hasColumn('exchange_rates', 'snapshot_id'));
    }

    public function test_fetch_command_persists_global_snapshot_idempotently(): void
    {
        config(['services.openexchangerates.app_id' => 'test-app-id']);

        $timestamp = 1738281600; // 2025-01-31 00:00:00 UTC

        Http::fake([
            'https://openexchangerates.org/api/latest.json*' => Http::sequence()
                ->push([
                    'timestamp' => $timestamp,
                    'base' => 'USD',
                    'rates' => [
                        'CAD' => 1.36,
                        'COP' => 4000,
                        'EUR' => 0.92,
                    ],
                ])
                ->push([
                    'timestamp' => $timestamp,
                    'base' => 'USD',
                    'rates' => [
                        'CAD' => 1.40,
                        'COP' => 4100,
                        'EUR' => 0.91,
                    ],
                ]),
        ]);

        $this->artisan('exchange-rates:fetch')->assertSuccessful();

        $this->assertDatabaseCount('exchange_rate_snapshots', 1);
        $row = ExchangeRateSnapshot::query()->first();
        $this->assertSame(ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES, $row->source);
        $this->assertNull($row->user_id);
        $this->assertEquals(1.36, (float) $row->cad_per_usd);
        $this->assertEquals(4000, (float) $row->cop_per_usd);

        $this->artisan('exchange-rates:fetch')->assertSuccessful();
        $this->assertDatabaseCount('exchange_rate_snapshots', 1);
        $row->refresh();
        $this->assertEquals(1.40, (float) $row->cad_per_usd);
        $this->assertEquals(4100, (float) $row->cop_per_usd);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'latest.json')
                && ! str_contains($request->url(), 'historical')
                && ! str_contains($request->url(), 'time-series')
                && ! str_contains($request->url(), 'convert');
        });
    }

    public function test_fetch_command_skips_when_app_id_missing(): void
    {
        config(['services.openexchangerates.app_id' => null]);
        Http::fake();
        Log::spy();

        $this->artisan('exchange-rates:fetch')->assertSuccessful();

        $this->assertDatabaseCount('exchange_rate_snapshots', 0);
        Http::assertNothingSent();
        Log::shouldHaveReceived('warning')->once();
    }

    public function test_fetch_command_fails_on_http_or_payload_errors_without_partial_rows(): void
    {
        config(['services.openexchangerates.app_id' => 'test-app-id']);
        Log::spy();

        Http::fake([
            'https://openexchangerates.org/api/latest.json*' => Http::sequence()
                ->push('error', 500)
                ->push([
                    'timestamp' => 1738281600,
                    'rates' => ['COP' => 4000],
                ])
                ->push([
                    'timestamp' => 1738281600,
                    'rates' => ['CAD' => 1.36],
                ])
                ->push([
                    'timestamp' => 1738281600,
                    'rates' => ['CAD' => 1.36, 'COP' => 4000],
                ]),
        ]);

        $this->artisan('exchange-rates:fetch')->assertFailed();
        $this->assertDatabaseCount('exchange_rate_snapshots', 0);

        $this->artisan('exchange-rates:fetch')->assertFailed();
        $this->assertDatabaseCount('exchange_rate_snapshots', 0);

        $this->artisan('exchange-rates:fetch')->assertFailed();
        $this->assertDatabaseCount('exchange_rate_snapshots', 0);

        $this->artisan('exchange-rates:fetch')->assertSuccessful();
        $this->assertDatabaseCount('exchange_rate_snapshots', 1);
    }

    public function test_manual_snapshot_upsert_per_user_and_date(): void
    {
        $response = $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.source', 'manual')
            ->assertJsonPath('data.user_id', $this->user->id);

        $id = $response->json('data.id');

        $update = $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.40,
            'cop_per_usd' => 4100,
        ]);
        $update->assertOk()->assertJsonPath('data.id', $id);
        $this->assertDatabaseCount('exchange_rate_snapshots', 1);
        $this->assertEquals(1.40, (float) ExchangeRateSnapshot::find($id)->cad_per_usd);

        $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
        ])->assertStatus(422);

        $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 0,
            'cop_per_usd' => 4000,
        ])->assertStatus(422);

        $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
            'cad_cop' => 3000,
        ])->assertStatus(422);

        $other = User::factory()->create();
        $this->actingAs($other);
        $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.50,
            'cop_per_usd' => 4200,
        ])->assertOk();

        $this->assertEquals(2, ExchangeRateSnapshot::query()->where('source', 'manual')->count());
    }

    public function test_manual_snapshot_does_not_overwrite_global_feed(): void
    {
        $global = ExchangeRateSnapshot::factory()->globalFeed()->create([
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);

        $this->postJson('/api/exchange-rate-snapshots', [
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.50,
            'cop_per_usd' => 4500,
        ])->assertOk();

        $global->refresh();
        $this->assertEquals(1.36, (float) $global->cad_per_usd);
        $this->assertEquals(4000, (float) $global->cop_per_usd);
        $this->assertDatabaseCount('exchange_rate_snapshots', 2);
    }

    public function test_period_assignment_uses_snapshot(): void
    {
        $snapshot = ExchangeRateSnapshot::factory()->manual($this->user->id)->create([
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);

        $response = $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'snapshot_id' => $snapshot->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('data.snapshot_id', $snapshot->id);

        $rate = ExchangeRate::forPeriod('202501');
        $this->assertNotNull($rate);
        $this->assertEquals(136.0, $rate->usdToCad(100));
        $this->assertEquals(100.0, $rate->cadToUsd(136));

        $otherSnapshot = ExchangeRateSnapshot::factory()->manual($this->user->id)->create([
            'rate_date' => '2025-01-15',
            'cad_per_usd' => 1.40,
            'cop_per_usd' => 4100,
        ]);

        $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'snapshot_id' => $otherSnapshot->id,
        ])->assertOk();

        $this->assertDatabaseCount('exchange_rates', 1);
        $this->assertDatabaseHas('exchange_rates', [
            'period' => '202501',
            'snapshot_id' => $otherSnapshot->id,
        ]);
        $this->assertDatabaseHas('exchange_rate_snapshots', ['id' => $snapshot->id]);

        $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ])->assertStatus(422);
    }

    public function test_conversion_quote_convention_and_derived_accessors(): void
    {
        $rate = $this->seedExchangeRate([
            'period' => '202501',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);

        $this->assertEquals(136.0, $rate->usdToCad(100));
        $this->assertEquals(100.0, $rate->cadToUsd(136));
        $this->assertEquals(136.0, $rate->copToCad(400000));
        $this->assertEqualsWithDelta(4000 / 1.36, (float) $rate->cad_cop, 0.0001);
        $this->assertEquals(4000.0, (float) $rate->usd_cop);
        $this->assertEquals(1.36, (float) $rate->usd_cad);
    }

    public function test_zero_quote_returns_zero_instead_of_dividing(): void
    {
        $snapshot = ExchangeRateSnapshot::factory()->manual($this->user->id)->create([
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 0,
            'cop_per_usd' => 4000,
        ]);
        // Bypass validation used by API; persist zero quote for conversion edge case.
        $snapshot->forceFill(['cad_per_usd' => 0])->save();

        $rate = ExchangeRate::query()->create([
            'user_id' => $this->user->id,
            'period' => '202501',
            'snapshot_id' => $snapshot->id,
        ]);

        $this->assertEquals(0.0, $rate->cadToUsd(100));
        $this->assertEquals(0.0, $rate->cadToCop(100));
    }

    public function test_owner_isolation_for_assignments_and_manual_snapshots(): void
    {
        $other = User::factory()->create();
        $otherSnapshot = ExchangeRateSnapshot::factory()->manual($other->id)->create([
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.10,
            'cop_per_usd' => 3900,
        ]);

        $this->postJson('/api/exchange-rates', [
            'period' => '202501',
            'snapshot_id' => $otherSnapshot->id,
        ])->assertStatus(403);

        $mine = $this->seedExchangeRate([
            'period' => '202501',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);

        $this->actingAs($other);
        $this->assertNull(ExchangeRate::forPeriod('202501'));
        $this->getJson('/api/exchange-rate-snapshots/'.$mine->snapshot_id)->assertNotFound();
    }

    public function test_can_list_and_show_period_rates(): void
    {
        $this->seedExchangeRate(['period' => '202501', 'cad_per_usd' => 1.36, 'cop_per_usd' => 4000]);
        $this->seedExchangeRate(['period' => '202502', 'cad_per_usd' => 1.37, 'cop_per_usd' => 4010]);

        $this->getJson('/api/exchange-rates')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/exchange-rates/show?period=202501')
            ->assertOk()
            ->assertJsonPath('data.period', '202501');
        $this->getJson('/api/exchange-rates/show?period=202599')
            ->assertStatus(404)
            ->assertJsonPath('missing_exchange_rate', true);
    }

    public function test_snapshots_index_defaults_to_period_month_filter(): void
    {
        ExchangeRateSnapshot::factory()->manual($this->user->id)->create([
            'rate_date' => '2025-01-31',
            'cad_per_usd' => 1.36,
            'cop_per_usd' => 4000,
        ]);
        ExchangeRateSnapshot::factory()->manual($this->user->id)->create([
            'rate_date' => '2025-02-28',
            'cad_per_usd' => 1.37,
            'cop_per_usd' => 4010,
        ]);

        $this->getJson('/api/exchange-rate-snapshots?period=202501')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rate_date', '2025-01-31');
    }
}

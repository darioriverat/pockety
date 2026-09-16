<?php

namespace Tests\Feature;

use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExchangeRatePathApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_get_exchange_rates_by_period_path(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4000,
            'usd_cad' => 1.35,
            'cad_cop' => 2960,
        ]);

        $response = $this->getJson('/api/exchange-rates/202501');

        $response->assertOk()
            ->assertJsonPath('data.period', '202501');

        $this->assertEquals(4000, (float) $response->json('data.usd_cop'));
        $this->assertEquals(1.35, (float) $response->json('data.usd_cad'));
        $this->assertEquals(2960, (float) $response->json('data.cad_cop'));
    }
}

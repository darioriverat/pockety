<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());

        Account::factory()->create([
            'name' => 'Test Bank',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        Account::factory()->create([
            'name' => 'Test Credit Card',
            'type' => 'liability',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);
    }

    public function test_get_accounts_returns_list_grouped_by_type(): void
    {
        $response = $this->getJson('/api/accounts');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'grouped' => ['assets', 'liabilities'],
                'meta' => ['total'],
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('grouped.assets')));
        $this->assertGreaterThanOrEqual(1, count($response->json('grouped.liabilities')));
    }
}

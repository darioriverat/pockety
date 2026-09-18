<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetVsActualApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->seed(CategorySeeder::class);
    }

    public function test_periods_budget_vs_actual_returns_all_categories(): void
    {
        $response = $this->getJson('/api/periods/202501/budget-vs-actual');

        $response->assertOk()
            ->assertJsonPath('meta.period', '202501');

        $rows = $response->json('data');
        $this->assertCount(46, $rows);

        $row = $rows[0];
        $this->assertArrayHasKey('budget_cad', $row);
        $this->assertArrayHasKey('actual_cad', $row);
        $this->assertArrayHasKey('variance_cad', $row);
        $this->assertArrayHasKey('percentage', $row);
    }
}

<?php

namespace Tests\Feature;

use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_guests_are_redirected_from_income_page(): void
    {
        auth()->logout();

        $response = $this->get(route('income'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_income_page(): void
    {
        $response = $this->get(route('income'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('income'));
    }

    public function test_user_can_create_income_line_with_cad_amount(): void
    {
        $response = $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'Salary - Main Job',
            'amount_cad' => 5000.00,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.description', 'Salary - Main Job')
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('data.amount_cad', 5000)
            ->assertJsonPath('data.line_number', 1);

        $this->assertDatabaseHas('income', [
            'period' => '202501',
            'description' => 'Salary - Main Job',
            'amount_cad' => 5000.00,
        ]);
    }

    public function test_income_line_supports_multiple_currencies(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $response = $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'Mixed Income',
            'amount_cad' => 1000.00,
            'amount_usd' => 500.00,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.amount_cad', 1000)
            ->assertJsonPath('data.amount_usd', 500)
            // 1000 CAD + (500 USD * 0.75) = 1375 CAD
            ->assertJsonPath('data.total_cad_equivalent', 1375);

        $this->assertDatabaseHas('income', [
            'description' => 'Mixed Income',
            'amount_cad' => 1000.00,
            'amount_usd' => 500.00,
        ]);
    }

    public function test_period_allows_up_to_six_income_lines(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $response = $this->postJson('/api/income', [
                'period' => '202501',
                'description' => "Income line {$i}",
                'amount_cad' => 100 * $i,
            ]);
            $response->assertCreated();
        }

        $this->assertSame(6, Income::forPeriod('202501')->count());

        $response = $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'Seventh line should fail',
            'amount_cad' => 50,
        ]);

        $response->assertStatus(422);
        $this->assertSame(6, Income::forPeriod('202501')->count());
    }

    public function test_income_total_is_computed_in_cad_equivalent(): void
    {
        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);

        $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'CAD income',
            'amount_cad' => 3000.00,
        ])->assertCreated();

        $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'USD income',
            'amount_usd' => 1000.00,
        ])->assertCreated();

        $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'COP income',
            'amount_cop' => 2000000,
        ])->assertCreated();

        $response = $this->getJson('/api/income?period=202501');

        $response->assertOk()
            ->assertJsonPath('meta.total', 3)
            // 3000 + (1000 * 0.75) + (2000000 / 3000) = 3000 + 750 + 666.67 = 4416.67
            ->assertJsonPath('meta.total_cad_equivalent', 4416.67);
    }

    public function test_create_requires_at_least_one_amount(): void
    {
        $response = $this->postJson('/api/income', [
            'period' => '202501',
            'description' => 'Empty amounts',
        ]);

        $response->assertStatus(422);
    }

    public function test_list_requires_period_query_param(): void
    {
        $response = $this->getJson('/api/income');

        $response->assertStatus(422);
    }

    public function test_user_can_delete_income_line(): void
    {
        $income = Income::create([
            'period' => '202501',
            'description' => 'To delete',
            'line_number' => 1,
            'amount_cad' => 100,
        ]);

        $response = $this->deleteJson("/api/income/{$income->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('income', ['id' => $income->id]);
    }
}

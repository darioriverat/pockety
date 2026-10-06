<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryActualsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Category $transport;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->groceries = Category::factory()->create([
            'code' => 'C001',
            'name' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $this->transport = Category::factory()->create([
            'code' => 'C004',
            'name' => 'Transportation',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Category::factory()->create([
            'code' => 'C040',
            'name' => 'Kids Allowance (retired)',
            'is_debt_category' => false,
            'is_active' => false,
        ]);

        $this->seedExchangeRate([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_authenticated_users_can_visit_category_actuals_page(): void
    {
        $response = $this->get(route('category-actuals'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('category-actuals'));
    }

    public function test_guests_are_redirected_from_category_actuals_page(): void
    {
        auth()->logout();

        $response = $this->get(route('category-actuals'));

        $response->assertRedirect();
    }

    public function test_category_actuals_aggregates_by_category_and_period(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'First groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 50.25,
            'comments' => 'Second groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->transport->id,
            'amount_cad' => 30.00,
            'comments' => 'Bus',
        ]);

        // Different period — must not be included
        Transaction::create([
            'date' => '2025-02-01',
            'period' => '202502',
            'category_id' => $this->groceries->id,
            'amount_cad' => 999.00,
            'comments' => 'Feb groceries',
        ]);

        $response = $this->getJson('/api/category-actuals?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.period', '202501')
            ->assertJsonPath('meta.currency', 'CAD');

        $categories = collect($response->json('data.categories'));
        $c001 = $categories->firstWhere('category_code', 'C001');
        $c004 = $categories->firstWhere('category_code', 'C004');

        $this->assertNotNull($c001);
        $this->assertEquals(150.25, $c001['actual_cad']);
        $this->assertEquals(2, $c001['transaction_count']);

        $this->assertNotNull($c004);
        $this->assertEquals(30.0, $c004['actual_cad']);
        $this->assertEquals(1, $c004['transaction_count']);
    }

    public function test_category_actuals_include_new_transactions_after_refresh(): void
    {
        Transaction::create([
            'date' => '2025-01-05',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Initial',
        ]);

        $first = $this->getJson('/api/category-actuals?period=202501');
        $first->assertOk();
        $c001First = collect($first->json('data.categories'))->firstWhere('category_code', 'C001');
        $this->assertEquals(100.0, $c001First['actual_cad']);
        $this->assertEquals(1, $c001First['transaction_count']);

        Transaction::create([
            'date' => '2025-01-25',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 42.50,
            'comments' => 'Added later',
        ]);

        $second = $this->getJson('/api/category-actuals?period=202501');
        $second->assertOk();
        $c001Second = collect($second->json('data.categories'))->firstWhere('category_code', 'C001');
        $this->assertEquals(142.5, $c001Second['actual_cad']);
        $this->assertEquals(2, $c001Second['transaction_count']);
    }

    public function test_category_actuals_omits_categories_without_transactions_in_selected_period(): void
    {
        Transaction::create([
            'date' => '2026-01-15',
            'period' => '202601',
            'category_id' => $this->groceries->id,
            'amount_cad' => 125.50,
        ]);
        Transaction::create([
            'date' => '2025-12-15',
            'period' => '202512',
            'category_id' => $this->transport->id,
            'amount_cad' => 999,
        ]);

        $this->getJson('/api/category-actuals?period=202601')->assertOk()
            ->assertJsonCount(1, 'data.categories')
            ->assertJsonPath('data.categories.0.category_code', 'C001')
            ->assertJsonPath('data.categories.0.actual_cad', 125.5)
            ->assertJsonPath('data.categories.0.transaction_count', 1)
            ->assertJsonPath('meta.category_count', 1);

        $this->getJson('/api/category-actuals?period=202602')->assertOk()
            ->assertJsonCount(0, 'data.categories')
            ->assertJsonPath('meta.total_transactions', 0);
    }

    public function test_category_actuals_keeps_inactive_and_zero_net_categories_ordered_by_code(): void
    {
        $this->transport->update(['is_active' => false]);
        foreach ([[$this->transport, 25], [$this->groceries, 10], [$this->groceries, -10]] as [$category, $amount]) {
            Transaction::create([
                'date' => '2026-01-15',
                'period' => '202601',
                'category_id' => $category->id,
                'amount_cad' => $amount,
            ]);
        }

        $this->getJson('/api/category-actuals?period=202601')->assertOk()
            ->assertJsonCount(2, 'data.categories')
            ->assertJsonPath('data.categories.0.category_code', 'C001')
            ->assertJsonPath('data.categories.0.transaction_count', 2)
            ->assertJsonPath('data.categories.1.category_code', 'C004')
            ->assertJsonPath('data.categories.1.transaction_count', 1);
        $response = $this->getJson('/api/category-actuals?period=202601');
        $this->assertEquals(0, $response->json('data.categories.0.actual_cad'));
        $this->assertEquals(25, $response->json('meta.total_actual_cad'));
    }

    public function test_category_actuals_converts_multi_currency_to_cad(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'amount_usd' => 40.00, // 40 * 0.75 = 30 CAD
            'amount_cop' => 6000.00, // 6000 / 4400 * 0.75 = 1.02 CAD
            'comments' => 'Multi-currency',
        ]);

        $response = $this->getJson('/api/category-actuals?period=202501');

        $response->assertOk();
        $c001 = collect($response->json('data.categories'))->firstWhere('category_code', 'C001');
        $this->assertEquals(131.02, $c001['actual_cad']);
    }

    public function test_category_actuals_rejects_invalid_period_format(): void
    {
        $response = $this->getJson('/api/category-actuals?period=01/2025');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }

    public function test_category_actuals_requires_period(): void
    {
        $response = $this->getJson('/api/category-actuals');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }
}

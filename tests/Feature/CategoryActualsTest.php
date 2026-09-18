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
            'name_es' => 'MERCADO',
            'name_en' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $this->transport = Category::factory()->create([
            'code' => 'C004',
            'name_es' => 'TRANSPORTES',
            'name_en' => 'Transportation',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Category::factory()->create([
            'code' => 'C040',
            'name_es' => 'MESADA NIÑAS',
            'name_en' => 'Kids Allowance (retired)',
            'is_debt_category' => false,
            'is_active' => false,
        ]);

        ExchangeRate::create([
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
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'First groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 50.25,
            'comments' => 'Second groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $this->transport->id,
            'amount_cad' => 30.00,
            'comments' => 'Bus',
        ]);

        // Different period — must not be included
        Transaction::create([
            'date' => '2025-02-01',
            'period' => '202502',
            'quincena' => 'Q1',
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
            'quincena' => 'Q1',
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
            'quincena' => 'Q2',
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

    public function test_category_actuals_lists_all_active_categories_including_zeros(): void
    {
        $response = $this->getJson('/api/category-actuals?period=202501');

        $response->assertOk();

        $categories = collect($response->json('data.categories'));
        $codes = $categories->pluck('category_code')->all();

        $this->assertContains('C001', $codes);
        $this->assertContains('C004', $codes);
        $this->assertContains('I01', $codes);
        $this->assertNotContains('C040', $codes);
        $this->assertEquals(3, $response->json('meta.category_count'));

        $c001 = $categories->firstWhere('category_code', 'C001');
        $this->assertEquals(0.0, $c001['actual_cad']);
        $this->assertEquals(0, $c001['transaction_count']);
    }

    public function test_category_actuals_converts_multi_currency_to_cad(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'amount_usd' => 40.00, // 40 * 0.75 = 30 CAD
            'amount_cop' => 6000.00, // 6000 / 3000 = 2 CAD
            'comments' => 'Multi-currency',
        ]);

        $response = $this->getJson('/api/category-actuals?period=202501');

        $response->assertOk();
        $c001 = collect($response->json('data.categories'))->firstWhere('category_code', 'C001');
        $this->assertEquals(132.0, $c001['actual_cad']);
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

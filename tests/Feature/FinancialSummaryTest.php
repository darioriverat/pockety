<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialSummaryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $groceries;

    private Category $fordEscape;

    private Category $depreciation;

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

        $this->fordEscape = Category::factory()->create([
            'code' => 'C044',
            'name_es' => 'CREDITO FORD ESCAPE',
            'name_en' => 'Ford Escape Auto Loan Payment',
            'is_debt_category' => true,
            'is_active' => true,
        ]);

        $this->depreciation = Category::factory()->create([
            'code' => 'C045',
            'name_es' => 'DEPRECIACIONES',
            'name_en' => 'Depreciation',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Category::factory()->create([
            'code' => 'C009',
            'name_es' => 'CRÉDITO DAVIVIENDA',
            'name_en' => 'Davivienda Credit Payment',
            'is_debt_category' => true,
            'is_active' => true,
        ]);

        ExchangeRate::create([
            'period' => '202501',
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    public function test_authenticated_users_can_visit_financial_summary_page(): void
    {
        $response = $this->get(route('financial-summary'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('financial-summary'));
    }

    public function test_guests_are_redirected_from_financial_summary_page(): void
    {
        auth()->logout();

        $response = $this->get(route('financial-summary'));

        $response->assertRedirect(route('login'));
    }

    public function test_total_recorded_disbursements_sums_all_category_totals_including_debt(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 200.00,
            'comments' => 'Groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-12',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 550.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 750)
            ->assertJsonPath('meta.debt_payment_categories', [
                'C009', 'C010', 'C027', 'C038', 'C039', 'C044', 'C046',
            ]);

        $codes = collect($response->json('data.category_totals'))
            ->pluck('category_code')
            ->all();

        $this->assertContains('C044', $codes);
        $this->assertContains('C009', $codes);
    }

    public function test_net_operating_expenses_excludes_principal_and_depreciation_keeps_interest(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 500.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 50.00,
            'debt_component' => 'interest',
            'comments' => 'FORD ESC INTERESES',
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'quincena' => 'Q2',
            'category_id' => $this->depreciation->id,
            'amount_cad' => 75.00,
            'comments' => 'Depreciation',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        // Disbursements = 100 + 500 + 50 + 75 = 725
        // Net operating = 725 - 500 principal - 75 depreciation = 150 (100 groceries + 50 interest)
        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 725)
            ->assertJsonPath('data.net_operating_expenses_cad', 150)
            ->assertJsonPath('data.debt_principal_excluded_cad', 500)
            ->assertJsonPath('data.depreciation_excluded_cad', 75)
            ->assertJsonPath('data.debt_interest_included_cad', 50);
    }

    public function test_ford_escape_loan_principal_excluded_from_net_operating_expenses(): void
    {
        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 500.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 50.00,
            'debt_component' => 'interest',
            'comments' => 'FORD ESC INTERESES',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 550)
            ->assertJsonPath('data.net_operating_expenses_cad', 50);

        $c044 = collect($response->json('data.category_totals'))
            ->firstWhere('category_code', 'C044');

        $this->assertNotNull($c044);
        $this->assertTrue($c044['is_debt_category']);
        $this->assertEquals(500.0, $c044['principal_cad']);
        $this->assertEquals(50.0, $c044['interest_cad']);
        $this->assertEquals(550.0, $c044['total_cad']);
    }

    public function test_period_is_required_for_financial_summary_api(): void
    {
        $response = $this->getJson('/api/financial-summary');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }
}

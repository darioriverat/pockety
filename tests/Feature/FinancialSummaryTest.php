<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Income;
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
            'name' => 'Groceries',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        $this->fordEscape = Category::factory()->create([
            'code' => 'C044',
            'name' => 'Ford Escape Auto Loan Payment',
            'is_debt_category' => true,
            'is_active' => true,
        ]);

        $this->depreciation = Category::factory()->create([
            'code' => 'C045',
            'name' => 'Depreciation',
            'is_debt_category' => false,
            'is_active' => true,
        ]);

        Category::factory()->create([
            'code' => 'C009',
            'name' => 'Davivienda Credit Payment',
            'is_debt_category' => true,
            'is_active' => true,
        ]);

        $this->seedExchangeRate([
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
            'category_id' => $this->groceries->id,
            'amount_cad' => 200.00,
            'comments' => 'Groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-12',
            'period' => '202501',
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
        $this->assertNotContains('C009', $codes);
    }

    public function test_net_operating_expenses_excludes_principal_and_depreciation_keeps_interest(): void
    {
        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Groceries',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 500.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 50.00,
            'debt_component' => 'interest',
            'comments' => 'FORD ESC INTERESES',
        ]);

        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->depreciation->id,
            'amount_cad' => 75.00,
            'comments' => 'Depreciation',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        // Disbursements = 100 + 500 + 50 + 75 = 725
        // Net operating = 725 - 500 principal - 75 depreciation - 50 interests = 100 (100 groceries)
        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 725)
            ->assertJsonPath('data.net_operating_expenses_cad', 100)
            ->assertJsonPath('data.debt_principal_excluded_cad', 500)
            ->assertJsonPath('data.depreciation_excluded_cad', 75)
            ->assertJsonPath('data.debt_interest_included_cad', 50);
    }

    public function test_ford_escape_loan_principal_excluded_from_net_operating_expenses(): void
    {
        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 500.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 50.00,
            'debt_component' => 'interest',
            'comments' => 'FORD ESC INTERESES',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 550)
            ->assertJsonPath('data.net_operating_expenses_cad', 0);

        $c044 = collect($response->json('data.category_totals'))
            ->firstWhere('category_code', 'C044');

        $this->assertNotNull($c044);
        $this->assertTrue($c044['is_debt_category']);
        $this->assertEquals(500.0, $c044['principal_cad']);
        $this->assertEquals(50.0, $c044['interest_cad']);
        $this->assertEquals(550.0, $c044['total_cad']);
    }

    public function test_net_operating_expenses_excludes_complementary_debt_payment_spends(): void
    {
        $bank = Account::create([
            'name' => 'Checking',
            'type' => 'bank',
            'primary_currency' => 'CAD',
            'is_active' => true,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'account_id' => $bank->id,
            'amount_cad' => 110.00,
            'is_debt_payment' => true,
            'comments' => 'Loan cash source',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 100.00,
            'debt_component' => 'principal',
            'comments' => 'FORD ESC CAPITAL',
        ]);

        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->fordEscape->id,
            'amount_cad' => 10.00,
            'debt_component' => 'interest',
            'comments' => 'FORD ESC INTERESES',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        // Disbursements = 110 + 100 + 10 = 220
        // Net operating = 220 - 100 principal - 110 debt-payment spend - 10 interest = 0
        $response->assertOk()
            ->assertJsonPath('data.total_recorded_disbursements_cad', 220)
            ->assertJsonPath('data.net_operating_expenses_cad', 0)
            ->assertJsonPath('data.debt_principal_excluded_cad', 100)
            ->assertJsonPath('data.debt_payments_excluded_cad', 110)
            ->assertJsonPath('data.debt_interest_included_cad', 10);
    }

    public function test_period_is_required_for_financial_summary_api(): void
    {
        $response = $this->getJson('/api/financial-summary');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['period']);
    }

    public function test_financial_summary_includes_income_lines_and_net(): void
    {
        Income::create([
            'period' => '202501',
            'description' => 'Salary CAD',
            'line_number' => 1,
            'amount_cad' => 4000,
        ]);
        Income::create([
            'period' => '202501',
            'description' => 'Freelance USD',
            'line_number' => 2,
            'amount_usd' => 750,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 200.00,
            'comments' => 'Groceries',
        ]);

        $response = $this->getJson('/api/financial-summary?period=202501');

        // Income: 4000 CAD + (750 USD * 0.75) = 4000 + 562.5 = 4562.5
        // Net operating expenses: 200
        // Net: 4562.5 - 200 = 4362.5
        $response->assertOk()
            ->assertJsonPath('data.total_income_cad', 4562.5)
            ->assertJsonPath('data.net_operating_expenses_cad', 200)
            ->assertJsonPath('data.net_cad', 4362.5)
            ->assertJsonPath('links.export_pdf', route('financial-summary.export-pdf', ['period' => '202501']));

        $this->assertCount(2, $response->json('data.income_lines'));
        $this->assertEquals('Salary CAD', $response->json('data.income_lines.0.description'));
    }

    public function test_user_can_export_income_statement_pdf_for_a_period(): void
    {
        Income::create([
            'period' => '202501',
            'description' => 'Primary Salary',
            'line_number' => 1,
            'amount_cad' => 3500,
        ]);

        Transaction::create([
            'date' => '2025-01-10',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 125.00,
            'comments' => 'Groceries PDF',
        ]);

        $response = $this->get('/api/financial-summary/export?period=202501');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString(
            'attachment; filename="income_statement_202501_',
            (string) $response->headers->get('Content-Disposition')
        );

        $pdf = $response->getContent();
        $this->assertIsString($pdf);
        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertStringContainsString('Income Statement', $pdf);
        $this->assertStringContainsString('Income', $pdf);
        $this->assertStringContainsString('Expenses by Category', $pdf);
        $this->assertStringContainsString('Net', $pdf);
        $this->assertStringContainsString('Primary Salary', $pdf);
        $this->assertStringContainsString('Total Income', $pdf);
        $this->assertStringContainsString('C001', $pdf);
        $this->assertStringContainsString('Groceries', $pdf);
        $this->assertStringContainsString('Net Operating Expenses', $pdf);
    }

    public function test_income_statement_pdf_export_requires_period(): void
    {
        $response = $this->getJson('/api/financial-summary/export');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['period']);
    }

    public function test_income_statement_pdf_export_rejects_invalid_period(): void
    {
        $response = $this->getJson('/api/financial-summary/export?period=2025');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['period']);
    }

    public function test_financial_summary_includes_inactive_categories_with_transactions_in_period(): void
    {
        // Step 1: Create category and inactivate it
        $inactiveCategory = Category::factory()->create([
            'code' => 'C050',
            'name' => 'Inactive with Transactions',
            'is_debt_category' => false,
            'is_income_category' => false,
            'is_active' => false,
        ]);

        // Step 2: Create transaction for this category in period 202501
        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $inactiveCategory->id,
            'amount_cad' => 150.00,
            'comments' => 'Transaction on inactive category',
        ]);

        // Step 3: Call FinancialSummaryService::getSummary for 202501
        $response = $this->getJson('/api/financial-summary?period=202501');

        // Step 4: Verify inactive category appears in category_totals
        $response->assertOk();

        $categoryTotals = $response->json('data.category_totals');
        $codes = collect($categoryTotals)->pluck('category_code')->all();

        // Step 5: Verify inactive category C050 is included
        $this->assertContains('C050', $codes);

        $c050 = collect($categoryTotals)->firstWhere('category_code', 'C050');
        $this->assertNotNull($c050);
        $this->assertEquals(150.0, $c050['total_cad']);
        $this->assertEquals('Inactive with Transactions', $c050['category_name']);
    }

    public function test_financial_summary_excludes_active_categories_with_no_transactions_in_period(): void
    {
        // Step 1: Create active category
        $activeCategory = Category::factory()->create([
            'code' => 'C051',
            'name' => 'Active No Transactions',
            'is_debt_category' => false,
            'is_income_category' => false,
            'is_active' => true,
        ]);

        // Create another category with a transaction to ensure the service works
        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'category_id' => $this->groceries->id,
            'amount_cad' => 100.00,
            'comments' => 'Transaction on different category',
        ]);

        // Step 2: Ensure no transactions for active category C051 in period 202501
        $this->assertDatabaseMissing('transactions', [
            'category_id' => $activeCategory->id,
            'period' => '202501',
        ]);

        // Step 3: Call FinancialSummaryService::getSummary for 202501
        $response = $this->getJson('/api/financial-summary?period=202501');

        // Step 4: Verify active category without transactions is NOT in category_totals
        $response->assertOk();

        $categoryTotals = $response->json('data.category_totals');
        $codes = collect($categoryTotals)->pluck('category_code')->all();

        // Step 5: Verify C051 is excluded
        $this->assertNotContains('C051', $codes);

        // Step 6: Verify C001 (with transaction) is included
        $this->assertContains('C001', $codes);
    }

    public function test_depreciation_calculation_includes_inactive_c045_transactions(): void
    {
        // Step 1-2: C045 exists from setUp; create a depreciation transaction in period.
        Transaction::create([
            'date' => '2025-01-20',
            'period' => '202501',
            'category_id' => $this->depreciation->id,
            'amount_cad' => 75.00,
            'comments' => 'Depreciation on inactive C045',
        ]);

        // Step 3: Inactivate C045 after the transaction exists.
        $this->depreciation->update(['is_active' => false]);
        $this->assertFalse((bool) $this->depreciation->fresh()->is_active);

        // Step 4-6: Summary still includes C045 and depreciation math is unchanged.
        $response = $this->getJson('/api/financial-summary?period=202501');
        $response->assertOk()
            ->assertJsonPath('data.depreciation_excluded_cad', 75)
            ->assertJsonPath('data.total_recorded_disbursements_cad', 75)
            ->assertJsonPath('data.net_operating_expenses_cad', 0);

        $categoryTotals = $response->json('data.category_totals');
        $codes = collect($categoryTotals)->pluck('category_code')->all();
        $this->assertContains('C045', $codes);

        $c045 = collect($categoryTotals)->firstWhere('category_code', 'C045');
        $this->assertNotNull($c045);
        $this->assertTrue($c045['is_depreciation']);
        $this->assertEquals(75.0, $c045['total_cad']);
    }
}

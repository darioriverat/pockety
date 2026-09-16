<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Income;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->actingAs(new User); // Unauthenticated
        auth()->logout();

        $response = $this->get(route('reports.ytd'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_year_to_date_reports_page()
    {
        $response = $this->get(route('reports.ytd'));
        $response->assertOk();
    }

    public function test_year_to_date_totals_are_calculated_correctly()
    {
        $year = 2025;

        // Create exchange rates for the year
        for ($month = 1; $month <= 3; $month++) {
            $period = sprintf('%d%02d', $year, $month);
            ExchangeRate::create([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }

        // Create category and account
        $category = Category::factory()->create(['code' => 'C001', 'name_en' => 'Groceries']);
        $account = Account::factory()->create(['type' => 'bank', 'name' => 'Test Bank']);

        // Create income for each month
        Income::create([
            'period' => '202501',
            'description' => 'Salary Jan',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Income::create([
            'period' => '202502',
            'description' => 'Salary Feb',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Income::create([
            'period' => '202503',
            'description' => 'Salary Mar',
            'line_number' => 1,
            'amount_cad' => 5000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        // Create expense transactions
        Transaction::create([
            'date' => '2025-01-15',
            'period' => '202501',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 1000.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        Transaction::create([
            'date' => '2025-02-15',
            'period' => '202502',
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 1500.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        Transaction::create([
            'date' => '2025-03-15',
            'period' => '202503',
            'quincena' => 'Q2',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 2000.00,
            'amount_usd' => null,
            'amount_cop' => null,
        ]);

        $response = $this->get(route('reports.ytd', ['year' => $year]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->where('ytd_totals.year', $year)
            ->where('ytd_totals.ytd_income_cad', 15000.00)
            ->where('ytd_totals.ytd_expenses_cad', 4500.00)
            ->where('ytd_totals.ytd_net_cad', 10500.00)
            ->where('ytd_totals.period_count', 12) // Full year from January to December
        );
    }

    public function test_year_to_date_defaults_to_current_year_if_not_specified()
    {
        $currentYear = now()->year;

        $response = $this->get(route('reports.ytd'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->where('ytd_totals.year', $currentYear)
        );
    }

    public function test_year_to_date_validates_year_parameter()
    {
        // Test with invalid year (too old)
        $response = $this->get(route('reports.ytd', ['year' => 1999]));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->where('ytd_totals.year', now()->year) // Should default to current year
        );

        // Test with invalid year (too far in future)
        $response = $this->get(route('reports.ytd', ['year' => 2099]));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->where('ytd_totals.year', now()->year) // Should default to current year
        );
    }

    public function test_year_to_date_includes_multi_currency_conversion()
    {
        $year = 2025;
        $period = '202501';

        // Create exchange rate
        ExchangeRate::create([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 1.33, // 1 USD = 1.33 CAD
            'cad_cop' => 3300, // 1 CAD = 3300 COP
        ]);

        // Create income in multiple currencies
        Income::create([
            'period' => $period,
            'description' => 'CAD Salary',
            'line_number' => 1,
            'amount_cad' => 3000.00,
            'amount_usd' => 0,
            'amount_cop' => 0,
        ]);

        Income::create([
            'period' => $period,
            'description' => 'USD Bonus',
            'line_number' => 2,
            'amount_cad' => 0,
            'amount_usd' => 1000.00, // Should convert to 1330 CAD
            'amount_cop' => 0,
        ]);

        // Create category and account
        $category = Category::factory()->create(['code' => 'C001', 'name_en' => 'Groceries']);
        $account = Account::factory()->create(['type' => 'bank', 'name' => 'Test Bank']);

        // Create expense in COP
        Transaction::create([
            'date' => '2025-01-15',
            'period' => $period,
            'quincena' => 'Q1',
            'category_id' => $category->id,
            'account_id' => $account->id,
            'amount_cad' => 0,
            'amount_usd' => 0,
            'amount_cop' => 1650000.00, // Should convert to 500 CAD (1650000 / 3300)
        ]);

        $response = $this->get(route('reports.ytd', ['year' => $year]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->where('ytd_totals.year', $year)
            ->where('ytd_totals.ytd_income_cad', 4330.00) // 3000 CAD + 1330 CAD (from USD)
            ->where('ytd_totals.ytd_expenses_cad', 500.00) // 500 CAD (from COP)
            ->where('ytd_totals.ytd_net_cad', 3830.00)
        );
    }

    public function test_available_years_are_provided()
    {
        $currentYear = now()->year;

        $response = $this->get(route('reports.ytd'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('reports-ytd')
            ->has('available_years')
            ->where('available_years', function ($years) use ($currentYear) {
                return in_array($currentYear, $years) && in_array(2020, $years);
            })
        );
    }
}

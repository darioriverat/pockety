<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        // Get current period from query param or default to current month
        $period = $request->query('period', now()->format('Ym'));

        // Validate period format
        if (! preg_match('/^\d{6}$/', $period)) {
            $period = now()->format('Ym');
        }

        $user = $request->user();
        $defaultCurrency = $user->default_currency ?? 'CAD';
        if (! in_array($defaultCurrency, ['CAD', 'USD', 'COP'], true)) {
            $defaultCurrency = 'CAD';
        }

        $displayCurrency = strtoupper((string) $request->query('currency', $defaultCurrency));
        if (! in_array($displayCurrency, ['CAD', 'USD', 'COP'], true)) {
            $displayCurrency = $defaultCurrency;
        }

        $summary = $this->dashboardService->getSummary($period);
        $incomeExpenseChart = $this->dashboardService->getIncomeExpenseTrend($period, 12);
        $assetsLiabilitiesChart = $this->dashboardService->getAssetsLiabilitiesTrend($period, 12);
        $topSpendingCategories = $this->dashboardService->getTopSpendingCategories($period, 10);
        $recentActivity = $this->dashboardService->getRecentActivity(15);

        return Inertia::render('dashboard', [
            'summary' => $summary,
            'income_expense_chart' => $incomeExpenseChart,
            'assets_liabilities_chart' => $assetsLiabilitiesChart,
            'top_spending_categories' => $topSpendingCategories,
            'recent_activity' => $recentActivity,
            'default_currency' => $defaultCurrency,
            'display_currency' => $displayCurrency,
            'available_currencies' => ['CAD', 'USD', 'COP'],
        ]);
    }
}

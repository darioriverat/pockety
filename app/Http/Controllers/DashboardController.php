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

        $summary = $this->dashboardService->getSummary($period);
        $incomeExpenseChart = $this->dashboardService->getIncomeExpenseTrend($period, 12);
        $assetsLiabilitiesChart = $this->dashboardService->getAssetsLiabilitiesTrend($period, 12);
        $topSpendingCategories = $this->dashboardService->getTopSpendingCategories($period, 10);

        return Inertia::render('dashboard', [
            'summary' => $summary,
            'income_expense_chart' => $incomeExpenseChart,
            'assets_liabilities_chart' => $assetsLiabilitiesChart,
            'top_spending_categories' => $topSpendingCategories,
        ]);
    }
}

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

        return Inertia::render('dashboard', [
            'summary' => $summary,
        ]);
    }
}

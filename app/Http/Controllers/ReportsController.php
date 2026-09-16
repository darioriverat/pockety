<?php

namespace App\Http\Controllers;

use App\Services\ReportsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportsController extends Controller
{
    public function __construct(
        private ReportsService $reportsService
    ) {}

    /**
     * Display the year-to-date reports page.
     */
    public function yearToDate(Request $request): Response
    {
        // Get year from query param or default to current year
        $year = (int) $request->query('year', now()->year);

        // Validate year is reasonable (between 2020 and current year + 1)
        if ($year < 2020 || $year > now()->year + 1) {
            $year = now()->year;
        }

        $ytdTotals = $this->reportsService->getYearToDateTotals($year);

        return Inertia::render('reports-ytd', [
            'ytd_totals' => $ytdTotals,
            'available_years' => $this->getAvailableYears(),
        ]);
    }

    /**
     * Get list of available years for selection.
     *
     * @return list<int>
     */
    private function getAvailableYears(): array
    {
        // Return years from 2020 to current year
        $currentYear = now()->year;
        $years = range(2020, $currentYear);

        return array_values($years);
    }
}

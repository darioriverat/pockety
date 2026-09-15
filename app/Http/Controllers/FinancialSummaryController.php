<?php

namespace App\Http\Controllers;

use App\Services\FinancialSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialSummaryController extends Controller
{
    public function __construct(
        private readonly FinancialSummaryService $financialSummaryService
    ) {}

    /**
     * Financial summary for a period (Total Recorded Disbursements + Net Operating Expenses).
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $summary = $this->financialSummaryService->getSummary($validated['period']);

        return response()->json([
            'data' => [
                'period' => $summary['period'],
                'total_recorded_disbursements_cad' => $summary['total_recorded_disbursements_cad'],
                'net_operating_expenses_cad' => $summary['net_operating_expenses_cad'],
                'debt_principal_excluded_cad' => $summary['debt_principal_excluded_cad'],
                'depreciation_excluded_cad' => $summary['depreciation_excluded_cad'],
                'debt_interest_included_cad' => $summary['debt_interest_included_cad'],
                'category_totals' => $summary['category_totals'],
            ],
            'links' => [
                'self' => route('financial-summary.show', ['period' => $validated['period']]),
            ],
            'meta' => [
                'period' => $summary['period'],
                'currency' => 'CAD',
                'debt_payment_categories' => FinancialSummaryService::DEBT_PAYMENT_CATEGORY_CODES,
                'depreciation_category' => FinancialSummaryService::DEPRECIATION_CATEGORY_CODE,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\FinancialSummaryService;
use App\Services\IncomeStatementPdfExporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FinancialSummaryController extends Controller
{
    public function __construct(
        private readonly FinancialSummaryService $financialSummaryService,
        private readonly IncomeStatementPdfExporter $pdfExporter
    ) {}

    /**
     * Financial summary / income statement for a period.
     *
     * Includes income line items, Total Recorded Disbursements,
     * Net Operating Expenses, and net (income − net operating expenses).
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
                'total_income_cad' => $summary['total_income_cad'],
                'total_recorded_disbursements_cad' => $summary['total_recorded_disbursements_cad'],
                'net_operating_expenses_cad' => $summary['net_operating_expenses_cad'],
                'net_cad' => $summary['net_cad'],
                'debt_principal_excluded_cad' => $summary['debt_principal_excluded_cad'],
                'depreciation_excluded_cad' => $summary['depreciation_excluded_cad'],
                'debt_interest_included_cad' => $summary['debt_interest_included_cad'],
                'debt_payments_excluded_cad' => $summary['debt_payments_excluded_cad'],
                'income_lines' => $summary['income_lines'],
                'category_totals' => $summary['category_totals'],
            ],
            'links' => [
                'self' => route('financial-summary.show', ['period' => $validated['period']]),
                'export_pdf' => route('financial-summary.export-pdf', ['period' => $validated['period']]),
            ],
            'meta' => [
                'period' => $summary['period'],
                'currency' => 'CAD',
                'debt_payment_categories' => FinancialSummaryService::DEBT_PAYMENT_CATEGORY_CODES,
                'depreciation_category' => FinancialSummaryService::DEPRECIATION_CATEGORY_CODE,
            ],
        ]);
    }

    /**
     * Export income statement as a downloadable PDF for a period.
     *
     * GET /api/financial-summary/export?period=YYYYMM
     */
    public function exportPdf(Request $request): Response
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $period = $validated['period'];
        $statement = $this->financialSummaryService->getSummary($period);
        $pdf = $this->pdfExporter->export($statement);
        $filename = 'income_statement_'.$period.'_'.date('Y-m-d').'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => (string) strlen($pdf),
        ]);
    }
}

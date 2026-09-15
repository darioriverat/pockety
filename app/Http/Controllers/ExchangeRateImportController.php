<?php

namespace App\Http\Controllers;

use App\Services\ExchangeRateImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateImportController extends Controller
{
    public function __construct(
        private readonly ExchangeRateImportService $importService
    ) {}

    /**
     * Import historical exchange rates from month_sheets JSON files.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'directory' => 'nullable|string',
        ]);

        $directory = $request->input('directory', 'month_sheets');

        $basePath = base_path('plan/extracted');
        $fullPath = realpath($basePath.'/'.$directory);

        if (!$fullPath || !str_starts_with($fullPath, $basePath) || !is_dir($fullPath)) {
            return response()->json([
                'message' => 'Invalid directory path',
            ], 400);
        }

        try {
            $result = $this->importService->importFromMonthSheets($fullPath);

            return response()->json([
                'message' => 'Exchange rate import completed',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get exchange rate import statistics.
     */
    public function statistics(): JsonResponse
    {
        return response()->json([
            'data' => $this->importService->getImportStatistics(),
        ]);
    }
}

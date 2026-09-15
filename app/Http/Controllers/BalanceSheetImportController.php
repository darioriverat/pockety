<?php

namespace App\Http\Controllers;

use App\Services\BalanceSheetImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BalanceSheetImportController extends Controller
{
    public function __construct(
        private readonly BalanceSheetImportService $importService
    ) {}

    /**
     * Import historical balance sheet data from estado_financiero JSON.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => 'nullable|string',
        ]);

        $fileName = $request->input('file_path', 'estado_financiero_2025_2026.json');

        $basePath = base_path('plan/extracted');
        $fullPath = realpath($basePath.'/'.$fileName);

        if (! $fullPath || ! str_starts_with($fullPath, $basePath) || ! is_file($fullPath)) {
            return response()->json([
                'message' => 'Invalid file path',
            ], 400);
        }

        try {
            $result = $this->importService->importFromFile($fullPath);

            return response()->json([
                'message' => 'Balance sheet history import completed',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get historical balance sheet import statistics.
     */
    public function statistics(): JsonResponse
    {
        return response()->json([
            'data' => $this->importService->getImportStatistics(),
        ]);
    }
}

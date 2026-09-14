<?php

namespace App\Http\Controllers;

use App\Services\TransactionImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionImportController extends Controller
{
    public function __construct(
        private readonly TransactionImportService $importService
    ) {}

    /**
     * Import historical transactions from JSON file.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file_path' => 'required|string',
        ]);

        $filePath = $request->input('file_path');

        // Ensure the file path is within the allowed directory
        $basePath = base_path('plan/extracted');
        $fullPath = realpath($basePath.'/'.$filePath);

        if (! $fullPath || ! str_starts_with($fullPath, $basePath)) {
            return response()->json([
                'message' => 'Invalid file path',
            ], 400);
        }

        try {
            $result = $this->importService->importFromJson($fullPath);

            return response()->json([
                'message' => 'Import completed',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get import statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = $this->importService->getImportStatistics();

        return response()->json([
            'data' => $stats,
        ]);
    }

    /**
     * Clear all transactions (for testing).
     */
    public function clear(): JsonResponse
    {
        $this->importService->clearAllTransactions();

        return response()->json([
            'message' => 'All transactions cleared',
        ]);
    }
}

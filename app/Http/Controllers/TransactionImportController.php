<?php

namespace App\Http\Controllers;

use App\Services\TransactionImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TransactionImportController extends Controller
{
    public function __construct(
        private readonly TransactionImportService $importService
    ) {}

    /**
     * Import transactions from an uploaded JSON or CSV file.
     */
    public function import(Request $request): JsonResponse
    {
        if ($request->has('file_path') || $request->has('directory')) {
            throw ValidationException::withMessages([
                'file' => __('File path and directory imports are not supported. Upload a file instead.'),
            ]);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'extensions:json,csv'],
        ]);

        /** @var UploadedFile $uploaded */
        $uploaded = $request->file('file');
        $storedPath = $uploaded->store('tmp/imports');
        $absolutePath = Storage::path($storedPath);

        try {
            $extension = strtolower($uploaded->getClientOriginalExtension());

            $result = match ($extension) {
                'csv' => $this->importService->importFromCsv($absolutePath),
                default => $this->importService->importFromJson($absolutePath),
            };

            return response()->json([
                'message' => 'Import completed',
                'data' => $result,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: '.$e->getMessage(),
            ], 500);
        } finally {
            Storage::delete($storedPath);
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

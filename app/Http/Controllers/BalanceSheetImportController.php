<?php

namespace App\Http\Controllers;

use App\Services\BalanceSheetImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BalanceSheetImportController extends Controller
{
    public function __construct(
        private readonly BalanceSheetImportService $importService
    ) {}

    /**
     * Import historical balance sheet data from an uploaded JSON file.
     */
    public function import(Request $request): JsonResponse
    {
        if ($request->has('file_path') || $request->has('directory')) {
            throw ValidationException::withMessages([
                'file' => 'File path and directory imports are not supported. Upload a file instead.',
            ]);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'extensions:json'],
        ]);

        /** @var UploadedFile $uploaded */
        $uploaded = $request->file('file');
        $storedPath = $uploaded->store('tmp/imports');
        $absolutePath = Storage::path($storedPath);

        try {
            $result = $this->importService->importFromFile($absolutePath);

            return response()->json([
                'message' => 'Balance sheet history import completed',
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
     * Get historical balance sheet import statistics.
     */
    public function statistics(): JsonResponse
    {
        return response()->json([
            'data' => $this->importService->getImportStatistics(),
        ]);
    }
}

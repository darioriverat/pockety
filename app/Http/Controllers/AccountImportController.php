<?php

namespace App\Http\Controllers;

use App\Services\AccountImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AccountImportController extends Controller
{
    public function __construct(
        private readonly AccountImportService $importService
    ) {}

    /**
     * Import accounts from one or more uploaded month-sheet JSON files.
     */
    public function import(Request $request): JsonResponse
    {
        if ($request->has('file_path') || $request->has('directory')) {
            throw ValidationException::withMessages([
                'files' => 'File path and directory imports are not supported. Upload month-sheet files instead.',
            ]);
        }

        $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'file', 'max:10240', 'extensions:json'],
        ]);

        /** @var list<UploadedFile> $uploads */
        $uploads = array_values($request->file('files', []));
        $storedPaths = [];
        $absolutePaths = [];

        try {
            foreach ($uploads as $uploaded) {
                $storedPath = $uploaded->store('tmp/imports');
                $storedPaths[] = $storedPath;
                $absolutePaths[] = Storage::path($storedPath);
            }

            $result = $this->importService->importFromFiles($absolutePaths);

            return response()->json([
                'message' => 'Account import completed',
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
            foreach ($storedPaths as $storedPath) {
                Storage::delete($storedPath);
            }
        }
    }

    /**
     * Get account import statistics.
     */
    public function statistics(): JsonResponse
    {
        return response()->json([
            'data' => $this->importService->getImportStatistics(),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FixedAssetController extends Controller
{
    /**
     * Get all fixed assets.
     *
     * GET /api/fixed-assets
     */
    public function index(): JsonResponse
    {
        $assets = FixedAsset::active()
            ->orderBy('name')
            ->get();

        $data = $assets->map(fn ($asset) => [
            'id' => $asset->id,
            'name' => $asset->name,
            'description' => $asset->description,
            'acquisition_date' => $asset->acquisition_date?->format('Y-m-d'),
            'initial_value_cad' => (float) $asset->initial_value_cad,
            'is_active' => $asset->is_active,
            'created_at' => $asset->created_at->toISOString(),
            'updated_at' => $asset->updated_at->toISOString(),
        ]);

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('fixed-assets.index'),
            ],
            'meta' => [
                'total' => $data->count(),
            ],
        ]);
    }

    /**
     * Get a fixed asset by ID.
     *
     * GET /api/fixed-assets/{id}
     */
    public function show(int $id): JsonResponse
    {
        $asset = FixedAsset::find($id);

        if (! $asset) {
            return response()->json([
                'error' => 'Fixed asset not found',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'name' => $asset->name,
                'description' => $asset->description,
                'acquisition_date' => $asset->acquisition_date?->format('Y-m-d'),
                'initial_value_cad' => (float) $asset->initial_value_cad,
                'is_active' => $asset->is_active,
                'created_at' => $asset->created_at->toISOString(),
                'updated_at' => $asset->updated_at->toISOString(),
            ],
            'links' => [
                'self' => route('fixed-assets.show', $id),
                'index' => route('fixed-assets.index'),
            ],
        ]);
    }

    /**
     * Create a new fixed asset.
     *
     * POST /api/fixed-assets
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'acquisition_date' => 'nullable|date',
            'initial_value_cad' => 'nullable|numeric|min:0',
        ]);

        $asset = FixedAsset::create($validated);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'name' => $asset->name,
                'description' => $asset->description,
                'acquisition_date' => $asset->acquisition_date?->format('Y-m-d'),
                'initial_value_cad' => (float) $asset->initial_value_cad,
                'is_active' => $asset->is_active,
                'created_at' => $asset->created_at->toISOString(),
                'updated_at' => $asset->updated_at->toISOString(),
            ],
            'links' => [
                'self' => route('fixed-assets.show', $asset->id),
                'index' => route('fixed-assets.index'),
            ],
        ], 201);
    }

    /**
     * Update a fixed asset.
     *
     * PUT/PATCH /api/fixed-assets/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $asset = FixedAsset::find($id);

        if (! $asset) {
            return response()->json([
                'error' => 'Fixed asset not found',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'acquisition_date' => 'nullable|date',
            'initial_value_cad' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $asset->update($validated);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'name' => $asset->name,
                'description' => $asset->description,
                'acquisition_date' => $asset->acquisition_date?->format('Y-m-d'),
                'initial_value_cad' => (float) $asset->initial_value_cad,
                'is_active' => $asset->is_active,
                'created_at' => $asset->created_at->toISOString(),
                'updated_at' => $asset->updated_at->toISOString(),
            ],
            'links' => [
                'self' => route('fixed-assets.show', $asset->id),
                'index' => route('fixed-assets.index'),
            ],
        ]);
    }

    /**
     * Delete a fixed asset (soft delete by setting is_active to false).
     *
     * DELETE /api/fixed-assets/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $asset = FixedAsset::find($id);

        if (! $asset) {
            return response()->json([
                'error' => 'Fixed asset not found',
            ], 404);
        }

        $asset->update(['is_active' => false]);

        return response()->json([
            'message' => 'Fixed asset deactivated successfully',
        ]);
    }

    /**
     * Get valuations for a fixed asset, optionally filtered by period.
     *
     * GET /api/fixed-assets/{id}/valuations?period=202501
     */
    public function valuations(Request $request, int $id): JsonResponse
    {
        $asset = FixedAsset::find($id);

        if (! $asset) {
            return response()->json([
                'error' => 'Fixed asset not found',
            ], 404);
        }

        $query = $asset->valuations()->orderBy('period');

        if ($period = $request->query('period')) {
            $query->where('period', $period);
        }

        $valuations = $query->get();

        $data = $valuations->map(fn ($val) => [
            'id' => $val->id,
            'fixed_asset_id' => $val->fixed_asset_id,
            'period' => $val->period,
            'book_value_cad' => (float) $val->book_value_cad,
            'depreciation_cad' => (float) $val->depreciation_cad,
            'created_at' => $val->created_at->toISOString(),
            'updated_at' => $val->updated_at->toISOString(),
        ]);

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('fixed-assets.valuations', $id),
                'asset' => route('fixed-assets.show', $id),
            ],
            'meta' => [
                'total' => $data->count(),
                'period_filter' => $request->query('period'),
            ],
        ]);
    }

    /**
     * Set book value for a fixed asset in a specific period.
     *
     * POST /api/fixed-assets/{id}/valuations
     */
    public function storeValuation(Request $request, int $id): JsonResponse
    {
        $asset = FixedAsset::find($id);

        if (! $asset) {
            return response()->json([
                'error' => 'Fixed asset not found',
            ], 404);
        }

        $validated = $request->validate([
            'period' => 'required|string|regex:/^\d{6}$/',
            'book_value_cad' => 'required|numeric|min:0',
            'depreciation_cad' => 'nullable|numeric|min:0',
        ]);

        $valuation = FixedAssetValuation::updateOrCreate(
            [
                'fixed_asset_id' => $asset->id,
                'period' => $validated['period'],
            ],
            [
                'book_value_cad' => $validated['book_value_cad'],
                'depreciation_cad' => $validated['depreciation_cad'] ?? 0,
            ]
        );

        return response()->json([
            'data' => [
                'id' => $valuation->id,
                'fixed_asset_id' => $valuation->fixed_asset_id,
                'period' => $valuation->period,
                'book_value_cad' => (float) $valuation->book_value_cad,
                'depreciation_cad' => (float) $valuation->depreciation_cad,
                'created_at' => $valuation->created_at->toISOString(),
                'updated_at' => $valuation->updated_at->toISOString(),
            ],
            'links' => [
                'self' => route('fixed-assets.valuations', $asset->id),
                'asset' => route('fixed-assets.show', $asset->id),
            ],
        ], $valuation->wasRecentlyCreated ? 201 : 200);
    }
}

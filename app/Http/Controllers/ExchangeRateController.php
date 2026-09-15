<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    /**
     * Get exchange rates for a specific period.
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        $period = $request->input('period');
        $rate = ExchangeRate::forPeriod($period);

        if (!$rate) {
            return response()->json([
                'message' => 'Exchange rates not found for period '.$period,
                'data' => null,
            ], 404);
        }

        return response()->json([
            'data' => $rate,
        ]);
    }

    /**
     * List all exchange rates.
     */
    public function index(): JsonResponse
    {
        $rates = ExchangeRate::orderBy('period')->get();

        return response()->json([
            'data' => $rates,
        ]);
    }

    /**
     * Create or update exchange rates for a period.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|string|size:6|regex:/^\d{6}$/',
            'usd_cop' => 'required|numeric|min:0',
            'usd_cad' => 'required|numeric|min:0',
            'cad_cop' => 'required|numeric|min:0',
        ]);

        $rate = ExchangeRate::updateOrCreate(
            ['period' => $validated['period']],
            [
                'usd_cop' => $validated['usd_cop'],
                'usd_cad' => $validated['usd_cad'],
                'cad_cop' => $validated['cad_cop'],
            ]
        );

        return response()->json([
            'message' => 'Exchange rates saved successfully',
            'data' => $rate,
        ]);
    }
}

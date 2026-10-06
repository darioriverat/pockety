<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Models\ExchangeRateSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateSnapshotController extends Controller
{
    public function __construct(
        private readonly OwnerResolverInterface $owner,
    ) {}

    /**
     * List global fetched snapshots and the current user's manual snapshots.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'period' => 'nullable|string|size:6|regex:/^\d{6}$/',
        ]);

        $query = ExchangeRateSnapshot::query()
            ->where(function ($builder) {
                $builder
                    ->where(function ($global) {
                        $global
                            ->where('source', ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES)
                            ->whereNull('user_id');
                    })
                    ->orWhere(function ($manual) {
                        $manual
                            ->where('source', ExchangeRateSnapshot::SOURCE_MANUAL)
                            ->where('user_id', $this->owner->id());
                    });
            })
            ->orderByDesc('rate_date')
            ->orderBy('source');

        if (! empty($validated['period'])) {
            $year = (int) substr($validated['period'], 0, 4);
            $month = (int) substr($validated['period'], 4, 2);
            $from = sprintf('%04d-%02d-01', $year, $month);
            $to = date('Y-m-t', strtotime($from));
            $query->whereDate('rate_date', '>=', $from)
                ->whereDate('rate_date', '<=', $to);
        } else {
            if (! empty($validated['from'])) {
                $query->whereDate('rate_date', '>=', $validated['from']);
            }
            if (! empty($validated['to'])) {
                $query->whereDate('rate_date', '<=', $validated['to']);
            }
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    /**
     * Create or update the current user's manual snapshot for a date.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rate_date' => 'required|date',
            'cad_per_usd' => 'required|numeric|gt:0',
            'cop_per_usd' => 'required|numeric|gt:0',
            'usd_cop' => 'prohibited',
            'usd_cad' => 'prohibited',
            'cad_cop' => 'prohibited',
        ], [
            'cad_per_usd.gt' => 'CAD per 1 USD must be a positive number.',
            'cop_per_usd.gt' => 'COP per 1 USD must be a positive number.',
        ]);

        $snapshot = ExchangeRateSnapshot::query()
            ->where('source', ExchangeRateSnapshot::SOURCE_MANUAL)
            ->where('user_id', $this->owner->id())
            ->whereDate('rate_date', $validated['rate_date'])
            ->first();

        if ($snapshot) {
            $snapshot->update([
                'cad_per_usd' => $validated['cad_per_usd'],
                'cop_per_usd' => $validated['cop_per_usd'],
            ]);
        } else {
            $snapshot = ExchangeRateSnapshot::query()->create([
                'rate_date' => $validated['rate_date'],
                'source' => ExchangeRateSnapshot::SOURCE_MANUAL,
                'user_id' => $this->owner->id(),
                'cad_per_usd' => $validated['cad_per_usd'],
                'cop_per_usd' => $validated['cop_per_usd'],
            ]);
        }

        return response()->json([
            'message' => 'Manual exchange rate snapshot saved successfully',
            'data' => $snapshot->fresh(),
        ]);
    }

    /**
     * Show a snapshot visible to the current user (global or own manual).
     */
    public function show(int $snapshot): JsonResponse
    {
        $row = ExchangeRateSnapshot::query()
            ->whereKey($snapshot)
            ->where(function ($builder) {
                $builder
                    ->where(function ($global) {
                        $global
                            ->where('source', ExchangeRateSnapshot::SOURCE_OPEN_EXCHANGE_RATES)
                            ->whereNull('user_id');
                    })
                    ->orWhere(function ($manual) {
                        $manual
                            ->where('source', ExchangeRateSnapshot::SOURCE_MANUAL)
                            ->where('user_id', $this->owner->id());
                    });
            })
            ->first();

        if (! $row) {
            return response()->json([
                'message' => 'Exchange rate snapshot not found',
            ], 404);
        }

        return response()->json([
            'data' => $row,
        ]);
    }
}

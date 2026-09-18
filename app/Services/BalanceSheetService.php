<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\ExchangeRate;
use App\Models\FixedAsset;
use App\Models\FixedAssetValuation;
use Illuminate\Support\Facades\Log;

class BalanceSheetService
{
    /**
     * Build the balance sheet for a period.
     *
     * Assets = bank + investment + receivable recorded balances + fixed asset book values
     * Liabilities = credit cards + loans (liability accounts)
     * Equity = Assets − Liabilities
     *
     * Totals are expressed in CAD and converted to USD/COP using the period exchange rates.
     *
     * @return array{
     *     period: string,
     *     total_assets: array{
     *         cad: float,
     *         usd: float,
     *         cop: float,
     *         accounts_cad: float,
     *         fixed_assets_cad: float,
     *         breakdown: list<array<string, mixed>>
     *     },
     *     total_liabilities: array{
     *         cad: float,
     *         usd: float,
     *         cop: float,
     *         breakdown: list<array<string, mixed>>
     *     },
     *     equity: array{cad: float, usd: float, cop: float},
     *     exchange_rates: array{usd_cop: float, usd_cad: float, cad_cop: float}
     * }
     */
    public function getBalanceSheet(string $period): array
    {
        $exchangeRate = $this->resolveExchangeRate($period);

        $assetBreakdown = [];
        $liabilityBreakdown = [];
        $accountsAssetsCad = 0.0;
        $liabilitiesCad = 0.0;

        $accounts = Account::active()->orderBy('type')->orderBy('name')->get();

        foreach ($accounts as $account) {
            $balance = AccountBalance::where('account_id', $account->id)
                ->where('period', $period)
                ->first();

            if (! $balance) {
                continue;
            }

            $cadEquivalent = $this->balanceCadEquivalent($balance, $exchangeRate);

            if ($cadEquivalent == 0.0) {
                continue;
            }

            $row = [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->type,
                'cad' => round($cadEquivalent, 2),
                'usd' => $exchangeRate->cadToUsd($cadEquivalent),
                'cop' => $exchangeRate->cadToCop($cadEquivalent),
                'recorded_balance_cad' => (float) ($balance->recorded_balance_cad ?? 0),
                'recorded_balance_usd' => (float) ($balance->recorded_balance_usd ?? 0),
                'recorded_balance_cop' => (float) ($balance->recorded_balance_cop ?? 0),
            ];

            if ($account->isAsset()) {
                $accountsAssetsCad += $cadEquivalent;
                $assetBreakdown[] = $row;
            } elseif ($account->isLiability()) {
                $liabilitiesCad += abs($cadEquivalent);
                $row['cad'] = round(abs($cadEquivalent), 2);
                $row['usd'] = $exchangeRate->cadToUsd(abs($cadEquivalent));
                $row['cop'] = $exchangeRate->cadToCop(abs($cadEquivalent));
                $liabilityBreakdown[] = $row;
            }
        }

        $fixedAssetsCad = 0.0;
        $fixedAssets = FixedAsset::active()->orderBy('name')->get();

        foreach ($fixedAssets as $fixedAsset) {
            $bookValueCad = $this->fixedAssetBookValueCad($fixedAsset, $period);

            if ($bookValueCad == 0.0) {
                continue;
            }

            $fixedAssetsCad += $bookValueCad;
            $assetBreakdown[] = [
                'id' => $fixedAsset->id,
                'name' => $fixedAsset->name,
                'type' => 'fixed_asset',
                'cad' => round($bookValueCad, 2),
                'usd' => $exchangeRate->cadToUsd($bookValueCad),
                'cop' => $exchangeRate->cadToCop($bookValueCad),
                'recorded_balance_cad' => round($bookValueCad, 2),
                'recorded_balance_usd' => 0.0,
                'recorded_balance_cop' => 0.0,
            ];
        }

        $totalAssetsCad = round($accountsAssetsCad + $fixedAssetsCad, 2);
        $totalLiabilitiesCad = round($liabilitiesCad, 2);
        $equityCad = round($totalAssetsCad - $totalLiabilitiesCad, 2);

        return [
            'period' => $period,
            'total_assets' => [
                'cad' => $totalAssetsCad,
                'usd' => $exchangeRate->cadToUsd($totalAssetsCad),
                'cop' => $exchangeRate->cadToCop($totalAssetsCad),
                'accounts_cad' => round($accountsAssetsCad, 2),
                'fixed_assets_cad' => round($fixedAssetsCad, 2),
                'breakdown' => $assetBreakdown,
            ],
            'total_liabilities' => [
                'cad' => $totalLiabilitiesCad,
                'usd' => $exchangeRate->cadToUsd($totalLiabilitiesCad),
                'cop' => $exchangeRate->cadToCop($totalLiabilitiesCad),
                'breakdown' => $liabilityBreakdown,
            ],
            'equity' => [
                'cad' => $equityCad,
                'usd' => $exchangeRate->cadToUsd($equityCad),
                'cop' => $exchangeRate->cadToCop($equityCad),
            ],
            'exchange_rates' => [
                'usd_cop' => (float) $exchangeRate->usd_cop,
                'usd_cad' => (float) $exchangeRate->usd_cad,
                'cad_cop' => (float) $exchangeRate->cad_cop,
            ],
        ];
    }

    /**
     * Build Assets / Liabilities / Equity totals for every period in a range
     * (source equivalent: "Estado Financiero" time series).
     *
     * Defaults to the in-scope window January 2025 through September 2026.
     *
     * @return array{
     *     from: string,
     *     to: string,
     *     periods: list<array{
     *         period: string,
     *         total_assets: array{cad: float, usd: float, cop: float},
     *         total_liabilities: array{cad: float, usd: float, cop: float},
     *         equity: array{cad: float, usd: float, cop: float}
     *     }>
     * }
     */
    public function getTimeSeries(string $from = '202501', string $to = '202609'): array
    {
        $series = [];

        foreach ($this->periodsBetween($from, $to) as $period) {
            $sheet = $this->getBalanceSheet($period);

            $series[] = [
                'period' => $period,
                'total_assets' => [
                    'cad' => $sheet['total_assets']['cad'],
                    'usd' => $sheet['total_assets']['usd'],
                    'cop' => $sheet['total_assets']['cop'],
                ],
                'total_liabilities' => [
                    'cad' => $sheet['total_liabilities']['cad'],
                    'usd' => $sheet['total_liabilities']['usd'],
                    'cop' => $sheet['total_liabilities']['cop'],
                ],
                'equity' => [
                    'cad' => $sheet['equity']['cad'],
                    'usd' => $sheet['equity']['usd'],
                    'cop' => $sheet['equity']['cop'],
                ],
            ];
        }

        return [
            'from' => $from,
            'to' => $to,
            'periods' => $series,
        ];
    }

    /**
     * @return list<string>
     */
    private function periodsBetween(string $from, string $to): array
    {
        $periods = [];
        $year = (int) substr($from, 0, 4);
        $month = (int) substr($from, 4, 2);
        $endYear = (int) substr($to, 0, 4);
        $endMonth = (int) substr($to, 4, 2);

        while ($year < $endYear || ($year === $endYear && $month <= $endMonth)) {
            $periods[] = sprintf('%04d%02d', $year, $month);
            $month++;
            if ($month > 12) {
                $month = 1;
                $year++;
            }
        }

        return $periods;
    }

    private function balanceCadEquivalent(AccountBalance $balance, ExchangeRate $exchangeRate): float
    {
        $cadEquivalent = 0.0;

        if ($balance->recorded_balance_cad !== null && (float) $balance->recorded_balance_cad != 0) {
            $cadEquivalent += (float) $balance->recorded_balance_cad;
        }

        if ($balance->recorded_balance_usd !== null && (float) $balance->recorded_balance_usd != 0) {
            $cadEquivalent += $exchangeRate->usdToCad((float) $balance->recorded_balance_usd);
        }

        if ($balance->recorded_balance_cop !== null && (float) $balance->recorded_balance_cop != 0) {
            $cadEquivalent += $exchangeRate->copToCad((float) $balance->recorded_balance_cop);
        }

        return $cadEquivalent;
    }

    private function fixedAssetBookValueCad(FixedAsset $fixedAsset, string $period): float
    {
        /** @var FixedAssetValuation|null $valuation */
        $valuation = $fixedAsset->valuationForPeriod($period);

        if ($valuation !== null) {
            return (float) $valuation->book_value_cad;
        }

        if ($fixedAsset->initial_value_cad !== null) {
            return (float) $fixedAsset->initial_value_cad;
        }

        return 0.0;
    }

    private function resolveExchangeRate(string $period): ExchangeRate
    {
        $exchangeRate = ExchangeRate::forPeriod($period);

        if (! $exchangeRate) {
            Log::warning("No exchange rate found for period {$period}, using defaults");

            return new ExchangeRate([
                'period' => $period,
                'usd_cop' => 4400,
                'usd_cad' => 0.75,
                'cad_cop' => 3000,
            ]);
        }

        return $exchangeRate;
    }
}

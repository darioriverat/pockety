<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Transaction;

class ReconciliationService
{
    /**
     * Acceptable rounding tolerance (in currency units) for considering a variance "balanced".
     */
    private const VARIANCE_THRESHOLD = 0.01;

    /**
     * Build the full reconciliation report for a given period (YYYYMM).
     *
     * For every active account, computes:
     * - Recorded: the manually-entered balance for the period (0 if not yet entered).
     * - Computed: a "known prior balance" (the most recent recorded balance for a period
     *   strictly before this one; if none exists yet, the current period's own recorded
     *   balance is used as the baseline) minus the sum of this period's expense
     *   transactions for the account.
     * - Variance: Recorded minus Computed.
     *
     * @return array{period: string, status: string, accounts: array<int, array<string, mixed>>}
     */
    public function reconcileForPeriod(string $period): array
    {
        $accounts = Account::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $results = [];

        foreach ($accounts as $account) {
            $results[] = $this->reconcileAccount($account, $period);
        }

        $overallBalanced = collect($results)->every(fn (array $result) => $result['is_balanced']);

        return [
            'period' => $period,
            'status' => $overallBalanced ? 'balanced' : 'unbalanced',
            'accounts' => $results,
        ];
    }

    /**
     * Compute the recorded/computed/variance figures for a single account and period.
     *
     * @return array<string, mixed>
     */
    public function reconcileAccount(Account $account, string $period): array
    {
        /** @var AccountBalance|null $recordedBalance */
        $recordedBalance = $account->balances()->where('period', $period)->first();

        $priorBalance = $account->balances()
            ->where('period', '<', $period)
            ->orderBy('period', 'desc')
            ->first();

        // Base balance to roll forward from: the most recent balance recorded
        // strictly before this period, or (if this is the first tracked period
        // for this account) this period's own recorded balance.
        /** @var AccountBalance|null $base */
        $base = $priorBalance ?? $recordedBalance;

        $baseCad = $base ? (float) $base->recorded_balance_cad : 0.0;
        $baseUsd = $base ? (float) $base->recorded_balance_usd : 0.0;
        $baseCop = $base ? (float) $base->recorded_balance_cop : 0.0;

        $txSums = Transaction::where('account_id', $account->id)
            ->where('period', $period)
            ->selectRaw('COALESCE(SUM(amount_cad), 0) as sum_cad, COALESCE(SUM(amount_usd), 0) as sum_usd, COALESCE(SUM(amount_cop), 0) as sum_cop')
            ->first();

        // Expense amounts are stored as positive values; they reduce account balances.
        $computedCad = $baseCad - (float) ($txSums->sum_cad ?? 0);
        $computedUsd = $baseUsd - (float) ($txSums->sum_usd ?? 0);
        $computedCop = $baseCop - (float) ($txSums->sum_cop ?? 0);

        $recordedCad = $recordedBalance ? (float) $recordedBalance->recorded_balance_cad : 0.0;
        $recordedUsd = $recordedBalance ? (float) $recordedBalance->recorded_balance_usd : 0.0;
        $recordedCop = $recordedBalance ? (float) $recordedBalance->recorded_balance_cop : 0.0;

        $varianceCad = round($recordedCad - $computedCad, 2);
        $varianceUsd = round($recordedUsd - $computedUsd, 2);
        $varianceCop = round($recordedCop - $computedCop, 2);

        $isBalanced = abs($varianceCad) <= self::VARIANCE_THRESHOLD
            && abs($varianceUsd) <= self::VARIANCE_THRESHOLD
            && abs($varianceCop) <= self::VARIANCE_THRESHOLD;

        return [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'account_type' => $account->type,
            'is_asset' => $account->isAsset(),
            'is_liability' => $account->isLiability(),
            'has_recorded_balance' => (bool) $recordedBalance,
            'recorded' => [
                'cad' => round($recordedCad, 2),
                'usd' => round($recordedUsd, 2),
                'cop' => round($recordedCop, 2),
            ],
            'computed' => [
                'cad' => round($computedCad, 2),
                'usd' => round($computedUsd, 2),
                'cop' => round($computedCop, 2),
            ],
            'variance' => [
                'cad' => $varianceCad,
                'usd' => $varianceUsd,
                'cop' => $varianceCop,
            ],
            'is_balanced' => $isBalanced,
        ];
    }
}

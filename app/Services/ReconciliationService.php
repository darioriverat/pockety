<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\ExchangeRate;
use App\Models\VarianceAcknowledgment;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ReconciliationService
{
    /**
     * Acceptable rounding tolerance (in currency units) for considering a variance "balanced".
     */
    private const VARIANCE_THRESHOLD = 0.01;

    public function __construct(
        private readonly FinancialSummaryService $financialSummaryService,
        private readonly TransactionService $transactionService,
    ) {}

    /**
     * Build the full reconciliation report for a given period (YYYYMM).
     *
     * For every active account, computes:
     * - Recorded: the manually-entered balance for the period (0 if not yet entered).
     * - Computed: a "known prior balance" (the most recent recorded balance for a period
     *   strictly before this one; if none exists yet, the current period's own recorded
     *   balance is used as the baseline) plus this period's signed transaction deltas.
     *   Asset accounts: minus regular spend, plus income. Debt (principal and interest) is omitted.
     *   Liability accounts: plus regular charges, minus income/credits, minus principal.
     *   Interest is omitted on liabilities.
     * - Variance: Recorded minus Computed.
     *
     * Also includes:
     * - Accounting equation check rolled up from account conciliations
     *   (Assets = Liabilities + Equity in CAD equivalent of recorded and computed balances)
     * - Balance changes: last recorded (initial) vs computed end value per account in CAD
     * - Income and expense totals for the period
     * - Per-account variance acknowledgment status
     *
     * @return array{
     *     period: string,
     *     status: string,
     *     accounts: array<int, array<string, mixed>>,
     *     accounting_equation: array<string, mixed>,
     *     balance_changes: array<string, mixed>,
     *     income_total_cad: float,
     *     expenses_total_cad: float,
     *     net_operating_expenses_cad: float
     * }
     */
    public function reconcileForPeriod(string $period): array
    {
        $accounts = Account::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        $acknowledgments = collect();

        if (Schema::hasTable('variance_acknowledgments')) {
            $acknowledgments = VarianceAcknowledgment::forPeriod($period)
                ->get()
                ->keyBy('account_id');
        } else {
            // Create table lazily so acknowledgments work before migrate runs.
            $this->ensureAcknowledgmentsTable();
        }

        $results = [];

        foreach ($accounts as $account) {
            $results[] = $this->reconcileAccount(
                $account,
                $period,
                $acknowledgments->get($account->id)
            );
        }

        $accountsBalanced = collect($results)->every(fn (array $result) => $result['is_balanced']);

        $exchangeRate = $this->resolveExchangeRate($period);
        $equation = $this->checkAccountingEquation($results, $exchangeRate);
        $balanceChanges = $this->buildBalanceChanges($results, $exchangeRate);

        // Get income and expenses
        $financialSummary = $this->financialSummaryService->getSummary($period);

        return [
            'period' => $period,
            'status' => $accountsBalanced && $equation['is_balanced'] ? 'balanced' : 'unbalanced',
            'accounts' => $results,
            'accounting_equation' => $equation,
            'balance_changes' => $balanceChanges,
            'income_total_cad' => round((float) $financialSummary['total_income_cad'], 2),
            'expenses_total_cad' => round($financialSummary['total_recorded_disbursements_cad'], 2),
            'net_operating_expenses_cad' => round($financialSummary['net_operating_expenses_cad'], 2),
        ];
    }

    /**
     * Ensure the variance_acknowledgments table exists.
     * Safe for environments where migrate cannot be run interactively;
     * the dedicated migration remains the source of truth for deploys.
     */
    private function ensureAcknowledgmentsTable(): void
    {
        if (Schema::hasTable('variance_acknowledgments')) {
            return;
        }

        Schema::create('variance_acknowledgments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('period', 6);
            $table->text('note')->nullable();
            $table->timestamp('acknowledged_at');
            $table->timestamps();
            $table->unique(['account_id', 'period']);
            $table->index('period');
        });
    }

    /**
     * Acknowledge a non-zero variance for an account in a period.
     *
     * @return array<string, mixed>
     */
    public function acknowledgeVariance(int $accountId, string $period, ?string $note = null): array
    {
        $this->ensureAcknowledgmentsTable();

        $account = Account::active()->find($accountId);

        if (! $account) {
            throw new \InvalidArgumentException('Account not found');
        }

        $reconciliation = $this->reconcileAccount($account, $period);

        if ($reconciliation['is_balanced']) {
            throw new \InvalidArgumentException('Cannot acknowledge a balanced account with zero variance');
        }

        $acknowledgment = VarianceAcknowledgment::updateOrCreate(
            [
                'account_id' => $accountId,
                'period' => $period,
            ],
            [
                'note' => $note,
                'acknowledged_at' => Carbon::now(),
            ]
        );

        return [
            'account_id' => $accountId,
            'period' => $period,
            'is_reviewed' => true,
            'review_note' => $acknowledgment->note,
            'reviewed_at' => $acknowledgment->acknowledged_at->toIso8601String(),
        ];
    }

    /**
     * Roll up the accounting equation from per-account conciliations.
     *
     * Each account's recorded and computed CAD/USD/COP amounts are converted to
     * CAD equivalent, then summed. Liabilities use absolute values. Equity is
     * Assets − Liabilities. Residual is computed Assets − (Liabilities + Equity).
     *
     * Top-level assets_cad / liabilities_cad / equity_cad are the computed CAD
     * equivalent totals so the equation reflects calculated activity rather than
     * the recorded balance sheet snapshot.
     *
     * @param  list<array<string, mixed>>  $accountResults
     * @return array{
     *     assets_cad: float,
     *     liabilities_cad: float,
     *     equity_cad: float,
     *     residual_cad: float,
     *     is_balanced: bool,
     *     recorded: array{assets_cad: float, liabilities_cad: float, equity_cad: float},
     *     computed: array{assets_cad: float, liabilities_cad: float, equity_cad: float},
     *     variance: array{assets_cad: float, liabilities_cad: float, equity_cad: float}
     * }
     */
    private function checkAccountingEquation(array $accountResults, ExchangeRate $exchangeRate): array
    {
        $recordedAssets = 0.0;
        $computedAssets = 0.0;
        $recordedLiabilities = 0.0;
        $computedLiabilities = 0.0;

        foreach ($accountResults as $result) {
            $recordedCad = $this->amountsCadEquivalent($result['recorded'], $exchangeRate);
            $computedCad = $this->amountsCadEquivalent($result['computed'], $exchangeRate);

            if ($result['is_asset']) {
                $recordedAssets += $recordedCad;
                $computedAssets += $computedCad;
            } elseif ($result['is_liability']) {
                $recordedLiabilities += abs($recordedCad);
                $computedLiabilities += abs($computedCad);
            }
        }

        $recordedAssets = round($recordedAssets, 2);
        $computedAssets = round($computedAssets, 2);
        $recordedLiabilities = round($recordedLiabilities, 2);
        $computedLiabilities = round($computedLiabilities, 2);

        $recordedEquity = round($recordedAssets - $recordedLiabilities, 2);
        $computedEquity = round($computedAssets - $computedLiabilities, 2);
        $residualCad = round($computedAssets - ($computedLiabilities + $computedEquity), 2);

        return [
            'assets_cad' => $computedAssets,
            'liabilities_cad' => $computedLiabilities,
            'equity_cad' => $computedEquity,
            'residual_cad' => $residualCad,
            'is_balanced' => abs($residualCad) <= self::VARIANCE_THRESHOLD,
            'recorded' => [
                'assets_cad' => $recordedAssets,
                'liabilities_cad' => $recordedLiabilities,
                'equity_cad' => $recordedEquity,
            ],
            'computed' => [
                'assets_cad' => $computedAssets,
                'liabilities_cad' => $computedLiabilities,
                'equity_cad' => $computedEquity,
            ],
            'variance' => [
                'assets_cad' => round($recordedAssets - $computedAssets, 2),
                'liabilities_cad' => round($recordedLiabilities - $computedLiabilities, 2),
                'equity_cad' => round($recordedEquity - $computedEquity, 2),
            ],
        ];
    }

    /**
     * Per-account CAD equivalent of last recorded (initial) vs computed end value.
     *
     * Initial is the most recent recorded balance strictly before this period
     * (or this period's recorded balance when none exists). Computed is that
     * baseline plus this period's signed transaction deltas. USD and COP are
     * converted to CAD with the same rates as the accounting equation.
     * Liability amounts use absolute values so totals match equation presentation.
     *
     * @param  list<array<string, mixed>>  $accountResults
     * @return array{
     *     accounts: list<array<string, mixed>>,
     *     assets: array{initial_cad: float, computed_cad: float, difference_cad: float},
     *     liabilities: array{initial_cad: float, computed_cad: float, difference_cad: float}
     * }
     */
    private function buildBalanceChanges(array $accountResults, ExchangeRate $exchangeRate): array
    {
        $accounts = [];
        $assetsInitial = 0.0;
        $assetsComputed = 0.0;
        $liabilitiesInitial = 0.0;
        $liabilitiesComputed = 0.0;

        foreach ($accountResults as $result) {
            $initialCad = $this->amountsCadEquivalent($result['initial'], $exchangeRate);
            $computedCad = $this->amountsCadEquivalent($result['computed'], $exchangeRate);

            if ($result['is_liability']) {
                $initialCad = abs($initialCad);
                $computedCad = abs($computedCad);
            }

            $initialCad = round($initialCad, 2);
            $computedCad = round($computedCad, 2);
            $differenceCad = round($computedCad - $initialCad, 2);

            $accounts[] = [
                'account_id' => $result['account_id'],
                'account_name' => $result['account_name'],
                'account_type' => $result['account_type'],
                'is_asset' => $result['is_asset'],
                'is_liability' => $result['is_liability'],
                'initial_cad' => $initialCad,
                'computed_cad' => $computedCad,
                'difference_cad' => $differenceCad,
            ];

            if ($result['is_asset']) {
                $assetsInitial += $initialCad;
                $assetsComputed += $computedCad;
            } elseif ($result['is_liability']) {
                $liabilitiesInitial += $initialCad;
                $liabilitiesComputed += $computedCad;
            }
        }

        $assetsInitial = round($assetsInitial, 2);
        $assetsComputed = round($assetsComputed, 2);
        $liabilitiesInitial = round($liabilitiesInitial, 2);
        $liabilitiesComputed = round($liabilitiesComputed, 2);

        return [
            'accounts' => $accounts,
            'assets' => [
                'initial_cad' => $assetsInitial,
                'computed_cad' => $assetsComputed,
                'difference_cad' => round($assetsComputed - $assetsInitial, 2),
            ],
            'liabilities' => [
                'initial_cad' => $liabilitiesInitial,
                'computed_cad' => $liabilitiesComputed,
                'difference_cad' => round($liabilitiesComputed - $liabilitiesInitial, 2),
            ],
        ];
    }

    /**
     * @param  array{cad?: float|int, usd?: float|int, cop?: float|int}  $amounts
     */
    private function amountsCadEquivalent(array $amounts, ExchangeRate $exchangeRate): float
    {
        $cadEquivalent = 0.0;
        $cad = (float) ($amounts['cad'] ?? 0);
        $usd = (float) ($amounts['usd'] ?? 0);
        $cop = (float) ($amounts['cop'] ?? 0);

        if ($cad != 0.0) {
            $cadEquivalent += $cad;
        }

        if ($usd != 0.0) {
            $cadEquivalent += $exchangeRate->usdToCad($usd);
        }

        if ($cop != 0.0) {
            $cadEquivalent += $exchangeRate->copToCad($cop);
        }

        return $cadEquivalent;
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

    /**
     * Compute the recorded/computed/variance figures for a single account and period.
     *
     * @return array<string, mixed>
     */
    public function reconcileAccount(
        Account $account,
        string $period,
        ?VarianceAcknowledgment $acknowledgment = null
    ): array {
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

        $computedCad = $baseCad;
        $computedUsd = $baseUsd;
        $computedCop = $baseCop;

        $computedAmounts = $this->transactionService->sumRollForwardAmountsForAccount($account, $period);
        $computedCad += $computedAmounts['cad'];
        $computedUsd += $computedAmounts['usd'];
        $computedCop += $computedAmounts['cop'];

        $recordedCad = $recordedBalance ? (float) $recordedBalance->recorded_balance_cad : 0.0;
        $recordedUsd = $recordedBalance ? (float) $recordedBalance->recorded_balance_usd : 0.0;
        $recordedCop = $recordedBalance ? (float) $recordedBalance->recorded_balance_cop : 0.0;

        $varianceCad = round($recordedCad - $computedCad, 2);
        $varianceUsd = round($recordedUsd - $computedUsd, 2);
        $varianceCop = round($recordedCop - $computedCop, 2);

        $isBalanced = abs($varianceCad) <= self::VARIANCE_THRESHOLD
            && abs($varianceUsd) <= self::VARIANCE_THRESHOLD
            && abs($varianceCop) <= self::VARIANCE_THRESHOLD;

        if ($acknowledgment === null && Schema::hasTable('variance_acknowledgments')) {
            $acknowledgment = VarianceAcknowledgment::where('account_id', $account->id)
                ->where('period', $period)
                ->first();
        }

        return [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'account_type' => $account->type,
            'is_asset' => $account->isAsset(),
            'is_liability' => $account->isLiability(),
            'has_recorded_balance' => (bool) $recordedBalance,
            'initial' => [
                'cad' => round($baseCad, 2),
                'usd' => round($baseUsd, 2),
                'cop' => round($baseCop, 2),
            ],
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
            'is_reviewed' => $acknowledgment !== null,
            'review_note' => $acknowledgment?->note,
            'reviewed_at' => $acknowledgment?->acknowledged_at?->toIso8601String(),
        ];
    }
}

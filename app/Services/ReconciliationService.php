<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountBalance;
use App\Models\Transaction;
use App\Models\VarianceAcknowledgment;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class ReconciliationService
{
    /**
     * Acceptable rounding tolerance (in currency units) for considering a variance "balanced".
     */
    private const VARIANCE_THRESHOLD = 0.01;

    public function __construct(
        private readonly BalanceSheetService $balanceSheetService,
        private readonly FinancialSummaryService $financialSummaryService,
    ) {}

    /**
     * Build the full reconciliation report for a given period (YYYYMM).
     *
     * For every active account, computes:
     * - Recorded: the manually-entered balance for the period (0 if not yet entered).
     * - Computed: a "known prior balance" (the most recent recorded balance for a period
     *   strictly before this one; if none exists yet, the current period's own recorded
     *   balance is used as the baseline) minus this period's expense outflows
     *   plus income/credit inflows for the account.
     * - Variance: Recorded minus Computed.
     *
     * Also includes:
     * - Accounting equation check (Assets = Liabilities + Equity)
     * - Income and expense totals for the period
     * - Per-account variance acknowledgment status
     *
     * @return array{
     *     period: string,
     *     status: string,
     *     accounts: array<int, array<string, mixed>>,
     *     accounting_equation: array<string, mixed>,
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

        // Get accounting equation check
        $equation = $this->checkAccountingEquation($period);

        // Get income and expenses
        $financialSummary = $this->financialSummaryService->getSummary($period);

        return [
            'period' => $period,
            'status' => $accountsBalanced && $equation['is_balanced'] ? 'balanced' : 'unbalanced',
            'accounts' => $results,
            'accounting_equation' => $equation,
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
     * Check the accounting equation: Assets = Liabilities + Equity
     * Returns the residual (should be near zero for a balanced sheet).
     *
     * @return array{
     *     assets_cad: float,
     *     liabilities_cad: float,
     *     equity_cad: float,
     *     residual_cad: float,
     *     is_balanced: bool
     * }
     */
    private function checkAccountingEquation(string $period): array
    {
        $balanceSheet = $this->balanceSheetService->getBalanceSheet($period);

        $assetsCad = $balanceSheet['total_assets']['cad'];
        $liabilitiesCad = $balanceSheet['total_liabilities']['cad'];
        $equityCad = $balanceSheet['equity']['cad'];

        // Accounting equation: Assets = Liabilities + Equity
        // Residual = Assets - (Liabilities + Equity), should be near zero
        $residualCad = round($assetsCad - ($liabilitiesCad + $equityCad), 2);

        return [
            'assets_cad' => $assetsCad,
            'liabilities_cad' => $liabilitiesCad,
            'equity_cad' => $equityCad,
            'residual_cad' => $residualCad,
            'is_balanced' => abs($residualCad) <= self::VARIANCE_THRESHOLD,
        ];
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

        $transactions = Transaction::where('account_id', $account->id)
            ->where('period', $period)
            ->with('category')
            ->get();

        $netOutflowCad = 0.0;
        $netOutflowUsd = 0.0;
        $netOutflowCop = 0.0;

        foreach ($transactions as $transaction) {
            $sign = $transaction->isInflow() ? -1 : 1;
            $netOutflowCad += $sign * (float) ($transaction->amount_cad ?? 0);
            $netOutflowUsd += $sign * (float) ($transaction->amount_usd ?? 0);
            $netOutflowCop += $sign * (float) ($transaction->amount_cop ?? 0);
        }

        // Expenses reduce the computed balance; income and credits increase it.
        $computedCad = $baseCad - $netOutflowCad;
        $computedUsd = $baseUsd - $netOutflowUsd;
        $computedCop = $baseCop - $netOutflowCop;

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

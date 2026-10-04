<?php

namespace App\Services;

use App\Domain\Collections\PeriodBalanceHistoryCollection;
use App\Domain\Entities\PeriodBalanceEntity;
use App\Domain\Entities\PeriodBalanceHistoryEntity;
use App\Domain\Entities\PeriodBalanceSnapshotEntity;
use App\Domain\Exceptions\PeriodBalanceAlreadyExistsException;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Domain\Services\Contracts\PeriodBalanceServiceInterface;
use App\Models\AccountBalance;
use App\Models\PeriodBalance;
use App\Models\PeriodBalanceHistory;
use Illuminate\Support\Facades\DB;

class PeriodBalanceService implements PeriodBalanceServiceInterface
{
    public function __construct(
        private readonly ReconciliationService $reconciliationService,
        private readonly OwnerResolverInterface $owner,
    ) {}

    public function preview(string $period): PeriodBalanceSnapshotEntity
    {
        return $this->snapshotFromReport(
            $period,
            $this->reconciliationService->reconcileForPeriod($period),
        );
    }

    public function findRegistered(string $period): ?PeriodBalanceEntity
    {
        $balance = PeriodBalance::query()
            ->forUser($this->owner->id())
            ->forPeriod($period)
            ->first();

        return $balance ? $this->toEntity($balance) : null;
    }

    public function historyForPeriod(string $period): PeriodBalanceHistoryCollection
    {
        $collection = new PeriodBalanceHistoryCollection;

        $rows = PeriodBalanceHistory::query()
            ->forUser($this->owner->id())
            ->forPeriod($period)
            ->orderByDesc('replaced_at')
            ->orderByDesc('id')
            ->get();

        foreach ($rows as $row) {
            $collection->add($this->toHistoryEntity($row));
        }

        return $collection;
    }

    public function register(string $period, bool $overwrite): PeriodBalanceEntity
    {
        $report = $this->reconciliationService->reconcileForPeriod($period);
        $proposed = $this->snapshotFromReport($period, $report);
        $existing = PeriodBalance::query()
            ->forUser($this->owner->id())
            ->forPeriod($period)
            ->first();

        if ($existing && ! $overwrite) {
            throw new PeriodBalanceAlreadyExistsException(
                $this->toEntity($existing),
                $proposed,
            );
        }

        $saved = DB::transaction(function () use ($existing, $proposed, $period, $report): PeriodBalance {
            if ($existing) {
                $this->archive($existing);
                $existing->fill($this->attributesFromSnapshot($proposed));
                $existing->save();
                $saved = $existing->refresh();
            } else {
                $saved = PeriodBalance::query()->create($this->attributesFromSnapshot($proposed));
            }

            /** @var array<int, array<string, mixed>> $accounts */
            $accounts = $report['accounts'];
            $this->syncAccountBalances($period, $accounts);

            return $saved;
        });

        return $this->toEntity($saved);
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function snapshotFromReport(string $period, array $report): PeriodBalanceSnapshotEntity
    {
        /** @var array<string, mixed> $equation */
        $equation = $report['accounting_equation'];
        /** @var array<string, mixed> $computed */
        $computed = $equation['computed'] ?? [
            'assets_cad' => $equation['assets_cad'],
            'liabilities_cad' => $equation['liabilities_cad'],
            'equity_cad' => $equation['equity_cad'],
        ];
        /** @var array<string, mixed> $recordsCheck */
        $recordsCheck = $report['records_check'] ?? [];

        return new PeriodBalanceSnapshotEntity(
            period: $period,
            assetsCad: round((float) $computed['assets_cad'], 2),
            liabilitiesCad: round((float) $computed['liabilities_cad'], 2),
            equityCad: round((float) $computed['equity_cad'], 2),
            incomeCad: round((float) $report['income_total_cad'], 2),
            netOperatingExpensesCad: round((float) $report['net_operating_expenses_cad'], 2),
            recordsCheckResultCad: round((float) ($recordsCheck['result_cad'] ?? 0), 2),
            reconciliationStatus: (string) $report['status'],
        );
    }

    /**
     * Write each account's computed reconciliation balance as its recorded balance.
     *
     * Uses the report captured before this write, so the saved amounts are the
     * figures the user just registered.
     *
     * @param  array<int, array<string, mixed>>  $accounts
     */
    private function syncAccountBalances(string $period, array $accounts): void
    {
        $userId = $this->owner->id();

        foreach ($accounts as $account) {
            /** @var array{cad?: float|int, usd?: float|int, cop?: float|int} $computed */
            $computed = $account['computed'];

            AccountBalance::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'account_id' => (int) $account['account_id'],
                    'period' => $period,
                ],
                [
                    'recorded_balance_cad' => round((float) ($computed['cad'] ?? 0), 2),
                    'recorded_balance_usd' => round((float) ($computed['usd'] ?? 0), 2),
                    'recorded_balance_cop' => round((float) ($computed['cop'] ?? 0), 2),
                ],
            );
        }
    }

    /**
     * @return array{
     *     user_id: int,
     *     period: string,
     *     assets_cad: float,
     *     liabilities_cad: float,
     *     equity_cad: float,
     *     income_cad: float,
     *     net_operating_expenses_cad: float,
     *     records_check_result_cad: float,
     *     reconciliation_status: string
     * }
     */
    private function attributesFromSnapshot(PeriodBalanceSnapshotEntity $snapshot): array
    {
        return [
            'user_id' => $this->owner->id(),
            'period' => $snapshot->period,
            'assets_cad' => $snapshot->assetsCad,
            'liabilities_cad' => $snapshot->liabilitiesCad,
            'equity_cad' => $snapshot->equityCad,
            'income_cad' => $snapshot->incomeCad,
            'net_operating_expenses_cad' => $snapshot->netOperatingExpensesCad,
            'records_check_result_cad' => $snapshot->recordsCheckResultCad,
            'reconciliation_status' => $snapshot->reconciliationStatus,
        ];
    }

    private function archive(PeriodBalance $existing): void
    {
        PeriodBalanceHistory::query()->create([
            'user_id' => $this->owner->id(),
            'period' => $existing->period,
            'assets_cad' => $existing->assets_cad,
            'liabilities_cad' => $existing->liabilities_cad,
            'equity_cad' => $existing->equity_cad,
            'income_cad' => $existing->income_cad,
            'net_operating_expenses_cad' => $existing->net_operating_expenses_cad,
            'records_check_result_cad' => $existing->records_check_result_cad,
            'reconciliation_status' => $existing->reconciliation_status,
            'recorded_at' => $existing->updated_at ?? $existing->created_at ?? now(),
            'replaced_at' => now(),
        ]);
    }

    private function toEntity(PeriodBalance $balance): PeriodBalanceEntity
    {
        return new PeriodBalanceEntity(
            id: $balance->id,
            period: $balance->period,
            assetsCad: round((float) $balance->assets_cad, 2),
            liabilitiesCad: round((float) $balance->liabilities_cad, 2),
            equityCad: round((float) $balance->equity_cad, 2),
            incomeCad: round((float) $balance->income_cad, 2),
            netOperatingExpensesCad: round((float) $balance->net_operating_expenses_cad, 2),
            recordsCheckResultCad: round((float) $balance->records_check_result_cad, 2),
            reconciliationStatus: $balance->reconciliation_status,
            registeredAt: $this->toDateTime($balance->created_at),
            updatedAt: $this->toDateTime($balance->updated_at),
        );
    }

    private function toHistoryEntity(PeriodBalanceHistory $history): PeriodBalanceHistoryEntity
    {
        return new PeriodBalanceHistoryEntity(
            id: $history->id,
            period: $history->period,
            assetsCad: round((float) $history->assets_cad, 2),
            liabilitiesCad: round((float) $history->liabilities_cad, 2),
            equityCad: round((float) $history->equity_cad, 2),
            incomeCad: round((float) $history->income_cad, 2),
            netOperatingExpensesCad: round((float) $history->net_operating_expenses_cad, 2),
            recordsCheckResultCad: round((float) $history->records_check_result_cad, 2),
            reconciliationStatus: $history->reconciliation_status,
            recordedAt: $this->toDateTime($history->recorded_at),
            replacedAt: $this->toDateTime($history->replaced_at),
        );
    }

    private function toDateTime(mixed $value): \DateTimeImmutable
    {
        if ($value instanceof \DateTimeImmutable) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return \DateTimeImmutable::createFromInterface($value);
        }

        return new \DateTimeImmutable(is_scalar($value) ? (string) $value : 'now');
    }
}

<?php

namespace App\Services;

use App\Domain\Collections\IncomeCollection;
use App\Domain\Entities\IncomeEntity;
use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Models\ExchangeRate;
use App\Models\Income;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class IncomeService implements IncomeServiceInterface
{
    public const MAX_LINES_PER_PERIOD = 6;

    public function getForPeriod(string $period): IncomeCollection
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $collection = new IncomeCollection;

        $lines = Income::forPeriod($period)
            ->orderBy('line_number')
            ->orderBy('id')
            ->get();

        foreach ($lines as $income) {
            $collection->add($this->mapToEntity($income, $exchangeRate));
        }

        return $collection;
    }

    public function getById(int $id): ?IncomeEntity
    {
        $income = Income::find($id);

        if (! $income) {
            return null;
        }

        return $this->mapToEntity(
            $income,
            $this->resolveExchangeRate($income->period)
        );
    }

    public function create(array $data): IncomeEntity
    {
        $period = $data['period'];
        $existingCount = Income::forPeriod($period)->count();

        if ($existingCount >= self::MAX_LINES_PER_PERIOD) {
            throw ValidationException::withMessages([
                'period' => [
                    'A period may have at most '.self::MAX_LINES_PER_PERIOD.' income line items.',
                ],
            ]);
        }

        $this->assertHasAmount($data);

        $lineNumber = $data['line_number']
            ?? ((int) Income::forPeriod($period)->max('line_number') + 1);

        if ($lineNumber < 1) {
            $lineNumber = 1;
        }

        $income = Income::create([
            'period' => $period,
            'description' => $data['description'],
            'line_number' => $lineNumber,
            'amount_cad' => $data['amount_cad'] ?? 0,
            'amount_usd' => $data['amount_usd'] ?? 0,
            'amount_cop' => $data['amount_cop'] ?? 0,
            'notes' => $data['notes'] ?? null,
        ]);

        return $this->mapToEntity(
            $income,
            $this->resolveExchangeRate($period)
        );
    }

    public function update(int $id, array $data): IncomeEntity
    {
        $income = Income::find($id);

        if (! $income) {
            throw (new ModelNotFoundException)->setModel(Income::class, [$id]);
        }

        $merged = [
            'amount_cad' => array_key_exists('amount_cad', $data)
                ? $data['amount_cad']
                : $income->amount_cad,
            'amount_usd' => array_key_exists('amount_usd', $data)
                ? $data['amount_usd']
                : $income->amount_usd,
            'amount_cop' => array_key_exists('amount_cop', $data)
                ? $data['amount_cop']
                : $income->amount_cop,
        ];

        if (
            array_key_exists('amount_cad', $data)
            || array_key_exists('amount_usd', $data)
            || array_key_exists('amount_cop', $data)
        ) {
            $this->assertHasAmount($merged);
        }

        $income->fill([
            'description' => $data['description'] ?? $income->description,
            'line_number' => $data['line_number'] ?? $income->line_number,
            'amount_cad' => $merged['amount_cad'] ?? 0,
            'amount_usd' => $merged['amount_usd'] ?? 0,
            'amount_cop' => $merged['amount_cop'] ?? 0,
            'notes' => array_key_exists('notes', $data)
                ? $data['notes']
                : $income->notes,
        ]);
        $income->save();

        return $this->mapToEntity(
            $income->fresh(),
            $this->resolveExchangeRate($income->period)
        );
    }

    public function delete(int $id): bool
    {
        $income = Income::find($id);

        if (! $income) {
            throw (new ModelNotFoundException)->setModel(Income::class, [$id]);
        }

        return (bool) $income->delete();
    }

    public function getTotalCadEquivalent(string $period): float
    {
        $exchangeRate = $this->resolveExchangeRate($period);
        $total = 0.0;

        foreach (Income::forPeriod($period)->get() as $income) {
            $total += $income->getTotalCadEquivalent($exchangeRate);
        }

        return round($total, 2);
    }

    /**
     * @param  array{amount_cad?: float|string|null, amount_usd?: float|string|null, amount_cop?: float|string|null}  $data
     */
    private function assertHasAmount(array $data): void
    {
        $cad = (float) ($data['amount_cad'] ?? 0);
        $usd = (float) ($data['amount_usd'] ?? 0);
        $cop = (float) ($data['amount_cop'] ?? 0);

        if ($cad == 0.0 && $usd == 0.0 && $cop == 0.0) {
            throw ValidationException::withMessages([
                'amount_cad' => [
                    'At least one currency amount (CAD, USD, or COP) is required.',
                ],
            ]);
        }
    }

    private function resolveExchangeRate(string $period): ExchangeRate
    {
        return ExchangeRate::forPeriod($period) ?? new ExchangeRate([
            'period' => $period,
            'usd_cop' => 4400,
            'usd_cad' => 0.75,
            'cad_cop' => 3000,
        ]);
    }

    private function mapToEntity(Income $income, ExchangeRate $exchangeRate): IncomeEntity
    {
        return new IncomeEntity(
            id: $income->id,
            period: $income->period,
            description: $income->description,
            lineNumber: (int) $income->line_number,
            amountCad: (float) $income->amount_cad,
            amountUsd: (float) $income->amount_usd,
            amountCop: (float) $income->amount_cop,
            notes: $income->notes,
            createdAt: $income->created_at->toIso8601String(),
            updatedAt: $income->updated_at->toIso8601String(),
            totalCadEquivalent: $income->getTotalCadEquivalent($exchangeRate),
        );
    }
}

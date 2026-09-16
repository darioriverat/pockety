<?php

namespace App\Domain\Entities;

readonly class PeriodComparisonMetricEntity
{
    public function __construct(
        public string $key,
        public string $label,
        public float $periodACad,
        public float $periodBCad,
        public float $differenceCad,
        public ?float $percentChange,
    ) {}

    /**
     * @return array{
     *     key: string,
     *     label: string,
     *     period_a_cad: float,
     *     period_b_cad: float,
     *     difference_cad: float,
     *     percent_change: float|null
     * }
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'period_a_cad' => $this->periodACad,
            'period_b_cad' => $this->periodBCad,
            'difference_cad' => $this->differenceCad,
            'percent_change' => $this->percentChange,
        ];
    }
}

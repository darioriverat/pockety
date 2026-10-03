<?php

namespace App\Domain\Requests\Contracts\PeriodBalance;

interface StorePeriodBalanceRequestInterface
{
    public function getPeriod(): string;

    public function shouldOverwrite(): bool;
}

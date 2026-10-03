<?php

namespace App\Domain\Requests\Contracts\PeriodBalance;

interface ShowPeriodBalanceRequestInterface
{
    public function getPeriod(): string;
}

<?php

namespace App\Domain\Exceptions;

use App\Domain\Entities\PeriodBalanceEntity;
use App\Domain\Entities\PeriodBalanceSnapshotEntity;

class PeriodBalanceAlreadyExistsException extends \RuntimeException
{
    public function __construct(
        public readonly PeriodBalanceEntity $existing,
        public readonly PeriodBalanceSnapshotEntity $proposed,
    ) {
        parent::__construct('A balance already exists for this period.');
    }
}

<?php

namespace App\Domain\Services\Contracts;

interface OwnerResolverInterface
{
    /**
     * Authenticated owner's user id.
     *
     * @throws \RuntimeException when no user is authenticated
     */
    public function id(): int;
}

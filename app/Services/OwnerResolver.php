<?php

namespace App\Services;

use App\Domain\Services\Contracts\OwnerResolverInterface;
use Illuminate\Support\Facades\Auth;

class OwnerResolver implements OwnerResolverInterface
{
    public function id(): int
    {
        $id = Auth::id();

        if ($id === null) {
            throw new \RuntimeException('An authenticated user is required to resolve ownership.');
        }

        return (int) $id;
    }
}

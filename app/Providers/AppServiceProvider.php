<?php

namespace App\Providers;

use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Domain\Services\Contracts\PeriodHistoryServiceInterface;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Services\AccountService;
use App\Services\CategoryActualsService;
use App\Services\CategoryService;
use App\Services\IncomeService;
use App\Services\PeriodHistoryService;
use App\Services\TransactionService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Service bindings
        $this->app->bind(
            AccountServiceInterface::class,
            AccountService::class
        );

        $this->app->bind(
            CategoryServiceInterface::class,
            CategoryService::class
        );

        $this->app->bind(
            TransactionServiceInterface::class,
            TransactionService::class
        );

        $this->app->bind(
            IncomeServiceInterface::class,
            IncomeService::class
        );

        $this->app->bind(
            PeriodHistoryServiceInterface::class,
            PeriodHistoryService::class
        );

        $this->app->bind(
            CategoryActualsServiceInterface::class,
            CategoryActualsService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}

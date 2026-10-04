<?php

namespace App\Providers;

use App\Domain\Requests\Contracts\PeriodBalance\ShowPeriodBalanceRequestInterface;
use App\Domain\Requests\Contracts\PeriodBalance\StorePeriodBalanceRequestInterface;
use App\Domain\Services\Contracts\AccountServiceInterface;
use App\Domain\Services\Contracts\AvailablePeriodServiceInterface;
use App\Domain\Services\Contracts\CategoryActualsServiceInterface;
use App\Domain\Services\Contracts\CategoryServiceInterface;
use App\Domain\Services\Contracts\IncomeServiceInterface;
use App\Domain\Services\Contracts\OwnerResolverInterface;
use App\Domain\Services\Contracts\PeriodBalanceServiceInterface;
use App\Domain\Services\Contracts\PeriodComparisonServiceInterface;
use App\Domain\Services\Contracts\PeriodHistoryServiceInterface;
use App\Domain\Services\Contracts\SearchServiceInterface;
use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Http\Requests\PeriodBalance\ShowPeriodBalanceRequest;
use App\Http\Requests\PeriodBalance\StorePeriodBalanceRequest;
use App\Services\AccountService;
use App\Services\AvailablePeriodService;
use App\Services\CategoryActualsService;
use App\Services\CategoryService;
use App\Services\IncomeService;
use App\Services\OwnerResolver;
use App\Services\PeriodBalanceService;
use App\Services\PeriodComparisonService;
use App\Services\PeriodHistoryService;
use App\Services\SearchService;
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
        $this->app->bind(
            OwnerResolverInterface::class,
            OwnerResolver::class
        );

        // Service bindings
        $this->app->bind(
            AccountServiceInterface::class,
            AccountService::class
        );

        $this->app->bind(
            AvailablePeriodServiceInterface::class,
            AvailablePeriodService::class
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
            PeriodComparisonServiceInterface::class,
            PeriodComparisonService::class
        );

        $this->app->bind(
            CategoryActualsServiceInterface::class,
            CategoryActualsService::class
        );

        $this->app->bind(
            SearchServiceInterface::class,
            SearchService::class
        );

        $this->app->bind(
            ShowPeriodBalanceRequestInterface::class,
            ShowPeriodBalanceRequest::class
        );

        $this->app->bind(
            StorePeriodBalanceRequestInterface::class,
            StorePeriodBalanceRequest::class
        );

        $this->app->bind(
            PeriodBalanceServiceInterface::class,
            PeriodBalanceService::class
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

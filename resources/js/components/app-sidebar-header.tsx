import { Link, router, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { PeriodSelector } from '@/components/period-selector';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage();
    const { name } = page.props;
    const summary = page.props.summary as { period?: string } | undefined;
    const dashboardPeriod =
        page.component === 'dashboard' ? summary?.period : undefined;
    const brandName = name && name !== 'Laravel' ? name : 'Pockety';

    return (
        <header
            data-testid="app-header"
            className="border-sidebar-border/50 bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b px-3 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-4 md:px-4"
        >
            <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                <SidebarTrigger
                    data-testid="nav-menu-trigger"
                    className="-ml-1"
                    aria-label="Toggle navigation menu"
                />
                <Link
                    href={dashboard()}
                    prefetch
                    data-testid="app-header-brand"
                    className="text-foreground hover:text-foreground/80 flex min-w-0 items-center gap-2 rounded-md px-1 py-1 transition-colors"
                >
                    <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md shadow-sm">
                        <AppLogoIcon className="size-4 fill-current text-white dark:text-black" />
                    </span>
                    <span className="truncate text-sm font-semibold tracking-tight">
                        {brandName}
                    </span>
                </Link>
                {breadcrumbs.length > 0 && (
                    <>
                        <div className="bg-border mx-1 hidden h-4 w-px sm:block" />
                        <div
                            className="min-w-0 max-w-[40vw] truncate sm:max-w-none sm:overflow-visible"
                            data-testid="breadcrumb-trail"
                        >
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    </>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <GlobalSearch className="px-2 sm:px-3" />
                <PeriodSelector
                    value={dashboardPeriod}
                    onValueChange={
                        dashboardPeriod
                            ? (period) => {
                                  router.get(
                                      '/dashboard',
                                      { period },
                                      { preserveScroll: true },
                                  );
                              }
                            : undefined
                    }
                    id="global-period"
                    showLabel={false}
                    testId="period-selector"
                    className="w-[7.5rem] max-w-none space-y-0 sm:w-40 md:w-48"
                />
            </div>
        </header>
    );
}

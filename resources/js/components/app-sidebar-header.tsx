import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { PeriodSelector } from '@/components/period-selector';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-2">
                <GlobalSearch />
                <PeriodSelector
                    id="global-period"
                    showLabel={false}
                    testId="period-selector"
                    className="w-40 max-w-none space-y-0 sm:w-48"
                />
            </div>
        </header>
    );
}

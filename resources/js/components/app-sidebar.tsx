import { Link } from '@inertiajs/react';
import { LayoutGrid, Tags, Receipt, Upload, Landmark, ScaleIcon, Banknote, DollarSign, PiggyBank, Calculator, Sheet, LineChart, Car, CalendarRange, ChartColumn, ArrowLeftRight, FileText, BookMarked } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        titleKey: 'nav.dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Accounts',
        titleKey: 'nav.accounts',
        href: '/accounts',
        icon: Landmark,
    },
    {
        title: 'Income',
        titleKey: 'nav.income',
        href: '/income',
        icon: Banknote,
    },
    {
        title: 'Reconciliation',
        titleKey: 'nav.reconciliation',
        href: '/reconciliation',
        icon: ScaleIcon,
    },
    {
        title: 'Categories',
        titleKey: 'nav.categories',
        href: '/categories',
        icon: Tags,
    },
    {
        title: 'Transactions',
        titleKey: 'nav.transactions',
        href: '/transactions',
        icon: Receipt,
    },
    {
        title: 'Periods',
        titleKey: 'nav.periods',
        href: '/periods/history',
        icon: CalendarRange,
    },
    {
        title: 'Compare Periods',
        titleKey: 'nav.comparePeriods',
        href: '/periods/compare',
        icon: ArrowLeftRight,
    },
    {
        title: 'Reports',
        titleKey: 'nav.reports',
        href: '/reports/year-to-date',
        icon: FileText,
    },
    {
        title: 'Category Actuals',
        titleKey: 'nav.categoryActuals',
        href: '/category-actuals',
        icon: ChartColumn,
    },
    {
        title: 'Budgets',
        titleKey: 'nav.budgets',
        href: '/budgets',
        icon: PiggyBank,
    },
    {
        title: 'Financial Summary',
        titleKey: 'nav.financialSummary',
        href: '/financial-summary',
        icon: Calculator,
    },
    {
        title: 'Balance Sheet',
        titleKey: 'nav.balanceSheet',
        href: '/balance-sheet',
        icon: Sheet,
    },
    {
        title: 'Period Balances',
        titleKey: 'nav.periodBalances',
        href: '/period-balances',
        icon: BookMarked,
    },
    {
        title: 'BS Time Series',
        titleKey: 'nav.bsTimeSeries',
        href: '/balance-sheet/time-series',
        icon: LineChart,
    },
    {
        title: 'Fixed Assets',
        titleKey: 'nav.fixedAssets',
        href: '/fixed-assets',
        icon: Car,
    },
    {
        title: 'Exchange Rates',
        titleKey: 'nav.exchangeRates',
        href: '/exchange-rates',
        icon: DollarSign,
    },
    {
        title: 'Import',
        titleKey: 'nav.import',
        href: '/import',
        icon: Upload,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" data-testid="app-sidebar">
            <SidebarHeader className="border-sidebar-border/60 border-b">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={dashboard()}
                                prefetch
                                data-testid="sidebar-brand"
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

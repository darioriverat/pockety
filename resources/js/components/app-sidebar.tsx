import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Tags, Receipt, Upload, Landmark, ScaleIcon, Banknote, DollarSign, PiggyBank, Calculator, Sheet, LineChart, Car, CalendarRange, ChartColumn, ArrowLeftRight, FileText } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Accounts',
        href: '/accounts',
        icon: Landmark,
    },
    {
        title: 'Income',
        href: '/income',
        icon: Banknote,
    },
    {
        title: 'Reconciliation',
        href: '/reconciliation',
        icon: ScaleIcon,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Tags,
    },
    {
        title: 'Transactions',
        href: '/transactions',
        icon: Receipt,
    },
    {
        title: 'Periods',
        href: '/periods/history',
        icon: CalendarRange,
    },
    {
        title: 'Compare Periods',
        href: '/periods/compare',
        icon: ArrowLeftRight,
    },
    {
        title: 'Reports',
        href: '/reports/year-to-date',
        icon: FileText,
    },
    {
        title: 'Category Actuals',
        href: '/category-actuals',
        icon: ChartColumn,
    },
    {
        title: 'Budgets',
        href: '/budgets',
        icon: PiggyBank,
    },
    {
        title: 'Financial Summary',
        href: '/financial-summary',
        icon: Calculator,
    },
    {
        title: 'Balance Sheet',
        href: '/balance-sheet',
        icon: Sheet,
    },
    {
        title: 'BS Time Series',
        href: '/balance-sheet/time-series',
        icon: LineChart,
    },
    {
        title: 'Fixed Assets',
        href: '/fixed-assets',
        icon: Car,
    },
    {
        title: 'Exchange Rates',
        href: '/exchange-rates',
        icon: DollarSign,
    },
    {
        title: 'Import',
        href: '/import',
        icon: Upload,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/dariorivera/pockety',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://github.com/dariorivera/pockety#readme',
        icon: BookOpen,
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

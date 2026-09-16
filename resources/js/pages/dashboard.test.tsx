import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from '@/layouts/app-layout';
import Dashboard from '@/pages/dashboard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { User } from '@/types';

type MockPage = {
    url: string;
    props: {
        name: string;
        auth: {
            user: User;
        };
        sidebarOpen: boolean;
        summary: {
            period: string;
            total_income_cad: number;
            total_expenses_cad: number;
            net_cad: number;
            total_assets_cad: number;
            total_liabilities_cad: number;
            equity_cad: number;
            reconciliation_status: 'balanced' | 'unbalanced';
            reconciliation_summary: {
                balanced_count: number;
                unbalanced_count: number;
                total_count: number;
            };
        };
        income_expense_chart: {
            months: number;
            from: string;
            to: string;
            periods: Array<{
                period: string;
                income_cad: number;
                expenses_cad: number;
            }>;
        };
        assets_liabilities_chart: {
            months: number;
            from: string;
            to: string;
            periods: Array<{
                period: string;
                assets_cad: number;
                liabilities_cad: number;
                equity_cad: number;
            }>;
        };
        top_spending_categories: {
            period: string;
            limit: number;
            total_expenses_cad: number;
            categories: Array<{
                category_id: number;
                category_code: string;
                category_name_es: string;
                category_name_en: string;
                amount_cad: number;
                percentage: number;
                transaction_count: number;
            }>;
        };
        recent_activity: {
            limit: number;
            items: Array<{
                id: number;
                type: 'expense' | 'income';
                date: string;
                period: string;
                summary: string;
                amount_cad: number | null;
                amount_usd: number | null;
                amount_cop: number | null;
                category_code: string | null;
                category_name_en: string | null;
                category_name_es: string | null;
                account_name: string | null;
                comments: string | null;
                detail_url: string;
            }>;
        };
    };
};

const mockPage: MockPage = {
    url: '/dashboard',
    props: {
        name: 'Pockety',
        auth: {
            user: {
                id: 1,
                name: 'Dario Rivera',
                email: 'dario@example.com',
                email_verified_at: '2026-09-13T00:00:00Z',
                created_at: '2026-09-13T00:00:00Z',
                updated_at: '2026-09-13T00:00:00Z',
            },
        },
        sidebarOpen: true,
        summary: {
            period: '202601',
            total_income_cad: 5000.00,
            total_income_usd: 6666.67,
            total_income_cop: 15000000,
            total_expenses_cad: 2000.00,
            total_expenses_usd: 2666.67,
            total_expenses_cop: 6000000,
            net_cad: 3000.00,
            net_usd: 4000.00,
            net_cop: 9000000,
            total_assets_cad: 15000.00,
            total_assets_usd: 20000.00,
            total_assets_cop: 45000000,
            total_liabilities_cad: 3000.00,
            total_liabilities_usd: 4000.00,
            total_liabilities_cop: 9000000,
            equity_cad: 12000.00,
            equity_usd: 16000.00,
            equity_cop: 36000000,
            reconciliation_status: 'balanced',
            reconciliation_summary: {
                balanced_count: 5,
                unbalanced_count: 0,
                total_count: 5,
            },
        },
        income_expense_chart: {
            months: 12,
            from: '202502',
            to: '202601',
            periods: [
                { period: '202502', income_cad: 4800, expenses_cad: 1900 },
                { period: '202503', income_cad: 4900, expenses_cad: 2100 },
                { period: '202504', income_cad: 5000, expenses_cad: 2000 },
                { period: '202505', income_cad: 5100, expenses_cad: 2200 },
                { period: '202506', income_cad: 5050, expenses_cad: 1950 },
                { period: '202507', income_cad: 5200, expenses_cad: 2300 },
                { period: '202508', income_cad: 5150, expenses_cad: 2050 },
                { period: '202509', income_cad: 5300, expenses_cad: 2400 },
                { period: '202510', income_cad: 5250, expenses_cad: 2150 },
                { period: '202511', income_cad: 5400, expenses_cad: 2500 },
                { period: '202512', income_cad: 5350, expenses_cad: 2250 },
                { period: '202601', income_cad: 5000, expenses_cad: 2000 },
            ],
        },
        assets_liabilities_chart: {
            months: 12,
            from: '202502',
            to: '202601',
            periods: [
                { period: '202502', assets_cad: 12000, liabilities_cad: 2500, equity_cad: 9500 },
                { period: '202503', assets_cad: 12500, liabilities_cad: 2600, equity_cad: 9900 },
                { period: '202504', assets_cad: 13000, liabilities_cad: 2700, equity_cad: 10300 },
                { period: '202505', assets_cad: 13200, liabilities_cad: 2800, equity_cad: 10400 },
                { period: '202506', assets_cad: 13500, liabilities_cad: 2750, equity_cad: 10750 },
                { period: '202507', assets_cad: 14000, liabilities_cad: 2900, equity_cad: 11100 },
                { period: '202508', assets_cad: 14200, liabilities_cad: 3000, equity_cad: 11200 },
                { period: '202509', assets_cad: 14500, liabilities_cad: 3100, equity_cad: 11400 },
                { period: '202510', assets_cad: 14700, liabilities_cad: 3050, equity_cad: 11650 },
                { period: '202511', assets_cad: 14800, liabilities_cad: 3200, equity_cad: 11600 },
                { period: '202512', assets_cad: 14900, liabilities_cad: 3100, equity_cad: 11800 },
                { period: '202601', assets_cad: 15000, liabilities_cad: 3000, equity_cad: 12000 },
            ],
        },
        top_spending_categories: {
            period: '202601',
            limit: 10,
            total_expenses_cad: 2000,
            categories: [
                {
                    category_id: 1,
                    category_code: 'C001',
                    category_name_es: 'MERCADO',
                    category_name_en: 'Groceries',
                    amount_cad: 800,
                    percentage: 40,
                    transaction_count: 4,
                },
                {
                    category_id: 2,
                    category_code: 'C006',
                    category_name_es: 'COMIDAS CALLE',
                    category_name_en: 'Dining Out / Takeout',
                    amount_cad: 500,
                    percentage: 25,
                    transaction_count: 3,
                },
                {
                    category_id: 3,
                    category_code: 'C004',
                    category_name_es: 'TRANSPORTES',
                    category_name_en: 'Transportation',
                    amount_cad: 350,
                    percentage: 17.5,
                    transaction_count: 2,
                },
                {
                    category_id: 4,
                    category_code: 'C008',
                    category_name_es: 'SERVICIOS',
                    category_name_en: 'Utilities',
                    amount_cad: 250,
                    percentage: 12.5,
                    transaction_count: 1,
                },
                {
                    category_id: 5,
                    category_code: 'C005',
                    category_name_es: 'HOGAR',
                    category_name_en: 'Household',
                    amount_cad: 100,
                    percentage: 5,
                    transaction_count: 1,
                },
            ],
        },
        recent_activity: {
            limit: 15,
            items: [
                {
                    id: 101,
                    type: 'expense',
                    date: '2026-01-20',
                    period: '202601',
                    summary: 'Groceries / MERCADO · via RBC Chequing · Weekly shop',
                    amount_cad: 85.5,
                    amount_usd: null,
                    amount_cop: null,
                    category_code: 'C001',
                    category_name_en: 'Groceries',
                    category_name_es: 'MERCADO',
                    account_name: 'RBC Chequing',
                    comments: 'Weekly shop',
                    detail_url: '/transactions?period=202601&highlight=101',
                },
                {
                    id: 12,
                    type: 'income',
                    date: '2026-01-31',
                    period: '202601',
                    summary: 'Salary',
                    amount_cad: 5000,
                    amount_usd: null,
                    amount_cop: null,
                    category_code: null,
                    category_name_en: null,
                    category_name_es: null,
                    account_name: null,
                    comments: null,
                    detail_url: '/income',
                },
                {
                    id: 99,
                    type: 'expense',
                    date: '2026-01-18',
                    period: '202601',
                    summary: 'Transportation / TRANSPORTES · via Wise',
                    amount_cad: 42,
                    amount_usd: null,
                    amount_cop: null,
                    category_code: 'C004',
                    category_name_en: 'Transportation',
                    category_name_es: 'TRANSPORTES',
                    account_name: 'Wise',
                    comments: null,
                    detail_url: '/transactions?period=202601&highlight=99',
                },
            ],
        },
    },
};

function resolveHref(href: unknown): string {
    if (typeof href === 'string') {
        return href;
    }

    if (
        typeof href === 'object' &&
        href !== null &&
        'url' in href &&
        typeof href.url === 'string'
    ) {
        return href.url;
    }

    return '#';
}

vi.mock('@inertiajs/react', () => {
    const mockUsePage = vi.fn(() => mockPage);

    const Link = React.forwardRef<
        HTMLAnchorElement,
        React.AnchorHTMLAttributes<HTMLAnchorElement> & {
            href?: unknown;
            prefetch?: boolean;
        }
    >(({ href, prefetch: _prefetch, children, ...props }, ref) => (
        <a ref={ref} href={resolveHref(href)} {...props}>
            {children}
        </a>
    ));

    Link.displayName = 'InertiaLink';

    return {
        Head: () => null,
        Link,
        router: {
            flushAll: vi.fn(),
        },
        usePage: mockUsePage,
    };
});

function renderDashboard(
    summary = mockPage.props.summary,
    incomeExpenseChart = mockPage.props.income_expense_chart,
    assetsLiabilitiesChart = mockPage.props.assets_liabilities_chart,
    topSpendingCategories = mockPage.props.top_spending_categories,
    recentActivity = mockPage.props.recent_activity,
    options: {
        defaultCurrency?: string;
        displayCurrency?: string;
    } = {},
) {
    return render(
        <TooltipProvider delayDuration={0}>
            <AppLayout breadcrumbs={Dashboard.layout.breadcrumbs}>
                <Dashboard
                    summary={summary as never}
                    income_expense_chart={incomeExpenseChart as never}
                    assets_liabilities_chart={assetsLiabilitiesChart as never}
                    top_spending_categories={topSpendingCategories as never}
                    recent_activity={recentActivity}
                    default_currency={options.defaultCurrency ?? 'CAD'}
                    display_currency={options.displayCurrency ?? options.defaultCurrency ?? 'CAD'}
                    available_currencies={['CAD', 'USD', 'COP']}
                />
            </AppLayout>
        </TooltipProvider>,
    );
}

describe('Dashboard feature', () => {
    it('renders the dashboard page without crashing', () => {
        expect(() => renderDashboard()).not.toThrow();
    });

    it('displays the dashboard title and period', () => {
        renderDashboard();

        expect(
            screen.getByRole('heading', { name: 'Dashboard' }),
        ).toBeDefined();
        expect(screen.getByText(/January 2026/i)).toBeDefined();
    });

    it('displays total income card', () => {
        renderDashboard();

        expect(screen.getByText('Total Income')).toBeDefined();
        expect(screen.getAllByText('$5,000.00').length).toBeGreaterThan(0);
    });

    it('displays total expenses card', () => {
        renderDashboard();

        expect(screen.getByText('Total Expenses')).toBeDefined();
        expect(screen.getByText('$2,000.00')).toBeDefined();
    });

    it('displays net card', () => {
        renderDashboard();

        expect(screen.getByText('Net')).toBeDefined();
        expect(screen.getAllByText('$3,000.00').length).toBeGreaterThan(0);
    });

    it('displays total assets card', () => {
        renderDashboard();

        expect(screen.getByText('Total Assets')).toBeDefined();
        expect(screen.getByText('$15,000.00')).toBeDefined();
    });

    it('displays total liabilities card', () => {
        renderDashboard();

        expect(screen.getByText('Total Liabilities')).toBeDefined();
        expect(screen.getAllByText('$3,000.00').length).toBeGreaterThan(0);
    });

    it('displays equity card', () => {
        renderDashboard();

        expect(screen.getAllByText('Equity').length).toBeGreaterThan(0);
        expect(screen.getByText('$12,000.00')).toBeDefined();
    });

    it('displays reconciliation status badge as balanced', () => {
        renderDashboard();

        expect(screen.getByText('Balanced')).toBeDefined();
    });

    it('displays reconciliation status badge as unbalanced', () => {
        const unbalancedSummary = {
            ...mockPage.props.summary,
            reconciliation_status: 'unbalanced' as const,
            reconciliation_summary: {
                balanced_count: 3,
                unbalanced_count: 2,
                total_count: 5,
            },
        };

        renderDashboard(unbalancedSummary);

        expect(screen.getByText('Unbalanced')).toBeDefined();
    });

    it('displays reconciliation summary with balanced accounts', () => {
        renderDashboard();

        expect(screen.getByText(/5 of 5 accounts balanced/i)).toBeDefined();
    });

    it('displays reconciliation summary with unbalanced accounts', () => {
        const unbalancedSummary = {
            ...mockPage.props.summary,
            reconciliation_status: 'unbalanced' as const,
            reconciliation_summary: {
                balanced_count: 3,
                unbalanced_count: 2,
                total_count: 5,
            },
        };

        renderDashboard(unbalancedSummary);

        expect(screen.getByText(/3 of 5 accounts balanced/i)).toBeDefined();
        expect(screen.getByText(/2 accounts need attention/i)).toBeDefined();
    });

    it('displays link to reconciliation page', () => {
        renderDashboard();

        const link = screen.getByText('View Details →');
        expect(link).toBeDefined();
        expect(link.closest('a')).toHaveAttribute('href', '/reconciliation');
    });

    it('displays income vs expenses chart with legend and 12 months', () => {
        renderDashboard();

        expect(screen.getByText('Income vs Expenses')).toBeDefined();
        expect(screen.getByTestId('income-expense-chart')).toBeDefined();
        expect(screen.getByTestId('income-expense-chart-legend')).toBeDefined();
        expect(screen.getByTestId('chart-line-income')).toBeDefined();
        expect(screen.getByTestId('chart-line-expenses')).toBeDefined();
        expect(screen.getByTestId('income-expense-chart-range').textContent).toMatch(
            /Last 12 months/i,
        );
        expect(screen.getByTestId('chart-bar-income-202601')).toBeDefined();
        expect(screen.getByTestId('chart-bar-expenses-202601')).toBeDefined();
        expect(
            screen.getByTestId('income-expense-chart-legend').textContent,
        ).toMatch(/Income/);
        expect(
            screen.getByTestId('income-expense-chart-legend').textContent,
        ).toMatch(/Expenses/);
    });

    it('displays assets vs liabilities chart with equity and hover values', () => {
        renderDashboard();

        expect(screen.getByText('Assets vs Liabilities')).toBeDefined();
        expect(screen.getByTestId('assets-liabilities-chart')).toBeDefined();
        expect(screen.getByTestId('assets-liabilities-chart-legend')).toBeDefined();
        expect(screen.getByTestId('al-chart-line-assets')).toBeDefined();
        expect(screen.getByTestId('al-chart-line-liabilities')).toBeDefined();
        expect(screen.getByTestId('al-chart-line-equity')).toBeDefined();
        expect(
            screen.getByTestId('assets-liabilities-chart-range').textContent,
        ).toMatch(/Last 12 months/i);
        expect(screen.getByTestId('al-chart-period-202601')).toBeDefined();
        expect(screen.getByTestId('al-chart-point-equity-202601')).toBeDefined();

        fireEvent.mouseEnter(screen.getByTestId('al-chart-hit-202601'));
        expect(screen.getByTestId('assets-liabilities-hover-tooltip')).toBeDefined();
        expect(
            screen.getByTestId('assets-liabilities-hover-tooltip').textContent,
        ).toMatch(/Assets/i);
        expect(
            screen.getByTestId('assets-liabilities-hover-tooltip').textContent,
        ).toMatch(/Liabilities/i);
        expect(
            screen.getByTestId('assets-liabilities-hover-tooltip').textContent,
        ).toMatch(/Equity/i);
    });

    it('displays top spending categories with amounts and percentages', () => {
        renderDashboard();

        expect(screen.getByText('Top Spending Categories')).toBeDefined();
        expect(screen.getByTestId('top-spending-categories-card')).toBeDefined();
        expect(screen.getByTestId('top-spending-categories-list')).toBeDefined();
        expect(screen.getByTestId('top-spending-row-C001')).toBeDefined();
        expect(screen.getByTestId('top-spending-amount-C001').textContent).toMatch(
            /\$800\.00/,
        );
        expect(screen.getByTestId('top-spending-pct-C001').textContent).toMatch(
            /40\.0%/,
        );
        expect(screen.getByTestId('top-spending-bar-C001')).toBeDefined();
        expect(screen.getAllByText(/MERCADO/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Groceries/).length).toBeGreaterThan(0);
        expect(screen.getByTestId('top-spending-row-C006')).toBeDefined();
        expect(screen.getByTestId('top-spending-row-C005')).toBeDefined();
    });

    it('shows empty state when there are no top spending categories', () => {
        renderDashboard(
            mockPage.props.summary,
            mockPage.props.income_expense_chart,
            mockPage.props.assets_liabilities_chart,
            {
                period: '202601',
                limit: 10,
                total_expenses_cad: 0,
                categories: [],
            },
        );

        expect(screen.getByTestId('top-spending-categories-empty')).toBeDefined();
        expect(screen.getByText(/No spending recorded/i)).toBeDefined();
    });

    it('displays recent activity feed with date, type, and summary', () => {
        renderDashboard();

        expect(screen.getByText('Recent Activity')).toBeDefined();
        expect(screen.getByTestId('recent-activity-card')).toBeDefined();
        expect(screen.getByTestId('recent-activity-list')).toBeDefined();
        expect(screen.getByTestId('recent-activity-item-expense-101')).toBeDefined();
        expect(screen.getByTestId('recent-activity-type-expense-101').textContent).toMatch(
            /Expense/i,
        );
        expect(screen.getByTestId('recent-activity-date-expense-101').textContent).toMatch(
            /Jan/i,
        );
        expect(
            screen.getByTestId('recent-activity-summary-expense-101').textContent,
        ).toMatch(/Weekly shop/);
        expect(
            screen.getByTestId('recent-activity-amount-expense-101').textContent,
        ).toMatch(/\$85\.50/);
        expect(screen.getByTestId('recent-activity-item-income-12')).toBeDefined();
        expect(screen.getByTestId('recent-activity-type-income-12').textContent).toMatch(
            /Income/i,
        );

        const expenseLink = screen
            .getByTestId('recent-activity-item-expense-101')
            .closest('a');
        expect(expenseLink).toHaveAttribute(
            'href',
            '/transactions?period=202601&highlight=101',
        );
    });

    it('shows empty state when there is no recent activity', () => {
        renderDashboard(
            mockPage.props.summary,
            mockPage.props.income_expense_chart,
            mockPage.props.assets_liabilities_chart,
            mockPage.props.top_spending_categories,
            { limit: 15, items: [] },
        );

        expect(screen.getByTestId('recent-activity-empty')).toBeDefined();
        expect(screen.getByText(/No recent activity yet/i)).toBeDefined();
    });

    it('defaults display currency from preferences and allows toggling', () => {
        renderDashboard(
            mockPage.props.summary,
            mockPage.props.income_expense_chart,
            mockPage.props.assets_liabilities_chart,
            mockPage.props.top_spending_categories,
            mockPage.props.recent_activity,
            { defaultCurrency: 'CAD', displayCurrency: 'CAD' },
        );

        expect(screen.getByTestId('currency-toggle')).toBeDefined();
        expect(screen.getByTestId('dashboard-total-income').textContent).toMatch(
            /\$5,000\.00/,
        );

        fireEvent.click(screen.getByTestId('currency-toggle-usd'));
        expect(screen.getByTestId('dashboard-total-income').textContent).toMatch(
            /US\$6,666\.67|\$6,666\.67/,
        );

        fireEvent.click(screen.getByTestId('currency-toggle-cop'));
        expect(screen.getByTestId('dashboard-total-income').textContent).toMatch(
            /15[,.]000[,.]000|\$15,000,000/,
        );
    });

    it('initializes from user default currency preference', () => {
        renderDashboard(
            mockPage.props.summary,
            mockPage.props.income_expense_chart,
            mockPage.props.assets_liabilities_chart,
            mockPage.props.top_spending_categories,
            mockPage.props.recent_activity,
            { defaultCurrency: 'USD', displayCurrency: 'USD' },
        );

        expect(screen.getByTestId('dashboard-total-income').textContent).toMatch(
            /US\$6,666\.67|\$6,666\.67/,
        );
        expect(screen.getByTestId('income-expense-chart-range').textContent).toMatch(
            /USD/,
        );
    });
});

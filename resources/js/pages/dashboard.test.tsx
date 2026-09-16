import React from 'react';
import { render, screen } from '@testing-library/react';
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
            total_expenses_cad: 2000.00,
            net_cad: 3000.00,
            total_assets_cad: 15000.00,
            total_liabilities_cad: 3000.00,
            equity_cad: 12000.00,
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
    chart = mockPage.props.income_expense_chart,
) {
    return render(
        <TooltipProvider delayDuration={0}>
            <AppLayout breadcrumbs={Dashboard.layout.breadcrumbs}>
                <Dashboard
                    summary={summary}
                    income_expense_chart={chart}
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
        expect(screen.getByText('$5,000.00')).toBeDefined();
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

        expect(screen.getByText('Equity')).toBeDefined();
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
});

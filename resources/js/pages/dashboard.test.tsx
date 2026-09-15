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

function renderDashboard(props = mockPage.props.summary) {
    return render(
        <TooltipProvider delayDuration={0}>
            <AppLayout breadcrumbs={Dashboard.layout.breadcrumbs}>
                <Dashboard summary={props} />
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

        expect(screen.getByText('Dashboard')).toBeDefined();
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
        expect(screen.getByText('$3,000.00')).toBeDefined();
    });

    it('displays total assets card', () => {
        renderDashboard();

        expect(screen.getByText('Total Assets')).toBeDefined();
        expect(screen.getByText('$15,000.00')).toBeDefined();
    });

    it('displays total liabilities card', () => {
        renderDashboard();

        expect(screen.getByText('Total Liabilities')).toBeDefined();
        expect(screen.getByText('$3,000.00')).toBeDefined();
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
});

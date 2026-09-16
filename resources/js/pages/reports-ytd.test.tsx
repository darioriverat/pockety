import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import ReportsYtd from '@/pages/reports-ytd';
import type { User } from '@/types';

type MockPage = {
    url: string;
    props: {
        name: string;
        auth: {
            user: User;
        };
        sidebarOpen: boolean;
        ytd_totals: {
            year: number;
            from_period: string;
            to_period: string;
            ytd_income_cad: number;
            ytd_expenses_cad: number;
            ytd_net_cad: number;
            period_count: number;
        };
        available_years: number[];
    };
};

const mockPage: MockPage = {
    url: '/reports/year-to-date',
    props: {
        name: 'Pockety',
        auth: {
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                email_verified_at: '2025-01-01T00:00:00Z',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
            },
        },
        sidebarOpen: false,
        ytd_totals: {
            year: 2025,
            from_period: '202501',
            to_period: '202512',
            ytd_income_cad: 60000.00,
            ytd_expenses_cad: 45000.00,
            ytd_net_cad: 15000.00,
            period_count: 12,
        },
        available_years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    },
};

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title?: string }) => <title>{title ?? 'Pockety'}</title>,
    Link: ({
        href,
        children,
        prefetch: _prefetch,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        prefetch?: boolean;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => mockPage,
    router: {
        get: vi.fn(),
    },
}));

function renderReportsYtd(
    ytdTotals = mockPage.props.ytd_totals,
    availableYears = mockPage.props.available_years,
) {
    return render(
        <TooltipProvider delayDuration={0}>
            <AppLayout>
                <ReportsYtd ytd_totals={ytdTotals} available_years={availableYears} />
            </AppLayout>
        </TooltipProvider>,
    );
}

describe('ReportsYtd', () => {
    it('renders the year-to-date reports heading', () => {
        renderReportsYtd();

        expect(screen.getByTestId('reports-ytd-heading')).toHaveTextContent(
            'Year-to-Date Reports',
        );
    });

    it('displays the year selector card', () => {
        renderReportsYtd();

        expect(screen.getByTestId('year-selector-card')).toBeInTheDocument();
        expect(screen.getByTestId('year-select')).toBeInTheDocument();
    });

    it('displays the YTD income total', () => {
        renderReportsYtd();

        expect(screen.getByTestId('ytd-income-card')).toBeInTheDocument();
        expect(screen.getByTestId('ytd-income-total')).toHaveTextContent('$60,000.00');
    });

    it('displays the YTD expenses total', () => {
        renderReportsYtd();

        expect(screen.getByTestId('ytd-expenses-card')).toBeInTheDocument();
        expect(screen.getByTestId('ytd-expenses-total')).toHaveTextContent('$45,000.00');
    });

    it('displays the YTD net total', () => {
        renderReportsYtd();

        expect(screen.getByTestId('ytd-net-card')).toBeInTheDocument();
        expect(screen.getByTestId('ytd-net-total')).toHaveTextContent('$15,000.00');
    });

    it('displays the correct year in the summary title', () => {
        renderReportsYtd();

        expect(screen.getByTestId('ytd-summary-card')).toHaveTextContent(
            'Year-to-Date Summary for 2025',
        );
    });

    it('displays period count in the summary description', () => {
        renderReportsYtd();

        expect(screen.getByTestId('ytd-summary-card')).toHaveTextContent('12 periods');
    });

    it('handles negative net values correctly', () => {
        const negativeNetProps = {
            ...mockPage.props.ytd_totals,
            ytd_net_cad: -5000.00,
        };

        renderReportsYtd(negativeNetProps);

        expect(screen.getByTestId('ytd-net-total')).toHaveTextContent('-$5,000.00');
    });

    it('renders all available years in the selector', () => {
        renderReportsYtd();

        const yearSelect = screen.getByTestId('year-select');
        fireEvent.click(yearSelect);

        mockPage.props.available_years.forEach((year) => {
            expect(screen.getByTestId(`year-option-${year}`)).toBeInTheDocument();
        });
    });
});

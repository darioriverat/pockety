import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PeriodComparison from './period-comparison';

const routerGet = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        get: (...args: unknown[]) => routerGet(...args),
    },
}));

describe('PeriodComparison page', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        routerGet.mockReset();
    });

    it('renders side-by-side income expenses and balances with differences', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: {
                        period_a: '202501',
                        period_b: '202502',
                        period_a_summary: {
                            period: '202501',
                            total_income_cad: 5000,
                            total_expenses_cad: 1000,
                            net_cad: 4000,
                            total_assets_cad: 10000,
                            total_liabilities_cad: 4000,
                            equity_cad: 6000,
                        },
                        period_b_summary: {
                            period: '202502',
                            total_income_cad: 5500,
                            total_expenses_cad: 800,
                            net_cad: 4700,
                            total_assets_cad: 12000,
                            total_liabilities_cad: 3500,
                            equity_cad: 8500,
                        },
                        metrics: [
                            {
                                key: 'income',
                                label: 'Income',
                                period_a_cad: 5000,
                                period_b_cad: 5500,
                                difference_cad: 500,
                                percent_change: 10,
                            },
                            {
                                key: 'expenses',
                                label: 'Expenses',
                                period_a_cad: 1000,
                                period_b_cad: 800,
                                difference_cad: -200,
                                percent_change: -20,
                            },
                            {
                                key: 'net',
                                label: 'Net',
                                period_a_cad: 4000,
                                period_b_cad: 4700,
                                difference_cad: 700,
                                percent_change: 17.5,
                            },
                            {
                                key: 'assets',
                                label: 'Assets',
                                period_a_cad: 10000,
                                period_b_cad: 12000,
                                difference_cad: 2000,
                                percent_change: 20,
                            },
                            {
                                key: 'liabilities',
                                label: 'Liabilities',
                                period_a_cad: 4000,
                                period_b_cad: 3500,
                                difference_cad: -500,
                                percent_change: -12.5,
                            },
                            {
                                key: 'equity',
                                label: 'Equity',
                                period_a_cad: 6000,
                                period_b_cad: 8500,
                                difference_cad: 2500,
                                percent_change: 41.67,
                            },
                        ],
                    },
                }),
            }),
        );

        render(<PeriodComparison />);

        await waitFor(() => {
            expect(screen.getByTestId('period-comparison-heading')).toBeInTheDocument();
        });

        expect(screen.getByTestId('period-a-label')).toHaveTextContent('202501');
        expect(screen.getByTestId('period-b-label')).toHaveTextContent('202502');
        expect(screen.getByTestId('period-a-income')).toHaveTextContent(/5,000/);
        expect(screen.getByTestId('period-b-income')).toHaveTextContent(/5,500/);
        expect(screen.getByTestId('period-a-expenses')).toHaveTextContent(/1,000/);
        expect(screen.getByTestId('period-b-expenses')).toHaveTextContent(/800/);
        expect(screen.getByTestId('period-a-assets')).toHaveTextContent(/10,000/);
        expect(screen.getByTestId('period-b-assets')).toHaveTextContent(/12,000/);

        expect(screen.getByTestId('comparison-row-income')).toBeInTheDocument();
        expect(screen.getByTestId('comparison-income-difference')).toHaveTextContent(
            /\+\$500/,
        );
        expect(screen.getByTestId('comparison-expenses-difference')).toHaveTextContent(
            /-\$200/,
        );
        expect(screen.getByTestId('comparison-income-percent')).toHaveTextContent(
            '+10.00%',
        );

        expect(screen.getByTestId('swap-periods-button')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('swap-periods-button'));
        expect(routerGet).toHaveBeenCalled();
    });
});

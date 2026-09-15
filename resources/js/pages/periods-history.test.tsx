import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PeriodsHistory from './periods-history';

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
}));

describe('PeriodsHistory page', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders chronological period rows with summary stats', async () => {
        const periods = Array.from({ length: 21 }, (_, index) => {
            const year = index < 12 ? 2025 : 2026;
            const month = (index % 12) + 1;
            const period = `${year}${String(month).padStart(2, '0')}`;
            return {
                period,
                transaction_count: period === '202501' ? 2 : 0,
                income_total_cad: period === '202501' ? 5000 : 0,
                expenses_total_cad: period === '202501' ? 200 : 0,
            };
        });

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: {
                        from: '202501',
                        to: '202609',
                        periods,
                    },
                }),
            }),
        );

        render(<PeriodsHistory />);

        await waitFor(() => {
            expect(screen.getByTestId('periods-history-count')).toHaveTextContent(
                '21',
            );
        });

        expect(screen.getByTestId('periods-history-heading')).toBeInTheDocument();
        expect(screen.getByTestId('period-row-202501')).toBeInTheDocument();
        expect(screen.getByTestId('period-row-202609')).toBeInTheDocument();
        expect(screen.getByTestId('period-tx-count-202501')).toHaveTextContent(
            '2',
        );
        expect(screen.getByTestId('period-income-202501')).toHaveTextContent(
            /5,000/,
        );
        expect(screen.getByTestId('period-expenses-202501')).toHaveTextContent(
            /200/,
        );

        const rows = screen.getAllByTestId(/period-row-/);
        expect(rows).toHaveLength(21);
        expect(rows[0]).toHaveAttribute('data-period', '202501');
        expect(rows[20]).toHaveAttribute('data-period', '202609');
    });
});

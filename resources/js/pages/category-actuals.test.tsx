import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CategoryActuals from './category-actuals';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    usePage: () => ({ props: {} }),
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

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

describe('CategoryActuals page', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders aggregated actuals and updates after refresh fetch', async () => {
        const categories = [
            {
                category_id: 1,
                category_code: 'C001',
                category_name: 'Groceries',
                is_debt_category: false,
                actual_cad: 150.25,
                transaction_count: 2,
            },
        ];

        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: { period: '202501', categories },
                    meta: {
                        period: '202501',
                        category_count: 1,
                        total_actual_cad: 150.25,
                        total_transactions: 2,
                        currency: 'CAD',
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        period: '202501',
                        categories: [
                            {
                                ...categories[0],
                                actual_cad: 192.75,
                                transaction_count: 3,
                            },
                        ],
                    },
                    meta: {
                        period: '202501',
                        category_count: 1,
                        total_actual_cad: 192.75,
                        total_transactions: 3,
                        currency: 'CAD',
                    },
                }),
            });

        vi.stubGlobal('fetch', fetchMock);

        render(<CategoryActuals />);

        await waitFor(() => {
            expect(
                screen.getByTestId('category-actual-amount-C001'),
            ).toHaveTextContent(/150\.25/);
        });

        expect(
            screen.getByTestId('category-actuals-heading'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('category-actuals-count')).toHaveTextContent(
            '1',
        );
        expect(
            screen.getByTestId('category-actual-tx-C001'),
        ).toHaveTextContent('2');
        expect(screen.queryByTestId('category-actual-row-C004')).not.toBeInTheDocument();
        expect(screen.getByText('Categories with transactions this period')).toBeInTheDocument();

        screen.getByTestId('category-actuals-refresh').click();

        await waitFor(() => {
            expect(
                screen.getByTestId('category-actual-amount-C001'),
            ).toHaveTextContent(/192\.75/);
        });

        expect(
            screen.getByTestId('category-actual-tx-C001'),
        ).toHaveTextContent('3');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('shows an empty month and keeps the selected period readable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: { period: '202501', categories: [] },
                meta: { category_count: 0, total_actual_cad: 0, total_transactions: 0 },
            }),
        }));
        render(<CategoryActuals />);
        expect(await screen.findByText('No transactions in this period.')).toBeInTheDocument();
        expect(screen.getByTestId('page-period-selector')).toHaveTextContent('January 2025');
        expect(screen.getByTestId('category-actuals-count')).toHaveTextContent('0');
    });

});

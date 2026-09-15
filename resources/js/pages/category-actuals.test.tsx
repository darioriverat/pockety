import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CategoryActuals from './category-actuals';

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
                category_name_es: 'MERCADO',
                category_name_en: 'Groceries',
                is_debt_category: false,
                actual_cad: 150.25,
                transaction_count: 2,
            },
            {
                category_id: 2,
                category_code: 'C004',
                category_name_es: 'TRANSPORTES',
                category_name_en: 'Transportation',
                is_debt_category: false,
                actual_cad: 0,
                transaction_count: 0,
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
                        category_count: 2,
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
                            categories[1],
                        ],
                    },
                    meta: {
                        period: '202501',
                        category_count: 2,
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
            '2',
        );
        expect(
            screen.getByTestId('category-actual-tx-C001'),
        ).toHaveTextContent('2');
        expect(
            screen.getByTestId('category-actual-amount-C004'),
        ).toHaveTextContent(/0\.00/);

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
});

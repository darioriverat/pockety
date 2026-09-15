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

describe('CategoryActuals drill-down links', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('links each category to the filtered transactions detail view', async () => {
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
        ];

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
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
            }),
        );

        render(<CategoryActuals />);

        await waitFor(() => {
            expect(
                screen.getByTestId('category-actual-link-C001'),
            ).toBeInTheDocument();
        });

        const link = screen.getByTestId('category-actual-link-C001');
        expect(link).toHaveAttribute(
            'href',
            '/transactions?period=202501&category=C001',
        );
    });
});

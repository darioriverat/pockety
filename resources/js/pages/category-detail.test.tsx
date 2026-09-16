import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CategoryDetail from './category-detail';

global.fetch = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => (
        <title>{title}</title>
    ),
    Link: ({
        href,
        children,
    }: {
        href: string;
        children: React.ReactNode;
    }) => <a href={href}>{children}</a>,
}));

const unfilteredResponse = {
    data: [
        {
            id: 2,
            date: '2025-02-10',
            period: '202502',
            quincena: 'Q1',
            amount: 250.5,
            currency: 'CAD',
            amount_cad: 250.5,
            amount_usd: null,
            amount_cop: null,
            comments: 'feb-groceries',
            account: { id: 1, name: 'RBC Checking', type: 'bank' },
        },
        {
            id: 1,
            date: '2025-01-05',
            period: '202501',
            quincena: 'Q1',
            amount: 100,
            currency: 'CAD',
            amount_cad: 100,
            amount_usd: null,
            amount_cop: null,
            comments: 'jan-groceries',
            account: { id: 1, name: 'RBC Checking', type: 'bank' },
        },
    ],
    meta: {
        category: {
            id: 1,
            code: 'C001',
            name_es: 'MERCADO',
            name_en: 'Groceries',
            is_debt_category: false,
            is_active: true,
            status: null,
        },
        total_spending_cad: 350.5,
        total_spending_usd: 0,
        total_spending_cop: 0,
        total_count: 2,
        period_count: 2,
        average_per_period_cad: 175.25,
        available_periods: ['202502', '202501'],
        is_filtered: false,
        filters: { period: null },
    },
};

const filteredResponse = {
    data: [unfilteredResponse.data[1]],
    meta: {
        ...unfilteredResponse.meta,
        total_spending_cad: 100,
        total_count: 1,
        period_count: 1,
        average_per_period_cad: 100,
        is_filtered: true,
        filters: { period: '202501' },
    },
};

describe('Category Detail Page — transaction history', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.pushState({}, '', '/categories/C001');
    });

    it('shows all C001 transactions and total spending across periods', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => unfilteredResponse,
        });

        render(<CategoryDetail />);

        await waitFor(() => {
            expect(screen.getByTestId('category-detail-heading')).toHaveTextContent(
                'C001 — Groceries'
            );
        });

        expect(screen.getByTestId('category-total-spending')).toHaveTextContent(
            /\$350\.50/
        );
        expect(screen.getByTestId('category-transaction-count')).toHaveTextContent(
            '2'
        );
        expect(screen.getByText('jan-groceries')).toBeInTheDocument();
        expect(screen.getByText('feb-groceries')).toBeInTheDocument();
        expect(screen.getByTestId('category-transactions-table')).toBeInTheDocument();
    });

    it('filters transactions by period', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => unfilteredResponse,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => filteredResponse,
            });

        render(<CategoryDetail />);

        await waitFor(() => {
            expect(screen.getByText('feb-groceries')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('filter-period'), {
            target: { value: '202501' },
        });
        fireEvent.click(screen.getByTestId('apply-period-filter'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/categories/C001/transactions?period=202501'
            );
        });

        await waitFor(() => {
            expect(screen.getByText('jan-groceries')).toBeInTheDocument();
            expect(screen.queryByText('feb-groceries')).not.toBeInTheDocument();
            expect(screen.getByTestId('category-total-spending')).toHaveTextContent(
                /\$100\.00/
            );
            expect(screen.getByTestId('active-period-filter')).toBeInTheDocument();
        });
    });
});

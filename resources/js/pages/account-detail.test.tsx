import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountDetail from './account-detail';

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

const accountResponse = {
    data: {
        id: 42,
        name: 'RBC Checking',
        type: 'bank',
        primary_currency: 'CAD',
    },
};

const unfilteredTransactions = {
    data: [
        {
            id: 3,
            date: '2025-02-10',
            period: '202502',
            category_code: 'C001',
            category_name: 'Groceries',
            amount: 50,
            currency: 'CAD',
            comments: 'feb-expense',
            running_balance: 600,
        },
        {
            id: 2,
            date: '2025-01-20',
            period: '202501',
            category_code: 'C001',
            category_name: 'Groceries',
            amount: 200,
            currency: 'CAD',
            comments: 'jan-second',
            running_balance: 650,
        },
        {
            id: 1,
            date: '2025-01-05',
            period: '202501',
            category_code: 'C001',
            category_name: 'Groceries',
            amount: 100,
            currency: 'CAD',
            comments: 'jan-first',
            running_balance: 850,
        },
    ],
    meta: {
        account_id: 42,
        account_name: 'RBC Checking',
        currency: 'CAD',
        starting_balance: 1000,
        current_balance: 600,
        has_recorded_balance: true,
        total_count: 3,
        is_filtered: false,
        filters: { start_date: null, end_date: null },
    },
};

const filteredTransactions = {
    data: [
        {
            id: 2,
            date: '2025-01-20',
            period: '202501',
            category_code: 'C001',
            category_name: 'Groceries',
            amount: 200,
            currency: 'CAD',
            comments: 'jan-second',
            running_balance: 650,
        },
        {
            id: 1,
            date: '2025-01-05',
            period: '202501',
            category_code: 'C001',
            category_name: 'Groceries',
            amount: 100,
            currency: 'CAD',
            comments: 'jan-first',
            running_balance: 850,
        },
    ],
    meta: {
        account_id: 42,
        account_name: 'RBC Checking',
        currency: 'CAD',
        starting_balance: 950,
        current_balance: 650,
        has_recorded_balance: true,
        total_count: 2,
        is_filtered: true,
        filters: { start_date: '2025-01-01', end_date: '2025-01-31' },
    },
};

describe('Account Detail Page — running balance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as ReturnType<typeof vi.fn>).mockReset();
        window.history.pushState({}, '', '/accounts/42');
    });

    it('shows starting balance, per-transaction balance after, and current balance', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => accountResponse,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => unfilteredTransactions,
            });

        render(<AccountDetail />);

        await waitFor(() => {
            expect(screen.getByTestId('account-detail-page')).toBeInTheDocument();
            expect(screen.getByText('RBC Checking')).toBeInTheDocument();
        });

        expect(screen.getByTestId('starting-balance')).toHaveTextContent(
            '$1,000.00',
        );
        expect(screen.getByTestId('current-balance')).toHaveTextContent(
            '$600.00',
        );
        expect(screen.getByTestId('final-running-balance')).toHaveTextContent(
            '$600.00',
        );
        expect(screen.getByTestId('starting-balance-row')).toHaveTextContent(
            'Starting balance',
        );
        expect(screen.getByTestId('starting-balance-row')).toHaveTextContent(
            '$1,000.00',
        );
        expect(screen.getByText('feb-expense')).toBeInTheDocument();
        expect(screen.getByText('jan-second')).toBeInTheDocument();
        expect(screen.getByText('jan-first')).toBeInTheDocument();
        expect(screen.getByText('Balance After')).toBeInTheDocument();
        expect(screen.getByTestId('account-date-filter')).toBeInTheDocument();
    });

    it('applies date range filter and shows filtered starting balance', async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => accountResponse,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => unfilteredTransactions,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => filteredTransactions,
            });

        render(<AccountDetail />);

        await waitFor(() => {
            expect(screen.getByText('feb-expense')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('filter-start-date'), {
            target: { value: '2025-01-01' },
        });
        fireEvent.change(screen.getByTestId('filter-end-date'), {
            target: { value: '2025-01-31' },
        });
        fireEvent.click(screen.getByTestId('apply-date-filter'));

        await waitFor(() => {
            expect(screen.getByTestId('active-date-filter')).toHaveTextContent(
                '2025-01-01 to 2025-01-31',
            );
        });

        expect(screen.getByTestId('starting-balance')).toHaveTextContent(
            '$950.00',
        );
        expect(screen.getByTestId('current-balance')).toHaveTextContent(
            '$650.00',
        );
        expect(screen.getByText('jan-second')).toBeInTheDocument();
        expect(screen.getByText('jan-first')).toBeInTheDocument();
        expect(screen.queryByText('feb-expense')).not.toBeInTheDocument();

        const filteredCall = (global.fetch as ReturnType<typeof vi.fn>).mock
            .calls[2][0] as string;
        expect(filteredCall).toContain('start_date=2025-01-01');
        expect(filteredCall).toContain('end_date=2025-01-31');
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccountDetail from './account-detail';

global.fetch = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => (
        <head>
            <title>{title}</title>
        </head>
    ),
    Link: ({
        href,
        children,
    }: {
        href: string;
        children: React.ReactNode;
    }) => <a href={href}>{children}</a>,
}));

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
                json: async () => ({
                    data: {
                        id: 42,
                        name: 'RBC Checking',
                        type: 'bank',
                        primary_currency: 'CAD',
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 2,
                            date: '2025-01-20',
                            period: '202501',
                            category_code: 'C001',
                            category_name: 'Groceries',
                            amount: 200,
                            currency: 'CAD',
                            comments: 'rb-second',
                            running_balance: 700,
                        },
                        {
                            id: 1,
                            date: '2025-01-05',
                            period: '202501',
                            category_code: 'C001',
                            category_name: 'Groceries',
                            amount: 100,
                            currency: 'CAD',
                            comments: 'rb-first',
                            running_balance: 900,
                        },
                    ],
                    meta: {
                        account_id: 42,
                        account_name: 'RBC Checking',
                        currency: 'CAD',
                        starting_balance: 1000,
                        current_balance: 700,
                        has_recorded_balance: true,
                        total_count: 2,
                    },
                }),
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
            '$700.00',
        );
        expect(screen.getByTestId('final-running-balance')).toHaveTextContent(
            '$700.00',
        );
        expect(screen.getByTestId('starting-balance-row')).toHaveTextContent(
            'Starting balance',
        );
        expect(screen.getByTestId('starting-balance-row')).toHaveTextContent(
            '$1,000.00',
        );
        expect(screen.getByText('rb-second')).toBeInTheDocument();
        expect(screen.getByText('rb-first')).toBeInTheDocument();
        expect(screen.getByText('Balance After')).toBeInTheDocument();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from 'sonner';
import Transactions from './transactions';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@inertiajs/react', () => ({
    Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Link: ({
        children,
        href,
        ...props
    }: {
        children?: React.ReactNode;
        href: string;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => ({
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com',
                    category_language: 'en',
                },
            },
        },
    }),
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

const baseTransaction = {
    id: 55,
    date: '2025-01-15',
    period: '202501',
    quincena: 'Q1',
    category_id: 1,
    account_id: null,
    account: null,
    amount_cad: 50.0,
    amount_usd: null,
    amount_cop: null,
    currency: 'CAD',
    amount: 50.0,
    comments: 'Delete me',
    is_recurring: false,
    debt_component: null,
    category: {
        id: 1,
        code: 'C001',
        name_es: 'MERCADO',
        name_en: 'Groceries',
        is_debt_category: false,
    },
};

describe('Transactions - Delete Confirmation Dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: 1,
                                code: 'C001',
                                name_es: 'MERCADO',
                                name_en: 'Groceries',
                                is_debt_category: false,
                            },
                        ],
                    }),
                } as Response;
            }

            if (url.startsWith('/api/accounts')) {
                return {
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response;
            }

            if (
                url.startsWith('/api/transactions/') &&
                init?.method === 'DELETE'
            ) {
                return {
                    ok: true,
                    json: async () => ({}),
                } as Response;
            }

            if (url.startsWith('/api/transactions')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [baseTransaction],
                        links: { self: '/api/transactions' },
                        meta: {
                            total: 1,
                            page: 1,
                            per_page: 50,
                            last_page: 1,
                        },
                    }),
                } as Response;
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('shows confirmation dialog with warning when delete is clicked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-55')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delete-transaction-button'));

        await waitFor(() => {
            expect(
                screen.getByTestId('delete-confirmation-dialog'),
            ).toBeInTheDocument();
        });

        expect(screen.getByTestId('delete-confirmation-title')).toHaveTextContent(
            'Delete transaction?',
        );
        expect(
            screen.getByTestId('delete-confirmation-warning'),
        ).toHaveTextContent(/cannot be undone/i);
        expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument();
        expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument();

        // No DELETE request until confirmed
        const deleteCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
        );
        expect(deleteCalls).toHaveLength(0);
    });

    it('does not delete when Cancel is clicked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-55')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delete-transaction-button'));
        await waitFor(() => {
            expect(
                screen.getByTestId('delete-confirmation-dialog'),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delete-cancel-button'));

        await waitFor(() => {
            expect(
                screen.queryByTestId('delete-confirmation-dialog'),
            ).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('transaction-row-55')).toBeInTheDocument();
        const deleteCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
        );
        expect(deleteCalls).toHaveLength(0);
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('deletes the transaction when confirmed', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-55')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delete-transaction-button'));
        await waitFor(() => {
            expect(
                screen.getByTestId('delete-confirmation-dialog'),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delete-confirm-button'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Transaction deleted successfully',
            );
        });

        const deleteCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([url, init]) =>
                String(url).includes('/api/transactions/55') &&
                (init as RequestInit | undefined)?.method === 'DELETE',
        );
        expect(deleteCalls.length).toBeGreaterThan(0);
    });
});

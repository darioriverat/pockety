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
    id: 123,
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
    comments: null,
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

describe('Transactions - Success Messages', () => {
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

            if (url === '/api/transactions' && init?.method === 'POST') {
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({
                        data: { ...baseTransaction, id: 999 },
                    }),
                } as Response;
            }

            if (
                url.startsWith('/api/transactions/') &&
                init?.method === 'PUT'
            ) {
                return {
                    ok: true,
                    json: async () => ({
                        data: { ...baseTransaction, amount: 75, amount_cad: 75 },
                    }),
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

    it('displays success message after creating a transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /add transaction/i }),
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2025-01-15' },
        });
        fireEvent.change(screen.getByTestId('transaction-period-input'), {
            target: { value: '202501' },
        });

        fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
        const option = await screen.findByRole('option', {
            name: /Groceries/,
        });
        fireEvent.click(option);

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '50.00' },
        });

        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Transaction created successfully',
            );
        });
    });

    it('submits a negative amount when creating a transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /add transaction/i }),
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2025-01-15' },
        });
        fireEvent.change(screen.getByTestId('transaction-period-input'), {
            target: { value: '202501' },
        });

        fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
        const option = await screen.findByRole('option', {
            name: /Groceries/,
        });
        fireEvent.click(option);

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '-25.50' },
        });

        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
                ([url, init]) =>
                    String(url) === '/api/transactions' &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );

            expect(postCall).toBeDefined();
            const body = JSON.parse(String((postCall?.[1] as RequestInit).body));
            expect(body.amount_cad).toBe(-25.5);
        });
    });

    it('displays success message after updating a transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('edit-transaction-button')[0]);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '75.00' },
        });
        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                'Transaction updated successfully',
            );
        });
    });

    it('displays success message after deleting a transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('delete-transaction-button')[0]);

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
    });

    it('displays error message when delete fails', async () => {
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
                    ok: false,
                    json: async () => ({ error: 'Failed to delete' }),
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

        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('delete-transaction-button')[0]);
        await waitFor(() => {
            expect(
                screen.getByTestId('delete-confirmation-dialog'),
            ).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId('delete-confirm-button'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                'Failed to delete transaction',
            );
        });
    });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const account = {
    id: 7,
    name: 'RBC Checking',
    type: 'bank',
};

const transactionWithAccount = {
    id: 123,
    date: '2025-01-15',
    period: '202501',
    quincena: 'Q1',
    category_id: 1,
    account_id: account.id,
    account,
    amount_cad: 50.0,
    amount_usd: null,
    amount_cop: null,
    currency: 'CAD',
    amount: 50.0,
    comments: 'with-account',
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

function jsonResponse(data: unknown, init?: { ok?: boolean; status?: number }) {
    return {
        ok: init?.ok ?? true,
        status: init?.status ?? 200,
        json: async () => data,
    } as Response;
}

describe('Transactions - optional account field', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return jsonResponse({
                    data: [
                        {
                            id: 1,
                            code: 'C001',
                            name_es: 'MERCADO',
                            name_en: 'Groceries',
                            is_debt_category: false,
                        },
                    ],
                });
            }

            if (url.startsWith('/api/accounts')) {
                return jsonResponse({ data: [account] });
            }

            if (url === '/api/transactions' && init?.method === 'POST') {
                return jsonResponse(
                    {
                        data: { ...transactionWithAccount, id: 999, account_id: null, account: null },
                        message: 'Transaction created successfully',
                    },
                    { status: 201 },
                );
            }

            if (url.startsWith('/api/transactions/') && init?.method === 'PUT') {
                const body = JSON.parse(String(init.body)) as { account_id: number | null };
                return jsonResponse({
                    data: {
                        ...transactionWithAccount,
                        account_id: body.account_id,
                        account: body.account_id ? account : null,
                    },
                    message: 'Transaction updated successfully',
                });
            }

            if (url.startsWith('/api/transactions')) {
                return jsonResponse({
                    data: [transactionWithAccount],
                    links: { self: '/api/transactions' },
                    meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('lets the user clear a selected account when editing', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('edit-transaction-button')[0]);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        const accountField = screen.getByTestId('account-field');
        expect(accountField).toHaveTextContent('RBC Checking');

        fireEvent.click(accountField);
        fireEvent.click(await screen.findByRole('option', { name: 'None' }));

        await waitFor(() => {
            expect(accountField).toHaveTextContent('None');
        });

        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const putCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
                ([url, init]) =>
                    String(url) === '/api/transactions/123' &&
                    (init as RequestInit | undefined)?.method === 'PUT',
            );

            expect(putCall).toBeDefined();
            const body = JSON.parse(String((putCall?.[1] as RequestInit).body));
            expect(body.account_id).toBeNull();
        });
    });

    it('includes a None option when creating a transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        const accountField = screen.getByTestId('account-field');
        expect(accountField).toHaveTextContent('None');

        fireEvent.click(accountField);
        fireEvent.click(await screen.findByRole('option', { name: 'RBC Checking' }));
        await waitFor(() => {
            expect(accountField).toHaveTextContent('RBC Checking');
        });

        fireEvent.click(accountField);
        fireEvent.click(await screen.findByRole('option', { name: 'None' }));
        await waitFor(() => {
            expect(accountField).toHaveTextContent('None');
        });
    });
});

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
                },
            },
        },
    }),
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202601',
        setPeriod: vi.fn(),
    }),
}));

const accounts = [
    { id: 7, name: 'RBC Checking', type: 'bank' },
    { id: 9, name: 'TD Savings', type: 'bank' },
];

const category = {
    id: 1,
    code: 'C001',
    name: 'Groceries',
    is_debt_category: false,
};

function makeTransaction(id: number, accountId: number) {
    return {
        id,
        date: '2026-01-15',
        period: '202601',
        category_id: category.id,
        account_id: accountId,
        account: accounts.find((account) => account.id === accountId) ?? null,
        amount_cad: 50,
        amount_usd: null,
        amount_cop: null,
        currency: 'CAD',
        amount: 50,
        comments: `transaction-${id}`,
        is_recurring: false,
        is_credit: false,
        is_debt_payment: false,
        debt_component: null,
        category,
    };
}

const allTransactions = [makeTransaction(1, 7), makeTransaction(2, 9)];

let transactionUrls: string[] = [];
let totalForPagination: number | null = null;

function jsonResponse(data: unknown, init?: { ok?: boolean; status?: number }) {
    return {
        ok: init?.ok ?? true,
        status: init?.status ?? 200,
        json: async () => data,
    } as Response;
}

function requestedAccountIds(): (string | null)[] {
    return transactionUrls.map((url) =>
        new URL(url, 'http://localhost').searchParams.get('account_id'),
    );
}

describe('Transactions - account filter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        transactionUrls = [];
        totalForPagination = null;
        window.history.replaceState({}, '', '/transactions');

        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = input instanceof Request ? input.url : String(input);

            if (url.startsWith('/api/categories')) {
                return jsonResponse({ data: [category] });
            }

            if (url.startsWith('/api/accounts')) {
                return jsonResponse({ data: accounts });
            }

            if (url.startsWith('/api/transactions')) {
                transactionUrls.push(url);
                const params = new URL(url, 'http://localhost').searchParams;
                const accountId = params.get('account_id');
                const data = accountId
                    ? allTransactions.filter(
                          (transaction) =>
                              transaction.account_id.toString() === accountId,
                      )
                    : allTransactions;

                return jsonResponse({
                    data,
                    links: { self: '/api/transactions' },
                    meta: {
                        total: totalForPagination ?? data.length,
                        page: Number.parseInt(params.get('page') ?? '1', 10),
                        per_page: 50,
                        last_page: totalForPagination ? 2 : 1,
                    },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('renders an account filter with an all-accounts option', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('filter-account')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('filter-account'));

        expect(
            await screen.findByRole('option', { name: 'All Accounts' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'RBC Checking' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'TD Savings' }),
        ).toBeInTheDocument();
    });

    it('sends account_id and lists only that account and updates the URL', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'RBC Checking' }),
        );

        await waitFor(() => {
            expect(requestedAccountIds()).toContain('7');
            expect(window.location.search).toContain('account=7');
        });

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
            expect(
                screen.queryByTestId('transaction-row-2'),
            ).not.toBeInTheDocument();
        });
    });

    it('counts the account filter as active and clears it with the other filters', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        expect(
            screen.queryByRole('button', { name: /clear filters/i }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'TD Savings' }),
        );

        const clearButton = await screen.findByRole('button', {
            name: /clear filters/i,
        });

        fireEvent.click(clearButton);

        await waitFor(() => {
            expect(window.location.search).not.toContain('account=');
        });

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
            expect(screen.getByTestId('transaction-row-2')).toBeInTheDocument();
        });

        expect(screen.getByTestId('filter-account')).toHaveTextContent(
            'All Accounts',
        );
        expect(
            screen.queryByRole('button', { name: /clear filters/i }),
        ).not.toBeInTheDocument();
    });

    it('reads the account query parameter on load', async () => {
        window.history.replaceState({}, '', '/transactions?account=9');

        render(<Transactions />);

        await waitFor(() => {
            expect(requestedAccountIds()).toContain('9');
        });

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-2')).toBeInTheDocument();
            expect(
                screen.queryByTestId('transaction-row-1'),
            ).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('filter-account')).toHaveTextContent(
            'TD Savings',
        );
    });

    it('keeps account_id when another filter changes and when sorting', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'RBC Checking' }),
        );

        await waitFor(() => {
            expect(requestedAccountIds()).toContain('7');
        });

        // Changing the category filter keeps the account filter in the request.
        fireEvent.click(screen.getByTestId('filter-category'));
        fireEvent.click(
            await screen.findByRole('option', {
                name: 'C001 - Groceries',
            }),
        );

        await waitFor(() => {
            const lastUrl = transactionUrls[transactionUrls.length - 1] ?? '';
            const params = new URL(lastUrl, 'http://localhost').searchParams;
            expect(params.get('account_id')).toBe('7');
            expect(params.get('category_id')).toBe('1');
        });

        // Sorting keeps the account filter too.
        fireEvent.click(screen.getByTestId('sort-header-amount'));

        await waitFor(() => {
            const lastUrl = transactionUrls[transactionUrls.length - 1] ?? '';
            const params = new URL(lastUrl, 'http://localhost').searchParams;
            expect(params.get('account_id')).toBe('7');
            expect(params.get('sort_by')).toBe('amount');
        });
    }, 15000);

    it('preserves the account filter across pagination', async () => {
        totalForPagination = 120;
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'RBC Checking' }),
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('pagination-controls'),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('pagination-next'));

        await waitFor(() => {
            const lastUrl = transactionUrls[transactionUrls.length - 1] ?? '';
            const params = new URL(lastUrl, 'http://localhost').searchParams;
            expect(params.get('account_id')).toBe('7');
            expect(params.get('page')).toBe('2');
        });
    }, 15000);

    it('sends no account_id after the all-accounts option is reselected', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'RBC Checking' }),
        );

        await waitFor(() => {
            expect(requestedAccountIds()).toContain('7');
        });

        fireEvent.click(screen.getByTestId('filter-account'));
        fireEvent.click(
            await screen.findByRole('option', { name: 'All Accounts' }),
        );

        await waitFor(() => {
            const lastUrl = transactionUrls[transactionUrls.length - 1] ?? '';
            const params = new URL(lastUrl, 'http://localhost').searchParams;
            expect(params.get('account_id')).toBeNull();
        });

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
            expect(screen.getByTestId('transaction-row-2')).toBeInTheDocument();
        });
    }, 15000);

    it('keeps the filter select separate from the transaction form account field', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-1')).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole('button', { name: /add transaction/i }),
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        expect(screen.getByTestId('account-field')).toBeInTheDocument();
        expect(screen.getByTestId('filter-account')).toBeInTheDocument();
    });
});

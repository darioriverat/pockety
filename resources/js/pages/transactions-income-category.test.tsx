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

const incomeCategory = {
    id: 47,
    code: 'I01',
    name_es: 'SALARIO',
    name_en: 'Salary',
    is_debt_category: false,
    is_income_category: true,
};

const groceries = {
    id: 1,
    code: 'C001',
    name_es: 'MERCADO',
    name_en: 'Groceries',
    is_debt_category: false,
    is_income_category: false,
};

const account = {
    id: 7,
    name: 'RBC Checking',
    type: 'bank',
};

function jsonResponse(data: unknown, init?: { ok?: boolean; status?: number }) {
    return {
        ok: init?.ok ?? true,
        status: init?.status ?? 200,
        json: async () => data,
    } as Response;
}

describe('Transactions - income categories', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return jsonResponse({ data: [groceries, incomeCategory] });
            }

            if (url.startsWith('/api/accounts')) {
                return jsonResponse({ data: [account] });
            }

            if (url === '/api/transactions' && init?.method === 'POST') {
                const body = JSON.parse(String(init.body)) as {
                    category_id: number;
                    account_id: number | null;
                };

                return jsonResponse(
                    {
                        data: {
                            id: 999,
                            date: '2025-01-15',
                            period: '202501',
                            quincena: 'Q1',
                            category_id: body.category_id,
                            account_id: body.account_id,
                            account: body.account_id ? account : null,
                            amount_cad: 500,
                            amount_usd: null,
                            amount_cop: null,
                            currency: 'CAD',
                            amount: 500,
                            comments: 'salary-deposit',
                            is_recurring: false,
                            debt_component: null,
                            category: incomeCategory,
                        },
                        message: 'Transaction created successfully',
                    },
                    { status: 201 },
                );
            }

            if (url.startsWith('/api/transactions')) {
                return jsonResponse({
                    data: [
                        {
                            id: 123,
                            date: '2025-01-15',
                            period: '202501',
                            quincena: 'Q1',
                            category_id: incomeCategory.id,
                            account_id: account.id,
                            account,
                            amount_cad: 500,
                            amount_usd: null,
                            amount_cop: null,
                            currency: 'CAD',
                            amount: 500,
                            comments: 'existing-income',
                            is_recurring: false,
                            debt_component: null,
                            category: incomeCategory,
                        },
                    ],
                    links: { self: '/api/transactions' },
                    meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('requires a deposit account for income categories', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(await screen.findByRole('option', { name: /I01 - Salary/ }));

        await waitFor(() => {
            expect(screen.getByTestId('income-account-hint')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('account-none-option')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Deposit account')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '500' },
        });
        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            expect(screen.getByTestId('account-error')).toHaveTextContent(
                'Income transactions must be assigned to a deposit account.',
            );
        });

        const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
            ([url, init]) =>
                String(url) === '/api/transactions' &&
                (init as RequestInit | undefined)?.method === 'POST',
        );
        expect(postCall).toBeUndefined();
    });

    it('submits income transactions with the selected deposit account', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(await screen.findByRole('option', { name: /I01 - Salary/ }));

        await waitFor(() => {
            expect(screen.getByTestId('income-account-hint')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('account-field'));
        fireEvent.click(await screen.findByRole('option', { name: /RBC Checking/ }));

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '500' },
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
            expect(body.category_id).toBe(incomeCategory.id);
            expect(body.account_id).toBe(account.id);
        });
    }, 15000);

    it('shows an Income badge on income-category transactions', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('income-badge-123')).toHaveTextContent(
                'Income',
            );
        });
    });
});

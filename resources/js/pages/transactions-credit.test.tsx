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

const groceries = {
    id: 1,
    code: 'C001',
    name_es: 'MERCADO',
    name_en: 'Groceries',
    is_debt_category: false,
    is_income_category: false,
};

const incomeCategory = {
    id: 47,
    code: 'I01',
    name_es: 'SALARIO',
    name_en: 'Salary',
    is_debt_category: false,
    is_income_category: true,
};

const account = {
    id: 7,
    name: 'RBC Checking',
    type: 'bank',
};

const creditTransaction = {
    id: 123,
    date: '2025-01-15',
    period: '202501',
    quincena: 'Q1',
    category_id: groceries.id,
    account_id: account.id,
    account,
    amount_cad: 75.0,
    amount_usd: null,
    amount_cop: null,
    currency: 'CAD',
    amount: 75.0,
    comments: 'grocery-refund',
    is_recurring: false,
    is_credit: true,
    debt_component: null,
    category: groceries,
};

function jsonResponse(data: unknown, init?: { ok?: boolean; status?: number }) {
    return {
        ok: init?.ok ?? true,
        status: init?.status ?? 200,
        json: async () => data,
    } as Response;
}

describe('Transactions - credit (refund / deposit)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return jsonResponse({
                    data: [groceries, incomeCategory],
                });
            }

            if (url.startsWith('/api/accounts')) {
                return jsonResponse({ data: [account] });
            }

            if (url === '/api/transactions' && init?.method === 'POST') {
                return jsonResponse(
                    {
                        data: { ...creditTransaction, id: 999 },
                        message: 'Transaction created successfully',
                    },
                    { status: 201 },
                );
            }

            if (url.startsWith('/api/transactions/') && init?.method === 'PUT') {
                return jsonResponse({
                    data: creditTransaction,
                    message: 'Transaction updated successfully',
                });
            }

            if (url.startsWith('/api/transactions')) {
                return jsonResponse({
                    data: [creditTransaction],
                    links: { self: '/api/transactions' },
                    meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('shows a Credit badge on credit transactions', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-credit-badge-123'),
            ).toHaveTextContent('Credit');
        });
    });

    it('submits is_credit when the credit checkbox is checked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-credit-checkbox')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2025-01-20' },
        });
        fireEvent.change(screen.getByTestId('transaction-period-input'), {
            target: { value: '202501' },
        });

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(await screen.findByRole('option', { name: /Groceries/ }));

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '75' },
        });
        fireEvent.click(screen.getByLabelText('Credit (refund / deposit)'));
        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
                ([requestUrl, init]) =>
                    String(requestUrl) === '/api/transactions' &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );

            expect(postCall).toBeDefined();
            const body = JSON.parse(String((postCall?.[1] as RequestInit).body));
            expect(body.is_credit).toBe(true);
            expect(body.amount_cad).toBe(75);
        });
    });

    it('prefills the credit checkbox when editing a credit transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('edit-transaction-button')[0]);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-credit-checkbox')).toHaveAttribute(
            'data-state',
            'checked',
        );
    });

    it('copies is_credit when duplicating a credit transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('duplicate-transaction-123'));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-title')).toHaveTextContent(
                'Duplicate Transaction',
            );
        });

        expect(screen.getByTestId('is-credit-checkbox')).toHaveAttribute(
            'data-state',
            'checked',
        );

        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
                ([requestUrl, init]) =>
                    String(requestUrl) === '/api/transactions' &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );

            expect(postCall).toBeDefined();
            const body = JSON.parse(String((postCall?.[1] as RequestInit).body));
            expect(body.is_credit).toBe(true);
        });
    });

    it('hides the credit checkbox for income categories', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-credit-checkbox')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(await screen.findByRole('option', { name: /I01 - Salary/ }));

        await waitFor(() => {
            expect(screen.queryByTestId('is-credit-checkbox')).not.toBeInTheDocument();
        });
    });
});

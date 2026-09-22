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

const debtCategory = {
    id: 44,
    code: 'C044',
    name_es: 'CREDITO FORD ESCAPE',
    name_en: 'Ford Escape Auto Loan Payment',
    is_debt_category: true,
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

const debtPaymentTransaction = {
    id: 123,
    date: '2025-01-15',
    period: '202501',
    quincena: 'Q1',
    category_id: groceries.id,
    account_id: account.id,
    account,
    amount_cad: 110.0,
    amount_usd: null,
    amount_cop: null,
    currency: 'CAD',
    amount: 110.0,
    comments: 'loan-cash-source',
    is_recurring: false,
    is_credit: false,
    is_debt_payment: true,
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

describe('Transactions - paying a debt (cash source)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return jsonResponse({
                    data: [groceries, debtCategory, incomeCategory],
                });
            }

            if (url.startsWith('/api/accounts')) {
                return jsonResponse({ data: [account] });
            }

            if (url === '/api/transactions' && init?.method === 'POST') {
                return jsonResponse(
                    {
                        data: { ...debtPaymentTransaction, id: 999 },
                        message: 'Transaction created successfully',
                    },
                    { status: 201 },
                );
            }

            if (url.startsWith('/api/transactions/') && init?.method === 'PUT') {
                return jsonResponse({
                    data: debtPaymentTransaction,
                    message: 'Transaction updated successfully',
                });
            }

            if (url.startsWith('/api/transactions')) {
                return jsonResponse({
                    data: [debtPaymentTransaction],
                    links: { self: '/api/transactions' },
                    meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        });
    });

    it('shows a Debt payment badge on flagged transactions', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-debt-payment-badge-123'),
            ).toHaveTextContent('Debt payment');
        });
    });

    it('submits is_debt_payment when the paying-a-debt checkbox is checked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-debt-payment-checkbox')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2025-01-20' },
        });
        fireEvent.change(screen.getByTestId('transaction-period-input'), {
            target: { value: '202501' },
        });

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(await screen.findByRole('option', { name: /C001 - Groceries/ }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-category-field')).toHaveTextContent(
                'Groceries',
            );
        });

        fireEvent.click(screen.getByTestId('account-field'));
        fireEvent.click(await screen.findByRole('option', { name: 'RBC Checking' }));

        await waitFor(() => {
            expect(screen.getByTestId('account-field')).toHaveTextContent(
                'RBC Checking',
            );
        });

        fireEvent.change(screen.getByTestId('transaction-amount-input'), {
            target: { value: '110' },
        });
        fireEvent.click(screen.getByLabelText('Paying a debt (cash source)'));
        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const postCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
                ([requestUrl, init]) =>
                    String(requestUrl) === '/api/transactions' &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );

            expect(postCall).toBeDefined();
            const body = JSON.parse(String((postCall?.[1] as RequestInit).body));
            expect(body.is_debt_payment).toBe(true);
            expect(body.account_id).toBe(account.id);
            expect(body.amount_cad).toBe(110);
        });
    });

    it('prefills the debt payment checkbox when editing', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByTestId('edit-transaction-button')[0]);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-debt-payment-checkbox')).toHaveAttribute(
            'data-state',
            'checked',
        );
    });

    it('copies is_debt_payment when duplicating', async () => {
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

        expect(screen.getByTestId('is-debt-payment-checkbox')).toHaveAttribute(
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
            expect(body.is_debt_payment).toBe(true);
        });
    });

    it('hides the debt payment checkbox for debt categories', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-123')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('is-debt-payment-checkbox')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('transaction-category-field'));
        fireEvent.click(
            await screen.findByRole('option', { name: /C044 - Ford Escape Auto Loan Payment/ }),
        );

        await waitFor(() => {
            expect(
                screen.queryByTestId('is-debt-payment-checkbox'),
            ).not.toBeInTheDocument();
        });
        expect(screen.getByTestId('debt-component-select')).toBeInTheDocument();
    });

    it('hides the debt payment checkbox for income categories', async () => {
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
            expect(
                screen.queryByTestId('is-debt-payment-checkbox'),
            ).not.toBeInTheDocument();
        });
    });
});

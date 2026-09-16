import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Transactions from './transactions';

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
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

describe('Transactions duplicate', () => {
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
                url === '/api/transactions' &&
                init?.method === 'POST'
            ) {
                return {
                    ok: true,
                    status: 201,
                    json: async () => ({
                        data: { id: 99 },
                        message: 'Transaction created successfully',
                    }),
                } as Response;
            }

            if (url.startsWith('/api/transactions')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                id: 10,
                                date: '2025-01-10',
                                period: '202501',
                                quincena: 'Q1',
                                category_id: 1,
                                account_id: null,
                                account: null,
                                amount_cad: 42.75,
                                amount_usd: null,
                                amount_cop: null,
                                currency: 'CAD',
                                amount: 42.75,
                                comments: 'Duplicate me',
                                is_recurring: false,
                                debt_component: null,
                                category: {
                                    id: 1,
                                    code: 'C001',
                                    name_es: 'MERCADO',
                                    name_en: 'Groceries',
                                    is_debt_category: false,
                                },
                            },
                        ],
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

    it('opens pre-filled duplicate form and creates a new transaction', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-10')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('duplicate-transaction-10'));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-title')).toHaveTextContent(
                'Duplicate Transaction',
            );
        });

        expect(screen.getByTestId('transaction-date-input')).toHaveValue(
            '2025-01-10',
        );
        expect(screen.getByTestId('transaction-period-input')).toHaveValue(
            '202501',
        );
        expect(screen.getByTestId('transaction-amount-input')).toHaveValue(42.75);

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2026-09-15' },
        });
        fireEvent.change(screen.getByTestId('transaction-period-input'), {
            target: { value: '202609' },
        });

        fireEvent.click(screen.getByTestId('transaction-form-submit'));

        await waitFor(() => {
            const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            const createCall = calls.find(
                ([requestUrl, init]) =>
                    String(requestUrl) === '/api/transactions' &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );
            expect(createCall).toBeTruthy();
            const body = JSON.parse(
                String((createCall?.[1] as RequestInit).body),
            );
            expect(body.date).toBe('2026-09-15');
            expect(body.period).toBe('202609');
            expect(body.category_id).toBe(1);
            expect(body.amount_cad).toBe(42.75);
            expect(body.comments).toBe('Duplicate me');
        });
    });
});

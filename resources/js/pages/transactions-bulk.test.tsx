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
    usePage: () => ({
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Test',
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

describe('Transactions bulk edit', () => {
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
                            {
                                id: 2,
                                code: 'C002',
                                name_es: 'REPOSTERÍA',
                                name_en: 'Baking Supplies',
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

            if (url.startsWith('/api/transactions/bulk') && init?.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({
                        data: [],
                        meta: { updated_count: 2 },
                        message: 'Transactions updated successfully',
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
                                amount_cad: 20,
                                amount_usd: null,
                                amount_cop: null,
                                currency: 'CAD',
                                amount: 20,
                                comments: 'Bulk A',
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
                            {
                                id: 11,
                                date: '2025-01-11',
                                period: '202501',
                                quincena: 'Q1',
                                category_id: 1,
                                account_id: null,
                                account: null,
                                amount_cad: 30,
                                amount_usd: null,
                                amount_cop: null,
                                currency: 'CAD',
                                amount: 30,
                                comments: 'Bulk B',
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
                            total: 2,
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

    it('enables Bulk Edit after selecting transactions and posts category change', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-10')).toBeInTheDocument();
        });

        const bulkButton = screen.getByTestId('bulk-edit-button');
        expect(bulkButton).toBeDisabled();

        fireEvent.click(screen.getByTestId('select-transaction-10'));
        fireEvent.click(screen.getByTestId('select-transaction-11'));

        await waitFor(() => {
            expect(screen.getByTestId('selected-count')).toHaveTextContent('2 selected');
        });
        expect(bulkButton).not.toBeDisabled();

        fireEvent.click(bulkButton);
        expect(screen.getByTestId('bulk-edit-dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('bulk-category-select'));
        const option = await screen.findByRole('option', {
            name: 'C002 - Baking Supplies',
        });
        fireEvent.click(option);

        fireEvent.click(screen.getByTestId('bulk-edit-confirm'));

        await waitFor(() => {
            const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
            const bulkCall = calls.find(
                ([url, init]) =>
                    String(url).includes('/api/transactions/bulk') &&
                    (init as RequestInit | undefined)?.method === 'POST',
            );
            expect(bulkCall).toBeTruthy();
            const body = JSON.parse(String((bulkCall?.[1] as RequestInit).body));
            expect(body.ids).toEqual([10, 11]);
            expect(body.category_id).toBe(2);
        });
    });
});

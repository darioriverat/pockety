import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        period: '202609',
        setPeriod: vi.fn(),
    }),
}));

const categories = [
    {
        id: 1,
        code: 'C001',
        name_es: 'MERCADO',
        name_en: 'Groceries',
        is_debt_category: false,
    },
    {
        id: 2,
        code: 'C004',
        name_es: 'TRANSPORTES',
        name_en: 'Transportation',
        is_debt_category: false,
    },
    {
        id: 3,
        code: 'C010',
        name_es: 'SERVICIOS',
        name_en: 'Utilities',
        is_debt_category: false,
    },
];

function makeTransaction(
    id: number,
    overrides: Partial<{
        date: string;
        amount: number;
        amount_cad: number;
        category_id: number;
        category: (typeof categories)[number];
        comments: string;
    }> = {},
) {
    const category =
        overrides.category ??
        categories.find((c) => c.id === (overrides.category_id ?? 1)) ??
        categories[0];

    return {
        id,
        date: overrides.date ?? '2026-09-10',
        period: '202609',
        quincena: 'Q1',
        category_id: category.id,
        account_id: null,
        account: null,
        amount_cad: overrides.amount_cad ?? overrides.amount ?? 25,
        amount_usd: null,
        amount_cop: null,
        currency: 'CAD',
        amount: overrides.amount ?? overrides.amount_cad ?? 25,
        comments: overrides.comments ?? `tx-${id}`,
        is_recurring: false,
        debt_component: null,
        category,
    };
}

describe('Transactions - Column Sorting', () => {
    let lastTransactionsUrl: string;

    beforeEach(() => {
        vi.clearAllMocks();
        lastTransactionsUrl = '';

        const byDateDesc = [
            makeTransaction(3, { date: '2026-09-20', amount: 30, comments: 'late' }),
            makeTransaction(1, { date: '2026-09-10', amount: 10, comments: 'mid' }),
            makeTransaction(2, { date: '2026-09-01', amount: 20, comments: 'early' }),
        ];
        const byDateAsc = [...byDateDesc].reverse();
        const byAmountAsc = [
            makeTransaction(1, { date: '2026-09-10', amount: 10 }),
            makeTransaction(2, { date: '2026-09-01', amount: 20 }),
            makeTransaction(3, { date: '2026-09-20', amount: 30 }),
        ];
        const byAmountDesc = [...byAmountAsc].reverse();
        const byCategoryAsc = [
            makeTransaction(10, {
                category: categories[0],
                comments: 'groceries',
            }),
            makeTransaction(11, {
                category: categories[1],
                comments: 'transport',
            }),
            makeTransaction(12, {
                category: categories[2],
                comments: 'utilities',
            }),
        ];
        const byCategoryDesc = [...byCategoryAsc].reverse();

        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);

            if (url.startsWith('/api/categories')) {
                return {
                    ok: true,
                    json: async () => ({ data: categories }),
                } as Response;
            }

            if (url.startsWith('/api/accounts')) {
                return {
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response;
            }

            if (url.startsWith('/api/transactions')) {
                lastTransactionsUrl = url;
                const params = new URL(url, 'http://localhost').searchParams;
                const sortBy = params.get('sort_by') ?? 'date';
                const sortDir = params.get('sort_dir') ?? 'desc';

                let data = byDateDesc;
                if (sortBy === 'date' && sortDir === 'asc') {
                    data = byDateAsc;
                } else if (sortBy === 'amount' && sortDir === 'asc') {
                    data = byAmountAsc;
                } else if (sortBy === 'amount' && sortDir === 'desc') {
                    data = byAmountDesc;
                } else if (sortBy === 'category' && sortDir === 'asc') {
                    data = byCategoryAsc;
                } else if (sortBy === 'category' && sortDir === 'desc') {
                    data = byCategoryDesc;
                }

                return {
                    ok: true,
                    json: async () => ({
                        data,
                        links: { self: '/api/transactions' },
                        meta: {
                            total: data.length,
                            page: 1,
                            per_page: 50,
                            last_page: 1,
                            sort_by: sortBy,
                            sort_dir: sortDir,
                        },
                    }),
                } as Response;
            }

            return {
                ok: false,
                json: async () => ({}),
            } as Response;
        });
    });

    it('shows Date, Amount, and Category column headers', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transactions-sort-headers')).toBeInTheDocument();
        });

        expect(screen.getByTestId('sort-header-date')).toHaveTextContent('Date');
        expect(screen.getByTestId('sort-header-amount')).toHaveTextContent('Amount');
        expect(screen.getByTestId('sort-header-category')).toHaveTextContent(
            'Category',
        );
    });

    it('sorts by date ascending then descending when Date header is clicked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transactions-list')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_by=date');
            expect(lastTransactionsUrl).toContain('sort_dir=desc');
        });

        fireEvent.click(screen.getByTestId('sort-header-date'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_dir=asc');
            const dates = screen
                .getAllByTestId(/transaction-date-/)
                .map((el) => el.textContent ?? '');
            expect(dates[0]).toContain('2026-09-01');
            expect(dates[2]).toContain('2026-09-20');
        });

        fireEvent.click(screen.getByTestId('sort-header-date'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_dir=desc');
            const dates = screen
                .getAllByTestId(/transaction-date-/)
                .map((el) => el.textContent ?? '');
            expect(dates[0]).toContain('2026-09-20');
            expect(dates[2]).toContain('2026-09-01');
        });
    });

    it('sorts by amount ascending then descending when Amount header is clicked', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('sort-header-amount')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('sort-header-amount'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_by=amount');
            expect(lastTransactionsUrl).toContain('sort_dir=asc');
            const amounts = screen
                .getAllByTestId(/transaction-amount-/)
                .map((el) => el.textContent ?? '');
            expect(amounts[0]).toContain('10.00');
            expect(amounts[2]).toContain('30.00');
        });

        fireEvent.click(screen.getByTestId('sort-header-amount'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_dir=desc');
            const amounts = screen
                .getAllByTestId(/transaction-amount-/)
                .map((el) => el.textContent ?? '');
            expect(amounts[0]).toContain('30.00');
            expect(amounts[2]).toContain('10.00');
        });
    });

    it('sorts by category alphabetically and reverses on second click', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('sort-header-category')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('sort-header-category'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_by=category');
            expect(lastTransactionsUrl).toContain('sort_dir=asc');
            const cats = screen
                .getAllByTestId(/transaction-category-/)
                .map((el) => el.textContent ?? '');
            expect(cats[0]).toContain('Groceries');
            expect(cats[2]).toContain('Utilities');
        });

        fireEvent.click(screen.getByTestId('sort-header-category'));

        await waitFor(() => {
            expect(lastTransactionsUrl).toContain('sort_dir=desc');
            const cats = screen
                .getAllByTestId(/transaction-category-/)
                .map((el) => el.textContent ?? '');
            expect(cats[0]).toContain('Utilities');
            expect(cats[2]).toContain('Groceries');
        });
    });
});

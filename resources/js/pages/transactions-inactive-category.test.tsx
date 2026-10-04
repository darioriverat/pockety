import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Transactions from './transactions';

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
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

global.fetch = vi.fn();

describe('Transactions with inactive category', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
            const url = String(input);

            if (url === '/api/categories') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 1,
                                    code: 'C001',
                                    name: 'Groceries',
                                    is_debt_category: false,
                                    is_income_category: false,
                                    is_active: true,
                                },
                            ],
                        }),
                } as Response);
            }

            if (url.includes('/api/accounts')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: [] }),
                } as Response);
            }

            if (url.includes('/api/transactions')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 74,
                                    date: '2026-01-15',
                                    period: '202601',
                                    category_id: 47,
                                    account_id: null,
                                    amount_cad: 87.25,
                                    amount_usd: null,
                                    amount_cop: null,
                                    currency: 'CAD',
                                    amount: 87.25,
                                    comments: 'survives-inactivation',
                                    is_recurring: false,
                                    is_credit: false,
                                    is_debt_payment: false,
                                    debt_component: null,
                                    category: {
                                        id: 47,
                                        code: 'C047',
                                        name: 'Keep Transaction Category',
                                        is_debt_category: false,
                                        is_income_category: false,
                                        is_active: false,
                                    },
                                    account: null,
                                },
                            ],
                            links: { self: '' },
                            meta: {
                                total: 1,
                                page: 1,
                                per_page: 50,
                                last_page: 1,
                            },
                        }),
                } as Response);
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });
    });

    it('still displays category code and name when the category is inactive', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(screen.getByTestId('transaction-row-74')).toBeInTheDocument();
        });

        expect(screen.getByTestId('transaction-category-74')).toHaveTextContent(
            'C047',
        );
        expect(screen.getByTestId('transaction-category-74')).toHaveTextContent(
            'Keep Transaction Category',
        );
        expect(screen.getByTestId('transaction-comments-74')).toHaveTextContent(
            'survives-inactivation',
        );
        expect(screen.getByTestId('transaction-amount-74')).toHaveTextContent(
            '87.25',
        );
    });
});

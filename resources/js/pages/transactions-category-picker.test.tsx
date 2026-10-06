import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

global.fetch = vi.fn();

describe('Transactions category picker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
            const url = input instanceof Request ? input.url : String(input);

            if (url === '/api/categories') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 47,
                                    code: 'C047',
                                    name: 'Picker Active Category',
                                    is_debt_category: false,
                                    is_income_category: false,
                                    is_active: true,
                                },
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
                            data: [],
                            links: { self: '' },
                            meta: {
                                total: 0,
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

    it('loads active categories without include_inactive for the picker', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/categories');
        });

        const categoryCalls = vi
            .mocked(fetch)
            .mock.calls.map(([url]) =>
                url instanceof Request ? url.url : String(url),
            )
            .filter((url) => url.includes('/api/categories'));

        expect(categoryCalls).toContain('/api/categories');
        expect(
            categoryCalls.some((url) => url.includes('include_inactive')),
        ).toBe(false);

        fireEvent.click(
            screen.getByRole('button', { name: /Add Transaction/i }),
        );

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-category-field'),
            ).toBeInTheDocument();
        });
    });
});

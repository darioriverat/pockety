import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import Budgets from './budgets';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    usePage: () => ({
        props: {
            availablePeriods: ['202501'],
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

describe('Budgets category picker', () => {
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
                                    id: 47,
                                    code: 'C047',
                                    name: 'Budget Picker Active Category',
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

            if (url.includes('/api/budgets/report')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [],
                            meta: {
                                totals: {
                                    budget_cad: 0,
                                    actual_cad: 0,
                                    variance_cad: 0,
                                },
                            },
                        }),
                } as Response);
            }

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });
    });

    it('loads active categories without include_inactive for the picker', async () => {
        render(<Budgets />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/categories', {
                headers: { Accept: 'application/json' },
            });
        });

        const categoryCalls = vi
            .mocked(fetch)
            .mock.calls.map(([url]) => String(url))
            .filter((url) => url.includes('/api/categories'));

        expect(categoryCalls).toContain('/api/categories');
        expect(
            categoryCalls.some((url) => url.includes('include_inactive')),
        ).toBe(false);
    });
});

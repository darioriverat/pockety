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

describe('Transactions period auto-fill', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        global.fetch = vi.fn(async (input: RequestInfo | URL) => {
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

            if (url.startsWith('/api/transactions')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: [],
                        links: { self: '/api/transactions' },
                        meta: {
                            total: 0,
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

    it('auto-fills period from the transaction date and updates when date changes', async () => {
        render(<Transactions />);

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Add Transaction' }),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Add Transaction' }));

        await waitFor(() => {
            expect(screen.getByTestId('transaction-form-title')).toHaveTextContent(
                'Add Transaction',
            );
        });

        expect(screen.getByTestId('transaction-period-hint')).toHaveTextContent(
            'Auto-filled from date',
        );

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2025-01-15' },
        });
        expect(screen.getByTestId('transaction-period-input')).toHaveValue(
            '202501',
        );

        fireEvent.change(screen.getByTestId('transaction-date-input'), {
            target: { value: '2026-02-20' },
        });
        expect(screen.getByTestId('transaction-period-input')).toHaveValue(
            '202602',
        );
    });
});

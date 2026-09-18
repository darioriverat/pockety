import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Transactions from './transactions';
import '@testing-library/jest-dom/vitest';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { auth: { user: { currency: 'CAD' } } } }),
    Head: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Link: ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <a href={href}>{children}</a>,
}));

// Mock hooks
vi.mock('@/hooks/use-category-language', () => ({
    useCategoryLanguage: () => ({
        language: 'en',
        setLanguage: vi.fn(),
        getCategoryName: (category: {
            name_en: string;
            name_es: string;
        }) => category.name_en,
    }),
}));

vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202601',
        setPeriod: vi.fn(),
    }),
}));

// Mock fetch globally
global.fetch = vi.fn();

const mockFetch = (response: any) => {
    (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => response,
    });
};

describe('Transaction Error Messages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch({
            data: [],
            links: { self: '/api/transactions' },
            meta: { total: 0 },
        });
    });

    it('displays error message with icon when date field is missing', async () => {
        mockFetch({
            data: [],
            links: { self: '/api/transactions' },
            meta: { total: 0 },
        });

        // Mock categories fetch
        (global.fetch as any).mockImplementation((url: string) => {
            if (url === '/api/categories') {
                return Promise.resolve({
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
                });
            }
            if (url === '/api/accounts') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: [] }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    data: [],
                    links: { self: '/api/transactions' },
                    meta: { total: 0 },
                }),
            });
        });

        render(<Transactions />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Open dialog
        const addButton = screen.getByText('Add Transaction');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        // Clear the date field
        const dateInput = screen.getByTestId(
            'transaction-date-input',
        ) as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: '' } });

        // Set amount to valid value
        const amountInput = screen.getByTestId(
            'transaction-amount-input',
        ) as HTMLInputElement;
        fireEvent.change(amountInput, { target: { value: '100' } });

        // Submit form
        const submitButton = screen.getByTestId('transaction-form-submit');
        fireEvent.click(submitButton);

        // Wait for error message
        await waitFor(() => {
            const errorElement = screen.getByTestId('date-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement).toHaveTextContent('Date is required');

            // Check that AlertCircle icon is present (lucide-react adds role="img")
            const icon = errorElement.querySelector('svg');
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass('h-4', 'w-4', 'shrink-0');

            // Check error styling
            expect(errorElement).toHaveClass('text-destructive');
            expect(errorElement).toHaveClass('flex', 'items-center', 'gap-1.5');
        });
    });

    it('displays error message with icon when amount is invalid', async () => {
        mockFetch({
            data: [],
            links: { self: '/api/transactions' },
            meta: { total: 0 },
        });

        // Mock categories fetch
        (global.fetch as any).mockImplementation((url: string) => {
            if (url === '/api/categories') {
                return Promise.resolve({
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
                });
            }
            if (url === '/api/accounts') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: [] }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    data: [],
                    links: { self: '/api/transactions' },
                    meta: { total: 0 },
                }),
            });
        });

        render(<Transactions />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Open dialog
        const addButton = screen.getByText('Add Transaction');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        // Set amount to invalid value (zero)
        const amountInput = screen.getByTestId(
            'transaction-amount-input',
        ) as HTMLInputElement;
        fireEvent.change(amountInput, { target: { value: '0' } });

        // Submit form
        const submitButton = screen.getByTestId('transaction-form-submit');
        fireEvent.click(submitButton);

        // Wait for error message
        await waitFor(() => {
            const errorElement = screen.getByTestId('amount-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement).toHaveTextContent('Amount cannot be zero');

            // Check that AlertCircle icon is present
            const icon = errorElement.querySelector('svg');
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass('h-4', 'w-4', 'shrink-0');

            // Check error styling
            expect(errorElement).toHaveClass('text-destructive');
            expect(errorElement).toHaveClass('flex', 'items-center', 'gap-1.5');
        });
    });

    it('displays error message with icon when category is missing', async () => {
        mockFetch({
            data: [],
            links: { self: '/api/transactions' },
            meta: { total: 0 },
        });

        // Mock categories fetch
        (global.fetch as any).mockImplementation((url: string) => {
            if (url === '/api/categories') {
                return Promise.resolve({
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
                });
            }
            if (url === '/api/accounts') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: [] }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    data: [],
                    links: { self: '/api/transactions' },
                    meta: { total: 0 },
                }),
            });
        });

        render(<Transactions />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Open dialog
        const addButton = screen.getByText('Add Transaction');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(
                screen.getByTestId('transaction-form-dialog'),
            ).toBeInTheDocument();
        });

        // Set amount to valid value
        const amountInput = screen.getByTestId(
            'transaction-amount-input',
        ) as HTMLInputElement;
        fireEvent.change(amountInput, { target: { value: '100' } });

        // Submit form without selecting category
        const submitButton = screen.getByTestId('transaction-form-submit');
        fireEvent.click(submitButton);

        // Wait for error message
        await waitFor(() => {
            const errorElement = screen.getByTestId('category-error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement).toHaveTextContent('Category is required');

            // Check that AlertCircle icon is present
            const icon = errorElement.querySelector('svg');
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveClass('h-4', 'w-4', 'shrink-0');

            // Check error styling
            expect(errorElement).toHaveClass('text-destructive');
            expect(errorElement).toHaveClass('flex', 'items-center', 'gap-1.5');
        });
    });
});

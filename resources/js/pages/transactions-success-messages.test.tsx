import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from 'sonner';
import Transactions from './transactions';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock Inertia
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
                    category_language: 'en',
                },
            },
        },
    }),
}));

// Mock use-period hook
vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockFetch = (url: string, options?: RequestInit) => {
    if (url.includes('/api/categories')) {
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
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
    if (url.includes('/api/accounts')) {
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: [
                        {
                            id: 1,
                            name: 'RBC Checking',
                            type: 'bank',
                        },
                    ],
                }),
        });
    }
    if (url.includes('/api/transactions') && options?.method === 'POST') {
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        id: 123,
                        date: '2025-01-15',
                        period: '202501',
                        quincena: 'Q1',
                        category_id: 1,
                        account_id: 1,
                        amount_cad: 50.0,
                        amount_usd: null,
                        amount_cop: null,
                        currency: 'CAD',
                        amount: 50.0,
                        comments: null,
                        is_recurring: false,
                        debt_component: null,
                    },
                }),
        });
    }
    if (url.includes('/api/transactions') && options?.method === 'PUT') {
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: {
                        id: 123,
                        date: '2025-01-15',
                        period: '202501',
                        quincena: 'Q1',
                        category_id: 1,
                        account_id: 1,
                        amount_cad: 75.0,
                        amount_usd: null,
                        amount_cop: null,
                        currency: 'CAD',
                        amount: 75.0,
                        comments: 'Updated',
                        is_recurring: false,
                        debt_component: null,
                    },
                }),
        });
    }
    if (url.includes('/api/transactions') && options?.method === 'DELETE') {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        });
    }
    if (url.includes('/api/transactions')) {
        return Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({
                    data: [],
                    links: { self: '' },
                    meta: { total: 0, page: 1, per_page: 50, last_page: 1 },
                }),
        });
    }
    return Promise.reject(new Error('Unknown URL'));
};

describe('Transactions - Success Messages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(mockFetch);
    });

    it('displays success message after creating a transaction', async () => {
        render(<Transactions />);

        // Wait for data to load
        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        // Open the add transaction dialog
        const addButton = screen.getByRole('button', { name: /add transaction/i });
        fireEvent.click(addButton);

        // Wait for dialog to open
        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Fill in required fields
        const dateInput = screen.getByTestId('transaction-date-input');
        fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

        const periodInput = screen.getByTestId('transaction-period-input');
        fireEvent.change(periodInput, { target: { value: '202501' } });

        // Select category (this is more complex with shadcn Select, so we'll test the basic flow)
        const categorySelect = screen.getByLabelText('Category');
        fireEvent.click(categorySelect);
        await waitFor(() => screen.getByText('Groceries'));
        fireEvent.click(screen.getByText('Groceries'));

        const amountInput = screen.getByTestId('transaction-amount-input');
        fireEvent.change(amountInput, { target: { value: '50.00' } });

        // Submit the form
        const submitButton = screen.getByTestId('transaction-form-submit');
        fireEvent.click(submitButton);

        // Verify success toast was called
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Transaction created successfully');
        });

        // Verify dialog was closed
        await waitFor(() => {
            expect(screen.queryByTestId('transaction-form-dialog')).not.toBeInTheDocument();
        });
    });

    it('displays success message after updating a transaction', async () => {
        // Mock transactions list with one transaction
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, options?: RequestInit) => {
            if (url.includes('/api/transactions') && !options?.method) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 123,
                                    date: '2025-01-15',
                                    period: '202501',
                                    quincena: 'Q1',
                                    category_id: 1,
                                    account_id: 1,
                                    amount_cad: 50.0,
                                    amount_usd: null,
                                    amount_cop: null,
                                    currency: 'CAD',
                                    amount: 50.0,
                                    comments: null,
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
                            links: { self: '' },
                            meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                        }),
                });
            }
            return mockFetch(url, options);
        });

        render(<Transactions />);

        // Wait for transactions to load
        await waitFor(() => screen.getByText('Groceries'));

        // Click edit button
        const editButtons = screen.getAllByTestId('edit-transaction-button');
        fireEvent.click(editButtons[0]);

        // Wait for dialog to open
        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Update amount
        const amountInput = screen.getByTestId('transaction-amount-input');
        fireEvent.change(amountInput, { target: { value: '75.00' } });

        // Submit the form
        const submitButton = screen.getByTestId('transaction-form-submit');
        fireEvent.click(submitButton);

        // Verify success toast was called with update message
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Transaction updated successfully');
        });
    });

    it('displays success message after deleting a transaction', async () => {
        // Mock window.confirm
        global.confirm = vi.fn(() => true);

        // Mock transactions list with one transaction
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, options?: RequestInit) => {
            if (url.includes('/api/transactions') && !options?.method) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 123,
                                    date: '2025-01-15',
                                    period: '202501',
                                    quincena: 'Q1',
                                    category_id: 1,
                                    account_id: 1,
                                    amount_cad: 50.0,
                                    amount_usd: null,
                                    amount_cop: null,
                                    currency: 'CAD',
                                    amount: 50.0,
                                    comments: null,
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
                            links: { self: '' },
                            meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                        }),
                });
            }
            return mockFetch(url, options);
        });

        render(<Transactions />);

        // Wait for transactions to load
        await waitFor(() => screen.getByText('Groceries'));

        // Click delete button
        const deleteButtons = screen.getAllByLabelText(/delete transaction/i);
        fireEvent.click(deleteButtons[0]);

        // Verify success toast was called
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Transaction deleted successfully');
        });
    });

    it('displays error message when delete fails', async () => {
        // Mock window.confirm
        global.confirm = vi.fn(() => true);

        // Mock transactions list and failing delete
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, options?: RequestInit) => {
            if (url.includes('/api/transactions') && options?.method === 'DELETE') {
                return Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve({ error: 'Failed to delete' }),
                });
            }
            if (url.includes('/api/transactions') && !options?.method) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            data: [
                                {
                                    id: 123,
                                    date: '2025-01-15',
                                    period: '202501',
                                    quincena: 'Q1',
                                    category_id: 1,
                                    account_id: 1,
                                    amount_cad: 50.0,
                                    amount_usd: null,
                                    amount_cop: null,
                                    currency: 'CAD',
                                    amount: 50.0,
                                    comments: null,
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
                            links: { self: '' },
                            meta: { total: 1, page: 1, per_page: 50, last_page: 1 },
                        }),
                });
            }
            return mockFetch(url, options);
        });

        render(<Transactions />);

        // Wait for transactions to load
        await waitFor(() => screen.getByText('Groceries'));

        // Click delete button
        const deleteButtons = screen.getAllByLabelText(/delete transaction/i);
        fireEvent.click(deleteButtons[0]);

        // Verify error toast was called
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to delete transaction');
        });
    });
});

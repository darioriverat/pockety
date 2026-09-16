import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Transactions from './transactions';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock fetch
global.fetch = vi.fn();

const mockFetch = (url: string) => {
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

describe('Transactions - Required Field Validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(mockFetch);
    });

    it('displays error when date field is empty on submit', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        // Wait for data to load
        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        // Open the add transaction dialog
        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        // Wait for dialog to open
        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Clear the date field (it's pre-filled with today's date)
        const dateInput = screen.getByTestId('transaction-date-input');
        await user.clear(dateInput);

        // Try to submit
        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Verify error message is displayed near date field
        await waitFor(() => {
            const error = screen.getByTestId('date-error');
            expect(error).toBeInTheDocument();
            expect(error).toHaveTextContent('Date is required');
        });

        // Verify form did not submit (dialog should still be open)
        expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument();
    });

    it('displays error when period field is empty on submit', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Clear the period field
        const periodInput = screen.getByTestId('transaction-period-input');
        await user.clear(periodInput);

        // Try to submit
        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Verify error message
        await waitFor(() => {
            const error = screen.getByTestId('period-error');
            expect(error).toBeInTheDocument();
            expect(error).toHaveTextContent('Period is required');
        });
    });

    it('displays error when category is not selected on submit', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Category is empty by default
        // Try to submit
        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Verify error message
        await waitFor(() => {
            const error = screen.getByTestId('category-error');
            expect(error).toBeInTheDocument();
            expect(error).toHaveTextContent('Category is required');
        });
    });

    it('displays error when amount field is empty on submit', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Amount is empty by default
        // Try to submit
        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Verify error message
        await waitFor(() => {
            const error = screen.getByTestId('amount-error');
            expect(error).toBeInTheDocument();
            expect(error).toHaveTextContent('Amount is required');
        });
    });

    it('clears date error when user fills in the field', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Clear date and submit to trigger error
        const dateInput = screen.getByTestId('transaction-date-input');
        await user.clear(dateInput);

        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Wait for error to appear
        await waitFor(() => {
            expect(screen.getByTestId('date-error')).toBeInTheDocument();
        });

        // Fill in the date
        await user.type(dateInput, '2025-01-15');

        // Verify error is cleared
        await waitFor(() => {
            expect(screen.queryByTestId('date-error')).not.toBeInTheDocument();
        });
    });

    it('displays multiple errors when multiple required fields are empty', async () => {
        const user = userEvent.setup();
        render(<Transactions />);

        await waitFor(() =>
            expect(screen.getByTestId('transactions-page')).toBeInTheDocument(),
        );

        const addButton = screen.getByRole('button', { name: /add transaction/i });
        await user.click(addButton);

        await waitFor(() =>
            expect(screen.getByTestId('transaction-form-dialog')).toBeInTheDocument(),
        );

        // Clear date and period
        const dateInput = screen.getByTestId('transaction-date-input');
        const periodInput = screen.getByTestId('transaction-period-input');
        await user.clear(dateInput);
        await user.clear(periodInput);

        // Try to submit (date, period, category, amount all invalid/empty)
        const submitButton = screen.getByTestId('transaction-form-submit');
        await user.click(submitButton);

        // Verify all error messages are displayed
        await waitFor(() => {
            expect(screen.getByTestId('date-error')).toBeInTheDocument();
            expect(screen.getByTestId('period-error')).toBeInTheDocument();
            expect(screen.getByTestId('category-error')).toBeInTheDocument();
            expect(screen.getByTestId('amount-error')).toBeInTheDocument();
        });
    });
});

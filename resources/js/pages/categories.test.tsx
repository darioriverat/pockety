import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Categories from './categories';

// Mock fetch globally
global.fetch = vi.fn();

// Mock Inertia Head component
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
        className?: string;
        'data-testid'?: string;
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
                },
            },
        },
    }),
}));

describe('Categories Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset fetch mock
        (global.fetch as any).mockReset();
    });

    it('shows the retired template category and its preserved status', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [{
                    id: 40,
                    code: 'C040',
                    name: "Kids' Allowance",
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: false,
                    status: 'retired_merged_into_C031',
                }],
            }),
        } as Response);

        render(<Categories />);

        const card = await screen.findByTestId('category-card-C040');
        expect(card).toHaveTextContent('Retired');
        expect(card).toHaveTextContent('retired_merged_into_C031');
        expect(fetch).toHaveBeenCalledWith('/api/categories?include_inactive=1');
    });

    it('displays an Income badge for income categories', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 47,
                    code: 'I01',
                    name: 'Salary',
                    is_debt_category: false,
                    is_income_category: true,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 2 },
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByTestId('income-badge-I01')).toHaveTextContent(
                'Income',
            );
        });

        expect(
            screen.queryByTestId('income-badge-C001'),
        ).not.toBeInTheDocument();
    });

    it('renders category list with delete buttons', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 2,
                    code: 'C004',
                    name: 'Transportation',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 2 },
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('C001')).toBeInTheDocument();
            expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
                'Groceries',
            );
            expect(screen.getByText('C004')).toBeInTheDocument();
            expect(screen.getByTestId('category-name-C004')).toHaveTextContent(
                'Transportation',
            );
        });

        // Should have delete buttons
        const deleteButtons = screen.getAllByRole('button');
        expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('prevents deletion of category with transactions', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        // Mock initial fetch
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        // Mock delete response with error
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 422,
            json: async () => ({
                error: 'Cannot delete category',
                message: 'This category has associated transactions and cannot be deleted',
                has_transactions: true,
            }),
        });

        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        // Mock window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('C001')).toBeInTheDocument();
        });

        // Find and click delete button by aria-label
        const deleteButton = screen.getByRole('button', { name: /Delete C001/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith(
                expect.stringContaining('C001')
            );
        });

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                expect.stringContaining('transactions')
            );
        });

        // Category should still be visible
        expect(screen.getByText('C001')).toBeInTheDocument();
    });

    it('successfully deletes category without transactions', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 2,
                    code: 'C004',
                    name: 'Transportation',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 2 },
        };

        // Mock initial fetch
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        // Mock delete response (success)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                message: 'Category deleted successfully',
                links: { index: '/api/categories' },
            }),
        });

        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('C001')).toBeInTheDocument();
            expect(screen.getByText('C004')).toBeInTheDocument();
        });

        // Find and click the first delete button by aria-label
        const deleteButton = screen.getByRole('button', { name: /Delete C001/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
        });

        // Wait for deletion to complete
        await waitFor(() => {
            // C001 should be removed from the list
            // Note: This assumes the component removes it from state
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/categories/C001'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    it('displays error message on deletion failure', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        // Mock initial fetch
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        // Mock delete response with error
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({
                error: 'Category not found',
            }),
        });

        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('C001')).toBeInTheDocument();
        });

        // Find and click delete button by aria-label
        const deleteButton = screen.getByRole('button', { name: /Delete C001/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
        });

        // Error should be displayed
        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
    it('shows server validation inside the create dialog and preserves input', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        } as Response).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'A category cannot be both debt and income' }),
        } as Response);
        render(<Categories />);
        await screen.findByText('Total categories: 0');
        fireEvent.click(screen.getByTestId('create-category-button'));
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Invalid' } });
        fireEvent.click(screen.getByTestId('create-category-submit'));
        expect(await screen.findByRole('alert')).toHaveTextContent('A category cannot be both debt and income');
        expect(screen.getByTestId('create-category-dialog')).toContainElement(screen.getByRole('alert'));
        expect(screen.getByLabelText('Name')).toHaveValue('Invalid');
        fireEvent.click(screen.getByTestId('create-category-cancel'));
        fireEvent.click(screen.getByTestId('create-category-button'));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('updates a category name through the edit dialog without reload', async () => {
        const mockCategories = {
            data: [
                {
                    id: 48,
                    code: 'C047',
                    name: 'Session4 Edit Target',
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        ...mockCategories.data[0],
                        name: 'Updated Name',
                    },
                    links: {
                        self: '/api/categories/C047',
                        index: '/api/categories',
                    },
                }),
            } as Response);

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByTestId('category-name-C047')).toHaveTextContent(
                'Session4 Edit Target',
            );
        });

        fireEvent.click(screen.getByRole('button', { name: /Edit C047/i }));

        await waitFor(() => {
            expect(screen.getByTestId('edit-category-dialog')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByTestId('edit-category-name-input'), {
            target: { value: 'Updated Name' },
        });
        fireEvent.click(screen.getByTestId('edit-category-submit'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/categories/C047',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        name: 'Updated Name',
                        is_debt_category: false,
                        is_income_category: false,
                        is_active: true,
                    }),
                }),
            );
        });

        await waitFor(() => {
            expect(screen.queryByTestId('edit-category-dialog')).not.toBeInTheDocument();
            expect(screen.getByTestId('category-name-C047')).toHaveTextContent(
                'Updated Name',
            );
        });
    });

    it('locks kind controls when the category has transactions', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name: 'Groceries',
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [{ id: 99 }],
                }),
            } as Response);

        render(<Categories />);

        await screen.findByTestId('category-name-C001');
        fireEvent.click(screen.getByRole('button', { name: /Edit C001/i }));

        await waitFor(() => {
            expect(screen.getByTestId('edit-kind-locked-message')).toBeInTheDocument();
            expect(screen.getByTestId('edit-kind-expense')).toBeDisabled();
            expect(screen.getByTestId('edit-kind-debt')).toBeDisabled();
            expect(screen.getByTestId('edit-kind-income')).toBeDisabled();
        });
    });

    it('updates debt flag when the category has no transactions', async () => {
        const mockCategories = {
            data: [
                {
                    id: 48,
                    code: 'C048',
                    name: 'Flag Target',
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        id: 48,
                        code: 'C048',
                        name: 'Flag Target',
                        is_debt_category: true,
                        is_income_category: false,
                        is_active: true,
                        status: null,
                    },
                    links: {
                        self: '/api/categories/C048',
                        index: '/api/categories',
                    },
                }),
            } as Response);

        render(<Categories />);

        await screen.findByTestId('category-name-C048');
        fireEvent.click(screen.getByRole('button', { name: /Edit C048/i }));

        await waitFor(() => {
            expect(screen.getByTestId('edit-category-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('edit-kind-debt')).not.toBeDisabled();
            expect(
                screen.queryByTestId('edit-kind-locked-message'),
            ).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('edit-kind-debt'));
        fireEvent.click(screen.getByTestId('edit-category-submit'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/categories/C048',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        name: 'Flag Target',
                        is_debt_category: true,
                        is_income_category: false,
                        is_active: true,
                    }),
                }),
            );
        });

        await waitFor(() => {
            expect(screen.queryByTestId('edit-category-dialog')).not.toBeInTheDocument();
            expect(screen.getByTestId('debt-badge-C048')).toHaveTextContent('Debt');
        });
    });

});

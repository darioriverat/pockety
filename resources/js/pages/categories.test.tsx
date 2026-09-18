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
                    category_language: 'en',
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

    it('displays an Income badge for income categories', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
                    is_debt_category: false,
                    is_income_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 47,
                    code: 'I01',
                    name_es: 'SALARIO',
                    name_en: 'Salary',
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
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 2,
                    code: 'C004',
                    name_es: 'TRANSPORTES',
                    name_en: 'Transportation',
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

        // Language toggle is available
        expect(screen.getByTestId('category-language-toggle')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('category-language-toggle-es'));

        await waitFor(() => {
            expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
                'MERCADO',
            );
            expect(screen.getByTestId('category-name-C004')).toHaveTextContent(
                'TRANSPORTES',
            );
        });

        fireEvent.click(screen.getByTestId('category-language-toggle-en'));

        await waitFor(() => {
            expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
                'Groceries',
            );
        });

        // Should have delete buttons
        const deleteButtons = screen.getAllByRole('button');
        expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('toggles category names between Spanish and English', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
            ],
            links: { self: '/api/categories' },
            meta: { total: 1 },
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
                'Groceries',
            );
        });

        fireEvent.click(screen.getByTestId('category-language-toggle-es'));
        expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
            'MERCADO',
        );
        expect(screen.queryByText('Groceries')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('category-language-toggle-en'));
        expect(screen.getByTestId('category-name-C001')).toHaveTextContent(
            'Groceries',
        );
        expect(screen.queryByText('MERCADO')).not.toBeInTheDocument();
    });

    it('prevents deletion of category with transactions', async () => {
        const mockCategories = {
            data: [
                {
                    id: 1,
                    code: 'C001',
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
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

        // Find and click delete button
        const deleteButtons = screen.getAllByRole('button');
        fireEvent.click(deleteButtons[0]);

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
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
                    is_debt_category: false,
                    is_active: true,
                    status: null,
                },
                {
                    id: 2,
                    code: 'C004',
                    name_es: 'TRANSPORTES',
                    name_en: 'Transportation',
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

        // Find and click the first delete button
        const deleteButtons = screen.getAllByRole('button');
        fireEvent.click(deleteButtons[0]);

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
                    name_es: 'MERCADO',
                    name_en: 'Groceries',
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

        // Find and click delete button
        const deleteButtons = screen.getAllByRole('button');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
        });

        // Error should be displayed
        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
});

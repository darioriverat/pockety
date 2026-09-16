import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Budgets from './budgets';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
}));

// Mock hooks
vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({
        period: '202501',
        setPeriod: vi.fn(),
    }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Budgets - Budget vs Actual Colors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCategories = {
        data: [
            {
                id: 1,
                code: 'C001',
                name_es: 'MERCADO',
                name_en: 'Groceries',
            },
            {
                id: 2,
                code: 'C002',
                name_es: 'REPOSTERÍA',
                name_en: 'Baking',
            },
        ],
    };

    const createBudgetRow = (overrides = {}) => ({
        category_id: 1,
        category_code: 'C001',
        category_name_es: 'MERCADO',
        category_name_en: 'Groceries',
        budget_cad: 1000,
        actual_cad: 800,
        variance_cad: -200,
        percentage: 80,
        is_over_budget: false,
        ...overrides,
    });

    it('displays under-budget categories with green colors', async () => {
        const underBudgetRow = createBudgetRow({
            budget_cad: 1000,
            actual_cad: 800,
            variance_cad: -200,
            percentage: 80,
            is_over_budget: false,
        });

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [underBudgetRow],
                    meta: {
                        totals: {
                            budget_cad: 1000,
                            actual_cad: 800,
                            variance_cad: -200,
                        },
                    },
                }),
            });

        render(<Budgets />);

        await waitFor(() => {
            expect(screen.getByTestId('budget-row-C001')).toBeInTheDocument();
        });

        const row = screen.getByTestId('budget-row-C001');
        
        // Should NOT be marked as over-budget
        expect(row).toHaveAttribute('data-over-budget', 'false');

        // Variance should be green (negative variance = under budget)
        const variance = screen.getByTestId('variance-C001');
        expect(variance).toHaveClass('text-green-600');

        // Status badge should show "Under" with green styling
        const statusBadge = screen.getByTestId('status-badge-C001');
        expect(statusBadge).toHaveTextContent('Under');
        expect(statusBadge).toHaveClass('bg-green-100');

        // Progress bar should be green
        const progressBar = screen.getByTestId('progress-bar-C001');
        expect(progressBar).toHaveClass('bg-green-500');
        expect(progressBar).toHaveStyle({ width: '80%' });
    });

    it('displays over-budget categories with red colors', async () => {
        const overBudgetRow = createBudgetRow({
            budget_cad: 1000,
            actual_cad: 1200,
            variance_cad: 200,
            percentage: 120,
            is_over_budget: true,
        });

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [overBudgetRow],
                    meta: {
                        totals: {
                            budget_cad: 1000,
                            actual_cad: 1200,
                            variance_cad: 200,
                        },
                    },
                }),
            });

        render(<Budgets />);

        await waitFor(() => {
            expect(screen.getByTestId('budget-row-C001')).toBeInTheDocument();
        });

        const row = screen.getByTestId('budget-row-C001');
        
        // Should be marked as over-budget
        expect(row).toHaveAttribute('data-over-budget', 'true');

        // Variance should be red (positive variance = over budget)
        const variance = screen.getByTestId('variance-C001');
        expect(variance).toHaveClass('text-red-600');

        // Status badge should show "Over" with red styling
        const statusBadge = screen.getByTestId('status-badge-C001');
        expect(statusBadge).toHaveTextContent('Over');
        // Badge with variant="destructive" will have specific styling classes
        expect(statusBadge.className).toMatch(/destructive/);

        // Progress bar should be red
        const progressBar = screen.getByTestId('progress-bar-C001');
        expect(progressBar).toHaveClass('bg-red-500');
        expect(progressBar).toHaveStyle({ width: '100%' }); // Capped at 100%
    });

    it('displays progress bar with correct width for partial budget usage', async () => {
        const partialRow = createBudgetRow({
            budget_cad: 1000,
            actual_cad: 500,
            variance_cad: -500,
            percentage: 50,
            is_over_budget: false,
        });

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [partialRow],
                    meta: {
                        totals: {
                            budget_cad: 1000,
                            actual_cad: 500,
                            variance_cad: -500,
                        },
                    },
                }),
            });

        render(<Budgets />);

        await waitFor(() => {
            expect(screen.getByTestId('progress-bar-C001')).toBeInTheDocument();
        });

        const progressBar = screen.getByTestId('progress-bar-C001');
        expect(progressBar).toHaveStyle({ width: '50%' });
        expect(progressBar).toHaveClass('bg-green-500'); // Under budget = green
    });

    it('handles categories with no budget set', async () => {
        const noBudgetRow = createBudgetRow({
            budget_cad: null,
            actual_cad: 500,
            variance_cad: null,
            percentage: null,
            is_over_budget: false,
        });

        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [noBudgetRow],
                    meta: {
                        totals: {
                            budget_cad: 0,
                            actual_cad: 500,
                            variance_cad: 0,
                        },
                    },
                }),
            });

        render(<Budgets />);

        await waitFor(() => {
            expect(screen.getByTestId('budget-row-C001')).toBeInTheDocument();
        });

        // Should show "No budget" badge
        const badge = screen.getByText('No budget');
        expect(badge).toBeInTheDocument();

        // Should not have progress bar test id (shows dash instead)
        expect(screen.queryByTestId('progress-bar-C001')).not.toBeInTheDocument();
    });
});

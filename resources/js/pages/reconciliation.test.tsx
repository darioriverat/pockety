import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Reconciliation from './reconciliation';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

// Mock hooks
vi.mock('@/hooks/use-period', () => ({
    usePeriod: () => ({ period: '202501' }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Reconciliation - Variance Warnings', () => {
    const mockAccountWithLargeVariance = {
        account_id: 1,
        account_name: 'Test Bank Account',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 1000, usd: 0, cop: 0 },
        computed: { cad: 985, usd: 0, cop: 0 },
        variance: { cad: 15, usd: 0, cop: 0 }, // Exceeds $10 threshold
        is_balanced: false,
    };

    const mockAccountWithSmallVariance = {
        account_id: 2,
        account_name: 'Savings Account',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 500, usd: 0, cop: 0 },
        computed: { cad: 495, usd: 0, cop: 0 },
        variance: { cad: 5, usd: 0, cop: 0 }, // Below $10 threshold
        is_balanced: false,
    };

    const mockAccountBalanced = {
        account_id: 3,
        account_name: 'Credit Card',
        account_type: 'liability',
        is_asset: false,
        is_liability: true,
        has_recorded_balance: true,
        recorded: { cad: -200, usd: 0, cop: 0 },
        computed: { cad: -200, usd: 0, cop: 0 },
        variance: { cad: 0, usd: 0, cop: 0 },
        is_balanced: true,
    };

    const mockReport = {
        period: '202501',
        status: 'unbalanced' as const,
        accounts: [mockAccountWithLargeVariance, mockAccountWithSmallVariance, mockAccountBalanced],
        accounting_equation: {
            assets_cad: 1485,
            liabilities_cad: 200,
            equity_cad: 1285,
            residual_cad: 0,
            is_balanced: true,
        },
        income_total_cad: 5000,
        expenses_total_cad: 3715,
        net_operating_expenses_cad: 3715,
    };

    it('shows warning icon for accounts with variance exceeding threshold', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);

        // Trigger the load
        const button = screen.getByText('View Reconciliation');
        button.click();

        // Wait for the data to load
        await screen.findByText('Test Bank Account');

        // Should show warning icon for account with large variance
        const warningIcon = screen.queryByTestId('variance-warning-1');
        expect(warningIcon).toBeTruthy();
    });

    it('does not show warning icon for accounts with variance below threshold', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);

        const button = screen.getByText('View Reconciliation');
        button.click();

        await screen.findByText('Savings Account');

        // Should NOT show warning icon for account with small variance
        const warningIcon = screen.queryByTestId('variance-warning-2');
        expect(warningIcon).toBeFalsy();
    });

    it('does not show warning icon for balanced accounts', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);

        const button = screen.getByText('View Reconciliation');
        button.click();

        await screen.findByText('Credit Card');

        // Should NOT show warning icon for balanced account
        const warningIcon = screen.queryByTestId('variance-warning-3');
        expect(warningIcon).toBeFalsy();
    });

    it('shows investigate transactions link for unbalanced accounts', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);

        const button = screen.getByText('View Reconciliation');
        button.click();

        await screen.findByText('Test Bank Account');

        // Should show investigate link for unbalanced account
        const investigateLink = screen.queryByTestId('investigate-link-1');
        expect(investigateLink).toBeTruthy();
        expect(investigateLink?.getAttribute('href')).toBe('/accounts/1?period=202501');
    });

    it('does not show investigate transactions link for balanced accounts', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);

        const button = screen.getByText('View Reconciliation');
        button.click();

        await screen.findByText('Credit Card');

        // Should NOT show investigate link for balanced account
        const investigateLink = screen.queryByTestId('investigate-link-3');
        expect(investigateLink).toBeFalsy();
    });

    it('handles multi-currency variances exceeding threshold', async () => {
        const accountWithUsdVariance = {
            ...mockAccountWithLargeVariance,
            account_id: 4,
            account_name: 'USD Account',
            variance: { cad: 0, usd: 15, cop: 0 }, // USD variance exceeds threshold
        };

        const reportWithUsd = {
            ...mockReport,
            accounts: [accountWithUsdVariance],
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: reportWithUsd }),
        });

        render(<Reconciliation />);

        const button = screen.getByText('View Reconciliation');
        button.click();

        await screen.findByText('USD Account');

        // Should show warning icon for USD variance
        const warningIcon = screen.queryByTestId('variance-warning-4');
        expect(warningIcon).toBeTruthy();
    });
});

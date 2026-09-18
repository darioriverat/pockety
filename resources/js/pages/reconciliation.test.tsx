import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    beforeEach(() => {
        vi.clearAllMocks();
    });

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
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
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
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
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
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
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

    it('shows yellow/orange warning banner explaining unreconciled variance', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Test Bank Account');

        const banner = screen.getByTestId('reconciliation-warning-banner');
        expect(banner).toBeInTheDocument();
        expect(banner.className).toMatch(/amber/);
        expect(
            screen.getByTestId('reconciliation-warning-icon'),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('reconciliation-warning-title'),
        ).toHaveTextContent('Unreconciled variance detected');
        expect(
            screen.getByTestId('reconciliation-warning-message'),
        ).toHaveTextContent(/non-zero difference/);
        expect(
            screen.getByTestId('reconciliation-warning-message'),
        ).toHaveTextContent('2 accounts have');

        const accountMessage = screen.getByTestId('variance-warning-message-1');
        expect(accountMessage).toBeInTheDocument();
        expect(accountMessage.className).toMatch(/amber/);
        expect(
            screen.getByTestId('variance-warning-message-icon-1'),
        ).toBeInTheDocument();
        expect(accountMessage).toHaveTextContent(
            /Significant unreconciled variance/i,
        );
        expect(accountMessage).toHaveTextContent(/CAD:/);
        expect(accountMessage).toHaveTextContent(/\$10\.00 threshold/);
    });

    it('does not show account warning message below threshold', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockReport }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Savings Account');

        expect(
            screen.queryByTestId('variance-warning-message-2'),
        ).not.toBeInTheDocument();
    });

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

describe('Reconciliation - Variance Color Highlighting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAccountNegativeVariance = {
        account_id: 100,
        account_name: 'Account With Negative Variance',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 500, usd: 0, cop: 0 },
        computed: { cad: 520, usd: 0, cop: 0 },
        variance: { cad: -20, usd: 0, cop: 0 }, // Significant negative
        is_balanced: false,
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
    };

    const mockAccountPositiveVariance = {
        account_id: 101,
        account_name: 'Account With Positive Variance',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 520, usd: 0, cop: 0 },
        computed: { cad: 500, usd: 0, cop: 0 },
        variance: { cad: 20, usd: 0, cop: 0 }, // Significant positive
        is_balanced: false,
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
    };

    const mockAccountZeroVariance = {
        account_id: 102,
        account_name: 'Account With Zero Variance',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 500, usd: 0, cop: 0 },
        computed: { cad: 500, usd: 0, cop: 0 },
        variance: { cad: 0, usd: 0, cop: 0 },
        is_balanced: true,
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
    };

    const mockAccountMinorVariance = {
        account_id: 103,
        account_name: 'Account With Minor Variance',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 500, usd: 0, cop: 0 },
        computed: { cad: 502, usd: 0, cop: 0 },
        variance: { cad: -2, usd: 0, cop: 0 }, // Minor, below threshold
        is_balanced: false,
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
    };

    it('displays negative significant variance in red', async () => {
        const report = {
            period: '202501',
            status: 'unbalanced' as const,
            accounts: [mockAccountNegativeVariance],
            accounting_equation: {
                assets_cad: 500,
                liabilities_cad: 0,
                equity_cad: 500,
                residual_cad: 0,
                is_balanced: true,
            },
            income_total_cad: 0,
            expenses_total_cad: 20,
            net_operating_expenses_cad: 20,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Account With Negative Variance');

        const accountCard = screen.getByTestId('account-reconciliation-100');
        const varianceAmounts = accountCard.querySelectorAll('[data-testid="variance-amount"]');
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-red-600');
        expect(cadVariance).toHaveAttribute('data-variance-state', 'negative-significant');
    });

    it('displays positive significant variance in amber/yellow', async () => {
        const report = {
            period: '202501',
            status: 'unbalanced' as const,
            accounts: [mockAccountPositiveVariance],
            accounting_equation: {
                assets_cad: 520,
                liabilities_cad: 0,
                equity_cad: 520,
                residual_cad: 0,
                is_balanced: true,
            },
            income_total_cad: 0,
            expenses_total_cad: 0,
            net_operating_expenses_cad: 0,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Account With Positive Variance');

        const accountCard = screen.getByTestId('account-reconciliation-101');
        const varianceAmounts = accountCard.querySelectorAll('[data-testid="variance-amount"]');
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-amber-600');
        expect(cadVariance).toHaveAttribute('data-variance-state', 'positive-significant');
    });

    it('displays zero variance in green', async () => {
        const report = {
            period: '202501',
            status: 'balanced' as const,
            accounts: [mockAccountZeroVariance],
            accounting_equation: {
                assets_cad: 500,
                liabilities_cad: 0,
                equity_cad: 500,
                residual_cad: 0,
                is_balanced: true,
            },
            income_total_cad: 0,
            expenses_total_cad: 0,
            net_operating_expenses_cad: 0,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Account With Zero Variance');

        const accountCard = screen.getByTestId('account-reconciliation-102');
        const varianceAmounts = accountCard.querySelectorAll('[data-testid="variance-amount"]');
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-green-600');
        expect(cadVariance).toHaveAttribute('data-variance-state', 'balanced');
    });

    it('displays minor variance in neutral/muted color', async () => {
        const report = {
            period: '202501',
            status: 'unbalanced' as const,
            accounts: [mockAccountMinorVariance],
            accounting_equation: {
                assets_cad: 500,
                liabilities_cad: 0,
                equity_cad: 500,
                residual_cad: 0,
                is_balanced: true,
            },
            income_total_cad: 0,
            expenses_total_cad: 2,
            net_operating_expenses_cad: 2,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Account With Minor Variance');

        const accountCard = screen.getByTestId('account-reconciliation-103');
        const varianceAmounts = accountCard.querySelectorAll('[data-testid="variance-amount"]');
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-muted-foreground');
        expect(cadVariance).toHaveAttribute('data-variance-state', 'minor');
    });
});

describe('Reconciliation - Variance Acknowledgment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const unbalancedAccount = {
        account_id: 10,
        account_name: 'Ack Bank',
        account_type: 'bank',
        is_asset: true,
        is_liability: false,
        has_recorded_balance: true,
        recorded: { cad: 1000, usd: 0, cop: 0 },
        computed: { cad: 900, usd: 0, cop: 0 },
        variance: { cad: 100, usd: 0, cop: 0 },
        is_balanced: false,
        is_reviewed: false,
        review_note: null,
        reviewed_at: null,
    };

    const baseReport = {
        period: '202501',
        status: 'unbalanced' as const,
        accounts: [unbalancedAccount],
        accounting_equation: {
            assets_cad: 1000,
            liabilities_cad: 0,
            equity_cad: 1000,
            residual_cad: 0,
            is_balanced: true,
        },
        income_total_cad: 0,
        expenses_total_cad: 100,
        net_operating_expenses_cad: 100,
    };

    it('shows acknowledge button for unbalanced accounts', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: baseReport }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Ack Bank');

        expect(
            screen.getByTestId('acknowledge-variance-10'),
        ).toHaveTextContent('Acknowledge Variance');
    });

    it('shows reviewed badge and note after acknowledgment', async () => {
        const reviewedReport = {
            ...baseReport,
            accounts: [
                {
                    ...unbalancedAccount,
                    is_reviewed: true,
                    review_note: 'Timing difference',
                    reviewed_at: '2025-01-20T12:00:00+00:00',
                },
            ],
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: reviewedReport }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Ack Bank');

        expect(screen.getByTestId('variance-reviewed-10')).toHaveTextContent(
            'Reviewed',
        );
        expect(screen.getByTestId('variance-review-note-10')).toHaveTextContent(
            'Timing difference',
        );
        expect(screen.getByTestId('acknowledge-variance-10')).toHaveTextContent(
            'Update Acknowledgment',
        );
        // Variance amounts still visible
        expect(screen.getAllByTestId('variance-amount')[0]).toHaveTextContent(
            '$100.00',
        );
    });

    it('submits acknowledgment with optional note and updates UI', async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: baseReport }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: {
                        account_id: 10,
                        period: '202501',
                        is_reviewed: true,
                        review_note: 'Bank fee pending',
                        reviewed_at: '2025-01-21T10:00:00+00:00',
                    },
                }),
            });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Ack Bank');

        fireEvent.click(screen.getByTestId('acknowledge-variance-10'));
        expect(
            screen.getByTestId('acknowledge-variance-dialog'),
        ).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('acknowledge-note-input'), {
            target: { value: 'Bank fee pending' },
        });
        fireEvent.click(screen.getByTestId('acknowledge-submit'));

        await waitFor(() => {
            expect(screen.getByTestId('variance-reviewed-10')).toBeInTheDocument();
        });
        expect(screen.getByTestId('variance-review-note-10')).toHaveTextContent(
            'Bank fee pending',
        );
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/periods/202501/reconciliation/10/acknowledge',
            expect.objectContaining({ method: 'POST' }),
        );
    });
});

describe('Reconciliation - Accounting Equation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows recorded, computed, and variance totals from account conciliations', async () => {
        const report = {
            period: '202501',
            status: 'unbalanced' as const,
            accounts: [
                {
                    account_id: 1,
                    account_name: 'Test Bank',
                    account_type: 'bank',
                    is_asset: true,
                    is_liability: false,
                    has_recorded_balance: true,
                    recorded: { cad: 1000, usd: 200, cop: 500000 },
                    computed: { cad: 900, usd: 180, cop: 450000 },
                    variance: { cad: 100, usd: 20, cop: 50000 },
                    is_balanced: false,
                    is_reviewed: false,
                    review_note: null,
                    reviewed_at: null,
                },
            ],
            accounting_equation: {
                assets_cad: 1350,
                liabilities_cad: 615,
                equity_cad: 735,
                residual_cad: 0,
                is_balanced: true,
                recorded: {
                    assets_cad: 1500,
                    liabilities_cad: 615,
                    equity_cad: 885,
                },
                computed: {
                    assets_cad: 1350,
                    liabilities_cad: 615,
                    equity_cad: 735,
                },
                variance: {
                    assets_cad: 150,
                    liabilities_cad: 0,
                    equity_cad: 150,
                },
            },
            income_total_cad: 0,
            expenses_total_cad: 100,
            net_operating_expenses_cad: 100,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByText('Test Bank');

        expect(screen.getByTestId('assets-recorded')).toHaveTextContent('1,500');
        expect(screen.getByTestId('assets-total')).toHaveTextContent('1,350');
        expect(screen.getByTestId('assets-variance')).toHaveTextContent('150');
        expect(screen.getByTestId('liabilities-total')).toHaveTextContent('615');
        expect(screen.getByTestId('equity-recorded')).toHaveTextContent('885');
        expect(screen.getByTestId('equity-total')).toHaveTextContent('735');
        expect(screen.getByTestId('equity-variance')).toHaveTextContent('150');
        expect(screen.queryByTestId('equation-currency-USD')).not.toBeInTheDocument();
        expect(screen.queryByTestId('equation-currency-COP')).not.toBeInTheDocument();
        expect(
            screen.getByTestId('accounting-equation-card'),
        ).toHaveTextContent('CAD equivalent');
    });
});

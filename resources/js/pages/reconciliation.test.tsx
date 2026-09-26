import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Reconciliation from './reconciliation';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
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
        accounts: [
            mockAccountWithLargeVariance,
            mockAccountWithSmallVariance,
            mockAccountBalanced,
        ],
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
        expect(investigateLink?.getAttribute('href')).toBe(
            '/accounts/1?period=202501',
        );
        expect(screen.queryByText('Acknowledge Variance')).toBeNull();
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
        const varianceAmounts = accountCard.querySelectorAll(
            '[data-testid="variance-amount"]',
        );
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-red-600');
        expect(cadVariance).toHaveAttribute(
            'data-variance-state',
            'negative-significant',
        );
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
        const varianceAmounts = accountCard.querySelectorAll(
            '[data-testid="variance-amount"]',
        );
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-amber-600');
        expect(cadVariance).toHaveAttribute(
            'data-variance-state',
            'positive-significant',
        );
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
        const varianceAmounts = accountCard.querySelectorAll(
            '[data-testid="variance-amount"]',
        );
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
        const varianceAmounts = accountCard.querySelectorAll(
            '[data-testid="variance-amount"]',
        );
        const cadVariance = varianceAmounts[0];

        expect(cadVariance).toHaveClass('text-muted-foreground');
        expect(cadVariance).toHaveAttribute('data-variance-state', 'minor');
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

        expect(screen.getByTestId('assets-recorded')).toHaveTextContent(
            '1,500',
        );
        expect(screen.getByTestId('assets-total')).toHaveTextContent('1,350');
        expect(screen.getByTestId('assets-variance')).toHaveTextContent('150');
        expect(screen.getByTestId('liabilities-total')).toHaveTextContent(
            '615',
        );
        expect(screen.getByTestId('equity-recorded')).toHaveTextContent('885');
        expect(screen.getByTestId('equity-total')).toHaveTextContent('735');
        expect(screen.getByTestId('equity-variance')).toHaveTextContent('150');
        expect(
            screen.queryByTestId('equation-currency-USD'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId('equation-currency-COP'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByTestId('accounting-equation-card'),
        ).toHaveTextContent('CAD equivalent');
    });
});

describe('Reconciliation - Balance Changes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows per-account CAD differences and asset/liability totals', async () => {
        const report = {
            period: '202502',
            status: 'unbalanced' as const,
            accounts: [
                {
                    account_id: 1,
                    account_name: 'Checking',
                    account_type: 'bank',
                    is_asset: true,
                    is_liability: false,
                    has_recorded_balance: true,
                    recorded: { cad: 800, usd: 150, cop: 250000 },
                    computed: { cad: 900, usd: 150, cop: 250000 },
                    variance: { cad: -100, usd: 0, cop: 0 },
                    is_balanced: false,
                },
                {
                    account_id: 2,
                    account_name: 'Savings',
                    account_type: 'bank',
                    is_asset: true,
                    is_liability: false,
                    has_recorded_balance: true,
                    recorded: { cad: 500, usd: 0, cop: 0 },
                    computed: { cad: 500, usd: 0, cop: 0 },
                    variance: { cad: 0, usd: 0, cop: 0 },
                    is_balanced: true,
                },
                {
                    account_id: 3,
                    account_name: 'Credit Card',
                    account_type: 'liability',
                    is_asset: false,
                    is_liability: true,
                    has_recorded_balance: true,
                    recorded: { cad: 450, usd: 60, cop: 50000 },
                    computed: { cad: 450, usd: 60, cop: 50000 },
                    variance: { cad: 0, usd: 0, cop: 0 },
                    is_balanced: true,
                },
            ],
            accounting_equation: {
                assets_cad: 1600,
                liabilities_cad: 510,
                equity_cad: 1090,
                residual_cad: 0,
                is_balanced: true,
            },
            balance_changes: {
                accounts: [
                    {
                        account_id: 1,
                        account_name: 'Checking',
                        account_type: 'bank',
                        is_asset: true,
                        is_liability: false,
                        initial_cad: 1200,
                        computed_cad: 1100,
                        difference_cad: 100,
                    },
                    {
                        account_id: 2,
                        account_name: 'Savings',
                        account_type: 'bank',
                        is_asset: true,
                        is_liability: false,
                        initial_cad: 500,
                        computed_cad: 500,
                        difference_cad: 0,
                    },
                    {
                        account_id: 3,
                        account_name: 'Credit Card',
                        account_type: 'liability',
                        is_asset: false,
                        is_liability: true,
                        initial_cad: 460,
                        computed_cad: 510,
                        difference_cad: -50,
                    },
                ],
                assets: {
                    initial_cad: 1700,
                    computed_cad: 1600,
                    difference_cad: 100,
                },
                liabilities: {
                    initial_cad: 460,
                    computed_cad: 510,
                    difference_cad: -50,
                },
            },
            income_total_cad: 0,
            expenses_total_cad: 150,
            net_operating_expenses_cad: 150,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByTestId('balance-changes-card');

        const card = screen.getByTestId('balance-changes-card');
        expect(screen.getByTestId('balance-changes-heading')).toHaveTextContent(
            'Balance Changes',
        );
        expect(card).toHaveTextContent('CAD equivalent');
        expect(card).toHaveTextContent('202502');

        expect(screen.getByTestId('balance-changes-row-1')).toHaveTextContent(
            'Checking',
        );
        expect(
            screen.getByTestId('balance-changes-row-1-initial'),
        ).toHaveTextContent('1,200');
        expect(
            screen.getByTestId('balance-changes-row-1-computed'),
        ).toHaveTextContent('1,100');
        expect(
            screen.getByTestId('balance-changes-row-1-difference'),
        ).toHaveTextContent('$100.00');
        expect(
            screen.getByTestId('balance-changes-row-1-difference'),
        ).not.toHaveTextContent('-$');

        expect(screen.getByTestId('balance-changes-row-2')).toHaveTextContent(
            'Savings',
        );
        expect(screen.getByTestId('balance-changes-row-3')).toHaveTextContent(
            'Credit Card',
        );
        expect(
            screen.getByTestId('balance-changes-row-3-difference'),
        ).toHaveTextContent('-$50.00');

        expect(
            screen.getByTestId('balance-changes-assets-total-difference'),
        ).toHaveTextContent('$100.00');
        expect(
            screen.getByTestId('balance-changes-liabilities-total-difference'),
        ).toHaveTextContent('-$50.00');
        expect(screen.getByTestId('balance-changes-assets')).toHaveTextContent(
            'Total assets',
        );
        expect(
            screen.getByTestId('balance-changes-liabilities'),
        ).toHaveTextContent('Total liabilities');
        expect(
            screen.queryByTestId('equation-currency-USD'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId('equation-currency-COP'),
        ).not.toBeInTheDocument();
    });
});

describe('Reconciliation - Records Check', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the month-close formula, terms, and result', async () => {
        const report = {
            period: '202502',
            status: 'unbalanced' as const,
            accounts: [
                {
                    account_id: 1,
                    account_name: 'Checking',
                    account_type: 'bank',
                    is_asset: true,
                    is_liability: false,
                    has_recorded_balance: true,
                    recorded: { cad: 1700, usd: 0, cop: 0 },
                    computed: { cad: 1700, usd: 0, cop: 0 },
                    variance: { cad: 0, usd: 0, cop: 0 },
                    is_balanced: true,
                },
            ],
            accounting_equation: {
                assets_cad: 1700,
                liabilities_cad: 650,
                equity_cad: 1050,
                residual_cad: 0,
                is_balanced: true,
            },
            records_check: {
                formula:
                    'Income − Net Operating Expenses + Total assets difference − Total liabilities difference + Down payments + Interest − Debt payments',
                income_cad: 1000,
                net_operating_expenses_cad: 450,
                assets_difference_cad: 300,
                liabilities_difference_cad: 150,
                down_payments_cad: 200,
                interest_cad: 100,
                debt_payments_cad: 300,
                result_cad: 700,
                is_balanced: false,
            },
            income_total_cad: 1000,
            expenses_total_cad: 650,
            net_operating_expenses_cad: 450,
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: report }),
        });

        render(<Reconciliation />);
        fireEvent.click(screen.getByText('View Reconciliation'));
        await screen.findByTestId('records-check-card');

        expect(screen.getByTestId('records-check-heading')).toHaveTextContent(
            'Records Check',
        );
        expect(
            screen.queryByTestId('records-check-formula'),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('records-check-card')).not.toHaveTextContent(
            'Income − Net Operating Expenses',
        );
        expect(screen.getByTestId('records-check-income')).toHaveTextContent(
            '1,000',
        );
        expect(
            screen.getByTestId('records-check-net-operating-expenses'),
        ).toHaveTextContent('450');
        expect(
            screen.getByTestId('records-check-assets-difference'),
        ).toHaveTextContent('300');
        expect(
            screen.getByTestId('records-check-liabilities-difference'),
        ).toHaveTextContent('150');
        expect(
            screen.getByTestId('records-check-down-payments'),
        ).toHaveTextContent('200');
        expect(screen.getByTestId('records-check-interest')).toHaveTextContent(
            '100',
        );
        expect(
            screen.getByTestId('records-check-debt-payments'),
        ).toHaveTextContent('300');
        expect(screen.getByTestId('records-check-result')).toHaveTextContent(
            '$700.00',
        );
        expect(screen.getByTestId('records-check-status')).toHaveTextContent(
            'Does not close',
        );
        expect(screen.getByTestId('records-check-card')).toHaveTextContent(
            '$0.00',
        );
    });

    it('marks a zero result as closing', async () => {
        const report = {
            period: '202501',
            status: 'unbalanced' as const,
            accounts: [],
            accounting_equation: {
                assets_cad: 0,
                liabilities_cad: 0,
                equity_cad: 0,
                residual_cad: 0,
                is_balanced: true,
            },
            records_check: {
                formula:
                    'Income − Net Operating Expenses + Total assets difference − Total liabilities difference + Down payments + Interest − Debt payments',
                income_cad: 0,
                net_operating_expenses_cad: 100,
                assets_difference_cad: 100,
                liabilities_difference_cad: 0,
                down_payments_cad: 0,
                interest_cad: 0,
                debt_payments_cad: 0,
                result_cad: 0,
                is_balanced: true,
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
        await screen.findByTestId('records-check-card');

        expect(screen.getByTestId('records-check-result')).toHaveTextContent(
            '$0.00',
        );
        expect(screen.getByTestId('records-check-status')).toHaveTextContent(
            'Closes',
        );
    });
});

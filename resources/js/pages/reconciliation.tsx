import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePeriod } from '@/hooks/use-period';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { SubsectionHeading } from '@/components/section-heading';
import TextLink from '@/components/text-link';
import { formatCurrencyAmount } from '@/lib/currency';
import {
    ScaleIcon,
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    ClipboardCheck,
    AlertCircle,
} from 'lucide-react';

interface CurrencyAmounts {
    cad: number;
    usd: number;
    cop: number;
}

interface AccountReconciliation {
    account_id: number;
    account_name: string;
    account_type: string;
    is_asset: boolean;
    is_liability: boolean;
    has_recorded_balance: boolean;
    recorded: CurrencyAmounts;
    computed: CurrencyAmounts;
    variance: CurrencyAmounts;
    is_balanced: boolean;
    is_reviewed: boolean;
    review_note: string | null;
    reviewed_at: string | null;
}

interface EquationTotals {
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
}

interface AccountingEquation extends EquationTotals {
    residual_cad: number;
    is_balanced: boolean;
    recorded?: EquationTotals;
    computed?: EquationTotals;
    variance?: EquationTotals;
}

interface BalanceChangeAmounts {
    initial_cad: number;
    computed_cad: number;
    difference_cad: number;
}

interface AccountBalanceChange extends BalanceChangeAmounts {
    account_id: number;
    account_name: string;
    account_type: string;
    is_asset: boolean;
    is_liability: boolean;
}

interface BalanceChanges {
    accounts: AccountBalanceChange[];
    assets: BalanceChangeAmounts;
    liabilities: BalanceChangeAmounts;
}

interface RecordsCheck {
    formula: string;
    income_cad: number;
    net_operating_expenses_cad: number;
    assets_difference_cad: number;
    liabilities_difference_cad: number;
    down_payments_cad: number;
    interest_cad: number;
    result_cad: number;
    is_balanced: boolean;
}

interface ReconciliationReport {
    period: string;
    status: 'balanced' | 'unbalanced';
    accounts: AccountReconciliation[];
    accounting_equation: AccountingEquation;
    balance_changes?: BalanceChanges;
    records_check?: RecordsCheck;
    income_total_cad: number;
    expenses_total_cad: number;
    net_operating_expenses_cad: number;
}

const VARIANCE_WARNING_THRESHOLD = 10.0;

const formatCurrency = (value: number, currency: string): string =>
    formatCurrencyAmount(value, currency);

/**
 * Check if any variance in the account exceeds the warning threshold.
 */
const hasSignificantVariance = (account: AccountReconciliation): boolean => {
    return (
        Math.abs(account.variance.cad) > VARIANCE_WARNING_THRESHOLD ||
        Math.abs(account.variance.usd) > VARIANCE_WARNING_THRESHOLD ||
        Math.abs(account.variance.cop) > VARIANCE_WARNING_THRESHOLD
    );
};

const getEquationRollup = (
    equation: AccountingEquation,
): {
    recorded: EquationTotals;
    computed: EquationTotals;
    variance: EquationTotals;
} => {
    const computed: EquationTotals = equation.computed ?? {
        assets_cad: equation.assets_cad,
        liabilities_cad: equation.liabilities_cad,
        equity_cad: equation.equity_cad,
    };
    const recorded: EquationTotals = equation.recorded ?? computed;
    const variance: EquationTotals = equation.variance ?? {
        assets_cad: recorded.assets_cad - computed.assets_cad,
        liabilities_cad: recorded.liabilities_cad - computed.liabilities_cad,
        equity_cad: recorded.equity_cad - computed.equity_cad,
    };

    return { recorded, computed, variance };
};

const getVarianceColorClass = (varianceValue: number): string => {
    const isZero = Math.abs(varianceValue) <= 0.01;
    const isSignificant = Math.abs(varianceValue) > VARIANCE_WARNING_THRESHOLD;

    if (isSignificant) {
        if (varianceValue < -0.01) {
            return 'font-medium text-red-600 dark:text-red-400';
        }

        return 'font-medium text-amber-600 dark:text-amber-400';
    }

    if (!isZero) {
        return 'font-medium text-muted-foreground';
    }

    return 'font-medium text-green-600 dark:text-green-500';
};

/**
 * Get a summary of significant variances for tooltip display.
 */
const getVarianceSummary = (account: AccountReconciliation): string => {
    const variances: string[] = [];

    if (Math.abs(account.variance.cad) > VARIANCE_WARNING_THRESHOLD) {
        variances.push(`CAD: ${formatCurrency(account.variance.cad, 'CAD')}`);
    }
    if (Math.abs(account.variance.usd) > VARIANCE_WARNING_THRESHOLD) {
        variances.push(`USD: ${formatCurrency(account.variance.usd, 'USD')}`);
    }
    if (Math.abs(account.variance.cop) > VARIANCE_WARNING_THRESHOLD) {
        variances.push(`COP: ${formatCurrency(account.variance.cop, 'COP')}`);
    }

    return variances.join(', ');
};

export default function Reconciliation() {
    const { period: sharedPeriod } = usePeriod();
    const [period, setPeriod] = useState<string>(sharedPeriod);
    const [report, setReport] = useState<ReconciliationReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [acknowledgeAccount, setAcknowledgeAccount] =
        useState<AccountReconciliation | null>(null);
    const [acknowledgeNote, setAcknowledgeNote] = useState('');
    const [acknowledgeSubmitting, setAcknowledgeSubmitting] = useState(false);
    const [acknowledgeError, setAcknowledgeError] = useState<string | null>(
        null,
    );

    const loadReconciliation = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!/^\d{6}$/.test(period)) {
            setError('Period must be in YYYYMM format (e.g. 202501)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/periods/${period}/reconciliation`,
            );

            if (!response.ok) {
                throw new Error('Failed to load reconciliation data');
            }

            const json = await response.json();
            setReport(json.data as ReconciliationReport);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load reconciliation data',
            );
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const openAcknowledgeDialog = (account: AccountReconciliation) => {
        setAcknowledgeAccount(account);
        setAcknowledgeNote(account.review_note ?? '');
        setAcknowledgeError(null);
    };

    const submitAcknowledgment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acknowledgeAccount || !report) {
            return;
        }

        setAcknowledgeSubmitting(true);
        setAcknowledgeError(null);

        try {
            const response = await fetch(
                `/api/periods/${report.period}/reconciliation/${acknowledgeAccount.account_id}/acknowledge`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        note: acknowledgeNote.trim() || null,
                    }),
                },
            );

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(
                    payload?.error ?? 'Failed to acknowledge variance',
                );
            }

            const json = await response.json();
            const acknowledgment = json.data as {
                is_reviewed: boolean;
                review_note: string | null;
                reviewed_at: string | null;
            };

            setReport({
                ...report,
                accounts: report.accounts.map((account) =>
                    account.account_id === acknowledgeAccount.account_id
                        ? {
                              ...account,
                              is_reviewed: acknowledgment.is_reviewed,
                              review_note: acknowledgment.review_note,
                              reviewed_at: acknowledgment.reviewed_at,
                          }
                        : account,
                ),
            });
            setAcknowledgeAccount(null);
            setAcknowledgeNote('');
        } catch (err) {
            setAcknowledgeError(
                err instanceof Error
                    ? err.message
                    : 'Failed to acknowledge variance',
            );
        } finally {
            setAcknowledgeSubmitting(false);
        }
    };

    const renderCurrencyRow = (
        label: string,
        currencyKey: keyof CurrencyAmounts,
        currencyCode: string,
        account: AccountReconciliation,
    ) => {
        const varianceValue = account.variance[currencyKey];
        const isZero = Math.abs(varianceValue) <= 0.01;
        const isSignificant =
            Math.abs(varianceValue) > VARIANCE_WARNING_THRESHOLD;
        const isNegative = varianceValue < -0.01;
        const varianceColorClass = getVarianceColorClass(varianceValue);

        return (
            <div
                key={label}
                className="grid grid-cols-4 gap-2 border-b py-2 text-sm last:border-b-0"
                data-testid={`currency-row-${currencyCode}`}
            >
                <div className="text-muted-foreground">{label}</div>
                <div data-testid="recorded-amount">
                    {formatCurrency(
                        account.recorded[currencyKey],
                        currencyCode,
                    )}
                </div>
                <div data-testid="computed-amount">
                    {formatCurrency(
                        account.computed[currencyKey],
                        currencyCode,
                    )}
                </div>
                <div
                    data-testid="variance-amount"
                    className={varianceColorClass}
                    data-variance-state={
                        isZero
                            ? 'balanced'
                            : isSignificant
                              ? isNegative
                                  ? 'negative-significant'
                                  : 'positive-significant'
                              : 'minor'
                    }
                >
                    {formatCurrency(varianceValue, currencyCode)}
                </div>
            </div>
        );
    };

    const unbalancedAccountCount =
        report?.accounts.filter((account) => !account.is_balanced).length ?? 0;
    const equationRollup = report
        ? getEquationRollup(report.accounting_equation)
        : null;

    const renderEquationRow = (
        label: string,
        testId: string,
        recorded: number,
        computed: number,
        variance: number,
    ) => (
        <div
            className="grid grid-cols-4 gap-2 border-b py-2 text-sm"
            data-testid={`equation-row-${testId}`}
        >
            <div className="text-muted-foreground">{label}</div>
            <div data-testid={`${testId}-recorded`}>
                {formatCurrency(recorded, 'CAD')}
            </div>
            <div
                className="font-semibold"
                data-testid={
                    testId === 'assets'
                        ? 'assets-total'
                        : testId === 'liabilities'
                          ? 'liabilities-total'
                          : 'equity-total'
                }
            >
                {formatCurrency(computed, 'CAD')}
            </div>
            <div
                className={getVarianceColorClass(variance)}
                data-testid={`${testId}-variance`}
            >
                {formatCurrency(variance, 'CAD')}
            </div>
        </div>
    );

    const renderBalanceChangeRow = (
        label: string,
        testId: string,
        amounts: BalanceChangeAmounts,
        options?: { isTotal?: boolean; rowKey?: string | number },
    ) => (
        <div
            key={options?.rowKey ?? testId}
            className={`grid grid-cols-4 gap-2 py-2 text-sm ${
                options?.isTotal ? 'border-t font-semibold' : 'border-b'
            }`}
            data-testid={testId}
        >
            <div
                className={
                    options?.isTotal ? '' : 'text-muted-foreground truncate'
                }
            >
                {label}
            </div>
            <div data-testid={`${testId}-initial`}>
                {formatCurrency(amounts.initial_cad, 'CAD')}
            </div>
            <div data-testid={`${testId}-computed`}>
                {formatCurrency(amounts.computed_cad, 'CAD')}
            </div>
            <div
                className={getVarianceColorClass(amounts.difference_cad)}
                data-testid={`${testId}-difference`}
            >
                {formatCurrency(amounts.difference_cad, 'CAD')}
            </div>
        </div>
    );

    const assetBalanceChanges =
        report?.balance_changes?.accounts.filter(
            (account) => account.is_asset,
        ) ?? [];
    const liabilityBalanceChanges =
        report?.balance_changes?.accounts.filter(
            (account) => account.is_liability,
        ) ?? [];

    return (
        <>
            <Head title="Reconciliation" />
            <PageContainer className="overflow-x-auto">
                <div className="mb-2 flex items-center justify-between">
                    <PageTitle
                        title="Reconciliation"
                        description="Compare recorded vs. computed balances for every account, per period"
                        leading={
                            <ScaleIcon className="size-7 shrink-0 fill-none" />
                        }
                    />
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={loadReconciliation}
                            className="flex flex-wrap items-end gap-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="period-input">
                                    Period (YYYYMM)
                                </Label>
                                <Input
                                    id="period-input"
                                    placeholder="202501"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="w-40"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Loading…' : 'View Reconciliation'}
                            </Button>
                            {report && (
                                <Badge
                                    variant="outline"
                                    className={
                                        report.status === 'balanced'
                                            ? 'ml-2 flex items-center gap-1 border-emerald-600 text-sm text-emerald-700 dark:text-emerald-400'
                                            : 'ml-2 flex items-center gap-1 border-amber-500 bg-amber-50 text-sm text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                                    }
                                    data-testid="reconciliation-status"
                                >
                                    {report.status === 'balanced' ? (
                                        <CheckCircle2 className="size-3.5 shrink-0 fill-none" />
                                    ) : (
                                        <AlertTriangle
                                            className="size-3.5 shrink-0 fill-none"
                                            data-testid="reconciliation-status-warning-icon"
                                        />
                                    )}
                                    {report.status === 'balanced'
                                        ? 'Balanced'
                                        : 'Unbalanced'}
                                </Badge>
                            )}
                        </form>
                        {error && (
                            <p className="mt-3 text-sm text-red-600">{error}</p>
                        )}
                    </CardContent>
                </Card>

                {report && report.status === 'unbalanced' && (
                    <Alert
                        variant="warning"
                        data-testid="reconciliation-warning-banner"
                    >
                        <AlertTriangle
                            className="h-4 w-4"
                            data-testid="reconciliation-warning-icon"
                        />
                        <AlertTitle data-testid="reconciliation-warning-title">
                            Unreconciled variance detected
                        </AlertTitle>
                        <AlertDescription data-testid="reconciliation-warning-message">
                            {unbalancedAccountCount} account
                            {unbalancedAccountCount === 1 ? '' : 's'}{' '}
                            {unbalancedAccountCount === 1 ? 'has' : 'have'} a
                            non-zero difference between recorded and computed
                            balances for period {report.period}. Review each
                            account below — investigate transactions or
                            acknowledge expected variances.
                        </AlertDescription>
                    </Alert>
                )}

                {report && equationRollup && (
                    <Card data-testid="accounting-equation-card">
                        <CardHeader>
                            <SubsectionHeading data-testid="accounting-equation-heading">
                                Accounting Equation
                            </SubsectionHeading>
                            <CardDescription>
                                Sum of account conciliations in CAD equivalent
                                for {report.period}. Assets = Liabilities +
                                Equity using calculated operations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="text-muted-foreground grid grid-cols-4 gap-2 border-b pb-2 text-xs font-semibold">
                                        <div>CAD</div>
                                        <div>Recorded</div>
                                        <div>Computed</div>
                                        <div>Variance</div>
                                    </div>
                                    {renderEquationRow(
                                        'Assets',
                                        'assets',
                                        equationRollup.recorded.assets_cad,
                                        equationRollup.computed.assets_cad,
                                        equationRollup.variance.assets_cad,
                                    )}
                                    {renderEquationRow(
                                        'Liabilities',
                                        'liabilities',
                                        equationRollup.recorded.liabilities_cad,
                                        equationRollup.computed.liabilities_cad,
                                        equationRollup.variance.liabilities_cad,
                                    )}
                                    {renderEquationRow(
                                        'Equity',
                                        'equity',
                                        equationRollup.recorded.equity_cad,
                                        equationRollup.computed.equity_cad,
                                        equationRollup.variance.equity_cad,
                                    )}
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <span className="text-sm font-medium">
                                            Residual
                                        </span>
                                        <span
                                            className={
                                                report.accounting_equation
                                                    .is_balanced
                                                    ? 'font-semibold text-green-600'
                                                    : 'font-semibold text-red-600'
                                            }
                                            data-testid="residual-amount"
                                        >
                                            {formatCurrency(
                                                report.accounting_equation
                                                    .residual_cad,
                                                'CAD',
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3 border-t pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                                    <p className="text-sm font-medium">
                                        Period Totals
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Income
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="income-total"
                                            >
                                                {formatCurrency(
                                                    report.income_total_cad,
                                                    'CAD',
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Total Disbursements
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="expenses-total"
                                            >
                                                {formatCurrency(
                                                    report.expenses_total_cad,
                                                    'CAD',
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Net Operating Expenses
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="net-expenses"
                                            >
                                                {formatCurrency(
                                                    report.net_operating_expenses_cad,
                                                    'CAD',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {report && report.balance_changes && (
                    <Card data-testid="balance-changes-card">
                        <CardHeader>
                            <SubsectionHeading data-testid="balance-changes-heading">
                                Balance Changes
                            </SubsectionHeading>
                            <CardDescription>
                                Difference between last recorded balance and
                                computed end value in CAD equivalent for{' '}
                                {report.period}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div data-testid="balance-changes-assets">
                                    <p className="mb-2 text-sm font-medium">
                                        Assets
                                    </p>
                                    <div className="text-muted-foreground grid grid-cols-4 gap-2 border-b pb-2 text-xs font-semibold">
                                        <div>Account</div>
                                        <div>Initial</div>
                                        <div>Computed</div>
                                        <div>Difference</div>
                                    </div>
                                    {assetBalanceChanges.map((account) =>
                                        renderBalanceChangeRow(
                                            account.account_name,
                                            `balance-changes-row-${account.account_id}`,
                                            account,
                                            { rowKey: account.account_id },
                                        ),
                                    )}
                                    {renderBalanceChangeRow(
                                        'Total assets',
                                        'balance-changes-assets-total',
                                        report.balance_changes.assets,
                                        { isTotal: true },
                                    )}
                                </div>
                                <div data-testid="balance-changes-liabilities">
                                    <p className="mb-2 text-sm font-medium">
                                        Liabilities
                                    </p>
                                    <div className="text-muted-foreground grid grid-cols-4 gap-2 border-b pb-2 text-xs font-semibold">
                                        <div>Account</div>
                                        <div>Initial</div>
                                        <div>Computed</div>
                                        <div>Difference</div>
                                    </div>
                                    {liabilityBalanceChanges.map((account) =>
                                        renderBalanceChangeRow(
                                            account.account_name,
                                            `balance-changes-row-${account.account_id}`,
                                            account,
                                            { rowKey: account.account_id },
                                        ),
                                    )}
                                    {renderBalanceChangeRow(
                                        'Total liabilities',
                                        'balance-changes-liabilities-total',
                                        report.balance_changes.liabilities,
                                        { isTotal: true },
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {report && report.records_check && (
                    <Card data-testid="records-check-card">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <SubsectionHeading data-testid="records-check-heading">
                                        Records Check
                                    </SubsectionHeading>
                                    <CardDescription>
                                        Confirms the month&apos;s records close.
                                        The result should be $0.00 when nothing
                                        is missing.
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        report.records_check.is_balanced
                                            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                            : 'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                                    }
                                    data-testid="records-check-status"
                                >
                                    {report.records_check.is_balanced
                                        ? 'Closes'
                                        : 'Does not close'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p
                                className="bg-muted/50 mb-4 rounded-md px-3 py-2 font-mono text-sm"
                                data-testid="records-check-formula"
                            >
                                {report.records_check.formula}
                            </p>
                            <div className="max-w-xl space-y-0">
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-income"
                                >
                                    <span className="text-muted-foreground">
                                        Income
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check.income_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-net-operating-expenses"
                                >
                                    <span className="text-muted-foreground">
                                        − Net Operating Expenses
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check
                                                .net_operating_expenses_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-assets-difference"
                                >
                                    <span className="text-muted-foreground">
                                        + Total assets difference
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check
                                                .assets_difference_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-liabilities-difference"
                                >
                                    <span className="text-muted-foreground">
                                        − Total liabilities difference
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check
                                                .liabilities_difference_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-down-payments"
                                >
                                    <span className="text-muted-foreground">
                                        + Down payments
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check
                                                .down_payments_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div
                                    className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm"
                                    data-testid="records-check-interest"
                                >
                                    <span className="text-muted-foreground">
                                        + Interest
                                    </span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            report.records_check.interest_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-4 border-t pt-3">
                                    <span className="text-sm font-medium">
                                        Result
                                    </span>
                                    <span
                                        className={`text-lg font-semibold tabular-nums ${
                                            report.records_check.is_balanced
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                        data-testid="records-check-result"
                                    >
                                        {formatCurrency(
                                            report.records_check.result_cad,
                                            'CAD',
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {report && report.accounts.length === 0 && (
                    <p className="text-muted-foreground">
                        No active accounts found.
                    </p>
                )}

                {report &&
                    report.accounts.map((account) => (
                        <Card
                            key={account.account_id}
                            data-testid={`account-reconciliation-${account.account_id}`}
                            data-account-name={account.account_name}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle
                                            data-testid={`account-name-${account.account_name.replace(/\s+/g, '-').toLowerCase()}`}
                                        >
                                            {account.account_name}
                                        </CardTitle>
                                        <CardDescription>
                                            {account.is_asset
                                                ? 'Asset'
                                                : 'Liability'}{' '}
                                            &middot; {account.account_type}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!account.is_balanced &&
                                            hasSignificantVariance(account) && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                                                                data-testid={`variance-warning-${account.account_id}`}
                                                            >
                                                                <AlertTriangle className="h-5 w-5" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            className="max-w-xs"
                                                            data-testid={`variance-tooltip-${account.account_id}`}
                                                        >
                                                            <p className="font-semibold">
                                                                Significant
                                                                Variance
                                                                Detected
                                                            </p>
                                                            <p className="mt-1 text-sm">
                                                                {getVarianceSummary(
                                                                    account,
                                                                )}
                                                            </p>
                                                            <p className="text-muted-foreground mt-1 text-xs">
                                                                Variance exceeds
                                                                $
                                                                {VARIANCE_WARNING_THRESHOLD.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                threshold
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        {!account.is_balanced &&
                                            account.is_reviewed && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-600 text-emerald-700 dark:text-emerald-400"
                                                    data-testid={`variance-reviewed-${account.account_id}`}
                                                >
                                                    <ClipboardCheck className="size-3.5 shrink-0 fill-none" />
                                                    Reviewed
                                                </Badge>
                                            )}
                                        <Badge
                                            variant={
                                                account.is_balanced
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {account.is_balanced
                                                ? 'Balanced'
                                                : 'Variance'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!account.is_balanced &&
                                    hasSignificantVariance(account) && (
                                        <Alert
                                            variant="warning"
                                            className="mb-4"
                                            data-testid={`variance-warning-message-${account.account_id}`}
                                        >
                                            <AlertTriangle
                                                className="h-4 w-4"
                                                data-testid={`variance-warning-message-icon-${account.account_id}`}
                                            />
                                            <AlertTitle>
                                                Significant unreconciled
                                                variance
                                            </AlertTitle>
                                            <AlertDescription>
                                                Recorded and computed balances
                                                differ by{' '}
                                                {getVarianceSummary(account)},
                                                which exceeds the $
                                                {VARIANCE_WARNING_THRESHOLD.toFixed(
                                                    2,
                                                )}{' '}
                                                threshold. Investigate
                                                transactions to resolve the
                                                difference, or acknowledge the
                                                variance if it is expected.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                <div className="text-muted-foreground grid grid-cols-4 gap-2 border-b pb-2 text-xs font-semibold">
                                    <div>Currency</div>
                                    <div>Recorded</div>
                                    <div>Computed</div>
                                    <div>Variance</div>
                                </div>
                                {renderCurrencyRow(
                                    'CAD',
                                    'cad',
                                    'CAD',
                                    account,
                                )}
                                {renderCurrencyRow(
                                    'USD',
                                    'usd',
                                    'USD',
                                    account,
                                )}
                                {renderCurrencyRow(
                                    'COP',
                                    'cop',
                                    'COP',
                                    account,
                                )}
                                {!account.is_balanced &&
                                    account.is_reviewed &&
                                    account.review_note && (
                                        <p
                                            className="text-muted-foreground mt-3 text-sm"
                                            data-testid={`variance-review-note-${account.account_id}`}
                                        >
                                            Review note: {account.review_note}
                                        </p>
                                    )}
                                {!account.is_balanced && (
                                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                                        <TextLink
                                            href={`/accounts/${account.account_id}?period=${report.period}`}
                                            className="inline-flex items-center gap-2 text-sm"
                                            data-testid={`investigate-link-${account.account_id}`}
                                        >
                                            <span>
                                                Investigate Transactions
                                            </span>
                                            <ExternalLink className="h-4 w-4" />
                                        </TextLink>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                openAcknowledgeDialog(account)
                                            }
                                            data-testid={`acknowledge-variance-${account.account_id}`}
                                        >
                                            {account.is_reviewed
                                                ? 'Update Acknowledgment'
                                                : 'Acknowledge Variance'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
            </PageContainer>

            <Dialog
                open={acknowledgeAccount !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAcknowledgeAccount(null);
                        setAcknowledgeError(null);
                    }
                }}
            >
                <DialogContent data-testid="acknowledge-variance-dialog">
                    <form onSubmit={submitAcknowledgment}>
                        <DialogHeader>
                            <DialogTitle>Acknowledge Variance</DialogTitle>
                            <DialogDescription>
                                Mark the variance for{' '}
                                {acknowledgeAccount?.account_name ??
                                    'this account'}{' '}
                                as reviewed. The variance amount still shows;
                                this only records that you acknowledged it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="acknowledge-note">
                                    Optional note
                                </Label>
                                <Textarea
                                    id="acknowledge-note"
                                    value={acknowledgeNote}
                                    onChange={(e) =>
                                        setAcknowledgeNote(e.target.value)
                                    }
                                    placeholder="e.g. Timing difference pending bank statement"
                                    rows={3}
                                    data-testid="acknowledge-note-input"
                                />
                            </div>
                            {acknowledgeError && (
                                <p
                                    className="text-destructive flex items-center gap-1.5 text-sm dark:text-red-400"
                                    role="alert"
                                    data-testid="acknowledge-error"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{acknowledgeError}</span>
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAcknowledgeAccount(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={acknowledgeSubmitting}
                                data-testid="acknowledge-submit"
                            >
                                {acknowledgeSubmitting
                                    ? 'Saving…'
                                    : 'Acknowledge Variance'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Reconciliation.layout = {
    breadcrumbs: [
        {
            title: 'Reconciliation',
            href: '/reconciliation',
        },
    ],
};

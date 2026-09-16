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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePeriod } from '@/hooks/use-period';
import { ScaleIcon, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from '@inertiajs/react';

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
}

interface AccountingEquation {
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
    residual_cad: number;
    is_balanced: boolean;
}

interface ReconciliationReport {
    period: string;
    status: 'balanced' | 'unbalanced';
    accounts: AccountReconciliation[];
    accounting_equation: AccountingEquation;
    income_total_cad: number;
    expenses_total_cad: number;
    net_operating_expenses_cad: number;
}

const VARIANCE_WARNING_THRESHOLD = 10.00;

const formatCurrency = (value: number, currency: string): string => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(value);
    } catch {
        return value.toFixed(2);
    }
};

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
                `/api/periods/${period}/reconciliation`
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
                    : 'Failed to load reconciliation data'
            );
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const renderCurrencyRow = (
        label: string,
        currencyKey: keyof CurrencyAmounts,
        currencyCode: string,
        account: AccountReconciliation
    ) => {
        const varianceValue = account.variance[currencyKey];
        const isZero = Math.abs(varianceValue) <= 0.01;

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
                        currencyCode
                    )}
                </div>
                <div data-testid="computed-amount">
                    {formatCurrency(
                        account.computed[currencyKey],
                        currencyCode
                    )}
                </div>
                <div
                    data-testid="variance-amount"
                    className={
                        isZero
                            ? 'font-medium text-green-600'
                            : 'font-medium text-red-600'
                    }
                >
                    {formatCurrency(varianceValue, currencyCode)}
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Reconciliation" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                            <ScaleIcon className="h-7 w-7" />
                            Reconciliation
                        </h1>
                        <p className="text-muted-foreground">
                            Compare recorded vs. computed balances for every
                            account, per period
                        </p>
                    </div>
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
                                    onChange={(e) =>
                                        setPeriod(e.target.value)
                                    }
                                    className="w-40"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Loading…' : 'View Reconciliation'}
                            </Button>
                            {report && (
                                <Badge
                                    variant={
                                        report.status === 'balanced'
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    className="ml-2 flex items-center gap-1 text-sm"
                                    data-testid="reconciliation-status"
                                >
                                    {report.status === 'balanced' ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4" />
                                    )}
                                    {report.status === 'balanced'
                                        ? 'Balanced'
                                        : 'Unbalanced'}
                                </Badge>
                            )}
                        </form>
                        {error && (
                            <p className="mt-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {report && report.accounting_equation && (
                    <Card data-testid="accounting-equation-card">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Accounting Equation</span>
                                <Badge
                                    variant={
                                        report.accounting_equation.is_balanced
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    data-testid="equation-status"
                                >
                                    {report.accounting_equation.is_balanced
                                        ? 'Balanced'
                                        : 'Unbalanced'}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Assets = Liabilities + Equity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Assets
                                        </p>
                                        <p
                                            className="text-2xl font-bold"
                                            data-testid="assets-value"
                                        >
                                            {formatCurrency(
                                                report.accounting_equation
                                                    .assets_cad,
                                                'CAD'
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Liabilities
                                        </p>
                                        <p
                                            className="text-2xl font-bold"
                                            data-testid="liabilities-value"
                                        >
                                            {formatCurrency(
                                                report.accounting_equation
                                                    .liabilities_cad,
                                                'CAD'
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Equity
                                        </p>
                                        <p
                                            className="text-2xl font-bold"
                                            data-testid="equity-value"
                                        >
                                            {formatCurrency(
                                                report.accounting_equation
                                                    .equity_cad,
                                                'CAD'
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Residual
                                        </p>
                                        <p
                                            className={`text-2xl font-bold ${Math.abs(report.accounting_equation.residual_cad) <= 0.01 ? 'text-green-600' : 'text-red-600'}`}
                                            data-testid="residual-value"
                                        >
                                            {formatCurrency(
                                                report.accounting_equation
                                                    .residual_cad,
                                                'CAD'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Income Total
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="income-total"
                                            >
                                                {formatCurrency(
                                                    report.income_total_cad,
                                                    'CAD'
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Total Disbursements
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="expenses-total"
                                            >
                                                {formatCurrency(
                                                    report.expenses_total_cad,
                                                    'CAD'
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Net Operating Expenses
                                            </p>
                                            <p
                                                className="text-lg font-semibold"
                                                data-testid="net-expenses"
                                            >
                                                {formatCurrency(
                                                    report.net_operating_expenses_cad,
                                                    'CAD'
                                                )}
                                            </p>
                                        </div>
                                    </div>
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
                                        {!account.is_balanced && hasSignificantVariance(account) && (
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
                                                        <p className="font-semibold">Significant Variance Detected</p>
                                                        <p className="text-sm mt-1">{getVarianceSummary(account)}</p>
                                                        <p className="text-xs mt-1 text-muted-foreground">
                                                            Variance exceeds ${VARIANCE_WARNING_THRESHOLD.toFixed(2)} threshold
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
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
                                <div className="grid grid-cols-4 gap-2 border-b pb-2 text-xs font-semibold text-muted-foreground">
                                    <div>Currency</div>
                                    <div>Recorded</div>
                                    <div>Computed</div>
                                    <div>Variance</div>
                                </div>
                                {renderCurrencyRow(
                                    'CAD',
                                    'cad',
                                    'CAD',
                                    account
                                )}
                                {renderCurrencyRow(
                                    'USD',
                                    'usd',
                                    'USD',
                                    account
                                )}
                                {renderCurrencyRow(
                                    'COP',
                                    'cop',
                                    'COP',
                                    account
                                )}
                                {!account.is_balanced && (
                                    <div className="mt-4 pt-4 border-t">
                                        <Link
                                            href={`/accounts/${account.account_id}?period=${report.period}`}
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            data-testid={`investigate-link-${account.account_id}`}
                                        >
                                            <span>Investigate Transactions</span>
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </>
    );
}

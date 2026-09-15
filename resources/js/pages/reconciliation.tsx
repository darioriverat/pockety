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
import { ScaleIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

interface ReconciliationReport {
    period: string;
    status: 'balanced' | 'unbalanced';
    accounts: AccountReconciliation[];
}

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

const currentPeriod = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
};

export default function Reconciliation() {
    const [period, setPeriod] = useState<string>(currentPeriod());
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
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </>
    );
}

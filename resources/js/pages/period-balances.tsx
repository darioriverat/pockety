import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import TextLink from '@/components/text-link';
import { usePeriod } from '@/hooks/use-period';
import { useSelectablePeriods } from '@/hooks/use-selectable-periods';
import { formatDisplayCurrency } from '@/lib/currency';
import { formatPeriod } from '@/lib/periods';
import {
    AlertTriangle,
    BookMarked,
    CheckCircle2,
    XCircle,
} from 'lucide-react';

interface BalanceFigures {
    period: string;
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
    income_cad: number;
    net_operating_expenses_cad: number;
    records_check_result_cad: number;
    reconciliation_status: 'balanced' | 'unbalanced' | string;
}

interface RegisteredBalance extends BalanceFigures {
    id: number;
    registered_at: string;
    updated_at: string;
}

interface BalanceHistoryEntry extends BalanceFigures {
    id: number;
    recorded_at: string;
    replaced_at: string;
}

interface PeriodBalancePayload {
    period: string;
    proposed: BalanceFigures;
    registered: RegisteredBalance | null;
    history: BalanceHistoryEntry[];
}

function formatCad(value: number): string {
    return formatDisplayCurrency(value, 'CAD');
}

function formatTimestamp(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function statusLabel(status: string): string {
    return status === 'balanced' ? 'Balanced' : 'Unbalanced';
}

function FigureGrid({
    figures,
    testIdPrefix,
    columns = 'responsive',
}: {
    figures: BalanceFigures;
    testIdPrefix: string;
    /** Single-column avoids nested-grid overlap inside the overwrite dialog. */
    columns?: 'responsive' | 'single';
}) {
    const rows: Array<{ label: string; key: string; value: number }> = [
        { label: 'Assets', key: 'assets-cad', value: figures.assets_cad },
        {
            label: 'Liabilities',
            key: 'liabilities-cad',
            value: figures.liabilities_cad,
        },
        { label: 'Equity', key: 'equity-cad', value: figures.equity_cad },
        { label: 'Income', key: 'income-cad', value: figures.income_cad },
        {
            label: 'Net operating expenses',
            key: 'expenses-cad',
            value: figures.net_operating_expenses_cad,
        },
        {
            label: 'Records check',
            key: 'records-check-cad',
            value: figures.records_check_result_cad,
        },
    ];

    return (
        <dl
            className={
                columns === 'single'
                    ? 'grid grid-cols-1 gap-3'
                    : 'grid gap-3 sm:grid-cols-2'
            }
        >
            {rows.map((row) => (
                <div key={row.key} className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd
                        className="text-sm font-medium tabular-nums"
                        data-testid={`${testIdPrefix}-${row.key}`}
                    >
                        {formatCad(row.value)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function PeriodBalances() {
    const periods = useSelectablePeriods();
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } =
        usePeriod();
    const [payload, setPayload] = useState<PeriodBalancePayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [overwriteOpen, setOverwriteOpen] = useState(false);

    const load = async (period: string) => {
        setLoading(true);
        setError(null);
        setPayload(null);
        try {
            const response = await fetch(
                `/api/period-balances?period=${encodeURIComponent(period)}`,
                { headers: { Accept: 'application/json' } },
            );
            if (!response.ok) {
                throw new Error('Failed to load period balance');
            }
            const body = await response.json();
            setPayload(body.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load period balance',
            );
            setPayload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPeriod) {
            void load(selectedPeriod);
        }
    }, [selectedPeriod]);

    const submit = async (overwrite: boolean) => {
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/period-balances', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    period: selectedPeriod,
                    overwrite,
                }),
            });

            if (response.status === 409) {
                setOverwriteOpen(true);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.messages
                    ? Object.values(errorData.messages).flat().join(' ')
                    : errorData?.error || 'Failed to register balance';
                throw new Error(message);
            }

            const body = await response.json();
            setOverwriteOpen(false);
            setSuccess(
                body.meta?.overwritten
                    ? `Balance for ${formatPeriod(selectedPeriod)} was overwritten. The previous figures are kept in the history.`
                    : `Balance for ${formatPeriod(selectedPeriod)} was registered from the reconciliation figures.`,
            );
            await load(selectedPeriod);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to register balance',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterClick = () => {
        setSuccess(null);
        setError(null);
        if (payload?.registered) {
            setOverwriteOpen(true);
            return;
        }
        void submit(false);
    };

    const proposed = payload?.proposed ?? null;
    const registered = payload?.registered ?? null;
    const history = payload?.history ?? [];

    return (
        <>
            <Head title="Period Balances" />

            <PageContainer>
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <PageTitle
                        title="Period Balances"
                        description="Register the month-end balance from reconciliation figures after you have verified the records"
                        leading={<BookMarked />}
                        data-testid="period-balances-heading"
                    />
                    <div className="w-full max-w-xs space-y-2">
                        <Label htmlFor="period">Period</Label>
                        <Select
                            value={selectedPeriod}
                            onValueChange={(value) => {
                                setSuccess(null);
                                setSelectedPeriod(value);
                            }}
                        >
                            <SelectTrigger
                                id="period"
                                data-testid="page-period-selector"
                            >
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map((period) => (
                                    <SelectItem key={period} value={period}>
                                        {formatPeriod(period)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Check that every record matches in the{' '}
                    <TextLink
                        href="/reconciliation"
                        data-testid="reconciliation-verify-link"
                    >
                        reconciliation report
                    </TextLink>
                    . When the computed figures look right, register them here.
                    Reconciliation itself stays a verification view.
                </p>

                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert data-testid="period-balance-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Balance saved</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {loading && !payload ? (
                    <LoadingState
                        variant="spinner"
                        label="Loading period balance…"
                        data-testid="period-balances-loading"
                    />
                ) : (
                    <>
                        {proposed && (
                            <Card data-testid="proposed-balance-card">
                                <CardHeader>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <CardTitle>
                                                Reconciliation figures
                                            </CardTitle>
                                            <CardDescription>
                                                Computed assets, liabilities,
                                                and equity for{' '}
                                                {formatPeriod(proposed.period)}.
                                                Registering also saves each
                                                account&apos;s computed balance.
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={
                                                proposed.reconciliation_status ===
                                                'balanced'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            data-testid="proposed-reconciliation-status"
                                        >
                                            {statusLabel(
                                                proposed.reconciliation_status,
                                            )}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {proposed.reconciliation_status !==
                                        'balanced' && (
                                        <Alert variant="warning">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Reconciliation is still
                                                unbalanced for this period. You
                                                can register anyway once you
                                                are comfortable with the
                                                figures.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <FigureGrid
                                        figures={proposed}
                                        testIdPrefix="proposed"
                                    />
                                    <Button
                                        onClick={handleRegisterClick}
                                        disabled={submitting || loading}
                                        data-testid="register-period-balance"
                                    >
                                        <BookMarked className="size-4 shrink-0 fill-none" />
                                        Register balance
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card data-testid="registered-balance-card">
                            <CardHeader>
                                <CardTitle>Registered balance</CardTitle>
                                <CardDescription>
                                    The balance currently saved for{' '}
                                    {formatPeriod(selectedPeriod)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {registered ? (
                                    <div className="space-y-4">
                                        <p
                                            className="text-sm text-muted-foreground"
                                            data-testid="registered-balance-updated"
                                        >
                                            Last saved{' '}
                                            {formatTimestamp(
                                                registered.updated_at,
                                            )}
                                        </p>
                                        <FigureGrid
                                            figures={registered}
                                            testIdPrefix="registered"
                                        />
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm text-muted-foreground"
                                        data-testid="registered-balance-empty"
                                    >
                                        No balance has been registered for this
                                        period yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Balance history</CardTitle>
                                <CardDescription>
                                    Previous balances replaced for{' '}
                                    {formatPeriod(selectedPeriod)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {history.length === 0 ? (
                                    <p
                                        className="text-sm text-muted-foreground"
                                        data-testid="balance-history-empty"
                                    >
                                        No previous balances for this period.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table
                                            className="w-full min-w-[40rem] border-collapse text-left text-sm"
                                            data-testid="balance-history-table"
                                        >
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="px-3 py-2 font-medium">
                                                        Replaced
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-medium">
                                                        Assets
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-medium">
                                                        Liabilities
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-medium">
                                                        Equity
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((entry) => (
                                                    <tr
                                                        key={entry.id}
                                                        className="border-b"
                                                        data-testid={`balance-history-row-${entry.id}`}
                                                    >
                                                        <td className="px-3 py-2">
                                                            {formatTimestamp(
                                                                entry.replaced_at,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right tabular-nums"
                                                            data-testid={`balance-history-assets-${entry.id}`}
                                                        >
                                                            {formatCad(
                                                                entry.assets_cad,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {formatCad(
                                                                entry.liabilities_cad,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {formatCad(
                                                                entry.equity_cad,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {statusLabel(
                                                                entry.reconciliation_status,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </PageContainer>

            <Dialog open={overwriteOpen} onOpenChange={setOverwriteOpen}>
                <DialogContent
                    data-testid="overwrite-balance-dialog"
                    className="sm:max-w-3xl"
                >
                    <DialogHeader className="pr-10">
                        <DialogTitle data-testid="overwrite-balance-title">
                            Overwrite existing balance?
                        </DialogTitle>
                        <DialogDescription>
                            A balance is already registered for{' '}
                            {formatPeriod(selectedPeriod)}. Saving replaces it
                            and each account balance for this period with the
                            current reconciliation figures, and keeps the
                            previous period balance in the history.
                        </DialogDescription>
                    </DialogHeader>
                    {registered && proposed && (
                        <div
                            className="grid gap-6 sm:grid-cols-2"
                            data-testid="overwrite-balance-comparison"
                        >
                            <div data-testid="overwrite-existing-column">
                                <p className="mb-2 text-sm font-medium">
                                    Current balance
                                </p>
                                <FigureGrid
                                    figures={registered}
                                    testIdPrefix="overwrite-existing"
                                    columns="single"
                                />
                            </div>
                            <div data-testid="overwrite-proposed-column">
                                <p className="mb-2 text-sm font-medium">
                                    New figures
                                </p>
                                <FigureGrid
                                    figures={proposed}
                                    testIdPrefix="overwrite-proposed"
                                    columns="single"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOverwriteOpen(false)}
                            disabled={submitting}
                            data-testid="overwrite-balance-cancel"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void submit(true)}
                            disabled={submitting}
                            data-testid="overwrite-balance-confirm"
                        >
                            Overwrite balance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PeriodBalances.layout = {
    breadcrumbs: [
        {
            title: 'Period Balances',
            href: '/period-balances',
        },
    ],
};

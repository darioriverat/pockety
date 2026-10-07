import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
import {
    formatDisplayCurrency,
    formatSignedDisplayCurrency,
} from '@/lib/currency';
import { formatPeriod } from '@/lib/periods';
import { cn } from '@/lib/utils';
import { AlertTriangle, BookMarked, CheckCircle2, XCircle } from 'lucide-react';

interface BalanceFigures {
    period: string;
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
    income_cad: number;
    net_operating_expenses_cad: number;
    records_check_result_cad: number;
    reconciliation_status: string;
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

const MONEY_EPSILON = 0.005;

const FIGURE_ROWS: Array<{
    label: string;
    key: string;
    field: keyof Pick<
        BalanceFigures,
        | 'assets_cad'
        | 'liabilities_cad'
        | 'equity_cad'
        | 'income_cad'
        | 'net_operating_expenses_cad'
        | 'records_check_result_cad'
    >;
}> = [
    { label: 'Assets', key: 'assets-cad', field: 'assets_cad' },
    { label: 'Liabilities', key: 'liabilities-cad', field: 'liabilities_cad' },
    { label: 'Equity', key: 'equity-cad', field: 'equity_cad' },
    { label: 'Income', key: 'income-cad', field: 'income_cad' },
    {
        label: 'Net operating expenses',
        key: 'expenses-cad',
        field: 'net_operating_expenses_cad',
    },
    {
        label: 'Records check',
        key: 'records-check-cad',
        field: 'records_check_result_cad',
    },
];

function amountsDiffer(left: number, right: number): boolean {
    return Math.abs(left - right) > MONEY_EPSILON;
}

function changedFigureKeys(
    proposed: BalanceFigures,
    registered: BalanceFigures,
): Set<string> {
    const changed = new Set<string>();

    for (const row of FIGURE_ROWS) {
        if (amountsDiffer(proposed[row.field], registered[row.field])) {
            changed.add(row.key);
        }
    }

    if (proposed.reconciliation_status !== registered.reconciliation_status) {
        changed.add('reconciliation-status');
    }

    return changed;
}

function figureDeltas(
    proposed: BalanceFigures,
    registered: BalanceFigures,
    changed: ReadonlySet<string>,
): Record<string, number> {
    const deltas: Record<string, number> = {};

    for (const row of FIGURE_ROWS) {
        if (changed.has(row.key)) {
            deltas[row.key] =
                Math.round(
                    (proposed[row.field] - registered[row.field]) * 100,
                ) / 100;
        }
    }

    return deltas;
}

function describeChangedFigures(changed: ReadonlySet<string>): string {
    const labels = FIGURE_ROWS.filter((row) => changed.has(row.key)).map(
        (row) => row.label.toLowerCase(),
    );

    if (changed.has('reconciliation-status')) {
        labels.push('reconciliation status');
    }

    if (labels.length === 0) {
        return '';
    }

    const sentence =
        labels.length === 1
            ? `${labels[0]} differs`
            : labels.length === 2
              ? `${labels[0]} and ${labels[1]} differ`
              : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]} differ`;

    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function FigureGrid({
    figures,
    testIdPrefix,
    columns = 'responsive',
    changedKeys,
    deltas,
}: {
    figures: BalanceFigures;
    testIdPrefix: string;
    /** Single-column avoids nested-grid overlap inside the overwrite dialog. */
    columns?: 'responsive' | 'single';
    changedKeys?: ReadonlySet<string>;
    deltas?: Readonly<Record<string, number>>;
}) {
    const rows = FIGURE_ROWS.map((row) => ({
        label: row.label,
        key: row.key,
        value: figures[row.field],
    }));

    return (
        <dl
            className={
                columns === 'single'
                    ? 'grid grid-cols-1 gap-3'
                    : 'grid gap-3 sm:grid-cols-2'
            }
        >
            {rows.map((row) => {
                const changed = changedKeys?.has(row.key) ?? false;
                const delta = deltas?.[row.key];

                return (
                    <div
                        key={row.key}
                        data-differs={changed ? 'true' : undefined}
                        className={cn(
                            'flex items-baseline justify-between gap-4 rounded-md px-2 py-1',
                            changed &&
                                'bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/50 dark:ring-amber-700',
                        )}
                    >
                        <dt
                            className={cn(
                                'text-sm',
                                changed
                                    ? 'font-medium text-amber-950 dark:text-amber-100'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {row.label}
                        </dt>
                        <dd className="flex items-baseline gap-2">
                            <span
                                className={cn(
                                    'text-sm tabular-nums',
                                    changed
                                        ? 'font-semibold text-amber-900 dark:text-amber-100'
                                        : 'font-medium',
                                )}
                                data-testid={`${testIdPrefix}-${row.key}`}
                            >
                                {formatCad(row.value)}
                            </span>
                            {delta !== undefined && (
                                <span
                                    className="text-xs font-medium text-amber-700 dark:text-amber-300"
                                    data-testid={`${testIdPrefix}-${row.key}-delta`}
                                >
                                    {formatSignedDisplayCurrency(delta, 'CAD')}
                                </span>
                            )}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}

export default function PeriodBalances() {
    const { t } = useTranslation();

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
    const changedKeys =
        proposed && registered
            ? changedFigureKeys(proposed, registered)
            : new Set<string>();
    const deltas =
        proposed && registered
            ? figureDeltas(proposed, registered, changedKeys)
            : {};
    const hasDifferences = changedKeys.size > 0;
    const statusDiffers = changedKeys.has('reconciliation-status');
    const differenceSummary = describeChangedFigures(changedKeys);

    return (
        <>
            <Head title={t('pages.periodBalances.title')} />

            <PageContainer>
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <PageTitle
                        title={t('pages.periodBalances.title')}
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

                <p className="text-muted-foreground text-sm">
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
                            <Card
                                data-testid="proposed-balance-card"
                                data-differs={
                                    hasDifferences ? 'true' : undefined
                                }
                                className={cn(
                                    hasDifferences &&
                                        'border-amber-400 dark:border-amber-600',
                                )}
                            >
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
                                            data-differs={
                                                statusDiffers
                                                    ? 'true'
                                                    : undefined
                                            }
                                            className={cn(
                                                statusDiffers &&
                                                    'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100',
                                            )}
                                        >
                                            {statusLabel(
                                                proposed.reconciliation_status,
                                            )}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {hasDifferences && (
                                        <Alert
                                            variant="warning"
                                            data-testid="balance-figures-differ-warning"
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>
                                                These figures differ from the
                                                registered balance
                                            </AlertTitle>
                                            <AlertDescription>
                                                {differenceSummary}. Highlighted
                                                amounts show the change from the
                                                saved balance. Registering will
                                                overwrite those values.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {proposed.reconciliation_status !==
                                        'balanced' && (
                                        <Alert variant="warning">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Reconciliation is still
                                                unbalanced for this period. You
                                                can register anyway once you are
                                                comfortable with the figures.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <FigureGrid
                                        figures={proposed}
                                        testIdPrefix="proposed"
                                        changedKeys={changedKeys}
                                        deltas={deltas}
                                    />
                                    <Button
                                        onClick={handleRegisterClick}
                                        disabled={submitting || loading}
                                        data-testid="register-period-balance"
                                    >
                                        <BookMarked className="size-4 shrink-0 fill-none" />
                                        {hasDifferences
                                            ? 'Overwrite balance'
                                            : 'Register balance'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card
                            data-testid="registered-balance-card"
                            data-differs={hasDifferences ? 'true' : undefined}
                            className={cn(
                                hasDifferences &&
                                    'border-amber-400 dark:border-amber-600',
                            )}
                        >
                            <CardHeader>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle>
                                            Registered balance
                                        </CardTitle>
                                        <CardDescription>
                                            The balance currently saved for{' '}
                                            {formatPeriod(selectedPeriod)}
                                        </CardDescription>
                                    </div>
                                    {registered && (
                                        <Badge
                                            variant={
                                                registered.reconciliation_status ===
                                                'balanced'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            data-testid="registered-reconciliation-status"
                                            data-differs={
                                                statusDiffers
                                                    ? 'true'
                                                    : undefined
                                            }
                                            className={cn(
                                                statusDiffers &&
                                                    'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100',
                                            )}
                                        >
                                            {statusLabel(
                                                registered.reconciliation_status,
                                            )}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {registered ? (
                                    <div className="space-y-4">
                                        <p
                                            className="text-muted-foreground text-sm"
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
                                            changedKeys={changedKeys}
                                        />
                                    </div>
                                ) : (
                                    <p
                                        className="text-muted-foreground text-sm"
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
                                        className="text-muted-foreground text-sm"
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
                        <>
                            {hasDifferences && (
                                <Alert
                                    variant="warning"
                                    data-testid="overwrite-figures-differ-warning"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        {differenceSummary}. Highlighted amounts
                                        will replace the registered balance.
                                    </AlertDescription>
                                </Alert>
                            )}
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
                                        changedKeys={changedKeys}
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
                                        changedKeys={changedKeys}
                                        deltas={deltas}
                                    />
                                </div>
                            </div>
                        </>
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
            titleKey: 'nav.periodBalances',
            href: '/period-balances',
        },
    ],
};

import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatPeriod, generatePeriods } from '@/lib/periods';
import { formatDisplayCurrency } from '@/lib/currency';
import { PageTitle } from '@/components/page-title';
import {
    ArrowLeftRight,
    CalendarRange,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';

interface PeriodSummary {
    period: string;
    total_income_cad: number;
    total_expenses_cad: number;
    net_cad: number;
    total_assets_cad: number;
    total_liabilities_cad: number;
    equity_cad: number;
}

interface ComparisonMetric {
    key: string;
    label: string;
    period_a_cad: number;
    period_b_cad: number;
    difference_cad: number;
    percent_change: number | null;
}

interface ComparisonData {
    period_a: string;
    period_b: string;
    period_a_summary: PeriodSummary;
    period_b_summary: PeriodSummary;
    metrics: ComparisonMetric[];
}

function formatCad(value: number): string {
    return formatDisplayCurrency(value, 'CAD');
}

function formatPercent(value: number | null): string {
    if (value === null) {
        return '—';
    }
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

function differenceTone(difference: number): string {
    if (difference > 0.005) {
        return 'text-emerald-700 dark:text-emerald-400';
    }
    if (difference < -0.005) {
        return 'text-rose-700 dark:text-rose-400';
    }
    return 'text-stone-600 dark:text-stone-400';
}

function differenceBackground(difference: number): string {
    if (difference > 0.005) {
        return 'bg-emerald-50 dark:bg-emerald-950/40';
    }
    if (difference < -0.005) {
        return 'bg-rose-50 dark:bg-rose-950/40';
    }
    return 'bg-stone-50 dark:bg-stone-900/40';
}

function readQueryParam(key: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return new URLSearchParams(window.location.search).get(key);
}

export default function PeriodComparison() {
    const periods = useMemo(() => generatePeriods(), []);
    const [periodA, setPeriodA] = useState(
        () => readQueryParam('period_a') ?? '202501',
    );
    const [periodB, setPeriodB] = useState(
        () => readQueryParam('period_b') ?? '202502',
    );
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const syncUrl = useCallback((nextA: string, nextB: string) => {
        router.get(
            '/periods/compare',
            { period_a: nextA, period_b: nextB },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/periods/compare?period_a=${periodA}&period_b=${periodB}`,
                );
                if (!response.ok) {
                    throw new Error('Failed to load period comparison');
                }
                const payload = await response.json();
                setComparison(payload.data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load period comparison',
                );
                setComparison(null);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [periodA, periodB]);

    const handlePeriodAChange = (value: string) => {
        setPeriodA(value);
        syncUrl(value, periodB);
    };

    const handlePeriodBChange = (value: string) => {
        setPeriodB(value);
        syncUrl(periodA, value);
    };

    const swapPeriods = () => {
        const nextA = periodB;
        const nextB = periodA;
        setPeriodA(nextA);
        setPeriodB(nextB);
        syncUrl(nextA, nextB);
    };

    return (
        <>
            <Head title="Period Comparison" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <PageTitle
                            title="Period Comparison"
                            description="Compare income, expenses, and balances for two periods side-by-side"
                            data-testid="period-comparison-heading"
                        />
                        <Button variant="outline" asChild>
                            <Link href="/periods/history">
                                <CalendarRange className="mr-2 h-4 w-4" />
                                Periods History
                            </Link>
                        </Button>
                    </div>

                    <Card className="mb-6" data-testid="period-comparison-controls">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Select periods
                            </CardTitle>
                            <CardDescription>
                                Choose two months to compare. Differences are
                                highlighted relative to the first period.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="period-a-select">
                                        First period
                                    </Label>
                                    <Select
                                        value={periodA}
                                        onValueChange={handlePeriodAChange}
                                    >
                                        <SelectTrigger
                                            id="period-a-select"
                                            data-testid="period-a-select"
                                        >
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((period) => (
                                                <SelectItem
                                                    key={`a-${period}`}
                                                    value={period}
                                                >
                                                    {formatPeriod(period)} ({period})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={swapPeriods}
                                    data-testid="swap-periods-button"
                                    aria-label="Swap periods"
                                    className="shrink-0"
                                >
                                    <ArrowLeftRight className="h-4 w-4" />
                                </Button>

                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="period-b-select">
                                        Second period
                                    </Label>
                                    <Select
                                        value={periodB}
                                        onValueChange={handlePeriodBChange}
                                    >
                                        <SelectTrigger
                                            id="period-b-select"
                                            data-testid="period-b-select"
                                        >
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((period) => (
                                                <SelectItem
                                                    key={`b-${period}`}
                                                    value={period}
                                                >
                                                    {formatPeriod(period)} ({period})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !comparison ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : comparison ? (
                        <>
                            <div
                                className="mb-6 grid gap-4 md:grid-cols-2"
                                data-testid="period-comparison-summary-cards"
                            >
                                <Card data-testid="period-a-summary-card">
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            First period
                                        </CardDescription>
                                        <CardTitle
                                            className="text-xl"
                                            data-testid="period-a-label"
                                        >
                                            {formatPeriod(comparison.period_a)}{' '}
                                            ({comparison.period_a})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Income</span>
                                            <span data-testid="period-a-income">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .total_income_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Expenses</span>
                                            <span data-testid="period-a-expenses">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .total_expenses_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span>Net</span>
                                            <span data-testid="period-a-net">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .net_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="border-t border-stone-200 pt-2 dark:border-stone-700" />
                                        <div className="flex justify-between">
                                            <span>Assets</span>
                                            <span data-testid="period-a-assets">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .total_assets_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Liabilities</span>
                                            <span data-testid="period-a-liabilities">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .total_liabilities_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span>Equity</span>
                                            <span data-testid="period-a-equity">
                                                {formatCad(
                                                    comparison.period_a_summary
                                                        .equity_cad,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card data-testid="period-b-summary-card">
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Second period
                                        </CardDescription>
                                        <CardTitle
                                            className="text-xl"
                                            data-testid="period-b-label"
                                        >
                                            {formatPeriod(comparison.period_b)}{' '}
                                            ({comparison.period_b})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Income</span>
                                            <span data-testid="period-b-income">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .total_income_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Expenses</span>
                                            <span data-testid="period-b-expenses">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .total_expenses_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span>Net</span>
                                            <span data-testid="period-b-net">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .net_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="border-t border-stone-200 pt-2 dark:border-stone-700" />
                                        <div className="flex justify-between">
                                            <span>Assets</span>
                                            <span data-testid="period-b-assets">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .total_assets_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Liabilities</span>
                                            <span data-testid="period-b-liabilities">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .total_liabilities_cad,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span>Equity</span>
                                            <span data-testid="period-b-equity">
                                                {formatCad(
                                                    comparison.period_b_summary
                                                        .equity_cad,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card data-testid="period-comparison-table-card">
                                <CardHeader>
                                    <CardTitle>Side-by-side metrics</CardTitle>
                                    <CardDescription>
                                        Differences and percent change (second
                                        period relative to first)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table
                                        className="w-full min-w-[640px] text-left text-sm"
                                        data-testid="period-comparison-table"
                                    >
                                        <thead>
                                            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-700">
                                                <th className="py-2 pr-3 font-medium">
                                                    Metric
                                                </th>
                                                <th
                                                    className="py-2 px-3 font-medium text-right"
                                                    data-testid="table-header-period-a"
                                                >
                                                    {comparison.period_a}
                                                </th>
                                                <th
                                                    className="py-2 px-3 font-medium text-right"
                                                    data-testid="table-header-period-b"
                                                >
                                                    {comparison.period_b}
                                                </th>
                                                <th className="py-2 px-3 font-medium text-right">
                                                    Change
                                                </th>
                                                <th className="py-2 pl-3 font-medium text-right">
                                                    %
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparison.metrics.map((metric) => (
                                                <tr
                                                    key={metric.key}
                                                    className={`border-b border-stone-100 dark:border-stone-800 ${differenceBackground(metric.difference_cad)}`}
                                                    data-testid={`comparison-row-${metric.key}`}
                                                    data-difference={
                                                        metric.difference_cad
                                                    }
                                                >
                                                    <td className="py-3 pr-3 font-medium">
                                                        {metric.label}
                                                    </td>
                                                    <td
                                                        className="py-3 px-3 text-right tabular-nums"
                                                        data-testid={`comparison-${metric.key}-period-a`}
                                                    >
                                                        {formatCad(
                                                            metric.period_a_cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="py-3 px-3 text-right tabular-nums"
                                                        data-testid={`comparison-${metric.key}-period-b`}
                                                    >
                                                        {formatCad(
                                                            metric.period_b_cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`py-3 px-3 text-right tabular-nums font-medium ${differenceTone(metric.difference_cad)}`}
                                                        data-testid={`comparison-${metric.key}-difference`}
                                                    >
                                                        <span className="inline-flex items-center justify-end gap-1">
                                                            {metric.difference_cad >
                                                            0.005 ? (
                                                                <TrendingUp className="h-3.5 w-3.5" />
                                                            ) : metric.difference_cad <
                                                              -0.005 ? (
                                                                <TrendingDown className="h-3.5 w-3.5" />
                                                            ) : null}
                                                            {metric.difference_cad >
                                                            0
                                                                ? '+'
                                                                : ''}
                                                            {formatCad(
                                                                metric.difference_cad,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={`py-3 pl-3 text-right tabular-nums ${differenceTone(metric.difference_cad)}`}
                                                        data-testid={`comparison-${metric.key}-percent`}
                                                    >
                                                        {formatPercent(
                                                            metric.percent_change,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}

PeriodComparison.layout = {
    breadcrumbs: [
        {
            title: 'Period Comparison',
            href: '/periods/compare',
        },
    ],
};

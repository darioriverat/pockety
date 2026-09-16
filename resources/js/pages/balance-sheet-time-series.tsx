import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
import {
    ChartAxisLabels,
    CHART_PADDING_WITH_AXIS_LABELS,
} from '@/components/charts/chart-axis-labels';
import { CHART_COLORS } from '@/lib/chart-colors';
import { formatCurrencyAmount } from '@/lib/currency';
import {
    ArrowLeft,
    LineChart,
    TrendingUp,
    XCircle,
} from 'lucide-react';

interface CurrencyTotals {
    cad: number;
    usd: number;
    cop: number;
}

interface TimeSeriesPeriod {
    period: string;
    total_assets: CurrencyTotals;
    total_liabilities: CurrencyTotals;
    equity: CurrencyTotals;
}

interface TimeSeriesData {
    from: string;
    to: string;
    periods: TimeSeriesPeriod[];
}

function formatPeriod(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function formatCad(value: number | null | undefined): string {
    return formatCurrencyAmount(value, 'CAD');
}

function TrendChart({ periods }: { periods: TimeSeriesPeriod[] }) {
    const width = 900;
    const height = 300;
    const padding = CHART_PADDING_WITH_AXIS_LABELS;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const values = periods.flatMap((p) => [
        p.total_assets.cad,
        p.total_liabilities.cad,
        p.equity.cad,
    ]);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(...values, 1);
    const range = maxValue - minValue || 1;

    const xFor = (index: number) =>
        padding.left +
        (periods.length <= 1
            ? innerWidth / 2
            : (index / (periods.length - 1)) * innerWidth);
    const yFor = (value: number) =>
        padding.top + ((maxValue - value) / range) * innerHeight;

    const buildPath = (selector: (p: TimeSeriesPeriod) => number) =>
        periods
            .map((period, index) => {
                const x = xFor(index);
                const y = yFor(selector(period));
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minValue + range * t);

    const labelStep = Math.max(1, Math.ceil(periods.length / 8));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Balance sheet trend chart"
            data-testid="time-series-chart"
            className="h-auto w-full"
        >
            <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="transparent"
            />
            {yTicks.map((tick) => {
                const y = yFor(tick);
                return (
                    <g key={tick}>
                        <line
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity={0.12}
                        />
                        <text
                            x={padding.left - 8}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-muted-foreground"
                            fontSize="11"
                        >
                            {new Intl.NumberFormat('en-CA', {
                                notation: 'compact',
                                maximumFractionDigits: 1,
                            }).format(tick)}
                        </text>
                    </g>
                );
            })}
            <path
                d={buildPath((p) => p.total_assets.cad)}
                fill="none"
                stroke={CHART_COLORS.assets}
                strokeWidth="2.5"
                data-testid="chart-line-assets"
            />
            <path
                d={buildPath((p) => p.total_liabilities.cad)}
                fill="none"
                stroke={CHART_COLORS.liabilities}
                strokeWidth="2.5"
                data-testid="chart-line-liabilities"
            />
            <path
                d={buildPath((p) => p.equity.cad)}
                fill="none"
                stroke={CHART_COLORS.equity}
                strokeWidth="2.5"
                data-testid="chart-line-equity"
            />
            {periods.map((period, index) =>
                index % labelStep === 0 || index === periods.length - 1 ? (
                    <text
                        key={period.period}
                        x={xFor(index)}
                        y={height - padding.bottom + 16}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        fontSize="11"
                    >
                        {formatPeriod(period.period)}
                    </text>
                ) : null,
            )}
            <ChartAxisLabels
                width={width}
                height={height}
                padding={padding}
                xLabel="Period"
                yLabel="Amount (CAD)"
                testIdPrefix="time-series-chart"
            />
        </svg>
    );
}

export default function BalanceSheetTimeSeries() {
    const [series, setSeries] = useState<TimeSeriesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    '/api/balance-sheet/time-series?from=202501&to=202609',
                );
                if (!response.ok) {
                    throw new Error('Failed to load balance sheet time series');
                }
                const payload = await response.json();
                setSeries(payload.data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load balance sheet time series',
                );
                setSeries(null);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    const changeSummary = useMemo(() => {
        if (!series || series.periods.length < 2) {
            return null;
        }
        const first = series.periods[0];
        const last = series.periods[series.periods.length - 1];
        return {
            assets: last.total_assets.cad - first.total_assets.cad,
            liabilities:
                last.total_liabilities.cad - first.total_liabilities.cad,
            equity: last.equity.cad - first.equity.cad,
            firstPeriod: first.period,
            lastPeriod: last.period,
        };
    }, [series]);

    return (
        <>
            <Head title="Balance Sheet Time Series" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Balance Sheet Time Series
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Historical Assets, Liabilities, and Equity from
                                January 2025 through September 2026 (Estado
                                Financiero)
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/balance-sheet">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Period view
                            </Link>
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !series ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : (
                        <>
                            <div
                                className="mb-6 grid gap-4 sm:grid-cols-3"
                                data-testid="time-series-summary"
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Periods covered
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="period-count"
                                        >
                                            {series?.periods.length ?? 0}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        {series
                                            ? `${formatPeriod(series.from)} → ${formatPeriod(series.to)}`
                                            : '—'}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Equity change
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="equity-change"
                                        >
                                            {changeSummary
                                                ? formatCad(
                                                      changeSummary.equity,
                                                  )
                                                : '—'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        {changeSummary
                                            ? `${formatPeriod(changeSummary.firstPeriod)} → ${formatPeriod(changeSummary.lastPeriod)}`
                                            : 'Need at least two periods'}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Assets / Liabilities change
                                        </CardDescription>
                                        <CardTitle className="text-lg">
                                            <span data-testid="assets-change">
                                                {changeSummary
                                                    ? formatCad(
                                                          changeSummary.assets,
                                                      )
                                                    : '—'}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        Liabilities:{' '}
                                        <span data-testid="liabilities-change">
                                            {changeSummary
                                                ? formatCad(
                                                      changeSummary.liabilities,
                                                  )
                                                : '—'}
                                        </span>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LineChart className="h-5 w-5" />
                                        Trend chart (CAD)
                                    </CardTitle>
                                    <CardDescription
                                        data-testid="time-series-chart-legend"
                                        role="list"
                                        aria-label="Balance sheet chart legend"
                                    >
                                        <span
                                            className="mr-3 inline-flex items-center gap-1"
                                            role="listitem"
                                        >
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        CHART_COLORS.assets,
                                                }}
                                            />
                                            Assets
                                        </span>
                                        <span
                                            className="mr-3 inline-flex items-center gap-1"
                                            role="listitem"
                                        >
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        CHART_COLORS.liabilities,
                                                }}
                                            />
                                            Liabilities
                                        </span>
                                        <span
                                            className="inline-flex items-center gap-1"
                                            role="listitem"
                                        >
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        CHART_COLORS.equity,
                                                }}
                                            />
                                            Equity
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {series && series.periods.length > 0 ? (
                                        <TrendChart periods={series.periods} />
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            No period data available.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Historical balance sheet
                                    </CardTitle>
                                    <CardDescription>
                                        Assets, Liabilities, and Equity by
                                        period (CAD)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table
                                        className="w-full text-sm"
                                        data-testid="time-series-table"
                                    >
                                        <thead>
                                            <tr className="border-b text-left text-gray-500">
                                                <th className="py-2 pr-4 font-medium">
                                                    Period
                                                </th>
                                                <th className="py-2 pr-4 text-right font-medium">
                                                    Assets
                                                </th>
                                                <th className="py-2 pr-4 text-right font-medium">
                                                    Liabilities
                                                </th>
                                                <th className="py-2 text-right font-medium">
                                                    Equity
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {series?.periods.map((row) => (
                                                <tr
                                                    key={row.period}
                                                    className="border-b border-gray-100 dark:border-gray-800"
                                                    data-testid={`time-series-row-${row.period}`}
                                                >
                                                    <td className="py-2 pr-4 font-medium">
                                                        {formatPeriod(
                                                            row.period,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="py-2 pr-4 text-right"
                                                        data-testid={`assets-${row.period}`}
                                                    >
                                                        {formatCad(
                                                            row.total_assets
                                                                .cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="py-2 pr-4 text-right"
                                                        data-testid={`liabilities-${row.period}`}
                                                    >
                                                        {formatCad(
                                                            row
                                                                .total_liabilities
                                                                .cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="py-2 text-right font-medium"
                                                        data-testid={`equity-${row.period}`}
                                                    >
                                                        {formatCad(
                                                            row.equity.cad,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

BalanceSheetTimeSeries.layout = {
    breadcrumbs: [
        {
            title: 'Balance Sheet',
            href: '/balance-sheet',
        },
        {
            title: 'Time Series',
            href: '/balance-sheet/time-series',
        },
    ],
};

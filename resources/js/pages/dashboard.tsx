import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard } from '@/routes';
import {
    TrendingUpIcon,
    TrendingDownIcon,
    WalletIcon,
    CreditCardIcon,
    ScaleIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    LineChart,
    PieChartIcon,
    ActivityIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardSummary {
    period: string;
    total_income_cad: number;
    total_expenses_cad: number;
    net_cad: number;
    total_assets_cad: number;
    total_liabilities_cad: number;
    equity_cad: number;
    reconciliation_status: 'balanced' | 'unbalanced';
    reconciliation_summary: {
        balanced_count: number;
        unbalanced_count: number;
        total_count: number;
    };
}

interface IncomeExpensePeriod {
    period: string;
    income_cad: number;
    expenses_cad: number;
}

interface IncomeExpenseChart {
    months: number;
    from: string;
    to: string;
    periods: IncomeExpensePeriod[];
}

interface AssetsLiabilitiesPeriod {
    period: string;
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
}

interface AssetsLiabilitiesChart {
    months: number;
    from: string;
    to: string;
    periods: AssetsLiabilitiesPeriod[];
}

interface TopSpendingCategory {
    category_id: number;
    category_code: string;
    category_name_es: string;
    category_name_en: string;
    amount_cad: number;
    percentage: number;
    transaction_count: number;
}

interface TopSpendingCategories {
    period: string;
    limit: number;
    total_expenses_cad: number;
    categories: TopSpendingCategory[];
}

interface RecentActivityItem {
    id: number;
    type: 'expense' | 'income';
    date: string;
    period: string;
    summary: string;
    amount_cad: number | null;
    amount_usd: number | null;
    amount_cop: number | null;
    category_code: string | null;
    category_name_en: string | null;
    category_name_es: string | null;
    account_name: string | null;
    comments: string | null;
    detail_url: string;
}

interface RecentActivity {
    limit: number;
    items: RecentActivityItem[];
}

interface DashboardProps {
    summary: DashboardSummary;
    income_expense_chart: IncomeExpenseChart;
    assets_liabilities_chart: AssetsLiabilitiesChart;
    top_spending_categories: TopSpendingCategories;
    recent_activity: RecentActivity;
}

function formatPeriodShort(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
}

function formatCadCompact(amount: number): string {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0,
    }).format(amount);
}

function IncomeExpenseTrendChart({
    chart,
}: {
    chart: IncomeExpenseChart;
}) {
    const width = 900;
    const height = 280;
    const padding = { top: 24, right: 24, bottom: 40, left: 64 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const periods = chart.periods;

    const values = periods.flatMap((p) => [p.income_cad, p.expenses_cad]);
    const maxValue = Math.max(...values, 1);
    const minValue = 0;
    const range = maxValue - minValue || 1;

    const groupWidth = periods.length > 0 ? innerWidth / periods.length : innerWidth;
    const barWidth = Math.max(4, Math.min(18, groupWidth * 0.32));
    const gap = 4;

    const xForGroup = (index: number) =>
        padding.left + index * groupWidth + groupWidth / 2;
    const yFor = (value: number) =>
        padding.top + ((maxValue - value) / range) * innerHeight;
    const barHeight = (value: number) =>
        Math.max(0, ((value - minValue) / range) * innerHeight);

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minValue + range * t);
    const labelStep = Math.max(1, Math.ceil(periods.length / 8));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Income versus expenses chart for the last 12 months"
            data-testid="income-expense-chart"
            className="h-auto w-full"
        >
            <rect x={0} y={0} width={width} height={height} fill="transparent" />
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
            {periods.map((period, index) => {
                const centerX = xForGroup(index);
                const incomeX = centerX - barWidth - gap / 2;
                const expenseX = centerX + gap / 2;
                const incomeH = barHeight(period.income_cad);
                const expenseH = barHeight(period.expenses_cad);

                return (
                    <g key={period.period} data-testid={`chart-period-${period.period}`}>
                        <rect
                            x={incomeX}
                            y={yFor(period.income_cad)}
                            width={barWidth}
                            height={incomeH}
                            fill="#16a34a"
                            rx={2}
                            data-testid={`chart-bar-income-${period.period}`}
                        >
                            <title>
                                {formatPeriodShort(period.period)} Income:{' '}
                                {period.income_cad.toFixed(2)} CAD
                            </title>
                        </rect>
                        <rect
                            x={expenseX}
                            y={yFor(period.expenses_cad)}
                            width={barWidth}
                            height={expenseH}
                            fill="#dc2626"
                            rx={2}
                            data-testid={`chart-bar-expenses-${period.period}`}
                        >
                            <title>
                                {formatPeriodShort(period.period)} Expenses:{' '}
                                {period.expenses_cad.toFixed(2)} CAD
                            </title>
                        </rect>
                        {(index % labelStep === 0 ||
                            index === periods.length - 1) && (
                            <text
                                x={centerX}
                                y={height - 12}
                                textAnchor="middle"
                                className="fill-muted-foreground"
                                fontSize="11"
                            >
                                {formatPeriodShort(period.period)}
                            </text>
                        )}
                    </g>
                );
            })}
            {/* Line overlays for trend readability */}
            <path
                d={periods
                    .map((period, index) => {
                        const x = xForGroup(index);
                        const y = yFor(period.income_cad);
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                fill="none"
                stroke="#15803d"
                strokeWidth="2"
                strokeOpacity={0.55}
                data-testid="chart-line-income"
            />
            <path
                d={periods
                    .map((period, index) => {
                        const x = xForGroup(index);
                        const y = yFor(period.expenses_cad);
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                fill="none"
                stroke="#b91c1c"
                strokeWidth="2"
                strokeOpacity={0.55}
                data-testid="chart-line-expenses"
            />
        </svg>
    );
}

function AssetsLiabilitiesTrendChart({
    chart,
}: {
    chart: AssetsLiabilitiesChart;
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const width = 900;
    const height = 300;
    const padding = { top: 24, right: 24, bottom: 40, left: 64 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const periods = chart.periods;

    const values = periods.flatMap((p) => [
        p.assets_cad,
        p.liabilities_cad,
        p.equity_cad,
    ]);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(0, ...values);
    const range = maxValue - minValue || 1;

    const groupWidth = periods.length > 0 ? innerWidth / periods.length : innerWidth;
    const xFor = (index: number) =>
        padding.left + index * groupWidth + groupWidth / 2;
    const yFor = (value: number) =>
        padding.top + ((maxValue - value) / range) * innerHeight;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minValue + range * t);
    const labelStep = Math.max(1, Math.ceil(periods.length / 8));
    const hovered = hoveredIndex !== null ? periods[hoveredIndex] : null;

    const buildPath = (selector: (p: AssetsLiabilitiesPeriod) => number) =>
        periods
            .map((period, index) => {
                const x = xFor(index);
                const y = yFor(selector(period));
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');

    return (
        <div className="relative" data-testid="assets-liabilities-chart-wrap">
            {hovered && hoveredIndex !== null && (
                <div
                    className="pointer-events-none absolute z-10 rounded-md border bg-background px-3 py-2 text-xs shadow-md"
                    data-testid="assets-liabilities-hover-tooltip"
                    style={{
                        left: `${Math.min(92, Math.max(8, (xFor(hoveredIndex) / width) * 100))}%`,
                        top: 8,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <p className="font-medium">
                        {formatPeriodShort(hovered.period)}
                    </p>
                    <p className="text-teal-700 dark:text-teal-400">
                        Assets: {formatCadCompact(hovered.assets_cad)}
                    </p>
                    <p className="text-amber-700 dark:text-amber-400">
                        Liabilities: {formatCadCompact(hovered.liabilities_cad)}
                    </p>
                    <p className="text-blue-700 dark:text-blue-400">
                        Equity: {formatCadCompact(hovered.equity_cad)}
                    </p>
                </div>
            )}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Assets versus liabilities and equity chart for the last 12 months"
                data-testid="assets-liabilities-chart"
                className="h-auto w-full"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <rect x={0} y={0} width={width} height={height} fill="transparent" />
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
                    d={buildPath((p) => p.assets_cad)}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="2.5"
                    data-testid="al-chart-line-assets"
                />
                <path
                    d={buildPath((p) => p.liabilities_cad)}
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="2.5"
                    data-testid="al-chart-line-liabilities"
                />
                <path
                    d={buildPath((p) => p.equity_cad)}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="2.5"
                    data-testid="al-chart-line-equity"
                />
                {periods.map((period, index) => {
                    const x = xFor(index);
                    const isHovered = hoveredIndex === index;

                    return (
                        <g
                            key={period.period}
                            data-testid={`al-chart-period-${period.period}`}
                        >
                            <circle
                                cx={x}
                                cy={yFor(period.assets_cad)}
                                r={isHovered ? 5 : 3}
                                fill="#0f766e"
                                data-testid={`al-chart-point-assets-${period.period}`}
                            />
                            <circle
                                cx={x}
                                cy={yFor(period.liabilities_cad)}
                                r={isHovered ? 5 : 3}
                                fill="#b45309"
                                data-testid={`al-chart-point-liabilities-${period.period}`}
                            />
                            <circle
                                cx={x}
                                cy={yFor(period.equity_cad)}
                                r={isHovered ? 5 : 3}
                                fill="#1d4ed8"
                                data-testid={`al-chart-point-equity-${period.period}`}
                            />
                            <rect
                                x={x - groupWidth / 2}
                                y={padding.top}
                                width={groupWidth}
                                height={innerHeight}
                                fill="transparent"
                                className="cursor-crosshair"
                                data-testid={`al-chart-hit-${period.period}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                            >
                                <title>
                                    {formatPeriodShort(period.period)} — Assets:{' '}
                                    {period.assets_cad.toFixed(2)} CAD,
                                    Liabilities:{' '}
                                    {period.liabilities_cad.toFixed(2)} CAD,
                                    Equity: {period.equity_cad.toFixed(2)} CAD
                                </title>
                            </rect>
                            {(index % labelStep === 0 ||
                                index === periods.length - 1) && (
                                <text
                                    x={x}
                                    y={height - 12}
                                    textAnchor="middle"
                                    className="fill-muted-foreground"
                                    fontSize="11"
                                >
                                    {formatPeriodShort(period.period)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

const TOP_SPENDING_BAR_COLORS = [
    '#0f766e', // teal-700
    '#1d4ed8', // blue-700
    '#b45309', // amber-700
    '#be123c', // rose-700
    '#047857', // emerald-700
    '#0369a1', // sky-700
    '#a16207', // yellow-700
    '#9a3412', // orange-800
    '#334155', // slate-700
    '#115e59', // teal-800
];

function TopSpendingCategoriesWidget({
    data,
    formatCurrency,
}: {
    data: TopSpendingCategories;
    formatCurrency: (amount: number) => string;
}) {
    const maxAmount = Math.max(
        ...data.categories.map((category) => category.amount_cad),
        1,
    );

    return (
        <Card data-testid="top-spending-categories-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Top Spending Categories
                </CardTitle>
                <CardDescription data-testid="top-spending-categories-subtitle">
                    Top {data.categories.length} categories for the selected period · CAD
                    {data.total_expenses_cad > 0
                        ? ` · Total ${formatCurrency(data.total_expenses_cad)}`
                        : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.categories.length === 0 ? (
                    <p
                        className="text-muted-foreground text-sm"
                        data-testid="top-spending-categories-empty"
                    >
                        No spending recorded for this period.
                    </p>
                ) : (
                    <div
                        className="space-y-3"
                        data-testid="top-spending-categories-list"
                        role="list"
                        aria-label="Top spending categories"
                    >
                        {data.categories.map((category, index) => {
                            const barWidth = Math.max(
                                4,
                                (category.amount_cad / maxAmount) * 100,
                            );
                            const color =
                                TOP_SPENDING_BAR_COLORS[
                                    index % TOP_SPENDING_BAR_COLORS.length
                                ];

                            return (
                                <div
                                    key={category.category_id}
                                    className="space-y-1.5"
                                    role="listitem"
                                    data-testid={`top-spending-row-${category.category_code}`}
                                >
                                    <div className="flex items-baseline justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                <span className="text-muted-foreground mr-1.5 font-mono text-xs">
                                                    {category.category_code}
                                                </span>
                                                {category.category_name_es} /{' '}
                                                {category.category_name_en}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p
                                                className="text-sm font-semibold tabular-nums"
                                                data-testid={`top-spending-amount-${category.category_code}`}
                                            >
                                                {formatCurrency(category.amount_cad)}
                                            </p>
                                            <p
                                                className="text-muted-foreground text-xs tabular-nums"
                                                data-testid={`top-spending-pct-${category.category_code}`}
                                            >
                                                {category.percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="bg-muted h-2.5 w-full overflow-hidden rounded-sm"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-sm transition-[width]"
                                            data-testid={`top-spending-bar-${category.category_code}`}
                                            style={{
                                                width: `${barWidth}%`,
                                                backgroundColor: color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatActivityAmount(item: RecentActivityItem): string {
    if (item.amount_cad !== null && item.amount_cad !== 0) {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(item.amount_cad);
    }
    if (item.amount_usd !== null && item.amount_usd !== 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(item.amount_usd);
    }
    if (item.amount_cop !== null && item.amount_cop !== 0) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(item.amount_cop);
    }
    return '—';
}

function formatActivityDate(date: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    const [year, month, day] = date.split('-').map((part) => parseInt(part, 10));
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function RecentActivityWidget({ data }: { data: RecentActivity }) {
    return (
        <Card data-testid="recent-activity-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
                <CardDescription data-testid="recent-activity-description">
                    Latest {data.limit} transactions and income changes
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.items.length === 0 ? (
                    <p
                        className="text-muted-foreground text-sm"
                        data-testid="recent-activity-empty"
                    >
                        No recent activity yet. Add a transaction or income
                        line to see it here.
                    </p>
                ) : (
                    <div
                        className="divide-y"
                        role="list"
                        data-testid="recent-activity-list"
                    >
                        {data.items.map((item) => (
                            <a
                                key={`${item.type}-${item.id}`}
                                href={item.detail_url}
                                role="listitem"
                                data-testid={`recent-activity-item-${item.type}-${item.id}`}
                                data-activity-type={item.type}
                                className="hover:bg-muted/50 flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 transition-colors"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={
                                                item.type === 'income'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            data-testid={`recent-activity-type-${item.type}-${item.id}`}
                                        >
                                            {item.type === 'income'
                                                ? 'Income'
                                                : 'Expense'}
                                        </Badge>
                                        <span
                                            className="text-muted-foreground text-xs tabular-nums"
                                            data-testid={`recent-activity-date-${item.type}-${item.id}`}
                                        >
                                            {formatActivityDate(item.date)}
                                        </span>
                                    </div>
                                    <p
                                        className="truncate text-sm font-medium"
                                        data-testid={`recent-activity-summary-${item.type}-${item.id}`}
                                    >
                                        {item.summary}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p
                                        className={`text-sm font-semibold tabular-nums ${
                                            item.type === 'income'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                        data-testid={`recent-activity-amount-${item.type}-${item.id}`}
                                    >
                                        {formatActivityAmount(item)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        View details →
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    summary,
    income_expense_chart,
    assets_liabilities_chart,
    top_spending_categories,
    recent_activity,
}: DashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
        }).format(amount);
    };

    const formatPeriod = (period: string) => {
        const year = period.substring(0, 4);
        const month = period.substring(4, 6);
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const netIsPositive = summary.net_cad >= 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                {/* Period Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Financial overview for {formatPeriod(summary.period)}
                        </p>
                    </div>
                    <Badge variant={summary.reconciliation_status === 'balanced' ? 'default' : 'destructive'}>
                        {summary.reconciliation_status === 'balanced' ? (
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                        ) : (
                            <AlertCircleIcon className="mr-1 h-3 w-3" />
                        )}
                        {summary.reconciliation_status.charAt(0).toUpperCase() + summary.reconciliation_status.slice(1)}
                    </Badge>
                </div>

                {/* Income, Expenses, Net Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                            <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.total_income_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All income sources
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <TrendingDownIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.total_expenses_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All expense categories
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net</CardTitle>
                            <ScaleIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.net_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Income - Expenses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Income vs Expenses Chart */}
                <Card data-testid="income-expense-chart-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChart className="h-5 w-5" />
                            Income vs Expenses
                        </CardTitle>
                        <CardDescription data-testid="income-expense-chart-range">
                            Last {income_expense_chart.months} months (
                            {formatPeriodShort(income_expense_chart.from)} →{' '}
                            {formatPeriodShort(income_expense_chart.to)}) · CAD
                        </CardDescription>
                        <div
                            className="mt-2 flex flex-wrap gap-4 text-sm"
                            data-testid="income-expense-chart-legend"
                            role="list"
                            aria-label="Chart legend"
                        >
                            <span className="inline-flex items-center gap-2" role="listitem">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />
                                Income
                            </span>
                            <span className="inline-flex items-center gap-2" role="listitem">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-600" />
                                Expenses
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {income_expense_chart.periods.length > 0 ? (
                            <IncomeExpenseTrendChart chart={income_expense_chart} />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No period data available for the chart.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Assets, Liabilities, Equity Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                            <WalletIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.total_assets_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                All bank accounts & investments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                            <CreditCardIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.total_liabilities_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Credit cards & loans
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Equity</CardTitle>
                            <ScaleIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(summary.equity_cad)}
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">
                                Assets - Liabilities
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets vs Liabilities Chart */}
                <Card data-testid="assets-liabilities-chart-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChart className="h-5 w-5" />
                            Assets vs Liabilities
                        </CardTitle>
                        <CardDescription data-testid="assets-liabilities-chart-range">
                            Last {assets_liabilities_chart.months} months (
                            {formatPeriodShort(assets_liabilities_chart.from)} →{' '}
                            {formatPeriodShort(assets_liabilities_chart.to)}) · CAD
                        </CardDescription>
                        <div
                            className="mt-2 flex flex-wrap gap-4 text-sm"
                            data-testid="assets-liabilities-chart-legend"
                            role="list"
                            aria-label="Assets liabilities chart legend"
                        >
                            <span className="inline-flex items-center gap-2" role="listitem">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-700" />
                                Assets
                            </span>
                            <span className="inline-flex items-center gap-2" role="listitem">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-700" />
                                Liabilities
                            </span>
                            <span className="inline-flex items-center gap-2" role="listitem">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-700" />
                                Equity
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assets_liabilities_chart.periods.length > 0 ? (
                            <AssetsLiabilitiesTrendChart
                                chart={assets_liabilities_chart}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No period data available for the chart.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Spending Categories */}
                <TopSpendingCategoriesWidget
                    data={top_spending_categories}
                    formatCurrency={formatCurrency}
                />

                {/* Recent Activity Feed */}
                <RecentActivityWidget data={recent_activity} />

                {/* Reconciliation Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ScaleIcon className="h-5 w-5" />
                            Reconciliation Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {summary.reconciliation_summary.balanced_count} of{' '}
                                    {summary.reconciliation_summary.total_count} accounts balanced
                                </p>
                                {summary.reconciliation_summary.unbalanced_count > 0 && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {summary.reconciliation_summary.unbalanced_count} account
                                        {summary.reconciliation_summary.unbalanced_count !== 1 ? 's' : ''} need
                                        {summary.reconciliation_summary.unbalanced_count === 1 ? 's' : ''} attention
                                    </p>
                                )}
                            </div>
                            <a
                                href="/reconciliation"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View Details →
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

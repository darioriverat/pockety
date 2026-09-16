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
import { DashboardSummaryCard } from '@/components/dashboard-summary-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    ChartAxisLabels,
    CHART_PADDING_WITH_AXIS_LABELS,
} from '@/components/charts/chart-axis-labels';
import { CHART_COLORS } from '@/lib/chart-colors';
import {
    amountForCurrency,
    formatDisplayCurrency,
    isDisplayCurrency,
    type DisplayCurrency,
} from '@/lib/currency';

interface DashboardSummary {
    period: string;
    total_income_cad: number;
    total_income_usd: number;
    total_income_cop: number;
    total_expenses_cad: number;
    total_expenses_usd: number;
    total_expenses_cop: number;
    net_cad: number;
    net_usd: number;
    net_cop: number;
    total_assets_cad: number;
    total_assets_usd: number;
    total_assets_cop: number;
    total_liabilities_cad: number;
    total_liabilities_usd: number;
    total_liabilities_cop: number;
    equity_cad: number;
    equity_usd: number;
    equity_cop: number;
    exchange_rates?: {
        usd_cop: number;
        usd_cad: number;
        cad_cop: number;
    };
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
    income_usd: number;
    income_cop: number;
    expenses_cad: number;
    expenses_usd: number;
    expenses_cop: number;
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
    assets_usd: number;
    assets_cop: number;
    liabilities_cad: number;
    liabilities_usd: number;
    liabilities_cop: number;
    equity_cad: number;
    equity_usd: number;
    equity_cop: number;
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
    amount_usd: number;
    amount_cop: number;
    percentage: number;
    transaction_count: number;
}

interface TopSpendingCategories {
    period: string;
    limit: number;
    total_expenses_cad: number;
    total_expenses_usd: number;
    total_expenses_cop: number;
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
    default_currency?: string;
    display_currency?: string;
    available_currencies?: string[];
}

function formatPeriodShort(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
}

function formatCadCompact(amount: number, currency: DisplayCurrency = 'CAD'): string {
    return new Intl.NumberFormat(
        currency === 'USD' ? 'en-US' : 'en-CA',
        {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        },
    ).format(amount);
}

function IncomeExpenseTrendChart({
    chart,
    currency,
}: {
    chart: IncomeExpenseChart;
    currency: DisplayCurrency;
}) {
    const width = 900;
    const height = 300;
    const padding = CHART_PADDING_WITH_AXIS_LABELS;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const periods = chart.periods;

    const values = periods.flatMap((p) => [
        amountForCurrency(p, 'income', currency),
        amountForCurrency(p, 'expenses', currency),
    ]);
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
            aria-label={`Income versus expenses chart for the last 12 months in ${currency}`}
            data-testid="income-expense-chart"
            className="h-auto w-full"
        >
            <rect x={0} y={0} width={width} height={height} fill="transparent" />
            {yTicks.map((tick) => {
                const y = yFor(tick);
                return (
                    <g key={tick} data-testid="income-expense-chart-y-tick">
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
                const incomeValue = amountForCurrency(period, 'income', currency);
                const expenseValue = amountForCurrency(period, 'expenses', currency);
                const incomeH = barHeight(incomeValue);
                const expenseH = barHeight(expenseValue);

                return (
                    <g key={period.period} data-testid={`chart-period-${period.period}`}>
                        <rect
                            x={incomeX}
                            y={yFor(incomeValue)}
                            width={barWidth}
                            height={incomeH}
                            fill={CHART_COLORS.income}
                            rx={2}
                            data-testid={`chart-bar-income-${period.period}`}
                        >
                            <title>
                                {formatPeriodShort(period.period)} Income:{' '}
                                {formatDisplayCurrency(incomeValue, currency)}
                            </title>
                        </rect>
                        <rect
                            x={expenseX}
                            y={yFor(expenseValue)}
                            width={barWidth}
                            height={expenseH}
                            fill={CHART_COLORS.expenses}
                            rx={2}
                            data-testid={`chart-bar-expenses-${period.period}`}
                        >
                            <title>
                                {formatPeriodShort(period.period)} Expenses:{' '}
                                {formatDisplayCurrency(expenseValue, currency)}
                            </title>
                        </rect>
                        {(index % labelStep === 0 ||
                            index === periods.length - 1) && (
                            <text
                                x={centerX}
                                y={height - padding.bottom + 16}
                                textAnchor="middle"
                                className="fill-muted-foreground"
                                fontSize="11"
                                data-testid="income-expense-chart-x-tick"
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
                        const y = yFor(amountForCurrency(period, 'income', currency));
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                fill="none"
                stroke={CHART_COLORS.incomeLine}
                strokeWidth="2"
                strokeOpacity={0.55}
                data-testid="chart-line-income"
            />
            <path
                d={periods
                    .map((period, index) => {
                        const x = xForGroup(index);
                        const y = yFor(amountForCurrency(period, 'expenses', currency));
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                fill="none"
                stroke={CHART_COLORS.expensesLine}
                strokeWidth="2"
                strokeOpacity={0.55}
                data-testid="chart-line-expenses"
            />
            <ChartAxisLabels
                width={width}
                height={height}
                padding={padding}
                xLabel="Period"
                yLabel={`Amount (${currency})`}
                testIdPrefix="income-expense-chart"
            />
        </svg>
    );
}

function AssetsLiabilitiesTrendChart({
    chart,
    currency,
}: {
    chart: AssetsLiabilitiesChart;
    currency: DisplayCurrency;
}) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const width = 900;
    const height = 320;
    const padding = CHART_PADDING_WITH_AXIS_LABELS;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const periods = chart.periods;

    const values = periods.flatMap((p) => [
        amountForCurrency(p, 'assets', currency),
        amountForCurrency(p, 'liabilities', currency),
        amountForCurrency(p, 'equity', currency),
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
                        Assets:{' '}
                        {formatCadCompact(
                            amountForCurrency(hovered, 'assets', currency),
                            currency,
                        )}
                    </p>
                    <p className="text-amber-700 dark:text-amber-400">
                        Liabilities:{' '}
                        {formatCadCompact(
                            amountForCurrency(hovered, 'liabilities', currency),
                            currency,
                        )}
                    </p>
                    <p className="text-blue-700 dark:text-blue-400">
                        Equity:{' '}
                        {formatCadCompact(
                            amountForCurrency(hovered, 'equity', currency),
                            currency,
                        )}
                    </p>
                </div>
            )}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`Assets versus liabilities and equity chart for the last 12 months in ${currency}`}
                data-testid="assets-liabilities-chart"
                className="h-auto w-full"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <rect x={0} y={0} width={width} height={height} fill="transparent" />
                {yTicks.map((tick) => {
                    const y = yFor(tick);
                    return (
                        <g key={tick} data-testid="assets-liabilities-chart-y-tick">
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
                    d={buildPath((p) => amountForCurrency(p, 'assets', currency))}
                    fill="none"
                    stroke={CHART_COLORS.assets}
                    strokeWidth="2.5"
                    data-testid="al-chart-line-assets"
                />
                <path
                    d={buildPath((p) =>
                        amountForCurrency(p, 'liabilities', currency),
                    )}
                    fill="none"
                    stroke={CHART_COLORS.liabilities}
                    strokeWidth="2.5"
                    data-testid="al-chart-line-liabilities"
                />
                <path
                    d={buildPath((p) => amountForCurrency(p, 'equity', currency))}
                    fill="none"
                    stroke={CHART_COLORS.equity}
                    strokeWidth="2.5"
                    data-testid="al-chart-line-equity"
                />
                {periods.map((period, index) => {
                    const x = xFor(index);
                    const isHovered = hoveredIndex === index;
                    const assetsValue = amountForCurrency(period, 'assets', currency);
                    const liabilitiesValue = amountForCurrency(
                        period,
                        'liabilities',
                        currency,
                    );
                    const equityValue = amountForCurrency(period, 'equity', currency);

                    return (
                        <g
                            key={period.period}
                            data-testid={`al-chart-period-${period.period}`}
                        >
                            <circle
                                cx={x}
                                cy={yFor(assetsValue)}
                                r={isHovered ? 5 : 3}
                                fill={CHART_COLORS.assets}
                                data-testid={`al-chart-point-assets-${period.period}`}
                            />
                            <circle
                                cx={x}
                                cy={yFor(liabilitiesValue)}
                                r={isHovered ? 5 : 3}
                                fill={CHART_COLORS.liabilities}
                                data-testid={`al-chart-point-liabilities-${period.period}`}
                            />
                            <circle
                                cx={x}
                                cy={yFor(equityValue)}
                                r={isHovered ? 5 : 3}
                                fill={CHART_COLORS.equity}
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
                                    {formatDisplayCurrency(assetsValue, currency)},
                                    Liabilities:{' '}
                                    {formatDisplayCurrency(liabilitiesValue, currency)},
                                    Equity:{' '}
                                    {formatDisplayCurrency(equityValue, currency)}
                                </title>
                            </rect>
                            {(index % labelStep === 0 ||
                                index === periods.length - 1) && (
                                <text
                                    x={x}
                                    y={height - padding.bottom + 16}
                                    textAnchor="middle"
                                    className="fill-muted-foreground"
                                    fontSize="11"
                                    data-testid="assets-liabilities-chart-x-tick"
                                >
                                    {formatPeriodShort(period.period)}
                                </text>
                            )}
                        </g>
                    );
                })}
                <ChartAxisLabels
                    width={width}
                    height={height}
                    padding={padding}
                    xLabel="Period"
                    yLabel={`Amount (${currency})`}
                    testIdPrefix="assets-liabilities-chart"
                />
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
    currency,
    formatCurrency,
}: {
    data: TopSpendingCategories;
    currency: DisplayCurrency;
    formatCurrency: (amount: number) => string;
}) {
    const maxAmount = Math.max(
        ...data.categories.map((category) =>
            amountForCurrency(category, 'amount', currency),
        ),
        1,
    );
    const totalExpenses = amountForCurrency(data, 'total_expenses', currency);

    return (
        <Card data-testid="top-spending-categories-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Top Spending Categories
                </CardTitle>
                <CardDescription data-testid="top-spending-categories-subtitle">
                    Top {data.categories.length} categories for the selected period ·{' '}
                    {currency}
                    {totalExpenses > 0
                        ? ` · Total ${formatCurrency(totalExpenses)}`
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
                            const amount = amountForCurrency(
                                category,
                                'amount',
                                currency,
                            );
                            const barWidth = Math.max(4, (amount / maxAmount) * 100);
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
                                                {formatCurrency(amount)}
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
        return formatDisplayCurrency(item.amount_cad, 'CAD');
    }
    if (item.amount_usd !== null && item.amount_usd !== 0) {
        return formatDisplayCurrency(item.amount_usd, 'USD');
    }
    if (item.amount_cop !== null && item.amount_cop !== 0) {
        return formatDisplayCurrency(item.amount_cop, 'COP');
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
    default_currency = 'CAD',
    display_currency,
    available_currencies = ['CAD', 'USD', 'COP'],
}: DashboardProps) {
    const initialCurrency: DisplayCurrency = isDisplayCurrency(
        display_currency ?? default_currency,
    )
        ? ((display_currency ?? default_currency) as DisplayCurrency)
        : 'CAD';
    const [currency, setCurrency] = useState<DisplayCurrency>(initialCurrency);

    const formatCurrency = (amount: number) =>
        formatDisplayCurrency(amount, currency);

    const formatPeriod = (period: string) => {
        const year = period.substring(0, 4);
        const month = period.substring(4, 6);
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const netIsPositive = amountForCurrency(summary, 'net', currency) >= 0;

    return (
        <>
            <Head title="Dashboard" />
            <div
                className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6"
                data-testid="dashboard-page"
            >
                {/* Period Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Financial overview for {formatPeriod(summary.period)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div
                            className="flex items-center gap-2"
                            data-testid="currency-toggle"
                        >
                            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                Currency
                            </span>
                            <ToggleGroup
                                type="single"
                                value={currency}
                                onValueChange={(value) => {
                                    if (isDisplayCurrency(value)) {
                                        setCurrency(value);
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                aria-label="Display currency"
                            >
                                {available_currencies.map((code) => (
                                    <ToggleGroupItem
                                        key={code}
                                        value={code}
                                        aria-label={`Show amounts in ${code}`}
                                        data-testid={`currency-toggle-${code.toLowerCase()}`}
                                    >
                                        {code}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                        <Badge
                            variant={
                                summary.reconciliation_status === 'balanced'
                                    ? 'default'
                                    : 'destructive'
                            }
                        >
                            {summary.reconciliation_status === 'balanced' ? (
                                <CheckCircleIcon className="mr-1 h-3 w-3" />
                            ) : (
                                <AlertCircleIcon className="mr-1 h-3 w-3" />
                            )}
                            {summary.reconciliation_status.charAt(0).toUpperCase() +
                                summary.reconciliation_status.slice(1)}
                        </Badge>
                    </div>
                </div>

                {/* Income, Expenses, Net Cards */}
                <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    data-testid="dashboard-summary-cards-income"
                >
                    <DashboardSummaryCard
                        title="Total Income"
                        value={formatCurrency(
                            amountForCurrency(summary, 'total_income', currency),
                        )}
                        description={`All income sources · ${currency}`}
                        icon={TrendingUpIcon}
                        tone="positive"
                        testId="dashboard-card-income"
                        valueTestId="dashboard-total-income"
                    />
                    <DashboardSummaryCard
                        title="Total Expenses"
                        value={formatCurrency(
                            amountForCurrency(summary, 'total_expenses', currency),
                        )}
                        description={`All expense categories · ${currency}`}
                        icon={TrendingDownIcon}
                        tone="negative"
                        testId="dashboard-card-expenses"
                        valueTestId="dashboard-total-expenses"
                    />
                    <DashboardSummaryCard
                        title="Net"
                        value={formatCurrency(
                            amountForCurrency(summary, 'net', currency),
                        )}
                        description={`Income - Expenses · ${currency}`}
                        icon={ScaleIcon}
                        tone={netIsPositive ? 'positive' : 'negative'}
                        testId="dashboard-card-net"
                        valueTestId="dashboard-net"
                        className="sm:col-span-2 lg:col-span-1"
                    />
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
                            {formatPeriodShort(income_expense_chart.to)}) · {currency}
                        </CardDescription>
                        <div
                            className="mt-2 flex flex-wrap gap-4 text-sm"
                            data-testid="income-expense-chart-legend"
                            role="list"
                            aria-label="Chart legend"
                        >
                            <span
                                className="inline-flex items-center gap-2"
                                role="listitem"
                                data-testid="legend-income"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                    style={{ backgroundColor: CHART_COLORS.income }}
                                    data-testid="legend-swatch-income"
                                />
                                Income
                            </span>
                            <span
                                className="inline-flex items-center gap-2"
                                role="listitem"
                                data-testid="legend-expenses"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                    style={{ backgroundColor: CHART_COLORS.expenses }}
                                    data-testid="legend-swatch-expenses"
                                />
                                Expenses
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {income_expense_chart.periods.length > 0 ? (
                            <IncomeExpenseTrendChart
                                chart={income_expense_chart}
                                currency={currency}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No period data available for the chart.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Assets, Liabilities, Equity Cards */}
                <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    data-testid="dashboard-summary-cards-balance"
                >
                    <DashboardSummaryCard
                        title="Total Assets"
                        value={formatCurrency(
                            amountForCurrency(summary, 'total_assets', currency),
                        )}
                        description={`All bank accounts & investments · ${currency}`}
                        icon={WalletIcon}
                        tone="default"
                        testId="dashboard-card-assets"
                        valueTestId="dashboard-total-assets"
                    />
                    <DashboardSummaryCard
                        title="Total Liabilities"
                        value={formatCurrency(
                            amountForCurrency(
                                summary,
                                'total_liabilities',
                                currency,
                            ),
                        )}
                        description={`Credit cards & loans · ${currency}`}
                        icon={CreditCardIcon}
                        tone="warning"
                        testId="dashboard-card-liabilities"
                        valueTestId="dashboard-total-liabilities"
                    />
                    <DashboardSummaryCard
                        title="Equity"
                        value={formatCurrency(
                            amountForCurrency(summary, 'equity', currency),
                        )}
                        description={`Assets - Liabilities · ${currency}`}
                        icon={ScaleIcon}
                        tone="info"
                        testId="dashboard-card-equity"
                        valueTestId="dashboard-equity"
                        className="sm:col-span-2 lg:col-span-1"
                    />
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
                            {formatPeriodShort(assets_liabilities_chart.to)}) · {currency}
                        </CardDescription>
                        <div
                            className="mt-2 flex flex-wrap gap-4 text-sm"
                            data-testid="assets-liabilities-chart-legend"
                            role="list"
                            aria-label="Assets liabilities chart legend"
                        >
                            <span
                                className="inline-flex items-center gap-2"
                                role="listitem"
                                data-testid="legend-assets"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                    style={{ backgroundColor: CHART_COLORS.assets }}
                                    data-testid="legend-swatch-assets"
                                />
                                Assets
                            </span>
                            <span
                                className="inline-flex items-center gap-2"
                                role="listitem"
                                data-testid="legend-liabilities"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                    style={{
                                        backgroundColor: CHART_COLORS.liabilities,
                                    }}
                                    data-testid="legend-swatch-liabilities"
                                />
                                Liabilities
                            </span>
                            <span
                                className="inline-flex items-center gap-2"
                                role="listitem"
                                data-testid="legend-equity"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-sm"
                                    style={{ backgroundColor: CHART_COLORS.equity }}
                                    data-testid="legend-swatch-equity"
                                />
                                Equity
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {assets_liabilities_chart.periods.length > 0 ? (
                            <AssetsLiabilitiesTrendChart
                                chart={assets_liabilities_chart}
                                currency={currency}
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
                    currency={currency}
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

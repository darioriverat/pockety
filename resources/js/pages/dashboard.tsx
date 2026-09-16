import { Head } from '@inertiajs/react';
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

interface DashboardProps {
    summary: DashboardSummary;
    income_expense_chart: IncomeExpenseChart;
}

function formatPeriodShort(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
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

export default function Dashboard({
    summary,
    income_expense_chart,
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

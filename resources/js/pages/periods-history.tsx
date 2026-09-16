import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import { formatDisplayCurrency } from '@/lib/currency';
import { formatPeriod } from '@/lib/periods';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { CalendarRange, Receipt, XCircle, ArrowLeftRight } from 'lucide-react';

interface PeriodSummary {
    period: string;
    transaction_count: number;
    income_total_cad: number;
    expenses_total_cad: number;
}

interface PeriodHistoryData {
    from: string;
    to: string;
    periods: PeriodSummary[];
}

function formatCad(value: number): string {
    return formatDisplayCurrency(value, 'CAD');
}

export default function PeriodsHistory() {
    const [history, setHistory] = useState<PeriodHistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    '/api/periods/history?from=202501&to=202609',
                );
                if (!response.ok) {
                    throw new Error('Failed to load periods history');
                }
                const payload = await response.json();
                setHistory(payload.data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load periods history',
                );
                setHistory(null);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    return (
        <>
            <Head title="Periods History" />

            <PageContainer>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <PageTitle
                            title="Periods History"
                            description="Summary stats for every month from January 2025 through September 2026"
                            data-testid="periods-history-heading"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/periods/compare">
                                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                                    Compare Periods
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/transactions">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Transactions
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !history ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : (
                        <>
                            <div
                                className="mb-6 grid gap-4 sm:grid-cols-3"
                                data-testid="periods-history-summary"
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Periods listed
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="periods-history-count"
                                        >
                                            {history?.periods.length ?? 0}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        {history
                                            ? `${formatPeriod(history.from)} → ${formatPeriod(history.to)}`
                                            : '—'}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Total transactions
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="periods-history-tx-total"
                                        >
                                            {history
                                                ? history.periods.reduce(
                                                      (sum, row) =>
                                                          sum +
                                                          row.transaction_count,
                                                      0,
                                                  )
                                                : 0}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        Across all listed periods
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <CalendarRange className="h-4 w-4" />
                                            Sort order
                                        </CardDescription>
                                        <CardTitle className="text-lg">
                                            Chronological
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                        Oldest period first
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Period summaries</CardTitle>
                                    <CardDescription>
                                        Transaction count, income, and expenses
                                        (CAD) per period
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table
                                        className="w-full min-w-[40rem] border-collapse text-left text-sm"
                                        data-testid="periods-history-table"
                                    >
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                    Period
                                                </th>
                                                <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                    Label
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                                    Transactions
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                                    Income (CAD)
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                                    Expenses (CAD)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(history?.periods ?? []).map(
                                                (row) => (
                                                    <tr
                                                        key={row.period}
                                                        className="border-b border-gray-100 dark:border-gray-800"
                                                        data-testid={`period-row-${row.period}`}
                                                        data-period={row.period}
                                                    >
                                                        <td
                                                            className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100"
                                                            data-testid={`period-code-${row.period}`}
                                                        >
                                                            {row.period}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                            {formatPeriod(
                                                                row.period,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100"
                                                            data-testid={`period-tx-count-${row.period}`}
                                                        >
                                                            {
                                                                row.transaction_count
                                                            }
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100"
                                                            data-testid={`period-income-${row.period}`}
                                                        >
                                                            {formatCad(
                                                                row.income_total_cad,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100"
                                                            data-testid={`period-expenses-${row.period}`}
                                                        >
                                                            {formatCad(
                                                                row.expenses_total_cad,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    )}
            </PageContainer>
        </>
    );
}

PeriodsHistory.layout = {
    breadcrumbs: [
        {
            title: 'Periods History',
            href: '/periods/history',
        },
    ],
};

import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
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
import { usePeriod } from '@/hooks/use-period';
import { formatDisplayCurrency } from '@/lib/currency';
import { formatPeriod, generatePeriods } from '@/lib/periods';
import TextLink from '@/components/text-link';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { ChartColumn, RefreshCw, XCircle } from 'lucide-react';

interface CategoryActualRow {
    category_id: number;
    category_code: string;
    category_name_es: string;
    category_name_en: string;
    is_debt_category: boolean;
    is_income_category?: boolean;
    actual_cad: number;
    transaction_count: number;
}

interface CategoryActualsMeta {
    period: string;
    category_count: number;
    total_actual_cad: number;
    total_transactions: number;
    currency: string;
}

function formatCad(value: number): string {
    return formatDisplayCurrency(value, 'CAD');
}

export default function CategoryActuals() {
    const periods = generatePeriods();
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } =
        usePeriod();
    const [rows, setRows] = useState<CategoryActualRow[]>([]);
    const [meta, setMeta] = useState<CategoryActualsMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(async (period: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/category-actuals?period=${encodeURIComponent(period)}`,
            );
            if (!response.ok) {
                throw new Error('Failed to load category actuals');
            }
            const payload = await response.json();
            setRows(payload.data.categories ?? []);
            setMeta(payload.meta ?? null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load category actuals',
            );
            setRows([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            void fetchReport(selectedPeriod);
        }
    }, [selectedPeriod, fetchReport]);

    return (
        <>
            <Head title="Category Actuals" />

            <PageContainer>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <PageTitle
                            title="Category Actuals"
                            description="Actual spending by category for the selected period, aggregated from the transaction ledger"
                            data-testid="category-actuals-heading"
                        />
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="category-actuals-period">
                                    Period
                                </Label>
                                <Select
                                    value={selectedPeriod}
                                    onValueChange={setSelectedPeriod}
                                >
                                    <SelectTrigger
                                        id="category-actuals-period"
                                        data-testid="page-period-selector"
                                        className="w-[12rem]"
                                    >
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periods.map((period) => (
                                            <SelectItem
                                                key={period}
                                                value={period}
                                            >
                                                {formatPeriod(period)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                data-testid="category-actuals-refresh"
                                onClick={() => {
                                    if (selectedPeriod) {
                                        void fetchReport(selectedPeriod);
                                    }
                                }}
                                disabled={loading || !selectedPeriod}
                            >
                                <RefreshCw className="size-4 shrink-0 fill-none" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div
                        className="mb-6 grid gap-4 sm:grid-cols-3"
                        data-testid="category-actuals-summary"
                    >
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Categories</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-actuals-count"
                                >
                                    {meta?.category_count ?? 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                Active categories (excludes retired)
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>
                                    Total actual (CAD)
                                </CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-actuals-total"
                                >
                                    {formatCad(meta?.total_actual_cad ?? 0)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                Multi-currency folded to CAD
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <ChartColumn className="h-4 w-4" />
                                    Transactions
                                </CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-actuals-tx-total"
                                >
                                    {meta?.total_transactions ?? 0}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
                                In period{' '}
                                {selectedPeriod
                                    ? formatPeriod(selectedPeriod)
                                    : '—'}
                            </CardContent>
                        </Card>
                    </div>

                    {loading && rows.length === 0 ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Actuals by category</CardTitle>
                                <CardDescription>
                                    Totals are computed by querying transactions
                                    for category + period — not hardcoded row
                                    references
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <table
                                    className="w-full min-w-[40rem] border-collapse text-left text-sm"
                                    data-testid="category-actuals-table"
                                >
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                Code
                                            </th>
                                            <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                Category
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                                Transactions
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                                Actual (CAD)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr
                                                key={row.category_code}
                                                className="border-b border-gray-100 dark:border-gray-800"
                                                data-testid={`category-actual-row-${row.category_code}`}
                                                data-category-code={
                                                    row.category_code
                                                }
                                            >
                                                <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">
                                                    <TextLink
                                                        href={`/transactions?period=${selectedPeriod}&category=${row.category_code}`}
                                                        className="font-mono"
                                                        data-testid={`category-actual-link-${row.category_code}`}
                                                    >
                                                        {row.category_code}
                                                    </TextLink>
                                                </td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {row.category_name_es}
                                                    </span>
                                                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                                                        {row.category_name_en}
                                                    </span>
                                                </td>
                                                <td
                                                    className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100"
                                                    data-testid={`category-actual-tx-${row.category_code}`}
                                                >
                                                    {row.transaction_count}
                                                </td>
                                                <td
                                                    className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100"
                                                    data-testid={`category-actual-amount-${row.category_code}`}
                                                >
                                                    {formatCad(row.actual_cad)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
            </PageContainer>
        </>
    );
}

CategoryActuals.layout = {
    breadcrumbs: [
        {
            title: 'Category Actuals',
            href: '/category-actuals',
        },
    ],
};

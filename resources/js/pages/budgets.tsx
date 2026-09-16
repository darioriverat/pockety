import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePeriod } from '@/hooks/use-period';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { formatCurrencyAmount } from '@/lib/currency';
import { formatPeriod, generatePeriods } from '@/lib/periods';
import {
    CheckCircle,
    XCircle,
    PiggyBank,
    TrendingUp,
    AlertTriangle,
    Download,
} from 'lucide-react';

interface CategoryOption {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
}

interface BudgetRow {
    category_id: number;
    category_code: string;
    category_name_es: string;
    category_name_en: string;
    budget_cad: number | null;
    actual_cad: number;
    variance_cad: number | null;
    percentage: number | null;
    is_over_budget: boolean;
}

interface ReportTotals {
    budget_cad: number;
    actual_cad: number;
    variance_cad: number;
}

function formatCad(value: number | null | undefined): string {
    return formatCurrencyAmount(value, 'CAD');
}

export default function Budgets() {
    const periods = generatePeriods();
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } =
        usePeriod();
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [selectedCategoryCode, setSelectedCategoryCode] =
        useState<string>('');
    const [amountCad, setAmountCad] = useState<string>('800');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [reportRows, setReportRows] = useState<BudgetRow[]>([]);
    const [totals, setTotals] = useState<ReportTotals | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            fetchReport(selectedPeriod);
        }
    }, [selectedPeriod]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories', {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();
            const items: CategoryOption[] = Array.isArray(data.data)
                ? data.data
                : [];
            setCategories(items);
            if (items.length > 0 && !selectedCategoryCode) {
                const mercado = items.find((c) => c.code === 'C001');
                setSelectedCategoryCode(mercado?.code ?? items[0].code);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchReport = async (period: string) => {
        setLoadingReport(true);
        setReportError(null);
        try {
            const response = await fetch(
                `/api/budgets/report?period=${encodeURIComponent(period)}`,
                { headers: { Accept: 'application/json' } },
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load report');
            }
            setReportRows(Array.isArray(data.data) ? data.data : []);
            setTotals(data.meta?.totals ?? null);
        } catch (err) {
            setReportError(
                err instanceof Error ? err.message : 'An error occurred',
            );
            setReportRows([]);
            setTotals(null);
        } finally {
            setLoadingReport(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const amount = parseFloat(amountCad);
        if (!selectedCategoryCode) {
            setSaveError('Please select a category');
            setSaving(false);
            return;
        }
        if (Number.isNaN(amount) || amount <= 0) {
            setSaveError('Budget amount must be a positive number');
            setSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    period: selectedPeriod,
                    category_code: selectedCategoryCode,
                    amount_cad: amount,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const message = data.messages
                    ? Object.values(data.messages).flat().join(' ')
                    : data.message ||
                      data.errors?.amount_cad?.[0] ||
                      'Failed to save budget';
                throw new Error(message);
            }

            setSaveSuccess(true);
            await fetchReport(selectedPeriod);
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const url = `/api/budgets/report/export?period=${encodeURIComponent(selectedPeriod)}`;
        window.location.href = url;
    };

    const rowsWithBudget = reportRows.filter((row) => row.budget_cad !== null);
    const overBudgetCount = reportRows.filter((row) => row.is_over_budget).length;

    return (
        <>
            <Head title="Budgets" />

            <PageContainer>
                    <div className="mb-8">
                        <PageTitle
                            title="Budgets"
                            description="Set monthly category budgets and compare against actual spending (CAD equivalent)"
                        />
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Budget</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="budget-total"
                                >
                                    {formatCad(totals?.budget_cad ?? 0)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Actual</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="actual-total"
                                >
                                    {formatCad(totals?.actual_cad ?? 0)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Over Budget</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="over-budget-count"
                                >
                                    {overBudgetCount}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PiggyBank className="h-5 w-5" />
                                    Set Monthly Budget
                                </CardTitle>
                                <CardDescription>
                                    Enter a CAD budget amount for a category and
                                    period
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="period">Period</Label>
                                    <Select
                                        value={selectedPeriod}
                                        onValueChange={setSelectedPeriod}
                                    >
                                        <SelectTrigger
                                            id="period"
                                            data-testid="page-period-selector"
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

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={selectedCategoryCode}
                                        onValueChange={setSelectedCategoryCode}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.code}
                                                    value={category.code}
                                                >
                                                    {category.code} —{' '}
                                                    {category.name_es} /{' '}
                                                    {category.name_en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount_cad">
                                        Budget Amount (CAD)
                                    </Label>
                                    <Input
                                        id="amount_cad"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amountCad}
                                        onChange={(e) =>
                                            setAmountCad(e.target.value)
                                        }
                                        placeholder="800.00"
                                    />
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full"
                                    data-testid="save-budget"
                                >
                                    {saving && <Spinner className="mr-2" />}
                                    Save Budget
                                </Button>

                                {saveSuccess && (
                                    <Alert data-testid="budget-save-success">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Budget saved for{' '}
                                            {selectedCategoryCode} in{' '}
                                            {formatPeriod(selectedPeriod)}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {saveError && (
                                    <Alert variant="destructive">
                                        <XCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {saveError}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Period Summary
                                </CardTitle>
                                <CardDescription>
                                    {formatPeriod(selectedPeriod)} — budgets set
                                    for {rowsWithBudget.length} categories
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p>
                                    <strong>Variance:</strong>{' '}
                                    <span
                                        data-testid="variance-total"
                                        className={
                                            (totals?.variance_cad ?? 0) > 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-green-700 dark:text-green-400'
                                        }
                                    >
                                        {formatCad(totals?.variance_cad ?? 0)}
                                    </span>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Actual spending is computed live from
                                    transactions and converted to CAD using the
                                    period exchange rates. Positive variance
                                    means over budget.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Budget vs Actual Report</CardTitle>
                                    <CardDescription>
                                        Compare budgeted amounts against computed
                                        actual spend for {formatPeriod(selectedPeriod)}
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    data-testid="export-budget-report"
                                >
                                    <Download className="h-4 w-4" />
                                    Export to CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingReport ? (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            ) : reportError ? (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {reportError}
                                    </AlertDescription>
                                </Alert>
                            ) : reportRows.length === 0 ? (
                                <p className="py-8 text-center text-gray-500">
                                    No categories found. Seed categories to get
                                    started.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table
                                        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                                        data-testid="budget-vs-actual-table"
                                    >
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Category
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Budget
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Actual
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Variance
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    %
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                            {reportRows.map((row) => (
                                                <tr
                                                    key={row.category_code}
                                                    data-testid={`budget-row-${row.category_code}`}
                                                    data-over-budget={
                                                        row.is_over_budget
                                                            ? 'true'
                                                            : 'false'
                                                    }
                                                    className={
                                                        row.is_over_budget
                                                            ? 'bg-red-50 dark:bg-red-950/40'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {row.category_code}{' '}
                                                        <span className="font-normal text-gray-500">
                                                            {row.category_name_es}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                        {formatCad(row.budget_cad)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                        {formatCad(row.actual_cad)}
                                                    </td>
                                                    <td
                                                        className={`whitespace-nowrap px-4 py-3 text-right text-sm ${
                                                            (row.variance_cad ??
                                                                0) > 0
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {formatCad(
                                                            row.variance_cad,
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                        {row.percentage !== null
                                                            ? `${row.percentage.toFixed(2)}%`
                                                            : '—'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                        {row.budget_cad ===
                                                        null ? (
                                                            <Badge variant="outline">
                                                                No budget
                                                            </Badge>
                                                        ) : row.is_over_budget ? (
                                                            <Badge
                                                                variant="destructive"
                                                                className="gap-1"
                                                            >
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Over budget
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                            >
                                                                Under budget
                                                            </Badge>
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
            </PageContainer>
        </>
    );
}

Budgets.layout = {
    breadcrumbs: [
        {
            title: 'Budgets',
            href: '/budgets',
        },
    ],
};

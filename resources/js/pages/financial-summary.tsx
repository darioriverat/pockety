import { Head } from '@inertiajs/react';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Calculator,
    Landmark,
    MinusCircle,
    XCircle,
} from 'lucide-react';

interface CategoryTotal {
    category_id: number;
    category_code: string;
    category_name_es: string;
    category_name_en: string;
    is_debt_category: boolean;
    is_depreciation: boolean;
    total_cad: number;
    principal_cad: number;
    interest_cad: number;
    other_cad: number;
}

interface FinancialSummaryData {
    period: string;
    total_recorded_disbursements_cad: number;
    net_operating_expenses_cad: number;
    debt_principal_excluded_cad: number;
    depreciation_excluded_cad: number;
    debt_interest_included_cad: number;
    category_totals: CategoryTotal[];
}

function generatePeriods(): string[] {
    const periods: string[] = [];
    for (let year = 2025; year <= 2026; year++) {
        const maxMonth = year === 2026 ? 9 : 12;
        for (let month = 1; month <= maxMonth; month++) {
            periods.push(`${year}${month.toString().padStart(2, '0')}`);
        }
    }
    return periods;
}

function formatPeriod(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function formatCad(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return '—';
    }
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(value);
}

export default function FinancialSummary() {
    const periods = generatePeriods();
    const [selectedPeriod, setSelectedPeriod] = useState<string>('202501');
    const [summary, setSummary] = useState<FinancialSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedPeriod) {
            fetchSummary(selectedPeriod);
        }
    }, [selectedPeriod]);

    const fetchSummary = async (period: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/financial-summary?period=${period}`,
            );
            if (!response.ok) {
                throw new Error('Failed to load financial summary');
            }
            const payload = await response.json();
            setSummary(payload.data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load summary',
            );
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const rowsWithActivity =
        summary?.category_totals.filter(
            (row) =>
                row.total_cad > 0 ||
                row.is_debt_category ||
                row.is_depreciation,
        ) ?? [];

    return (
        <>
            <Head title="Financial Summary" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Financial Summary
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Total Recorded Disbursements (Gasto Total) and
                                Net Operating Expenses (Gasto Real) for the
                                selected period
                            </p>
                        </div>
                        <div className="w-full max-w-xs space-y-2">
                            <Label htmlFor="period">Period</Label>
                            <Select
                                value={selectedPeriod}
                                onValueChange={setSelectedPeriod}
                            >
                                <SelectTrigger
                                    id="period"
                                    data-testid="period-selector"
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
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !summary ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Total Recorded Disbursements
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="total-recorded-disbursements"
                                        >
                                            {formatCad(
                                                summary?.total_recorded_disbursements_cad ??
                                                    0,
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-gray-500">
                                        Gasto Total — all categories including
                                        debt payments
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Net Operating Expenses
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="net-operating-expenses"
                                        >
                                            {formatCad(
                                                summary?.net_operating_expenses_cad ??
                                                    0,
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-gray-500">
                                        Gasto Real — excludes principal &amp;
                                        depreciation
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Debt Principal Excluded
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="debt-principal-excluded"
                                        >
                                            {formatCad(
                                                summary?.debt_principal_excluded_cad ??
                                                    0,
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Depreciation Excluded
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="depreciation-excluded"
                                        >
                                            {formatCad(
                                                summary?.depreciation_excluded_cad ??
                                                    0,
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>

                            <div className="mb-6 grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calculator className="h-5 w-5" />
                                            How Net Operating Expenses is
                                            calculated
                                        </CardTitle>
                                        <CardDescription>
                                            {formatPeriod(selectedPeriod)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <p>
                                            Total Recorded Disbursements:{' '}
                                            <strong>
                                                {formatCad(
                                                    summary?.total_recorded_disbursements_cad,
                                                )}
                                            </strong>
                                        </p>
                                        <p className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                            <MinusCircle className="h-4 w-4" />
                                            Debt principal:{' '}
                                            {formatCad(
                                                summary?.debt_principal_excluded_cad,
                                            )}
                                        </p>
                                        <p className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                            <MinusCircle className="h-4 w-4" />
                                            Depreciation (C045):{' '}
                                            {formatCad(
                                                summary?.depreciation_excluded_cad,
                                            )}
                                        </p>
                                        <p>
                                            Debt interest included:{' '}
                                            <strong
                                                data-testid="debt-interest-included"
                                            >
                                                {formatCad(
                                                    summary?.debt_interest_included_cad,
                                                )}
                                            </strong>
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Landmark className="h-5 w-5" />
                                            Debt payment categories
                                        </CardTitle>
                                        <CardDescription>
                                            Included in Total Recorded
                                            Disbursements; principal excluded
                                            from Net Operating Expenses
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="flex flex-wrap gap-2"
                                            data-testid="debt-category-codes"
                                        >
                                            {[
                                                'C009',
                                                'C010',
                                                'C027',
                                                'C038',
                                                'C039',
                                                'C044',
                                                'C046',
                                            ].map((code) => (
                                                <Badge
                                                    key={code}
                                                    variant="secondary"
                                                    data-testid={`debt-code-${code}`}
                                                >
                                                    {code}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Category totals (
                                        {formatPeriod(selectedPeriod)})
                                    </CardTitle>
                                    <CardDescription>
                                        CAD equivalent using period exchange
                                        rates. Debt rows show principal vs
                                        interest split.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading && (
                                        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                                            <Spinner className="h-4 w-4" />
                                            Refreshing…
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table
                                            className="w-full text-left text-sm"
                                            data-testid="financial-summary-table"
                                        >
                                            <thead>
                                                <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                                                    <th className="py-2 pr-3">
                                                        Category
                                                    </th>
                                                    <th className="py-2 pr-3">
                                                        Total
                                                    </th>
                                                    <th className="py-2 pr-3">
                                                        Principal
                                                    </th>
                                                    <th className="py-2 pr-3">
                                                        Interest
                                                    </th>
                                                    <th className="py-2">
                                                        Flags
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rowsWithActivity.length ===
                                                0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="py-8 text-center text-gray-500"
                                                        >
                                                            No transactions for
                                                            this period yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    rowsWithActivity.map(
                                                        (row) => (
                                                            <tr
                                                                key={
                                                                    row.category_id
                                                                }
                                                                className="border-b border-gray-100 dark:border-gray-800"
                                                                data-testid={`summary-row-${row.category_code}`}
                                                                data-debt={
                                                                    row.is_debt_category
                                                                        ? 'true'
                                                                        : 'false'
                                                                }
                                                                data-depreciation={
                                                                    row.is_depreciation
                                                                        ? 'true'
                                                                        : 'false'
                                                                }
                                                            >
                                                                <td className="py-2 pr-3">
                                                                    {
                                                                        row.category_code
                                                                    }{' '}
                                                                    {
                                                                        row.category_name_es
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="py-2 pr-3 font-medium"
                                                                    data-testid={`total-${row.category_code}`}
                                                                >
                                                                    {formatCad(
                                                                        row.total_cad,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    className="py-2 pr-3"
                                                                    data-testid={`principal-${row.category_code}`}
                                                                >
                                                                    {formatCad(
                                                                        row.principal_cad,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    className="py-2 pr-3"
                                                                    data-testid={`interest-${row.category_code}`}
                                                                >
                                                                    {formatCad(
                                                                        row.interest_cad,
                                                                    )}
                                                                </td>
                                                                <td className="py-2">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {row.is_debt_category && (
                                                                            <Badge variant="outline">
                                                                                Debt
                                                                            </Badge>
                                                                        )}
                                                                        {row.is_depreciation && (
                                                                            <Badge variant="outline">
                                                                                Depreciation
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

FinancialSummary.layout = {
    breadcrumbs: [
        {
            title: 'Financial Summary',
            href: '/financial-summary',
        },
    ],
};

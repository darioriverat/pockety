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
import { LoadingState } from '@/components/ui/loading-state';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { Spinner } from '@/components/ui/spinner';
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
import { usePeriod } from '@/hooks/use-period';
import { formatCurrencyAmount } from '@/lib/currency';
import { formatPeriod, generatePeriods } from '@/lib/periods';
import {
    Calculator,
    Download,
    Landmark,
    MinusCircle,
    TrendingUp,
    XCircle,
} from 'lucide-react';

interface IncomeLine {
    id: number;
    description: string;
    line_number: number;
    amount_cad: number;
    amount_usd: number;
    amount_cop: number;
    total_cad_equivalent: number;
}

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
    total_income_cad: number;
    total_recorded_disbursements_cad: number;
    net_operating_expenses_cad: number;
    net_cad: number;
    debt_principal_excluded_cad: number;
    depreciation_excluded_cad: number;
    debt_interest_included_cad: number;
    income_lines: IncomeLine[];
    category_totals: CategoryTotal[];
}

function formatCad(value: number | null | undefined): string {
    return formatCurrencyAmount(value, 'CAD');
}

export default function FinancialSummary() {
    const periods = generatePeriods();
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } =
        usePeriod();
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

    const handleExportPdf = () => {
        const url = `/api/financial-summary/export?period=${encodeURIComponent(selectedPeriod)}`;
        window.location.href = url;
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

            <PageContainer>
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <PageTitle
                            title="Financial Summary"
                            description="Income statement for the selected period — income, Total Recorded Disbursements (Gasto Total), Net Operating Expenses (Gasto Real), and net"
                        />
                        <div className="flex w-full max-w-md flex-col gap-3 sm:items-end">
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleExportPdf}
                                    disabled={!selectedPeriod || loading}
                                    data-testid="export-income-statement-pdf"
                                >
                                    <Download className="size-4 shrink-0 fill-none" />
                                    Export to PDF
                                </Button>
                            </div>
                            <div className="w-full max-w-xs space-y-2">
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
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !summary ? (
                        <LoadingState
                            variant="spinner"
                            label="Loading financial summary…"
                            data-testid="financial-summary-loading-state"
                        />
                    ) : (
                        <>
                            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>
                                            Total Income
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="total-income"
                                        >
                                            {formatCad(
                                                summary?.total_income_cad ?? 0,
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
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
                                    <CardContent className="text-xs text-muted-foreground">
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
                                    <CardContent className="text-xs text-muted-foreground">
                                        Gasto Real — excludes principal &amp;
                                        depreciation
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription>Net</CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="income-statement-net"
                                        >
                                            {formatCad(summary?.net_cad ?? 0)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Income − Net Operating Expenses
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

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Income line items (
                                        {formatPeriod(selectedPeriod)})
                                    </CardTitle>
                                    <CardDescription>
                                        CAD equivalents using period exchange
                                        rates
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="overflow-x-auto"
                                        data-responsive="scroll"
                                    >
                                        <table
                                            className="w-full min-w-[36rem] text-left text-sm"
                                            data-testid="income-lines-table"
                                        >
                                            <thead>
                                                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                                                    <th className="py-2 pr-3">
                                                        #
                                                    </th>
                                                    <th className="py-2 pr-3">
                                                        Description
                                                    </th>
                                                    <th className="py-2 text-right">
                                                        CAD
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(summary?.income_lines
                                                    ?.length ?? 0) === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={3}
                                                            className="py-8 text-center text-muted-foreground"
                                                        >
                                                            No income lines for
                                                            this period yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    summary?.income_lines.map(
                                                        (line) => (
                                                            <tr
                                                                key={line.id}
                                                                className="border-b border-gray-100 dark:border-gray-800"
                                                                data-testid={`income-line-${line.id}`}
                                                            >
                                                                <td className="py-2 pr-3">
                                                                    {
                                                                        line.line_number
                                                                    }
                                                                </td>
                                                                <td className="py-2 pr-3">
                                                                    {
                                                                        line.description
                                                                    }
                                                                </td>
                                                                <td className="py-2 text-right font-medium">
                                                                    {formatCad(
                                                                        line.total_cad_equivalent,
                                                                    )}
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
                                        Expenses by category (
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
                                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                                            <Spinner className="h-4 w-4" />
                                            Refreshing…
                                        </div>
                                    )}
                                    <div
                                        className="overflow-x-auto"
                                        data-responsive="scroll"
                                    >
                                        <table
                                            className="w-full min-w-[36rem] text-left text-sm"
                                            data-testid="financial-summary-table"
                                        >
                                            <thead>
                                                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
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
                                                            className="py-8 text-center text-muted-foreground"
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
            </PageContainer>
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

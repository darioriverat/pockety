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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Landmark,
    LineChart,
    Scale,
    TrendingUp,
    XCircle,
} from 'lucide-react';

interface BalanceLine {
    id: number;
    name: string;
    type: string;
    cad: number;
    usd: number;
    cop: number;
}

interface CurrencyTotals {
    cad: number;
    usd: number;
    cop: number;
}

interface BalanceSheetData {
    period: string;
    total_assets: CurrencyTotals & {
        accounts_cad: number;
        fixed_assets_cad: number;
        breakdown: BalanceLine[];
    };
    total_liabilities: CurrencyTotals & {
        breakdown: BalanceLine[];
    };
    equity: CurrencyTotals;
    exchange_rates: {
        usd_cop: number;
        usd_cad: number;
        cad_cop: number;
    };
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

function formatMoney(
    value: number | null | undefined,
    currency: 'CAD' | 'USD' | 'COP',
): string {
    if (value === null || value === undefined) {
        return '—';
    }
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(value);
}

function typeLabel(type: string): string {
    switch (type) {
        case 'bank':
            return 'Bank';
        case 'investment':
            return 'Investment';
        case 'receivable':
            return 'Receivable';
        case 'fixed_asset':
            return 'Fixed asset';
        case 'liability':
            return 'Liability';
        default:
            return type;
    }
}

export default function BalanceSheet() {
    const periods = generatePeriods();
    const [selectedPeriod, setSelectedPeriod] = useState<string>('202501');
    const [sheet, setSheet] = useState<BalanceSheetData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedPeriod) {
            fetchBalanceSheet(selectedPeriod);
        }
    }, [selectedPeriod]);

    const fetchBalanceSheet = async (period: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/balance-sheet?period=${period}`,
            );
            if (!response.ok) {
                throw new Error('Failed to load balance sheet');
            }
            const payload = await response.json();
            setSheet(payload.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load balance sheet',
            );
            setSheet(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Balance Sheet" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Balance Sheet
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Assets, Liabilities, and Equity for the selected
                                period — shown in CAD with USD and COP
                                equivalents
                            </p>
                        </div>
                        <div className="flex w-full max-w-md flex-col gap-3 sm:items-end">
                            <Button variant="outline" asChild>
                                <Link
                                    href="/balance-sheet/time-series"
                                    data-testid="time-series-link"
                                >
                                    <LineChart className="mr-2 h-4 w-4" />
                                    Time series
                                </Link>
                            </Button>
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
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading && !sheet ? (
                        <div className="flex justify-center py-16">
                            <Spinner className="h-8 w-8" />
                        </div>
                    ) : (
                        <>
                            <div
                                className="mb-6 grid gap-4 sm:grid-cols-3"
                                data-testid="balance-sheet-summary"
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <Landmark className="h-4 w-4" />
                                            Total Assets
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="total-assets-cad"
                                        >
                                            {formatMoney(
                                                sheet?.total_assets.cad ?? 0,
                                                'CAD',
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p data-testid="total-assets-usd">
                                            {formatMoney(
                                                sheet?.total_assets.usd ?? 0,
                                                'USD',
                                            )}
                                        </p>
                                        <p data-testid="total-assets-cop">
                                            {formatMoney(
                                                sheet?.total_assets.cop ?? 0,
                                                'COP',
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <Scale className="h-4 w-4" />
                                            Total Liabilities
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="total-liabilities-cad"
                                        >
                                            {formatMoney(
                                                sheet?.total_liabilities.cad ?? 0,
                                                'CAD',
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p data-testid="total-liabilities-usd">
                                            {formatMoney(
                                                sheet?.total_liabilities.usd ?? 0,
                                                'USD',
                                            )}
                                        </p>
                                        <p data-testid="total-liabilities-cop">
                                            {formatMoney(
                                                sheet?.total_liabilities.cop ?? 0,
                                                'COP',
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Equity
                                        </CardDescription>
                                        <CardTitle
                                            className="text-2xl"
                                            data-testid="equity-cad"
                                        >
                                            {formatMoney(
                                                sheet?.equity.cad ?? 0,
                                                'CAD',
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p data-testid="equity-usd">
                                            {formatMoney(
                                                sheet?.equity.usd ?? 0,
                                                'USD',
                                            )}
                                        </p>
                                        <p data-testid="equity-cop">
                                            {formatMoney(
                                                sheet?.equity.cop ?? 0,
                                                'COP',
                                            )}
                                        </p>
                                        <p className="pt-1 text-xs">
                                            Assets − Liabilities
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Assets breakdown</CardTitle>
                                        <CardDescription>
                                            Bank, investment, receivable, and
                                            fixed assets (
                                            {formatPeriod(selectedPeriod)})
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span data-testid="accounts-assets-cad">
                                                Accounts:{' '}
                                                {formatMoney(
                                                    sheet?.total_assets
                                                        .accounts_cad ?? 0,
                                                    'CAD',
                                                )}
                                            </span>
                                            <span data-testid="fixed-assets-cad">
                                                Fixed assets:{' '}
                                                {formatMoney(
                                                    sheet?.total_assets
                                                        .fixed_assets_cad ?? 0,
                                                    'CAD',
                                                )}
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table
                                                className="w-full text-sm"
                                                data-testid="assets-table"
                                            >
                                                <thead>
                                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                                                        <th className="py-2 pr-2">
                                                            Name
                                                        </th>
                                                        <th className="py-2 pr-2">
                                                            Type
                                                        </th>
                                                        <th className="py-2 text-right">
                                                            CAD
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        sheet?.total_assets
                                                            .breakdown ?? []
                                                    ).map((row) => (
                                                        <tr
                                                            key={`asset-${row.type}-${row.id}`}
                                                            className="border-b border-gray-100 dark:border-gray-800"
                                                            data-testid={`asset-row-${row.type}-${row.id}`}
                                                        >
                                                            <td className="py-2 pr-2">
                                                                {row.name}
                                                            </td>
                                                            <td className="py-2 pr-2 text-gray-500">
                                                                {typeLabel(
                                                                    row.type,
                                                                )}
                                                            </td>
                                                            <td className="py-2 text-right font-medium">
                                                                {formatMoney(
                                                                    row.cad,
                                                                    'CAD',
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(sheet?.total_assets.breakdown
                                                        .length ?? 0) === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={3}
                                                                className="py-6 text-center text-gray-500"
                                                            >
                                                                No asset
                                                                balances for
                                                                this period
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Liabilities breakdown
                                        </CardTitle>
                                        <CardDescription>
                                            Credit cards and loans (
                                            {formatPeriod(selectedPeriod)})
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table
                                                className="w-full text-sm"
                                                data-testid="liabilities-table"
                                            >
                                                <thead>
                                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                                                        <th className="py-2 pr-2">
                                                            Name
                                                        </th>
                                                        <th className="py-2 pr-2">
                                                            Type
                                                        </th>
                                                        <th className="py-2 text-right">
                                                            CAD
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        sheet?.total_liabilities
                                                            .breakdown ?? []
                                                    ).map((row) => (
                                                        <tr
                                                            key={`liability-${row.id}`}
                                                            className="border-b border-gray-100 dark:border-gray-800"
                                                            data-testid={`liability-row-${row.id}`}
                                                        >
                                                            <td className="py-2 pr-2">
                                                                {row.name}
                                                            </td>
                                                            <td className="py-2 pr-2 text-gray-500">
                                                                {typeLabel(
                                                                    row.type,
                                                                )}
                                                            </td>
                                                            <td className="py-2 text-right font-medium">
                                                                {formatMoney(
                                                                    row.cad,
                                                                    'CAD',
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(sheet?.total_liabilities
                                                        .breakdown.length ??
                                                        0) === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={3}
                                                                className="py-6 text-center text-gray-500"
                                                            >
                                                                No liability
                                                                balances for
                                                                this period
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card data-testid="multi-currency-totals">
                                <CardHeader>
                                    <CardTitle>
                                        Multi-currency totals
                                    </CardTitle>
                                    <CardDescription>
                                        Converted with period rates USD/CAD{' '}
                                        {sheet?.exchange_rates.usd_cad ?? '—'},
                                        CAD/COP{' '}
                                        {sheet?.exchange_rates.cad_cop ?? '—'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                                                <th className="py-2">Item</th>
                                                <th className="py-2 text-right">
                                                    CAD
                                                </th>
                                                <th className="py-2 text-right">
                                                    USD
                                                </th>
                                                <th className="py-2 text-right">
                                                    COP
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="py-2">Assets</td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_assets.cad,
                                                        'CAD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_assets.usd,
                                                        'USD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_assets.cop,
                                                        'COP',
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="py-2">
                                                    Liabilities
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_liabilities.cad,
                                                        'CAD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_liabilities.usd,
                                                        'USD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatMoney(
                                                        sheet?.total_liabilities.cop,
                                                        'COP',
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 font-medium">
                                                    Equity
                                                </td>
                                                <td className="py-2 text-right font-medium">
                                                    {formatMoney(
                                                        sheet?.equity.cad,
                                                        'CAD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right font-medium">
                                                    {formatMoney(
                                                        sheet?.equity.usd,
                                                        'USD',
                                                    )}
                                                </td>
                                                <td className="py-2 text-right font-medium">
                                                    {formatMoney(
                                                        sheet?.equity.cop,
                                                        'COP',
                                                    )}
                                                </td>
                                            </tr>
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

BalanceSheet.layout = {
    breadcrumbs: [
        {
            title: 'Balance Sheet',
            href: '/balance-sheet',
        },
    ],
};

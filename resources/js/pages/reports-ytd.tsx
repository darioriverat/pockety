import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileText, TrendingDown, TrendingUp } from 'lucide-react';

interface YtdTotals {
    year: number;
    from_period: string;
    to_period: string;
    ytd_income_cad: number;
    ytd_expenses_cad: number;
    ytd_net_cad: number;
    period_count: number;
}

interface ReportsYtdPageProps {
    ytd_totals: YtdTotals;
    available_years: number[];
}

function formatCad(value: number): string {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(value);
}

function formatPeriod(period: string): string {
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function readQueryParam(key: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return new URLSearchParams(window.location.search).get(key);
}

export default function ReportsYtd({ ytd_totals, available_years }: ReportsYtdPageProps) {
    const currentYear = useMemo(() => {
        const queryYear = readQueryParam('year');
        return queryYear ? parseInt(queryYear) : ytd_totals.year;
    }, [ytd_totals.year]);

    const handleYearChange = useCallback((value: string) => {
        router.get(
            '/reports/year-to-date',
            { year: value },
            {
                preserveState: false,
                replace: true,
            },
        );
    }, []);

    return (
        <>
            <Head title="Year-to-Date Reports" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1
                                className="text-3xl font-bold text-gray-900 dark:text-gray-100"
                                data-testid="reports-ytd-heading"
                            >
                                Year-to-Date Reports
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                View year-to-date totals for income and expenses
                            </p>
                        </div>
                    </div>

                    <Card className="mb-6" data-testid="year-selector-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Select Year
                            </CardTitle>
                            <CardDescription>
                                Choose a year to view year-to-date income and expense totals
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4 md:max-w-xs">
                                <div className="space-y-2">
                                    <Label htmlFor="year-select">Year</Label>
                                    <Select
                                        value={currentYear.toString()}
                                        onValueChange={handleYearChange}
                                    >
                                        <SelectTrigger
                                            id="year-select"
                                            data-testid="year-select"
                                        >
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {available_years.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                    data-testid={`year-option-${year}`}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mb-6">
                        <Card data-testid="ytd-summary-card">
                            <CardHeader>
                                <CardTitle>Year-to-Date Summary for {ytd_totals.year}</CardTitle>
                                <CardDescription>
                                    Covering {formatPeriod(ytd_totals.from_period)} through {formatPeriod(ytd_totals.to_period)} ({ytd_totals.period_count} {ytd_totals.period_count === 1 ? 'period' : 'periods'})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" data-testid="ytd-income-card">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium">
                                                    YTD Income
                                                </CardDescription>
                                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className="text-2xl font-bold text-emerald-900 dark:text-emerald-100"
                                                data-testid="ytd-income-total"
                                            >
                                                {formatCad(ytd_totals.ytd_income_cad)}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" data-testid="ytd-expenses-card">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardDescription className="text-rose-700 dark:text-rose-400 font-medium">
                                                    YTD Expenses
                                                </CardDescription>
                                                <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className="text-2xl font-bold text-rose-900 dark:text-rose-100"
                                                data-testid="ytd-expenses-total"
                                            >
                                                {formatCad(ytd_totals.ytd_expenses_cad)}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className={`${ytd_totals.ytd_net_cad >= 0 ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'}`} data-testid="ytd-net-card">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardDescription className={`${ytd_totals.ytd_net_cad >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'} font-medium`}>
                                                    YTD Net
                                                </CardDescription>
                                                {ytd_totals.ytd_net_cad >= 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div
                                                className={`text-2xl font-bold ${ytd_totals.ytd_net_cad >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'}`}
                                                data-testid="ytd-net-total"
                                            >
                                                {formatCad(ytd_totals.ytd_net_cad)}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                Income - Expenses
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ReportsYtd.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: '/reports/year-to-date',
        },
        {
            title: 'Year-to-Date',
            href: '/reports/year-to-date',
        },
    ],
};

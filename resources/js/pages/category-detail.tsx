import { Head, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyAmount } from '@/lib/currency';
import { ArrowLeft, Tags } from 'lucide-react';

interface Category {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
    is_debt_category: boolean;
    is_active: boolean;
    status: string | null;
}

interface Transaction {
    id: number;
    date: string;
    period: string;
    quincena: string;
    amount: number | null;
    currency: string | null;
    amount_cad: number | null;
    amount_usd: number | null;
    amount_cop: number | null;
    comments: string | null;
    account: {
        id: number;
        name: string;
        type: string;
    } | null;
}

interface CategoryTransactionsResponse {
    data: Transaction[];
    meta: {
        category: Category;
        total_spending_cad: number;
        total_spending_usd: number;
        total_spending_cop: number;
        total_count: number;
        period_count: number;
        average_per_period_cad: number;
        available_periods: string[];
        is_filtered: boolean;
        filters: {
            period: string | null;
        };
    };
}

const formatCurrency = (value: number, currency: string): string =>
    formatCurrencyAmount(value, currency);

const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatPeriod = (period: string): string => {
    if (period.length !== 6) return period;
    const year = period.slice(0, 4);
    const month = period.slice(4, 6);
    const date = new Date(`${year}-${month}-01T00:00:00`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

export default function CategoryDetail() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const categoryCode = pathParts[pathParts.length - 1] ?? '';

    const [category, setCategory] = useState<Category | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [totalSpendingCad, setTotalSpendingCad] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [periodCount, setPeriodCount] = useState(0);
    const [averagePerPeriodCad, setAveragePerPeriodCad] = useState(0);
    const [isFiltered, setIsFiltered] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('');
    const [appliedPeriod, setAppliedPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!categoryCode) {
            setError('Invalid category code');
            setLoading(false);
            return;
        }

        void fetchTransactions();
    }, [categoryCode]);

    const fetchTransactions = async (period?: string) => {
        if (!categoryCode) return;

        const nextPeriod = period ?? appliedPeriod;

        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (nextPeriod) params.set('period', nextPeriod);
            const query = params.toString();
            const url = `/api/categories/${categoryCode}/transactions${query ? `?${query}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Category not found');
                }
                throw new Error('Failed to fetch category transactions');
            }

            const data: CategoryTransactionsResponse = await response.json();
            setCategory(data.meta.category);
            setTransactions(data.data || []);
            setAvailablePeriods(data.meta.available_periods || []);
            setTotalSpendingCad(data.meta.total_spending_cad ?? 0);
            setTotalCount(data.meta.total_count ?? 0);
            setPeriodCount(data.meta.period_count ?? 0);
            setAveragePerPeriodCad(data.meta.average_per_period_cad ?? 0);
            setIsFiltered(Boolean(data.meta.is_filtered));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = (event: FormEvent) => {
        event.preventDefault();
        setAppliedPeriod(periodFilter);
        void fetchTransactions(periodFilter);
    };

    const handleClearFilter = () => {
        setPeriodFilter('');
        setAppliedPeriod('');
        void fetchTransactions('');
    };

    if (error) {
        return (
            <>
                <Head title="Category Details" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Link href="/categories">
                                <Button variant="outline" className="mt-4">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Categories
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head
                title={
                    category
                        ? `${category.code} — ${category.name_en}`
                        : 'Category Details'
                }
            />
            <div
                className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
                data-testid="category-detail-page"
            >
                <div className="mb-4">
                    <Link href="/categories">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                        <Tags className="h-6 w-6" />
                        <h1
                            className="text-3xl font-bold tracking-tight"
                            data-testid="category-detail-heading"
                        >
                            {category
                                ? `${category.code} — ${category.name_en}`
                                : 'Loading...'}
                        </h1>
                        {category?.is_debt_category && (
                            <Badge variant="secondary">Debt</Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        {category
                            ? `ES: ${category.name_es} · Transaction history across all periods`
                            : 'Transaction history across all periods'}
                    </p>
                </div>

                <Card data-testid="category-period-filter">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filter by period</CardTitle>
                        <CardDescription>
                            Show only transactions from a specific YYYYMM period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                            onSubmit={handleApplyFilter}
                        >
                            <div className="grid w-full gap-2 sm:max-w-xs">
                                <Label htmlFor="period-filter">Period</Label>
                                <select
                                    id="period-filter"
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                                    value={periodFilter}
                                    onChange={(event) =>
                                        setPeriodFilter(event.target.value)
                                    }
                                    data-testid="filter-period"
                                >
                                    <option value="">All periods</option>
                                    {availablePeriods.map((period) => (
                                        <option key={period} value={period}>
                                            {period} ({formatPeriod(period)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" data-testid="apply-period-filter">
                                    Apply filter
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClearFilter}
                                    data-testid="clear-period-filter"
                                >
                                    Clear
                                </Button>
                            </div>
                        </form>
                        {isFiltered && appliedPeriod && (
                            <p
                                className="mt-3 text-sm text-muted-foreground"
                                data-testid="active-period-filter"
                            >
                                Showing period {appliedPeriod} (
                                {formatPeriod(appliedPeriod)})
                            </p>
                        )}
                    </CardContent>
                </Card>

                {!loading && (
                    <div
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        data-testid="category-spending-summary"
                    >
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>
                                    {isFiltered
                                        ? 'Total Spending (filtered)'
                                        : 'Total Spending'}
                                </CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-total-spending"
                                >
                                    {formatCurrency(totalSpendingCad, 'CAD')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Sum of CAD amounts
                                    {isFiltered ? ' in selected period' : ''}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Transactions</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-transaction-count"
                                >
                                    {totalCount}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Total transactions shown
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Periods</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-period-count"
                                >
                                    {periodCount}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Periods with transactions
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Avg / Period</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="category-average-spending"
                                >
                                    {formatCurrency(averagePerPeriodCad, 'CAD')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Average CAD spending per period
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {loading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading transactions...
                        </CardContent>
                    </Card>
                ) : transactions.length === 0 ? (
                    <Card>
                        <CardContent
                            className="py-8 text-center text-muted-foreground"
                            data-testid="no-category-transactions-message"
                        >
                            {isFiltered
                                ? 'No transactions found in this period.'
                                : 'No transactions found for this category.'}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {transactions.length} transaction
                                {transactions.length !== 1 ? 's' : ''}
                                {isFiltered ? ' in selected period' : ' across all periods'}{' '}
                                · Sorted by date (newest first)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table data-testid="category-transactions-table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead>Comments</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow
                                            key={transaction.id}
                                            data-testid={`category-tx-row-${transaction.id}`}
                                            data-tx-period={transaction.period}
                                            data-tx-date={transaction.date}
                                        >
                                            <TableCell className="font-medium">
                                                {formatDate(transaction.date)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs">
                                                    {transaction.period}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {transaction.account?.name ?? (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-destructive">
                                                −
                                                {formatCurrency(
                                                    transaction.amount ?? 0,
                                                    transaction.currency || 'CAD'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {transaction.comments || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

CategoryDetail.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: '/categories',
        },
        {
            title: 'Details',
            href: '#',
        },
    ],
};

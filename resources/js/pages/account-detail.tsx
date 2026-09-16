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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrencyAmount, formatSignedCurrencyAmount, amountToneClass } from '@/lib/currency';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { ArrowLeft, Building2 } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    type: string;
    primary_currency: string | null;
}

interface Transaction {
    id: number;
    date: string;
    period: string;
    category_code: string | null;
    category_name: string | null;
    amount: number;
    signed_amount: number;
    is_credit: boolean;
    currency: string;
    comments: string | null;
    running_balance: number;
}

interface TransactionsResponse {
    data: Transaction[];
    meta: {
        account_id: number;
        account_name: string;
        currency: string;
        starting_balance: number;
        current_balance: number;
        has_recorded_balance: boolean;
        total_count: number;
        is_filtered?: boolean;
        filters?: {
            start_date: string | null;
            end_date: string | null;
        };
    };
}

const formatCurrency = (value: number, currency: string): string =>
    formatCurrencyAmount(value, currency);

const formatSignedCurrency = (value: number, currency: string): string =>
    formatSignedCurrencyAmount(value, currency);

const cashflowAmount = (transaction: Transaction): number =>
    typeof transaction.signed_amount === 'number'
        ? transaction.signed_amount
        : transaction.is_credit
          ? Math.abs(transaction.amount)
          : -Math.abs(transaction.amount);

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function AccountDetail() {
    // Extract account ID from URL path
    const pathParts = window.location.pathname.split('/');
    const accountId = parseInt(pathParts[pathParts.length - 1]);

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [startingBalance, setStartingBalance] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [currency, setCurrency] = useState('CAD');
    const [isFiltered, setIsFiltered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');

    useEffect(() => {
        if (!accountId) {
            setError('Invalid account ID');
            setLoading(false);
            return;
        }

        fetchAccountDetails();
        fetchTransactions();
    }, [accountId]);

    const fetchAccountDetails = async () => {
        if (!accountId) return;

        try {
            const response = await fetch(`/api/accounts/${accountId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch account details');
            }

            const data: { data: Account } = await response.json();
            setAccount(data.data || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const fetchTransactions = async (range?: {
        startDate?: string;
        endDate?: string;
    }) => {
        if (!accountId) return;

        const nextStart = range?.startDate ?? appliedStartDate;
        const nextEnd = range?.endDate ?? appliedEndDate;

        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (nextStart) params.set('start_date', nextStart);
            if (nextEnd) params.set('end_date', nextEnd);
            const query = params.toString();
            const url = `/api/accounts/${accountId}/transactions${query ? `?${query}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data: TransactionsResponse = await response.json();
            setTransactions(data.data || []);
            setStartingBalance(data.meta.starting_balance ?? 0);
            setCurrentBalance(data.meta.current_balance ?? 0);
            setCurrency(data.meta.currency || account?.primary_currency || 'CAD');
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
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
        void fetchTransactions({ startDate, endDate });
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        void fetchTransactions({ startDate: '', endDate: '' });
    };

    if (error) {
        return (
            <>
                <Head title="Account Details" />
                <PageContainer className="overflow-x-auto">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Link href="/accounts">
                                <Button variant="outline" className="mt-4">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Accounts
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </PageContainer>
            </>
        );
    }

    const displayCurrency = currency || account?.primary_currency || 'CAD';

    return (
        <>
            <Head title={account ? account.name : 'Account Details'} />
            <PageContainer
                className="overflow-x-auto"
                data-testid="account-detail-page"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/accounts">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <PageTitle
                            className="mt-2"
                            title={account?.name || 'Loading...'}
                            description="Transaction history with running balance"
                            leading={<Building2 className="h-6 w-6" />}
                            data-testid="account-detail-heading"
                        />
                    </div>
                </div>

                <Card data-testid="account-date-filter">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filter by date range</CardTitle>
                        <CardDescription>
                            Show only transactions in a date range. Starting balance
                            reflects the balance at the start of the filtered view.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex flex-col gap-4 sm:flex-row sm:items-end"
                            onSubmit={handleApplyFilter}
                        >
                            <div className="grid w-full gap-2 sm:max-w-xs">
                                <Label htmlFor="start-date">Start date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    data-testid="filter-start-date"
                                />
                            </div>
                            <div className="grid w-full gap-2 sm:max-w-xs">
                                <Label htmlFor="end-date">End date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                    data-testid="filter-end-date"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" data-testid="apply-date-filter">
                                    Apply filter
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClearFilter}
                                    data-testid="clear-date-filter"
                                >
                                    Clear
                                </Button>
                            </div>
                        </form>
                        {isFiltered && (
                            <p
                                className="mt-3 text-sm text-muted-foreground"
                                data-testid="active-date-filter"
                            >
                                Showing{' '}
                                {appliedStartDate || '…'} to {appliedEndDate || '…'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {!loading && (
                    <div
                        className="grid gap-4 sm:grid-cols-2"
                        data-testid="account-balance-summary"
                    >
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>
                                    {isFiltered
                                        ? 'Starting Balance (filtered)'
                                        : 'Starting Balance'}
                                </CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="starting-balance"
                                >
                                    {formatCurrency(startingBalance, displayCurrency)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    {isFiltered
                                        ? 'Balance before the first transaction in this date range'
                                        : 'Balance before the earliest transaction'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>
                                    {isFiltered
                                        ? 'Ending Balance (filtered)'
                                        : 'Current Balance'}
                                </CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="current-balance"
                                >
                                    {formatCurrency(currentBalance, displayCurrency)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    {isFiltered
                                        ? 'Balance after the last transaction in this date range'
                                        : 'Balance after all transactions'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {loading ? (
                    <LoadingState
                        variant="skeleton-rows"
                        count={4}
                        label="Loading transactions…"
                        data-testid="account-detail-loading-state"
                    />
                ) : transactions.length === 0 ? (
                    <Card>
                        <CardContent
                            className="py-8 text-center text-muted-foreground"
                            data-testid="no-transactions-message"
                        >
                            {isFiltered
                                ? 'No transactions found in this date range.'
                                : 'No transactions found for this account.'}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {transactions.length} transaction
                                {transactions.length !== 1 ? 's' : ''}
                                {isFiltered ? ' in selected range' : ''} · Sorted by
                                date (newest first) · Running balance after each
                                transaction
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table data-testid="account-transactions-table">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Balance After
                                        </TableHead>
                                        <TableHead>Comments</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction, index) => (
                                        <TableRow
                                            key={transaction.id}
                                            data-testid={`account-tx-row-${transaction.id}`}
                                            data-running-balance={
                                                transaction.running_balance
                                            }
                                            data-tx-date={transaction.date}
                                        >
                                            <TableCell className="font-medium">
                                                {formatDate(transaction.date)}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.category_code ? (
                                                    <div>
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {transaction.category_code}
                                                        </span>
                                                        {transaction.category_name && (
                                                            <div className="text-sm">
                                                                {transaction.category_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-medium tabular-nums ${amountToneClass(
                                                    cashflowAmount(transaction),
                                                )}`}
                                                data-testid={`account-tx-amount-${transaction.id}`}
                                                data-signed-amount={cashflowAmount(
                                                    transaction,
                                                )}
                                                data-amount-tone={
                                                    cashflowAmount(transaction) >= 0
                                                        ? 'positive'
                                                        : 'negative'
                                                }
                                            >
                                                {formatSignedCurrency(
                                                    cashflowAmount(transaction),
                                                    transaction.currency || displayCurrency
                                                )}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-semibold ${
                                                    index === 0
                                                        ? 'text-foreground'
                                                        : ''
                                                }`}
                                                data-testid={
                                                    index === 0
                                                        ? 'final-running-balance'
                                                        : undefined
                                                }
                                            >
                                                {formatCurrency(
                                                    transaction.running_balance,
                                                    transaction.currency || displayCurrency
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {transaction.comments || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow
                                        className="bg-muted/40"
                                        data-testid="starting-balance-row"
                                    >
                                        <TableCell
                                            colSpan={3}
                                            className="font-medium text-muted-foreground"
                                        >
                                            Starting balance
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(
                                                startingBalance,
                                                displayCurrency
                                            )}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </PageContainer>
        </>
    );
}

AccountDetail.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: '/dashboard',
        },
        {
            title: 'Accounts',
            href: '/accounts',
        },
        {
            title: 'Details',
            href: '#',
        },
    ],
};

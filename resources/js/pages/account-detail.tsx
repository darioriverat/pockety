import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
    };
}

const formatCurrency = (value: number, currency: string): string => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${currency} ${value.toFixed(2)}`;
    }
};

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const fetchTransactions = async () => {
        if (!accountId) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/accounts/${accountId}/transactions`);

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data: TransactionsResponse = await response.json();
            setTransactions(data.data || []);
            setStartingBalance(data.meta.starting_balance ?? 0);
            setCurrentBalance(data.meta.current_balance ?? 0);
            setCurrency(data.meta.currency || account?.primary_currency || 'CAD');
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <>
                <Head title="Account Details" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
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
                </div>
            </>
        );
    }

    const displayCurrency = currency || account?.primary_currency || 'CAD';

    return (
        <>
            <Head title={account ? account.name : 'Account Details'} />
            <div
                className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
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
                        <div className="mt-2 flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            <h1 className="text-3xl font-bold tracking-tight">
                                {account?.name || 'Loading...'}
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            Transaction history with running balance
                        </p>
                    </div>
                </div>

                {!loading && (
                    <div
                        className="grid gap-4 sm:grid-cols-2"
                        data-testid="account-balance-summary"
                    >
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Starting Balance</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="starting-balance"
                                >
                                    {formatCurrency(startingBalance, displayCurrency)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Balance before the earliest transaction
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Current Balance</CardDescription>
                                <CardTitle
                                    className="text-2xl"
                                    data-testid="current-balance"
                                >
                                    {formatCurrency(currentBalance, displayCurrency)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    Balance after all transactions
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
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No transactions found for this account.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {transactions.length} transaction
                                {transactions.length !== 1 ? 's' : ''} · Sorted by
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
                                            <TableCell className="text-right font-medium text-destructive">
                                                −
                                                {formatCurrency(
                                                    transaction.amount,
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
            </div>
        </>
    );
}

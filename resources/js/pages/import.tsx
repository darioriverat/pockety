import { Head } from '@inertiajs/react';
import { useState } from 'react';
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
import { Upload, CheckCircle, XCircle, Database } from 'lucide-react';

interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

interface AccountImportResult {
    accounts_created: number;
    accounts_updated: number;
    balances_imported: number;
    transactions_linked: number;
    accounts: string[];
    errors: string[];
}

interface ImportStatistics {
    total: number;
    by_period: Record<string, number>;
    by_currency: {
        cad: number;
        usd: number;
        cop: number;
    };
}

interface AccountImportStatistics {
    total: number;
    by_type: Record<string, number>;
}

export default function Import() {
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<ImportStatistics | null>(
        null,
    );
    const [loadingStats, setLoadingStats] = useState(false);

    const [importingAccounts, setImportingAccounts] = useState(false);
    const [accountResult, setAccountResult] =
        useState<AccountImportResult | null>(null);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [accountStatistics, setAccountStatistics] =
        useState<AccountImportStatistics | null>(null);
    const [loadingAccountStats, setLoadingAccountStats] = useState(false);

    const handleImport = async () => {
        setImporting(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/transactions/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    file_path: 'gastos_ledger_2025_2026.json',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Import failed');
            }

            setResult(data.data);
            // Refresh statistics after import
            fetchStatistics();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setImporting(false);
        }
    };

    const fetchStatistics = async () => {
        setLoadingStats(true);
        try {
            const response = await fetch(
                '/api/transactions/import/statistics',
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const data = await response.json();
            setStatistics(data.data);
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleClear = async () => {
        if (
            !confirm(
                'Are you sure you want to clear all transactions? This action cannot be undone.',
            )
        ) {
            return;
        }

        try {
            const response = await fetch('/api/transactions/import/clear', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (response.ok) {
                setResult(null);
                setStatistics(null);
                alert('All transactions cleared successfully');
            }
        } catch (err) {
            alert('Failed to clear transactions');
        }
    };

    const handleAccountImport = async () => {
        setImportingAccounts(true);
        setAccountError(null);
        setAccountResult(null);

        try {
            const response = await fetch('/api/accounts/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    directory: 'month_sheets',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Account import failed');
            }

            setAccountResult(data.data);
            fetchAccountStatistics();
        } catch (err) {
            setAccountError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setImportingAccounts(false);
        }
    };

    const fetchAccountStatistics = async () => {
        setLoadingAccountStats(true);
        try {
            const response = await fetch('/api/accounts/import/statistics', {
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();
            setAccountStatistics(data.data);
        } catch (err) {
            console.error('Failed to fetch account statistics:', err);
        } finally {
            setLoadingAccountStats(false);
        }
    };

    // Load statistics on mount
    useState(() => {
        fetchStatistics();
        fetchAccountStatistics();
    });

    return (
        <>
            <Head title="Import Historical Data" />

            <div className="container mx-auto py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">
                        Import Historical Data
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Import accounts and transactions from the extracted
                        spreadsheet data
                    </p>
                </div>

                {/* Account Import Card */}
                <Card data-testid="account-import-card">
                    <CardHeader>
                        <CardTitle>Historical Account Import</CardTitle>
                        <CardDescription>
                            Import known accounts from month_sheets JSON files.
                            This will:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>
                                    Collect bank and liability accounts across
                                    all 21 months
                                </li>
                                <li>
                                    Rename stale &quot;Crédito Móvil **6174&quot;
                                    to &quot;Personal LOAN CIBC&quot;
                                </li>
                                <li>
                                    Ensure Colombian Éxito liability is present
                                </li>
                                <li>
                                    Import recorded balances and link Ford
                                    Escape payments
                                </li>
                            </ul>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <Button
                                onClick={handleAccountImport}
                                disabled={importingAccounts}
                                size="lg"
                                data-testid="import-accounts-button"
                            >
                                {importingAccounts ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Importing Accounts...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import Accounts
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={fetchAccountStatistics}
                                disabled={loadingAccountStats}
                                variant="outline"
                                size="lg"
                            >
                                {loadingAccountStats ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                Refresh Account Stats
                            </Button>
                        </div>

                        {accountResult && (
                            <Alert
                                className={
                                    accountResult.errors.length > 0
                                        ? 'border-yellow-500'
                                        : 'border-green-500'
                                }
                                data-testid="account-import-result"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            Account Import Completed
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="default">
                                                Created:{' '}
                                                {accountResult.accounts_created}
                                            </Badge>
                                            <Badge variant="secondary">
                                                Updated:{' '}
                                                {accountResult.accounts_updated}
                                            </Badge>
                                            <Badge variant="outline">
                                                Balances:{' '}
                                                {
                                                    accountResult.balances_imported
                                                }
                                            </Badge>
                                            <Badge variant="outline">
                                                Linked txs:{' '}
                                                {
                                                    accountResult.transactions_linked
                                                }
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {accountResult.accounts.length}{' '}
                                            accounts available
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {accountError && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {accountError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {accountStatistics && (
                            <div className="rounded-md border p-4">
                                <p className="text-2xl font-bold">
                                    {accountStatistics.total}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Active Accounts
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.entries(
                                        accountStatistics.by_type,
                                    ).map(([type, count]) => (
                                        <Badge key={type} variant="outline">
                                            {type}: {count}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Import Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historical Transaction Import</CardTitle>
                        <CardDescription>
                            Import 2,631 transactions from the historical data
                            file. This will:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Skip template rows (rows without dates)</li>
                                <li>
                                    Map C040 category to C031 (category merge)
                                </li>
                                <li>
                                    Detect debt principal/interest from comments
                                </li>
                                <li>
                                    Import transactions for periods 2025-2026
                                </li>
                            </ul>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <Button
                                onClick={handleImport}
                                disabled={importing}
                                size="lg"
                            >
                                {importing ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Start Import
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={fetchStatistics}
                                disabled={loadingStats}
                                variant="outline"
                                size="lg"
                            >
                                {loadingStats ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                Refresh Statistics
                            </Button>

                            <Button
                                onClick={handleClear}
                                variant="destructive"
                                size="lg"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Clear All Transactions
                            </Button>
                        </div>

                        {/* Import Results */}
                        {result && (
                            <Alert
                                className={
                                    result.errors.length > 0
                                        ? 'border-yellow-500'
                                        : 'border-green-500'
                                }
                            >
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            Import Completed
                                        </p>
                                        <div className="flex gap-4">
                                            <Badge variant="default">
                                                Imported: {result.imported}
                                            </Badge>
                                            <Badge variant="secondary">
                                                Skipped: {result.skipped}
                                            </Badge>
                                            {result.errors.length > 0 && (
                                                <Badge variant="destructive">
                                                    Errors:{' '}
                                                    {result.errors.length}
                                                </Badge>
                                            )}
                                        </div>
                                        {result.errors.length > 0 && (
                                            <div className="mt-4">
                                                <p className="font-semibold text-sm">
                                                    Errors:
                                                </p>
                                                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                                    {result.errors
                                                        .slice(0, 10)
                                                        .map((err, idx) => (
                                                            <li key={idx}>
                                                                {err}
                                                            </li>
                                                        ))}
                                                    {result.errors.length >
                                                        10 && (
                                                        <li>
                                                            ... and{' '}
                                                            {result.errors
                                                                .length - 10}{' '}
                                                            more errors
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Statistics Card */}
                {statistics && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Statistics</CardTitle>
                            <CardDescription>
                                Current database statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-2xl font-bold">
                                    {statistics.total.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total Transactions
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">
                                    By Currency
                                </h3>
                                <div className="flex gap-4">
                                    <Badge variant="outline">
                                        CAD: {statistics.by_currency.cad}
                                    </Badge>
                                    <Badge variant="outline">
                                        USD: {statistics.by_currency.usd}
                                    </Badge>
                                    <Badge variant="outline">
                                        COP: {statistics.by_currency.cop}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">
                                    By Period
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(statistics.by_period).map(
                                        ([period, count]) => (
                                            <Badge
                                                key={period}
                                                variant="secondary"
                                            >
                                                {period}: {count}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

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

interface BalanceSheetSnapshot {
    period: string;
    assets_cad: number;
    liabilities_cad: number;
    equity_cad: number;
}

interface BalanceSheetImportResult {
    periods_imported: number;
    periods: string[];
    snapshots: BalanceSheetSnapshot[];
    errors: string[];
}

interface BalanceSheetImportStatistics {
    total: number;
    periods_covered: {
        min: string | null;
        max: string | null;
    };
    snapshots: BalanceSheetSnapshot[];
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

function formatCad(value: number): string {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
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

    const [importingBalanceSheet, setImportingBalanceSheet] = useState(false);
    const [balanceSheetResult, setBalanceSheetResult] =
        useState<BalanceSheetImportResult | null>(null);
    const [balanceSheetError, setBalanceSheetError] = useState<string | null>(
        null,
    );
    const [balanceSheetStatistics, setBalanceSheetStatistics] =
        useState<BalanceSheetImportStatistics | null>(null);
    const [loadingBalanceSheetStats, setLoadingBalanceSheetStats] =
        useState(false);
    const [selectedBalanceSheetFile, setSelectedBalanceSheetFile] = useState(
        'estado_financiero_2025_2026.json',
    );

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

    const handleBalanceSheetImport = async () => {
        if (
            !confirm(
                `Import balance sheet history from ${selectedBalanceSheetFile}?`,
            )
        ) {
            return;
        }

        setImportingBalanceSheet(true);
        setBalanceSheetError(null);
        setBalanceSheetResult(null);

        try {
            const response = await fetch('/api/balance-sheet/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    file_path: selectedBalanceSheetFile,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Balance sheet import failed');
            }

            setBalanceSheetResult(data.data);
            fetchBalanceSheetStatistics();
        } catch (err) {
            setBalanceSheetError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setImportingBalanceSheet(false);
        }
    };

    const fetchBalanceSheetStatistics = async () => {
        setLoadingBalanceSheetStats(true);
        try {
            const response = await fetch(
                '/api/balance-sheet/import/statistics',
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const data = await response.json();
            setBalanceSheetStatistics(data.data);
        } catch (err) {
            console.error('Failed to fetch balance sheet statistics:', err);
        } finally {
            setLoadingBalanceSheetStats(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
        fetchAccountStatistics();
        fetchBalanceSheetStatistics();
    }, []);

    const balanceSheetSnapshots =
        balanceSheetResult?.snapshots ??
        balanceSheetStatistics?.snapshots ??
        [];

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

                {/* Balance Sheet History Import Card */}
                <Card data-testid="balance-sheet-import-card">
                    <CardHeader>
                        <CardTitle>Import Balance Sheet History</CardTitle>
                        <CardDescription>
                            Import Assets / Liabilities / Equity totals from
                            the Estado Financiero source file. This will:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>
                                    Load every period present in
                                    estado_financiero_2025_2026.json
                                </li>
                                <li>
                                    Store CAD totals for Assets, Liabilities,
                                    and Equity
                                </li>
                                <li>
                                    Normalize floating-point noise near zero
                                </li>
                            </ul>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="balance-sheet-file"
                                className="text-sm font-medium"
                            >
                                Source file
                            </label>
                            <select
                                id="balance-sheet-file"
                                data-testid="balance-sheet-file-select"
                                className="flex h-10 w-full max-w-lg rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedBalanceSheetFile}
                                onChange={(event) =>
                                    setSelectedBalanceSheetFile(
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="estado_financiero_2025_2026.json">
                                    estado_financiero_2025_2026.json
                                </option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={handleBalanceSheetImport}
                                disabled={importingBalanceSheet}
                                size="lg"
                                data-testid="import-balance-sheet-button"
                            >
                                {importingBalanceSheet ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Importing Balance Sheet History...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import Balance Sheet History
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={fetchBalanceSheetStatistics}
                                disabled={loadingBalanceSheetStats}
                                variant="outline"
                                size="lg"
                                data-testid="refresh-balance-sheet-stats"
                            >
                                {loadingBalanceSheetStats ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                ) : (
                                    <Database className="mr-2 h-4 w-4" />
                                )}
                                Refresh Balance Sheet Stats
                            </Button>
                        </div>

                        {balanceSheetResult && (
                            <Alert
                                className={
                                    balanceSheetResult.errors.length > 0
                                        ? 'border-yellow-500'
                                        : 'border-green-500'
                                }
                                data-testid="balance-sheet-import-result"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            Balance Sheet History Import
                                            Completed
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant="default"
                                                data-testid="balance-sheet-periods-imported"
                                            >
                                                Periods imported:{' '}
                                                {
                                                    balanceSheetResult.periods_imported
                                                }
                                            </Badge>
                                            {balanceSheetResult.errors
                                                .length > 0 && (
                                                <Badge variant="destructive">
                                                    Errors:{' '}
                                                    {
                                                        balanceSheetResult
                                                            .errors.length
                                                    }
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {balanceSheetError && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {balanceSheetError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {balanceSheetStatistics && (
                            <div
                                className="rounded-md border p-4"
                                data-testid="balance-sheet-import-stats"
                            >
                                <p
                                    className="text-2xl font-bold"
                                    data-testid="balance-sheet-total-periods"
                                >
                                    {balanceSheetStatistics.total}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Historical Balance Sheet Periods
                                    {balanceSheetStatistics.periods_covered
                                        .min &&
                                        balanceSheetStatistics.periods_covered
                                            .max && (
                                            <>
                                                {' '}
                                                (
                                                {
                                                    balanceSheetStatistics
                                                        .periods_covered.min
                                                }{' '}
                                                →{' '}
                                                {
                                                    balanceSheetStatistics
                                                        .periods_covered.max
                                                }
                                                )
                                            </>
                                        )}
                                </p>
                            </div>
                        )}

                        {balanceSheetSnapshots.length > 0 && (
                            <div className="overflow-x-auto rounded-md border">
                                <table
                                    className="min-w-full text-sm"
                                    data-testid="balance-sheet-import-table"
                                >
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">
                                                Period
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Assets
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Liabilities
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Equity
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {balanceSheetSnapshots.map(
                                            (snapshot) => (
                                                <tr
                                                    key={snapshot.period}
                                                    data-testid={`balance-sheet-row-${snapshot.period}`}
                                                    className="border-t"
                                                >
                                                    <td className="px-3 py-2 font-medium">
                                                        {snapshot.period}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 text-right"
                                                        data-testid={`assets-${snapshot.period}`}
                                                    >
                                                        {formatCad(
                                                            snapshot.assets_cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 text-right"
                                                        data-testid={`liabilities-${snapshot.period}`}
                                                    >
                                                        {formatCad(
                                                            snapshot.liabilities_cad,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 text-right"
                                                        data-testid={`equity-${snapshot.period}`}
                                                    >
                                                        {formatCad(
                                                            snapshot.equity_cad,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
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

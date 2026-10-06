import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
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
import { formatDisplayCurrency } from '@/lib/currency';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
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
    return formatDisplayCurrency(value, 'CAD');
}

function apiErrorMessage(data: unknown, fallback: string): string {
    if (!data || typeof data !== 'object') {
        return fallback;
    }

    const payload = data as {
        message?: string;
        errors?: Record<string, string[]>;
    };

    if (payload.message) {
        return payload.message;
    }

    const firstError = Object.values(payload.errors ?? {})[0]?.[0];

    return firstError ?? fallback;
}

export default function Import() {
    const { t } = useTranslation();

    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [transactionFile, setTransactionFile] = useState<File | null>(null);
    const [statistics, setStatistics] = useState<ImportStatistics | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const transactionInputRef = useRef<HTMLInputElement>(null);

    const [importingAccounts, setImportingAccounts] = useState(false);
    const [accountResult, setAccountResult] =
        useState<AccountImportResult | null>(null);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [accountFiles, setAccountFiles] = useState<File[]>([]);
    const [accountStatistics, setAccountStatistics] =
        useState<AccountImportStatistics | null>(null);
    const [loadingAccountStats, setLoadingAccountStats] = useState(false);
    const accountInputRef = useRef<HTMLInputElement>(null);

    const [importingBalanceSheet, setImportingBalanceSheet] = useState(false);
    const [balanceSheetResult, setBalanceSheetResult] =
        useState<BalanceSheetImportResult | null>(null);
    const [balanceSheetError, setBalanceSheetError] = useState<string | null>(
        null,
    );
    const [balanceSheetFile, setBalanceSheetFile] = useState<File | null>(null);
    const [balanceSheetStatistics, setBalanceSheetStatistics] =
        useState<BalanceSheetImportStatistics | null>(null);
    const [loadingBalanceSheetStats, setLoadingBalanceSheetStats] =
        useState(false);
    const balanceSheetInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async () => {
        if (!transactionFile) {
            setError('Please choose a .json or .csv file to import.');
            return;
        }

        setImporting(true);
        setError(null);
        setResult(null);

        try {
            const body = new FormData();
            body.append('file', transactionFile);

            const response = await fetch('/api/transactions/import', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(apiErrorMessage(data, 'Import failed'));
            }

            setResult(data.data);
            void fetchStatistics();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
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
        } catch {
            alert('Failed to clear transactions');
        }
    };

    const handleAccountImport = async () => {
        if (accountFiles.length === 0) {
            setAccountError(
                'Please choose one or more .json month-sheet files to import.',
            );
            return;
        }

        setImportingAccounts(true);
        setAccountError(null);
        setAccountResult(null);

        try {
            const body = new FormData();
            accountFiles.forEach((file) => {
                body.append('files[]', file);
            });

            const response = await fetch('/api/accounts/import', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(apiErrorMessage(data, 'Account import failed'));
            }

            setAccountResult(data.data);
            void fetchAccountStatistics();
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
        if (!balanceSheetFile) {
            setBalanceSheetError(
                'Please choose a .json balance sheet file to import.',
            );
            return;
        }

        setImportingBalanceSheet(true);
        setBalanceSheetError(null);
        setBalanceSheetResult(null);

        try {
            const body = new FormData();
            body.append('file', balanceSheetFile);

            const response = await fetch('/api/balance-sheet/import', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    apiErrorMessage(data, 'Balance sheet import failed'),
                );
            }

            setBalanceSheetResult(data.data);
            void fetchBalanceSheetStatistics();
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
        void fetchStatistics();
        void fetchAccountStatistics();
        void fetchBalanceSheetStatistics();
    }, []);

    const balanceSheetSnapshots =
        balanceSheetResult?.snapshots ??
        balanceSheetStatistics?.snapshots ??
        [];

    return (
        <>
            <Head title={t('pages.import.title')} />

            <PageContainer>
                <PageTitle
                    title={t('pages.import.title')}
                    description="Upload your own transaction, account, and balance sheet files"
                />

                <Card data-testid="transaction-import-card">
                    <CardHeader>
                        <CardTitle>{t('pages.import.transactions')}</CardTitle>
                        <CardDescription>
                            Upload one .json or .csv file. JSON rows use fecha,
                            periodo, concepto_code, nested cad/usd/cop values,
                            and comentarios. CSV uses the same columns as a flat
                            header.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-lg space-y-2">
                            <Label htmlFor="transaction-file-input">
                                Transaction file
                            </Label>
                            <Input
                                id="transaction-file-input"
                                ref={transactionInputRef}
                                type="file"
                                accept=".json,.csv,application/json,text/csv"
                                data-testid="transaction-file-input"
                                onChange={(event) => {
                                    setTransactionFile(
                                        event.target.files?.[0] ?? null,
                                    );
                                    setError(null);
                                }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={handleImport}
                                disabled={importing}
                                size="lg"
                                data-testid="import-transactions-button"
                            >
                                {importing ? (
                                    <>
                                        <Spinner className="size-4 shrink-0 fill-none" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-4 shrink-0 fill-none" />
                                        Import Transactions
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
                                    <Spinner className="size-4 shrink-0 fill-none" />
                                ) : (
                                    <Database className="size-4 shrink-0 fill-none" />
                                )}
                                Refresh Statistics
                            </Button>

                            <Button
                                onClick={handleClear}
                                variant="destructive"
                                size="lg"
                            >
                                <XCircle className="size-4 shrink-0 fill-none" />
                                Clear All Transactions
                            </Button>
                        </div>

                        {result && (
                            <Alert
                                className={
                                    result.errors.length > 0
                                        ? 'border-yellow-500'
                                        : 'border-green-500'
                                }
                                data-testid="transaction-import-result"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-semibold">
                                            Import Completed
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant="default"
                                                data-testid="transactions-imported"
                                            >
                                                Imported: {result.imported}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                data-testid="transactions-skipped"
                                            >
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
                                                <p className="text-sm font-semibold">
                                                    Errors:
                                                </p>
                                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
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
                                                                .length -
                                                                10}{' '}
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

                        {error && (
                            <Alert
                                variant="destructive"
                                data-testid="transaction-import-error"
                            >
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card data-testid="account-import-card">
                    <CardHeader>
                        <CardTitle>{t('pages.import.accounts')}</CardTitle>
                        <CardDescription>
                            Upload one or more month-sheet .json files. Each
                            file needs header.period.value and
                            sections.Cuentas.items with recorded balances.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-lg space-y-2">
                            <Label htmlFor="account-file-input">
                                Month-sheet files
                            </Label>
                            <Input
                                id="account-file-input"
                                ref={accountInputRef}
                                type="file"
                                accept=".json,application/json"
                                multiple
                                data-testid="account-file-input"
                                onChange={(event) => {
                                    setAccountFiles(
                                        Array.from(event.target.files ?? []),
                                    );
                                    setAccountError(null);
                                }}
                            />
                            <p className="text-muted-foreground text-sm">
                                You can select multiple .json files at once.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={handleAccountImport}
                                disabled={importingAccounts}
                                size="lg"
                                data-testid="import-accounts-button"
                            >
                                {importingAccounts ? (
                                    <>
                                        <Spinner className="size-4 shrink-0 fill-none" />
                                        Importing Accounts...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-4 shrink-0 fill-none" />
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
                                    <Spinner className="size-4 shrink-0 fill-none" />
                                ) : (
                                    <Database className="size-4 shrink-0 fill-none" />
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
                                        <p className="text-muted-foreground text-sm">
                                            {accountResult.accounts.length}{' '}
                                            accounts available
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {accountError && (
                            <Alert
                                variant="destructive"
                                data-testid="account-import-error"
                            >
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
                                <p className="text-muted-foreground text-sm">
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

                <Card data-testid="balance-sheet-import-card">
                    <CardHeader>
                        <CardTitle>{t('pages.import.balanceSheet')}</CardTitle>
                        <CardDescription>
                            Upload one .json file containing an array of period
                            rows with periodo, activo_value, pasivo_value, and
                            patrimonio_value.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-lg space-y-2">
                            <Label htmlFor="balance-sheet-file-input">
                                Balance sheet file
                            </Label>
                            <Input
                                id="balance-sheet-file-input"
                                ref={balanceSheetInputRef}
                                type="file"
                                accept=".json,application/json"
                                data-testid="balance-sheet-file-input"
                                onChange={(event) => {
                                    setBalanceSheetFile(
                                        event.target.files?.[0] ?? null,
                                    );
                                    setBalanceSheetError(null);
                                }}
                            />
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
                                        <Spinner className="size-4 shrink-0 fill-none" />
                                        Importing Balance Sheet History...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="size-4 shrink-0 fill-none" />
                                        Import Balance Sheet
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
                                    <Spinner className="size-4 shrink-0 fill-none" />
                                ) : (
                                    <Database className="size-4 shrink-0 fill-none" />
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
                                            {balanceSheetResult.errors.length >
                                                0 && (
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
                            <Alert
                                variant="destructive"
                                data-testid="balance-sheet-import-error"
                            >
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
                                <p className="text-muted-foreground text-sm">
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
                                <p className="text-muted-foreground text-sm">
                                    Total Transactions
                                </p>
                            </div>

                            <div>
                                <h3 className="mb-2 font-semibold">
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
                                <h3 className="mb-2 font-semibold">
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
            </PageContainer>
        </>
    );
}

Import.layout = {
    breadcrumbs: [
        {
            title: 'Import',
            titleKey: 'nav.import',
            href: '/import',
        },
    ],
};

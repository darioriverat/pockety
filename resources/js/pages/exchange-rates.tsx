import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
import { PageTitle } from '@/components/page-title';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Upload,
    CheckCircle,
    XCircle,
    DollarSign,
    TrendingUp,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePeriod } from '@/hooks/use-period';
import { formatPeriod, generatePeriods } from '@/lib/periods';

interface ExchangeRate {
    id: number;
    period: string;
    usd_cop: string;
    usd_cad: string;
    cad_cop: string;
    created_at: string;
    updated_at: string;
}

interface ExchangeRateImportResult {
    rates_imported: number;
    periods: string[];
    errors: string[];
}

interface ExchangeRateStatistics {
    total_rates: number;
    periods_covered: {
        min: string | null;
        max: string | null;
    };
    rates_by_month: Record<
        string,
        {
            usd_cop: string;
            usd_cad: string;
            cad_cop: string;
        }
    >;
}

export default function ExchangeRates() {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } =
        usePeriod();
    const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
    const [loadingRate, setLoadingRate] = useState(false);

    // Form state
    const [usdCop, setUsdCop] = useState<string>('4400');
    const [usdCad, setUsdCad] = useState<string>('0.75');
    const [cadCop, setCadCop] = useState<string>('3000');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Import state
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] =
        useState<ExchangeRateImportResult | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [statistics, setStatistics] =
        useState<ExchangeRateStatistics | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const periods = generatePeriods();

    useEffect(() => {
        fetchAllRates();
        fetchStatistics();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            fetchRateForPeriod(selectedPeriod);
        }
    }, [selectedPeriod]);

    const fetchAllRates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/exchange-rates', {
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await response.json();
            setRates(data.data);
        } catch (err) {
            console.error('Failed to fetch exchange rates:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRateForPeriod = async (period: string) => {
        setLoadingRate(true);
        try {
            const response = await fetch(
                `/api/exchange-rates/show?period=${period}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            const data = await response.json();

            if (response.ok && data.data) {
                setCurrentRate(data.data);
                setUsdCop(data.data.usd_cop);
                setUsdCad(data.data.usd_cad);
                setCadCop(data.data.cad_cop);
            } else {
                setCurrentRate(null);
                // Set default values
                setUsdCop('4400');
                setUsdCad('0.75');
                setCadCop('3000');
            }
        } catch (err) {
            console.error('Failed to fetch rate for period:', err);
            setCurrentRate(null);
        } finally {
            setLoadingRate(false);
        }
    };

    const fetchStatistics = async () => {
        setLoadingStats(true);
        try {
            const response = await fetch(
                '/api/exchange-rates/import/statistics',
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

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const response = await fetch('/api/exchange-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    period: selectedPeriod,
                    usd_cop: parseFloat(usdCop),
                    usd_cad: parseFloat(usdCad),
                    cad_cop: parseFloat(cadCop),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.messages
                    ? Object.values(data.messages).flat().join(' ')
                    : data.message || 'Failed to save exchange rates';
                throw new Error(message);
            }

            setSaveSuccess(true);
            setCurrentRate(data.data);
            fetchAllRates();
            fetchStatistics();

            // Clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleImport = async () => {
        setImporting(true);
        setImportError(null);
        setImportResult(null);

        try {
            const response = await fetch('/api/exchange-rates/import', {
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
                throw new Error(data.message || 'Import failed');
            }

            setImportResult(data.data);
            fetchAllRates();
            fetchStatistics();
            if (selectedPeriod) {
                fetchRateForPeriod(selectedPeriod);
            }
        } catch (err) {
            setImportError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <Head title="Exchange Rates" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <PageTitle
                            title="Exchange Rates"
                            description="Manage three independent exchange rate series: USD/COP, USD/CAD, and CAD/COP (COP per 1 CAD)"
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Import Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Import Historical Rates
                                </CardTitle>
                                <CardDescription>
                                    Import exchange rates from month_sheets JSON files
                                    (Jan 2025 - Sep 2026)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="w-full"
                                >
                                    {importing && <Spinner className="mr-2" />}
                                    Import from Month Sheets
                                </Button>

                                {importResult && (
                                    <Alert>
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Successfully imported{' '}
                                            {importResult.rates_imported} exchange rate
                                            periods
                                            {importResult.errors.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="font-semibold">Errors:</p>
                                                    <ul className="list-disc pl-4">
                                                        {importResult.errors.map(
                                                            (error, index) => (
                                                                <li key={index}>{error}</li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {importError && (
                                    <Alert variant="destructive">
                                        <XCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {importError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {loadingStats ? (
                                    <div className="flex justify-center">
                                        <Spinner />
                                    </div>
                                ) : (
                                    statistics && (
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                <strong>Total Rates:</strong>{' '}
                                                {statistics.total_rates}
                                            </p>
                                            {statistics.periods_covered.min && (
                                                <p>
                                                    <strong>Period Coverage:</strong>{' '}
                                                    {formatPeriod(
                                                        statistics.periods_covered.min,
                                                    )}{' '}
                                                    -{' '}
                                                    {formatPeriod(
                                                        statistics.periods_covered.max!,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Set Exchange Rates Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Set Exchange Rates
                                </CardTitle>
                                <CardDescription>
                                    Enter or update exchange rates for a specific
                                    period
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
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
                                                <SelectItem key={period} value={period}>
                                                    {formatPeriod(period)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {loadingRate ? (
                                    <div className="flex justify-center py-4">
                                        <Spinner />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="usd_cop">
                                                USD/COP (COP per 1 USD)
                                            </Label>
                                            <Input
                                                id="usd_cop"
                                                type="number"
                                                step="0.0001"
                                                value={usdCop}
                                                onChange={(e) => setUsdCop(e.target.value)}
                                                placeholder="4400"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="usd_cad">
                                                USD/CAD (CAD per 1 USD)
                                            </Label>
                                            <Input
                                                id="usd_cad"
                                                type="number"
                                                step="0.0001"
                                                value={usdCad}
                                                onChange={(e) => setUsdCad(e.target.value)}
                                                placeholder="0.75"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cad_cop">
                                                CAD/COP (COP per 1 CAD)
                                            </Label>
                                            <Input
                                                id="cad_cop"
                                                type="number"
                                                step="0.0001"
                                                value={cadCop}
                                                onChange={(e) => setCadCop(e.target.value)}
                                                placeholder="3000"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="w-full"
                                        >
                                            {saving && <Spinner className="mr-2" />}
                                            {currentRate ? 'Update' : 'Save'} Exchange Rates
                                        </Button>

                                        {saveSuccess && (
                                            <Alert>
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Exchange rates saved successfully
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {saveError && (
                                            <Alert variant="destructive">
                                                <XCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    {saveError}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Historical Rates Table */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Historical Exchange Rates
                            </CardTitle>
                            <CardDescription>
                                View all exchange rates by period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            ) : rates.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    No exchange rates found. Import data to get started.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Period
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    USD/COP
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    USD/CAD
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    CAD/COP
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            {rates.map((rate) => (
                                                <tr
                                                    key={rate.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {formatPeriod(rate.period)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {parseFloat(rate.usd_cop).toFixed(4)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {parseFloat(rate.usd_cad).toFixed(4)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {parseFloat(rate.cad_cop).toFixed(4)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ExchangeRates.layout = {
    breadcrumbs: [
        {
            title: 'Exchange Rates',
            href: '/exchange-rates',
        },
    ],
};

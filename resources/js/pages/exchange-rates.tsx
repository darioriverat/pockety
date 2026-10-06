import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
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
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, DollarSign, Link2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { usePeriod } from '@/hooks/use-period';
import { useSelectablePeriods } from '@/hooks/use-selectable-periods';
import { formatPeriod } from '@/lib/periods';

interface ExchangeRateSnapshot {
    id: number;
    rate_date: string;
    source: 'openexchangerates' | 'manual';
    user_id: number | null;
    cad_per_usd: string;
    cop_per_usd: string;
}

interface ExchangeRate {
    id: number;
    period: string;
    snapshot_id: number;
    usd_cop: string | null;
    usd_cad: string | null;
    cad_cop: string | null;
    cad_per_usd: string | null;
    cop_per_usd: string | null;
    snapshot?: ExchangeRateSnapshot;
}

function lastDayOfPeriod(period: string): string {
    const year = Number(period.slice(0, 4));
    const month = Number(period.slice(4, 6));
    const date = new Date(year, month, 0);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function periodBounds(period: string): { from: string; to: string } {
    const year = period.slice(0, 4);
    const month = period.slice(4, 6);
    return {
        from: `${year}-${month}-01`,
        to: lastDayOfPeriod(period),
    };
}

export default function ExchangeRates() {
    const { t } = useTranslation();
    const { period: selectedPeriod, setPeriod: setSelectedPeriod } = usePeriod();
    const periods = useSelectablePeriods();

    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [snapshots, setSnapshots] = useState<ExchangeRateSnapshot[]>([]);
    const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingRate, setLoadingRate] = useState(false);

    const [manualDate, setManualDate] = useState('');
    const [cadPerUsd, setCadPerUsd] = useState('');
    const [copPerUsd, setCopPerUsd] = useState('');
    const [savingManual, setSavingManual] = useState(false);
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualSuccess, setManualSuccess] = useState(false);

    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignSuccess, setAssignSuccess] = useState(false);

    const bounds = useMemo(
        () => (selectedPeriod ? periodBounds(selectedPeriod) : null),
        [selectedPeriod],
    );

    useEffect(() => {
        fetchAllRates();
    }, []);

    useEffect(() => {
        if (!selectedPeriod) {
            return;
        }
        setManualDate(lastDayOfPeriod(selectedPeriod));
        fetchRateForPeriod(selectedPeriod);
        fetchSnapshotsForPeriod(selectedPeriod);
    }, [selectedPeriod]);

    const fetchAllRates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/exchange-rates', {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();
            setRates(data.data ?? []);
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
                { headers: { Accept: 'application/json' } },
            );
            const data = await response.json();
            if (response.ok && data.data) {
                setCurrentRate(data.data);
                setSelectedSnapshotId(String(data.data.snapshot_id));
            } else {
                setCurrentRate(null);
                setSelectedSnapshotId('');
            }
        } catch (err) {
            console.error('Failed to fetch rate for period:', err);
            setCurrentRate(null);
        } finally {
            setLoadingRate(false);
        }
    };

    const fetchSnapshotsForPeriod = async (period: string) => {
        try {
            const response = await fetch(
                `/api/exchange-rate-snapshots?period=${period}`,
                { headers: { Accept: 'application/json' } },
            );
            const data = await response.json();
            let rows: ExchangeRateSnapshot[] = data.data ?? [];

            // Allow nearby dates (e.g. last day of month) even if filter is empty.
            if (rows.length === 0 && bounds) {
                const nearby = await fetch(
                    `/api/exchange-rate-snapshots?from=${bounds.from}&to=${bounds.to}`,
                    { headers: { Accept: 'application/json' } },
                );
                const nearbyData = await nearby.json();
                rows = nearbyData.data ?? [];
            }

            // Also load a wider window so nearby dates outside the month can be chosen.
            const wide = await fetch('/api/exchange-rate-snapshots', {
                headers: { Accept: 'application/json' },
            });
            const wideData = await wide.json();
            const byId = new Map<number, ExchangeRateSnapshot>();
            for (const row of [...rows, ...(wideData.data ?? [])]) {
                byId.set(row.id, row);
            }
            setSnapshots(Array.from(byId.values()).sort((a, b) =>
                a.rate_date < b.rate_date ? 1 : -1,
            ));
        } catch (err) {
            console.error('Failed to fetch snapshots:', err);
        }
    };

    const handleSaveManual = async () => {
        setSavingManual(true);
        setManualError(null);
        setManualSuccess(false);

        try {
            const response = await fetch('/api/exchange-rate-snapshots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    rate_date: manualDate,
                    cad_per_usd: parseFloat(cadPerUsd),
                    cop_per_usd: parseFloat(copPerUsd),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                const message = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || t('pages.exchangeRates.manualSaveFailed');
                throw new Error(message);
            }
            setManualSuccess(true);
            setSelectedSnapshotId(String(data.data.id));
            if (selectedPeriod) {
                await fetchSnapshotsForPeriod(selectedPeriod);
            }
            setTimeout(() => setManualSuccess(false), 3200);
        } catch (err) {
            setManualError(
                err instanceof Error
                    ? err.message
                    : t('pages.exchangeRates.manualSaveFailed'),
            );
        } finally {
            setSavingManual(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedPeriod || !selectedSnapshotId) {
            setAssignError(t('pages.exchangeRates.snapshotRequired'));
            return;
        }

        setAssigning(true);
        setAssignError(null);
        setAssignSuccess(false);

        try {
            const response = await fetch('/api/exchange-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    period: selectedPeriod,
                    snapshot_id: Number(selectedSnapshotId),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                const message = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || t('pages.exchangeRates.assignFailed');
                throw new Error(message);
            }
            setAssignSuccess(true);
            setCurrentRate(data.data);
            fetchAllRates();
            setTimeout(() => setAssignSuccess(false), 3200);
        } catch (err) {
            setAssignError(
                err instanceof Error
                    ? err.message
                    : t('pages.exchangeRates.assignFailed'),
            );
        } finally {
            setAssigning(false);
        }
    };

    const periodSnapshots = useMemo(() => {
        if (!bounds) {
            return snapshots;
        }
        const inMonth = snapshots.filter(
            (s) => s.rate_date >= bounds.from && s.rate_date <= bounds.to,
        );
        return inMonth.length > 0 ? inMonth : snapshots;
    }, [snapshots, bounds]);

    return (
        <>
            <Head title={t('pages.exchangeRates.title')} />

            <PageContainer>
                <div className="mb-8">
                    <PageTitle
                        title={t('pages.exchangeRates.title')}
                        description={t('pages.exchangeRates.description')}
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t('pages.exchangeRates.attribution')}{' '}
                        <a
                            href="https://openexchangerates.org/"
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                            data-testid="oxr-attribution-link"
                        >
                            Open Exchange Rates
                        </a>
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                {t('pages.exchangeRates.manualTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('pages.exchangeRates.manualDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rate_date">
                                    {t('pages.exchangeRates.date')}
                                </Label>
                                <Input
                                    id="rate_date"
                                    type="date"
                                    value={manualDate}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    data-testid="manual-rate-date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cad_per_usd">
                                    {t('pages.exchangeRates.cadPerUsd')}
                                </Label>
                                <Input
                                    id="cad_per_usd"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={cadPerUsd}
                                    onChange={(e) => setCadPerUsd(e.target.value)}
                                    placeholder="1.36"
                                    data-testid="manual-cad-per-usd"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cop_per_usd">
                                    {t('pages.exchangeRates.copPerUsd')}
                                </Label>
                                <Input
                                    id="cop_per_usd"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={copPerUsd}
                                    onChange={(e) => setCopPerUsd(e.target.value)}
                                    placeholder="4000"
                                    data-testid="manual-cop-per-usd"
                                />
                            </div>
                            <Button
                                onClick={handleSaveManual}
                                disabled={savingManual}
                                className="w-full"
                                data-testid="save-manual-snapshot"
                            >
                                {savingManual && <Spinner className="mr-2" />}
                                {t('pages.exchangeRates.saveManual')}
                            </Button>
                            {manualSuccess && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {t('pages.exchangeRates.manualSaved')}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {manualError && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>{manualError}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                {t('pages.exchangeRates.assignTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('pages.exchangeRates.assignDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="period">
                                    {t('pages.exchangeRates.period')}
                                </Label>
                                <Select
                                    value={selectedPeriod}
                                    onValueChange={setSelectedPeriod}
                                >
                                    <SelectTrigger
                                        id="period"
                                        data-testid="page-period-selector"
                                    >
                                        <SelectValue
                                            placeholder={t(
                                                'pages.exchangeRates.selectPeriod',
                                            )}
                                        />
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
                                    {!currentRate && (
                                        <Alert data-testid="missing-exchange-rate">
                                            <AlertDescription>
                                                {t(
                                                    'pages.exchangeRates.missingForPeriod',
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="snapshot_id">
                                            {t('pages.exchangeRates.snapshot')}
                                        </Label>
                                        <Select
                                            value={selectedSnapshotId}
                                            onValueChange={setSelectedSnapshotId}
                                        >
                                            <SelectTrigger
                                                id="snapshot_id"
                                                data-testid="snapshot-picker"
                                            >
                                                <SelectValue
                                                    placeholder={t(
                                                        'pages.exchangeRates.selectSnapshot',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {periodSnapshots.map((snap) => (
                                                    <SelectItem
                                                        key={snap.id}
                                                        value={String(snap.id)}
                                                    >
                                                        {snap.rate_date} ·{' '}
                                                        {snap.source === 'manual'
                                                            ? t(
                                                                  'pages.exchangeRates.sourceManual',
                                                              )
                                                            : t(
                                                                  'pages.exchangeRates.sourceFetched',
                                                              )}{' '}
                                                        · CAD {snap.cad_per_usd} / COP{' '}
                                                        {snap.cop_per_usd}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {currentRate && (
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>
                                                {t('pages.exchangeRates.derivedUsdCop')}:{' '}
                                                {currentRate.usd_cop}
                                            </p>
                                            <p>
                                                {t('pages.exchangeRates.derivedUsdCad')}:{' '}
                                                {currentRate.usd_cad}
                                            </p>
                                            <p>
                                                {t('pages.exchangeRates.derivedCadCop')}:{' '}
                                                {currentRate.cad_cop}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleAssign}
                                        disabled={assigning}
                                        className="w-full"
                                        data-testid="assign-snapshot"
                                    >
                                        {assigning && <Spinner className="mr-2" />}
                                        {t('pages.exchangeRates.assign')}
                                    </Button>

                                    {assignSuccess && (
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {t('pages.exchangeRates.assigned')}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {assignError && (
                                        <Alert variant="destructive">
                                            <XCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {assignError}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>
                            {t('pages.exchangeRates.historyTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('pages.exchangeRates.historyDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        ) : rates.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                {t('pages.exchangeRates.noRates')}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                {t('pages.exchangeRates.period')}
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                {t('pages.exchangeRates.cadPerUsd')}
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                {t('pages.exchangeRates.copPerUsd')}
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                {t('pages.exchangeRates.derivedCadCop')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rates.map((rate) => (
                                            <tr key={rate.id}>
                                                <td className="px-4 py-3 text-sm">
                                                    {formatPeriod(rate.period)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {rate.cad_per_usd
                                                        ? parseFloat(
                                                              rate.cad_per_usd,
                                                          ).toFixed(4)
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {rate.cop_per_usd
                                                        ? parseFloat(
                                                              rate.cop_per_usd,
                                                          ).toFixed(4)
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {rate.cad_cop
                                                        ? parseFloat(
                                                              rate.cad_cop,
                                                          ).toFixed(4)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}

ExchangeRates.layout = {
    breadcrumbs: [
        {
            title: 'Exchange Rates',
            titleKey: 'nav.exchangeRates',
            href: '/exchange-rates',
        },
    ],
};

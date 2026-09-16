import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDisplayCurrency } from '@/lib/currency';
import { PlusIcon, Car, Calendar } from 'lucide-react';

interface FixedAsset {
    id: number;
    name: string;
    description: string | null;
    acquisition_date: string | null;
    initial_value_cad: number;
    is_active: boolean;
}

interface FixedAssetFormData {
    name: string;
    description: string;
    acquisition_date: string;
    initial_value_cad: string;
}

interface Valuation {
    id: number;
    fixed_asset_id: number;
    period: string;
    book_value_cad: number;
    depreciation_cad: number;
}

interface ValuationFormData {
    period: string;
    book_value_cad: string;
    depreciation_cad: string;
}

const emptyForm: FixedAssetFormData = {
    name: '',
    description: '',
    acquisition_date: '',
    initial_value_cad: '',
};

const emptyValuationForm: ValuationFormData = {
    period: '',
    book_value_cad: '',
    depreciation_cad: '0',
};

const formatCurrency = (value: number): string =>
    formatDisplayCurrency(value, 'CAD');

const formatPeriod = (period: string): string => {
    if (period.length !== 6) return period;
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

export default function FixedAssets() {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<FixedAssetFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [valuationDialogAsset, setValuationDialogAsset] =
        useState<FixedAsset | null>(null);
    const [valuations, setValuations] = useState<Valuation[]>([]);
    const [valuationsLoading, setValuationsLoading] = useState(false);
    const [valuationForm, setValuationForm] =
        useState<ValuationFormData>(emptyValuationForm);
    const [valuationFormError, setValuationFormError] = useState<
        string | null
    >(null);
    const [valuationSubmitting, setValuationSubmitting] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/fixed-assets');

            if (!response.ok) {
                throw new Error('Failed to fetch fixed assets');
            }

            const data: any = await response.json();
            setAssets(data.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const payload: Record<string, unknown> = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            acquisition_date: formData.acquisition_date || null,
            initial_value_cad: formData.initial_value_cad
                ? parseFloat(formData.initial_value_cad)
                : null,
        };

        try {
            setSubmitting(true);
            const response = await fetch('/api/fixed-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create asset');
            }

            await fetchAssets();
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'Failed to create asset'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const openValuationDialog = async (asset: FixedAsset) => {
        setValuationDialogAsset(asset);
        setValuationForm(emptyValuationForm);
        setValuationFormError(null);
        await fetchValuations(asset.id);
    };

    const fetchValuations = async (assetId: number) => {
        try {
            setValuationsLoading(true);
            const response = await fetch(
                `/api/fixed-assets/${assetId}/valuations`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch valuations');
            }

            const data: any = await response.json();
            setValuations(data.data || []);
        } catch (err) {
            console.error('Failed to fetch valuations:', err);
            setValuations([]);
        } finally {
            setValuationsLoading(false);
        }
    };

    const handleValuationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valuationDialogAsset) return;

        setValuationFormError(null);

        const payload = {
            period: valuationForm.period.replace(/-/g, ''),
            book_value_cad: parseFloat(valuationForm.book_value_cad),
            depreciation_cad: valuationForm.depreciation_cad
                ? parseFloat(valuationForm.depreciation_cad)
                : 0,
        };

        try {
            setValuationSubmitting(true);
            const response = await fetch(
                `/api/fixed-assets/${valuationDialogAsset.id}/valuations`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to save valuation'
                );
            }

            await fetchValuations(valuationDialogAsset.id);
            setValuationForm(emptyValuationForm);
        } catch (err) {
            setValuationFormError(
                err instanceof Error ? err.message : 'Failed to save valuation'
            );
        } finally {
            setValuationSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Fixed Assets" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Fixed Assets
                        </h1>
                        <p className="text-muted-foreground">
                            Manage fixed assets and their book values per period
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => resetForm()}>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add Fixed Asset</DialogTitle>
                                <DialogDescription>
                                    Create a new fixed asset to track its book
                                    value over time.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Ford Escape"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        placeholder="Family vehicle"
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="acquisition_date">
                                        Acquisition Date
                                    </Label>
                                    <Input
                                        id="acquisition_date"
                                        type="date"
                                        value={formData.acquisition_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                acquisition_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="initial_value_cad">
                                        Initial Value (CAD)
                                    </Label>
                                    <Input
                                        id="initial_value_cad"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.initial_value_cad}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                initial_value_cad: e.target.value,
                                            })
                                        }
                                        placeholder="25000.00"
                                    />
                                </div>

                                {formError && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                        {formError}
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Creating...' : 'Create Asset'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-800">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                Loading fixed assets...
                            </p>
                        </CardContent>
                    </Card>
                ) : assets.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-2 text-sm font-semibold">
                                    No fixed assets
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Get started by creating a new fixed asset.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {assets.map((asset) => (
                            <Card key={asset.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <Car className="h-5 w-5 text-muted-foreground" />
                                                {asset.name}
                                            </CardTitle>
                                            {asset.description && (
                                                <CardDescription className="mt-1">
                                                    {asset.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        {asset.is_active ? (
                                            <Badge variant="outline" className="ml-2">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="ml-2">
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {asset.acquisition_date && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Acquired:{' '}
                                                {new Date(
                                                    asset.acquisition_date
                                                ).toLocaleDateString('en-CA')}
                                            </span>
                                        </div>
                                    )}
                                    {asset.initial_value_cad > 0 && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">
                                                Initial Value:{' '}
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    asset.initial_value_cad
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openValuationDialog(asset)}
                                        className="w-full"
                                    >
                                        Manage Book Values
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Valuation Dialog */}
                <Dialog
                    open={!!valuationDialogAsset}
                    onOpenChange={(open) => {
                        if (!open) setValuationDialogAsset(null);
                    }}
                >
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                Book Values - {valuationDialogAsset?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Set the book value for this asset in different periods.
                                Each period can have a different book value.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <form
                                onSubmit={handleValuationSubmit}
                                className="space-y-4 border-b pb-4"
                            >
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="period">
                                            Period <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="period"
                                            type="month"
                                            value={valuationForm.period}
                                            onChange={(e) =>
                                                setValuationForm({
                                                    ...valuationForm,
                                                    period: e.target.value,
                                                })
                                            }
                                            placeholder="2025-01"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="book_value_cad">
                                            Book Value (CAD) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="book_value_cad"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={valuationForm.book_value_cad}
                                            onChange={(e) =>
                                                setValuationForm({
                                                    ...valuationForm,
                                                    book_value_cad: e.target.value,
                                                })
                                            }
                                            placeholder="25000.00"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="depreciation_cad">
                                            Depreciation (CAD)
                                        </Label>
                                        <Input
                                            id="depreciation_cad"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={valuationForm.depreciation_cad}
                                            onChange={(e) =>
                                                setValuationForm({
                                                    ...valuationForm,
                                                    depreciation_cad: e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {valuationFormError && (
                                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                                        {valuationFormError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={valuationSubmitting}
                                    className="w-full"
                                >
                                    {valuationSubmitting ? 'Saving...' : 'Save Book Value'}
                                </Button>
                            </form>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">
                                    Existing Book Values
                                </h4>
                                {valuationsLoading ? (
                                    <p className="text-sm text-muted-foreground">
                                        Loading...
                                    </p>
                                ) : valuations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No book values set yet. Add one above to get
                                        started.
                                    </p>
                                ) : (
                                    <div className="max-h-60 space-y-2 overflow-y-auto">
                                        {valuations
                                            .sort((a, b) => b.period.localeCompare(a.period))
                                            .map((val) => (
                                                <div
                                                    key={val.id}
                                                    className="flex items-center justify-between rounded-md border p-3"
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {formatPeriod(val.period)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Period: {val.period}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold">
                                                            {formatCurrency(
                                                                val.book_value_cad
                                                            )}
                                                        </div>
                                                        {val.depreciation_cad > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Depreciation:{' '}
                                                                {formatCurrency(
                                                                    val.depreciation_cad
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

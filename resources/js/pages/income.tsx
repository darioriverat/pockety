import { usePeriod } from '@/hooks/use-period';
import { isValidPeriod } from '@/lib/periods';
import { cn } from '@/lib/utils';
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
import { PlusIcon, Banknote, Trash2 } from 'lucide-react';

interface IncomeLine {
    id: number;
    period: string;
    description: string;
    line_number: number;
    amount_cad: number;
    amount_usd: number;
    amount_cop: number;
    notes: string | null;
    total_cad_equivalent: number | null;
}

interface IncomeFormData {
    description: string;
    amount_cad: string;
    amount_usd: string;
    amount_cop: string;
    notes: string;
}

const emptyForm: IncomeFormData = {
    description: '',
    amount_cad: '',
    amount_usd: '',
    amount_cop: '',
    notes: '',
};

const formatCurrency = (value: number, currency: string): string => {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: currency === 'COP' ? 0 : 2,
        }).format(value);
    } catch {
        return value.toFixed(2);
    }
};

const formatPeriodLabel = (period: string): string => {
    if (!/^\d{6}$/.test(period)) {
        return period;
    }
    const year = period.slice(0, 4);
    const month = period.slice(4, 6);
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function Income() {
    const { period, setPeriod } = usePeriod();
    const [periodInput, setPeriodInput] = useState(period);
    const [lines, setLines] = useState<IncomeLine[]>([]);
    const [totalCad, setTotalCad] = useState<number>(0);
    const [maxLines, setMaxLines] = useState<number>(6);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<IncomeFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchIncome = async (targetPeriod: string) => {
        if (!/^\d{6}$/.test(targetPeriod)) {
            setError('Period must be in YYYYMM format (e.g. 202501)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/income?period=${encodeURIComponent(targetPeriod)}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch income');
            }

            const payload = await response.json();
            setLines(Array.isArray(payload.data) ? payload.data : []);
            setTotalCad(payload.meta?.total_cad_equivalent ?? 0);
            setMaxLines(payload.meta?.max_lines ?? 6);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLines([]);
            setTotalCad(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPeriodInput(period);
        fetchIncome(period);
    }, [period]);

    const handlePeriodSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidPeriod(periodInput)) {
            setError('Select a supported period from January 2025 through September 2026.');
            return;
        }
        if (periodInput === period) {
            fetchIncome(period);
        } else {
            setPeriod(periodInput);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.description.trim()) {
            setFormError('Description is required.');
            return;
        }

        const payload = {
            period,
            description: formData.description.trim(),
            amount_cad: formData.amount_cad
                ? parseFloat(formData.amount_cad)
                : 0,
            amount_usd: formData.amount_usd
                ? parseFloat(formData.amount_usd)
                : 0,
            amount_cop: formData.amount_cop
                ? parseFloat(formData.amount_cop)
                : 0,
            notes: formData.notes.trim() || null,
        };

        if (
            payload.amount_cad === 0 &&
            payload.amount_usd === 0 &&
            payload.amount_cop === 0
        ) {
            setFormError('Enter at least one amount in CAD, USD, or COP.');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const message = errorData.messages
                    ? Object.values(errorData.messages).flat().join(' ')
                    : errorData.error || 'Failed to create income line';
                throw new Error(message);
            }

            await fetchIncome(period);
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id);
            const response = await fetch(`/api/income/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete income line');
            }

            await fetchIncome(period);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setDeletingId(null);
        }
    };

    const canAddMore = lines.length < maxLines;

    return (
        <>
            <Head title="Income" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Income
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Track up to {maxLines} free-text income lines per
                            month across CAD, USD, and COP.
                        </p>
                    </div>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) {
                                resetForm();
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                disabled={!canAddMore || loading}
                                aria-label="Add Income"
                            >
                                <PlusIcon className="size-4" />
                                Add Income
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Add Income</DialogTitle>
                                    <DialogDescription>
                                        Add a line item for{' '}
                                        {formatPeriodLabel(period)} ({period}).
                                        Amounts may use one or more currencies.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Salary - Main Job"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount_cad">
                                                Amount CAD
                                            </Label>
                                            <Input
                                                id="amount_cad"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount_cad}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        amount_cad:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="5000.00"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount_usd">
                                                Amount USD
                                            </Label>
                                            <Input
                                                id="amount_usd"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount_usd}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        amount_usd:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount_cop">
                                                Amount COP
                                            </Label>
                                            <Input
                                                id="amount_cop"
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={formData.amount_cop}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        amount_cop:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    notes: e.target.value,
                                                })
                                            }
                                            placeholder="Optional notes"
                                            rows={2}
                                        />
                                    </div>

                                    {formError && (
                                        <p
                                            className="text-destructive text-sm"
                                            role="alert"
                                        >
                                            {formError}
                                        </p>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Saving…' : 'Save Income'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Period</CardTitle>
                        <CardDescription>
                            Select a month in YYYYMM format to view and edit
                            income lines.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handlePeriodSubmit}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="period">Period (YYYYMM)</Label>
                                <Input
                                    id="period"
                                    value={periodInput}
                                    onChange={(e) => setPeriodInput(e.target.value)}
                                    placeholder="202501"
                                    maxLength={6}
                                    aria-label="Period"
                                />
                            </div>
                            <Button type="submit" variant="secondary">
                                Load Period
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Total income (CAD equivalent) —{' '}
                            {formatPeriodLabel(period)}
                        </CardDescription>
                        <CardTitle
                            className="text-3xl font-semibold tabular-nums"
                            data-testid="income-total-cad"
                        >
                            {formatCurrency(totalCad, 'CAD')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-sm">
                        Converted with the period exchange rates (defaults:
                        USD/CAD 0.75, CAD/COP 3,000).
                    </CardContent>
                </Card>

                {error && (
                    <div
                        className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {!canAddMore && !loading && (
                    <p className="text-muted-foreground text-sm">
                        This period already has {maxLines} income lines (the
                        source system maximum).
                    </p>
                )}

                {loading ? (
                    <p className="text-muted-foreground text-sm">
                        Loading income…
                    </p>
                ) : lines.length === 0 ? (
                    <Card>
                        <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center text-sm">
                            <Banknote className="size-8 opacity-50" />
                            <p>No income lines for this period yet.</p>
                            <p>Click Add Income to create the first line.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="border-b bg-muted/70">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        #
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        CAD
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        USD
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        COP
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        CAD equiv.
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-foreground">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, index) => (
                                    <tr
                                        key={line.id}
                                        className={cn(
                                            'border-b last:border-0 transition-colors hover:bg-accent/70',
                                            index % 2 === 1 && 'bg-muted/35',
                                        )}
                                        data-testid={`income-line-${line.id}`}
                                        data-row-stripe={
                                            index % 2 === 1 ? 'odd' : 'even'
                                        }
                                    >
                                        <td className="text-muted-foreground px-4 py-3 tabular-nums">
                                            {line.line_number}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {line.description}
                                            {line.notes ? (
                                                <span className="text-muted-foreground mt-0.5 block text-xs font-normal">
                                                    {line.notes}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {line.amount_cad
                                                ? formatCurrency(
                                                      line.amount_cad,
                                                      'CAD'
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {line.amount_usd
                                                ? formatCurrency(
                                                      line.amount_usd,
                                                      'USD'
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {line.amount_cop
                                                ? formatCurrency(
                                                      line.amount_cop,
                                                      'COP'
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 font-medium tabular-nums">
                                            {formatCurrency(
                                                line.total_cad_equivalent ?? 0,
                                                'CAD'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete ${line.description}`}
                                                disabled={
                                                    deletingId === line.id
                                                }
                                                onClick={() =>
                                                    handleDelete(line.id)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

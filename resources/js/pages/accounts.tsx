import { Head, Link } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrencyAmount } from '@/lib/currency';
import { PlusIcon, Building2, Wallet, AlertCircle } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    type: 'bank' | 'investment' | 'liability' | 'receivable';
    primary_currency: string | null;
    currencies?: string[];
    notes: string | null;
    is_active: boolean;
    is_asset: boolean;
    is_liability: boolean;
}

interface AccountFormData {
    name: string;
    type: 'bank' | 'investment' | 'liability' | 'receivable';
    primary_currency: 'CAD' | 'USD' | 'COP' | 'none';
    notes: string;
}

interface AccountBalance {
    id: number;
    account_id: number;
    period: string;
    recorded_balance_cad: number;
    recorded_balance_usd: number;
    recorded_balance_cop: number;
    notes: string | null;
}

interface BalanceFormData {
    period: string;
    recorded_balance_cad: string;
    recorded_balance_usd: string;
    recorded_balance_cop: string;
    notes: string;
}

const emptyForm: AccountFormData = {
    name: '',
    type: 'bank',
    primary_currency: 'CAD',
    notes: '',
};

const emptyBalanceForm: BalanceFormData = {
    period: '',
    recorded_balance_cad: '',
    recorded_balance_usd: '',
    recorded_balance_cop: '',
    notes: '',
};

const formatCurrency = (value: number, currency: string): string =>
    formatCurrencyAmount(value, currency);

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<AccountFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [balanceDialogAccount, setBalanceDialogAccount] =
        useState<Account | null>(null);
    const [balances, setBalances] = useState<AccountBalance[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(false);
    const [balanceForm, setBalanceForm] =
        useState<BalanceFormData>(emptyBalanceForm);
    const [balanceFormError, setBalanceFormError] = useState<string | null>(
        null
    );
    const [balanceSubmitting, setBalanceSubmitting] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/accounts');

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            const data: any = await response.json();
            setAccounts(data.data || []);
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
            type: formData.type,
            primary_currency:
                formData.primary_currency === 'none'
                    ? null
                    : formData.primary_currency,
            notes: formData.notes.trim() || null,
        };

        try {
            setSubmitting(true);
            const response = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const message =
                    errorData.messages
                        ? Object.values(errorData.messages).flat().join(' ')
                        : errorData.error || 'Failed to create account';
                throw new Error(message);
            }

            await fetchAccounts();
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

    const fetchBalances = async (accountId: number) => {
        try {
            setBalancesLoading(true);
            const response = await fetch(`/api/accounts/${accountId}/balances`);

            if (!response.ok) {
                throw new Error('Failed to fetch balances');
            }

            const data: any = await response.json();
            setBalances(data.data || []);
        } catch (err) {
            setBalanceFormError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        } finally {
            setBalancesLoading(false);
        }
    };

    const openBalanceDialog = (account: Account) => {
        setBalanceDialogAccount(account);
        setBalanceForm(emptyBalanceForm);
        setBalanceFormError(null);
        fetchBalances(account.id);
    };

    const closeBalanceDialog = (open: boolean) => {
        if (!open) {
            setBalanceDialogAccount(null);
            setBalances([]);
            setBalanceForm(emptyBalanceForm);
            setBalanceFormError(null);
        }
    };

    const handleBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBalanceFormError(null);

        if (!balanceDialogAccount) return;

        if (!/^\d{6}$/.test(balanceForm.period)) {
            setBalanceFormError('Period must be in YYYYMM format (e.g. 202501).');
            return;
        }

        const payload: Record<string, unknown> = {
            period: balanceForm.period,
            recorded_balance_cad: balanceForm.recorded_balance_cad
                ? parseFloat(balanceForm.recorded_balance_cad)
                : 0,
            recorded_balance_usd: balanceForm.recorded_balance_usd
                ? parseFloat(balanceForm.recorded_balance_usd)
                : 0,
            recorded_balance_cop: balanceForm.recorded_balance_cop
                ? parseFloat(balanceForm.recorded_balance_cop)
                : 0,
            notes: balanceForm.notes.trim() || null,
        };

        try {
            setBalanceSubmitting(true);
            const response = await fetch(
                `/api/accounts/${balanceDialogAccount.id}/balances`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                const message = errorData.messages
                    ? Object.values(errorData.messages).flat().join(' ')
                    : errorData.error || 'Failed to save balance';
                throw new Error(message);
            }

            await fetchBalances(balanceDialogAccount.id);
            setBalanceForm(emptyBalanceForm);
        } catch (err) {
            setBalanceFormError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        } finally {
            setBalanceSubmitting(false);
        }
    };

    const handleBalanceDelete = async (balanceId: number) => {
        if (!balanceDialogAccount) return;

        try {
            const response = await fetch(
                `/api/accounts/${balanceDialogAccount.id}/balances/${balanceId}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Failed to delete balance');
            }

            await fetchBalances(balanceDialogAccount.id);
        } catch (err) {
            setBalanceFormError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        }
    };

    const getAccountTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            bank: 'Bank Account',
            investment: 'Investment',
            liability: 'Credit Card/Loan',
            receivable: 'Accounts Receivable',
        };
        return labels[type] || type;
    };

    const renderAccountCard = (account: Account) => (
        <Card key={account.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <CardTitle className="text-lg">
                            {account.name}
                        </CardTitle>
                    </div>
                    <Badge variant={account.is_asset ? 'default' : 'secondary'}>
                        {getAccountTypeLabel(account.type)}
                    </Badge>
                </div>
                <CardDescription>
                    <div className="space-y-1">
                        {(account.currencies?.length
                            ? account.currencies
                            : account.primary_currency
                              ? [account.primary_currency]
                              : []
                        ).length > 0 && (
                            <div>
                                <span className="font-medium">Currencies:</span>{' '}
                                {(
                                    account.currencies?.length
                                        ? account.currencies
                                        : [account.primary_currency as string]
                                ).join(', ')}
                            </div>
                        )}
                        {account.notes && (
                            <div className="text-xs text-muted-foreground">
                                {account.notes}
                            </div>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Link href={`/accounts/${account.id}`}>
                        <Button variant="outline" size="sm">
                            View Transactions
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBalanceDialog(account)}
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        Manage Balances
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const assetAccounts = accounts.filter((account) => account.is_asset);
    const liabilityAccounts = accounts.filter(
        (account) => account.is_liability
    );

    return (
        <>
            <Head title="Accounts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Accounts
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your bank accounts, investments, and liabilities
                        </p>
                    </div>
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Add Account</DialogTitle>
                                    <DialogDescription>
                                        Create a new account to track balances
                                        and transactions.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="account-name">
                                            Account Name
                                        </Label>
                                        <Input
                                            id="account-name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="e.g. RBC Checking"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="account-type">
                                            Account Type
                                        </Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    type: value as AccountFormData['type'],
                                                })
                                            }
                                        >
                                            <SelectTrigger id="account-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank">
                                                    Bank Account
                                                </SelectItem>
                                                <SelectItem value="investment">
                                                    Investment
                                                </SelectItem>
                                                <SelectItem value="liability">
                                                    Credit Card/Loan
                                                </SelectItem>
                                                <SelectItem value="receivable">
                                                    Accounts Receivable
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="account-currency">
                                            Primary Currency
                                        </Label>
                                        <Select
                                            value={formData.primary_currency}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    primary_currency:
                                                        value as AccountFormData['primary_currency'],
                                                })
                                            }
                                        >
                                            <SelectTrigger id="account-currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CAD">
                                                    CAD
                                                </SelectItem>
                                                <SelectItem value="USD">
                                                    USD
                                                </SelectItem>
                                                <SelectItem value="COP">
                                                    COP
                                                </SelectItem>
                                                <SelectItem value="none">
                                                    None
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="account-notes">
                                            Notes
                                        </Label>
                                        <Textarea
                                            id="account-notes"
                                            value={formData.notes}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    notes: e.target.value,
                                                })
                                            }
                                            placeholder="Optional notes"
                                        />
                                    </div>

                                    {formError && (
                                        <p className="flex items-center gap-1.5 text-sm text-destructive dark:text-red-400">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{formError}</span>
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
                                        {submitting ? 'Saving...' : 'Save Account'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {error && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <LoadingState
                        variant="skeleton-cards"
                        count={6}
                        label="Loading accounts…"
                        data-testid="accounts-loading-state"
                    />
                ) : accounts.length === 0 ? (
                    <EmptyState
                        data-testid="accounts-empty-state"
                        icon={Building2}
                        title="No accounts yet"
                        description="Create your first bank, investment, or liability account to get started."
                        actionLabel="Add First Account"
                        actionTestId="add-first-account"
                        onAction={() => setIsDialogOpen(true)}
                    />
                ) : (
                    <>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Assets
                            </h2>
                            {assetAccounts.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No asset accounts yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {assetAccounts.map(renderAccountCard)}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Liabilities
                            </h2>
                            {liabilityAccounts.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No liability accounts yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {liabilityAccounts.map(renderAccountCard)}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <Dialog
                    open={balanceDialogAccount !== null}
                    onOpenChange={closeBalanceDialog}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                Manage Balances
                                {balanceDialogAccount
                                    ? ` — ${balanceDialogAccount.name}`
                                    : ''}
                            </DialogTitle>
                            <DialogDescription>
                                Enter the recorded balance for a specific
                                period (YYYYMM), in one or more currencies.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBalanceSubmit}>
                            <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="balance-period">
                                        Period (YYYYMM)
                                    </Label>
                                    <Input
                                        id="balance-period"
                                        value={balanceForm.period}
                                        onChange={(e) =>
                                            setBalanceForm({
                                                ...balanceForm,
                                                period: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 202501"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="balance-cad">
                                            CAD
                                        </Label>
                                        <Input
                                            id="balance-cad"
                                            type="number"
                                            step="0.01"
                                            value={
                                                balanceForm.recorded_balance_cad
                                            }
                                            onChange={(e) =>
                                                setBalanceForm({
                                                    ...balanceForm,
                                                    recorded_balance_cad:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="balance-usd">
                                            USD
                                        </Label>
                                        <Input
                                            id="balance-usd"
                                            type="number"
                                            step="0.01"
                                            value={
                                                balanceForm.recorded_balance_usd
                                            }
                                            onChange={(e) =>
                                                setBalanceForm({
                                                    ...balanceForm,
                                                    recorded_balance_usd:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="balance-cop">
                                            COP
                                        </Label>
                                        <Input
                                            id="balance-cop"
                                            type="number"
                                            step="0.01"
                                            value={
                                                balanceForm.recorded_balance_cop
                                            }
                                            onChange={(e) =>
                                                setBalanceForm({
                                                    ...balanceForm,
                                                    recorded_balance_cop:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="balance-notes">
                                        Notes
                                    </Label>
                                    <Textarea
                                        id="balance-notes"
                                        value={balanceForm.notes}
                                        onChange={(e) =>
                                            setBalanceForm({
                                                ...balanceForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        placeholder="Optional notes"
                                    />
                                </div>

                                {balanceFormError && (
                                    <p className="flex items-center gap-1.5 text-sm text-destructive dark:text-red-400">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{balanceFormError}</span>
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={balanceSubmitting}
                                >
                                    {balanceSubmitting
                                        ? 'Saving...'
                                        : 'Save Balance'}
                                </Button>
                            </DialogFooter>
                        </form>

                        <div className="mt-4 space-y-2 border-t pt-4">
                            <h3 className="text-sm font-semibold">
                                Recorded Balances
                            </h3>
                            {balancesLoading ? (
                                <p className="text-sm text-muted-foreground">
                                    Loading...
                                </p>
                            ) : balances.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No balances recorded yet.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {balances.map((balance) => (
                                        <li
                                            key={balance.id}
                                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                                        >
                                            <div>
                                                <span className="font-medium">
                                                    {balance.period}
                                                </span>
                                                <div className="text-muted-foreground">
                                                    {formatCurrency(
                                                        balance.recorded_balance_cad,
                                                        'CAD'
                                                    )}{' '}
                                                    ·{' '}
                                                    {formatCurrency(
                                                        balance.recorded_balance_usd,
                                                        'USD'
                                                    )}{' '}
                                                    ·{' '}
                                                    {formatCurrency(
                                                        balance.recorded_balance_cop,
                                                        'COP'
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleBalanceDelete(
                                                        balance.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Accounts.layout = {
    breadcrumbs: [
        {
            title: 'Accounts',
            href: '/accounts',
        },
    ],
};

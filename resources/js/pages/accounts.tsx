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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, Building2 } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    type: 'bank' | 'investment' | 'liability' | 'receivable';
    primary_currency: string | null;
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

const emptyForm: AccountFormData = {
    name: '',
    type: 'bank',
    primary_currency: 'CAD',
    notes: '',
};

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<AccountFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

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
                        {account.primary_currency && (
                            <div>
                                <span className="font-medium">Currency:</span>{' '}
                                {account.primary_currency}
                            </div>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>
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
                                        <p className="text-sm text-destructive">
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
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading accounts...
                        </CardContent>
                    </Card>
                ) : accounts.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No accounts yet. Click "Add Account" to create one.
                        </CardContent>
                    </Card>
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
            </div>
        </>
    );
}

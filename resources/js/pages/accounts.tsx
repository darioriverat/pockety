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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { PlusIcon, Building2, Landmark, CreditCard, DollarSign } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    type: 'bank' | 'investment' | 'liability' | 'receivable';
    primary_currency: string | null;
    notes: string | null;
    is_active: boolean;
    is_asset: boolean;
    is_liability: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiResponse {
    data: Account[];
    grouped: {
        assets: Account[];
        liabilities: Account[];
    };
    links: {
        self: string;
    };
    meta: {
        total: number;
        filters: Record<string, unknown>;
    };
}

interface FormData {
    name: string;
    type: 'bank' | 'investment' | 'liability' | 'receivable';
    primary_currency: string;
    notes: string;
}

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [assets, setAssets] = useState<Account[]>([]);
    const [liabilities, setLiabilities] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        type: 'bank',
        primary_currency: 'CAD',
        notes: '',
    });

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

            const data: ApiResponse = await response.json();
            setAccounts(data.data);
            setAssets(data.grouped.assets);
            setLiabilities(data.grouped.liabilities);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create account');
            }

            // Reset form and close dialog
            setFormData({
                name: '',
                type: 'bank',
                primary_currency: 'CAD',
                notes: '',
            });
            setIsDialogOpen(false);

            // Refresh accounts list
            await fetchAccounts();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
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

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'bank':
                return <Building2 className="h-4 w-4" />;
            case 'investment':
                return <DollarSign className="h-4 w-4" />;
            case 'liability':
                return <CreditCard className="h-4 w-4" />;
            case 'receivable':
                return <Landmark className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const renderAccountCard = (account: Account) => (
        <Card key={account.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {getAccountIcon(account.type)}
                        <CardTitle className="text-lg">
                            {account.name}
                        </CardTitle>
                    </div>
                    <Badge variant={account.is_asset ? "default" : "secondary"}>
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
                        {account.notes && (
                            <div className="text-xs text-muted-foreground mt-2">
                                {account.notes}
                            </div>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
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
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Account
                    </Button>
                </div>

                {error && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">
                                Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {error}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                                Total accounts: {accounts.length} ({assets.length} assets, {liabilities.length} liabilities)
                            </p>
                        </div>

                        {/* Assets Section */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Assets
                            </h2>
                            {assets.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No asset accounts yet. Click "Add Account" to create one.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {assets.map(renderAccountCard)}
                                </div>
                            )}
                        </div>

                        {/* Liabilities Section */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Liabilities
                            </h2>
                            {liabilities.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No liability accounts yet.
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {liabilities.map(renderAccountCard)}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Add Account Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Account</DialogTitle>
                            <DialogDescription>
                                Create a new bank account, investment, or liability account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Account Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., RBC Checking"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Account Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: any) =>
                                            setFormData({ ...formData, type: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank">Bank Account</SelectItem>
                                            <SelectItem value="investment">Investment</SelectItem>
                                            <SelectItem value="liability">Credit Card/Loan</SelectItem>
                                            <SelectItem value="receivable">Accounts Receivable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Primary Currency</Label>
                                    <Select
                                        value={formData.primary_currency}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, primary_currency: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CAD">CAD</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="COP">COP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Additional notes about this account"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

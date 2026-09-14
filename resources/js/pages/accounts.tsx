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

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Assets
                        </h2>
                        {accounts.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No accounts yet. Click "Add Account" to create one.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {accounts.map(renderAccountCard)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

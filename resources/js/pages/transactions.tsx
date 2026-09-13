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
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Category {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
}

interface Transaction {
    id: number;
    date: string;
    period: string;
    quincena: string;
    category_id: number;
    account_id: number | null;
    amount_cad: number | null;
    amount_usd: number | null;
    amount_cop: number | null;
    currency: string;
    amount: number;
    comments: string | null;
    is_recurring: boolean;
    debt_component: string | null;
    category: Category;
}

interface ApiResponse {
    data: Transaction[];
    links: {
        self: string;
    };
    meta: {
        total: number;
    };
}

interface TransactionFormData {
    date: string;
    period: string;
    quincena: 'Q1' | 'Q2';
    category_id: string;
    currency: 'CAD' | 'USD' | 'COP';
    amount: string;
    comments: string;
    is_recurring: boolean;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<TransactionFormData>({
        date: new Date().toISOString().split('T')[0],
        period: new Date().toISOString().slice(0, 7).replace('-', ''),
        quincena: 'Q1',
        category_id: '',
        currency: 'CAD',
        amount: '',
        comments: '',
        is_recurring: false,
    });

    useEffect(() => {
        fetchTransactions();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/transactions');
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data: ApiResponse = await response.json();
            setTransactions(data.data);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            date: formData.date,
            period: formData.period,
            quincena: formData.quincena,
            category_id: parseInt(formData.category_id),
            comments: formData.comments || null,
            is_recurring: formData.is_recurring,
        };

        // Set the appropriate currency field
        const amountNum = parseFloat(formData.amount);
        if (formData.currency === 'CAD') {
            payload.amount_cad = amountNum;
            payload.amount_usd = null;
            payload.amount_cop = null;
        } else if (formData.currency === 'USD') {
            payload.amount_usd = amountNum;
            payload.amount_cad = null;
            payload.amount_cop = null;
        } else {
            payload.amount_cop = amountNum;
            payload.amount_cad = null;
            payload.amount_usd = null;
        }

        try {
            const url = editingId
                ? `/api/transactions/${editingId}`
                : '/api/transactions';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save transaction');
            }

            await fetchTransactions();
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingId(transaction.id);
        setFormData({
            date: transaction.date,
            period: transaction.period,
            quincena: transaction.quincena as 'Q1' | 'Q2',
            category_id: transaction.category_id.toString(),
            currency: transaction.currency as 'CAD' | 'USD' | 'COP',
            amount: transaction.amount.toString(),
            comments: transaction.comments || '',
            is_recurring: transaction.is_recurring,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this transaction?'))
            return;

        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            await fetchTransactions();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            period: new Date().toISOString().slice(0, 7).replace('-', ''),
            quincena: 'Q1',
            category_id: '',
            currency: 'CAD',
            amount: '',
            comments: '',
            is_recurring: false,
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <>
            <Head title="Transactions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Transactions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your expense transactions
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
                                <Plus className="mr-2 h-4 w-4" />
                                Add Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingId
                                            ? 'Edit Transaction'
                                            : 'Add Transaction'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Fill in the transaction details below
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    date: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="period">
                                                Period (YYYYMM)
                                            </Label>
                                            <Input
                                                id="period"
                                                value={formData.period}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        period: e.target.value,
                                                    })
                                                }
                                                placeholder="202501"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="quincena">
                                                Quincena
                                            </Label>
                                            <Select
                                                value={formData.quincena}
                                                onValueChange={(value) =>
                                                    setFormData({
                                                        ...formData,
                                                        quincena: value as
                                                            | 'Q1'
                                                            | 'Q2',
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Q1">
                                                        Q1
                                                    </SelectItem>
                                                    <SelectItem value="Q2">
                                                        Q2
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">
                                            Category
                                        </Label>
                                        <Select
                                            value={formData.category_id}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    category_id: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem
                                                        key={cat.id}
                                                        value={cat.id.toString()}
                                                    >
                                                        {cat.code} -{' '}
                                                        {cat.name_en}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="currency">
                                                Currency
                                            </Label>
                                            <Select
                                                value={formData.currency}
                                                onValueChange={(value) =>
                                                    setFormData({
                                                        ...formData,
                                                        currency: value as
                                                            | 'CAD'
                                                            | 'USD'
                                                            | 'COP',
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
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
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount">
                                                Amount
                                            </Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        amount: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="comments">
                                            Comments
                                        </Label>
                                        <Textarea
                                            id="comments"
                                            value={formData.comments}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    comments: e.target.value,
                                                })
                                            }
                                            placeholder="Optional notes..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">
                                        {editingId ? 'Update' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mb-2">
                            <p className="text-sm text-muted-foreground">
                                Total transactions: {transactions.length}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {transactions.map((transaction) => (
                                <Card key={transaction.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">
                                                        {formatCurrency(
                                                            transaction.amount,
                                                            transaction.currency
                                                        )}
                                                    </CardTitle>
                                                    <Badge variant="outline">
                                                        {transaction.currency}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="mt-1">
                                                    <div className="space-y-1">
                                                        <div>
                                                            <span className="font-medium">
                                                                Date:
                                                            </span>{' '}
                                                            {transaction.date} |{' '}
                                                            <span className="font-medium">
                                                                Period:
                                                            </span>{' '}
                                                            {transaction.period} -{' '}
                                                            {transaction.quincena}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">
                                                                Category:
                                                            </span>{' '}
                                                            {
                                                                transaction
                                                                    .category.code
                                                            }{' '}
                                                            -{' '}
                                                            {
                                                                transaction
                                                                    .category
                                                                    .name_en
                                                            }
                                                        </div>
                                                        {transaction.comments && (
                                                            <div>
                                                                <span className="font-medium">
                                                                    Comments:
                                                                </span>{' '}
                                                                {
                                                                    transaction.comments
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEdit(transaction)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDelete(
                                                            transaction.id
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>

                        {transactions.length === 0 && !loading && (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <p className="text-muted-foreground">
                                        No transactions found. Click "Add
                                        Transaction" to create one.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

Transactions.layout = {
    breadcrumbs: [
        {
            title: 'Transactions',
            href: '/transactions',
        },
    ],
};

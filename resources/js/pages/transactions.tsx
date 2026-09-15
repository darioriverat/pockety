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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2, Filter, X } from 'lucide-react';

interface Category {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
    is_debt_category: boolean;
}

interface Account {
    id: number;
    name: string;
    type: string;
}

interface Transaction {
    id: number;
    date: string;
    period: string;
    quincena: string;
    category_id: number;
    account_id: number | null;
    account?: Account | null;
    amount_cad: number | null;
    amount_usd: number | null;
    amount_cop: number | null;
    currency: string | null;
    amount: number | null;
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
    account_id: string;
    currency: 'CAD' | 'USD' | 'COP';
    amount: string;
    comments: string;
    is_recurring: boolean;
    debt_component: 'principal' | 'interest' | '';
}

interface FilterState {
    period: string;
    category_id: string;
    quincena: string;
    currency: string;
    is_recurring: string;
    search: string;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<TransactionFormData>({
        date: new Date().toISOString().split('T')[0],
        period: new Date().toISOString().slice(0, 7).replace('-', ''),
        quincena: 'Q1',
        category_id: '',
        account_id: '',
        currency: 'CAD',
        amount: '',
        comments: '',
        is_recurring: false,
        debt_component: '',
    });
    const [filters, setFilters] = useState<FilterState>({
        period: '',
        category_id: '',
        quincena: '',
        currency: '',
        is_recurring: '',
        search: '',
    });

    useEffect(() => {
        fetchTransactions();
        fetchCategories();
        fetchAccounts();
    }, [filters]);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/accounts');
            if (!response.ok) throw new Error('Failed to fetch accounts');
            const data = await response.json();
            setAccounts(data.data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
        }
    };

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

            // Build query parameters from filters
            const params = new URLSearchParams();
            if (filters.period) params.append('period', filters.period);
            if (filters.category_id) params.append('category_id', filters.category_id);
            if (filters.quincena) params.append('quincena', filters.quincena);
            if (filters.currency) params.append('currency', filters.currency);
            if (filters.is_recurring) params.append('is_recurring', filters.is_recurring);

            const url = `/api/transactions${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data: ApiResponse = await response.json();

            // Apply client-side search filter for comments
            let filteredData = data.data;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredData = data.data.filter(t =>
                    t.comments?.toLowerCase().includes(searchLower) ||
                    t.category.name_en.toLowerCase().includes(searchLower) ||
                    t.category.name_es.toLowerCase().includes(searchLower) ||
                    t.category.code.toLowerCase().includes(searchLower)
                );
            }

            setTransactions(filteredData);
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
            account_id: formData.account_id
                ? parseInt(formData.account_id)
                : null,
            comments: formData.comments || null,
            is_recurring: formData.is_recurring,
            debt_component: formData.debt_component || null,
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
            account_id: transaction.account_id?.toString() ?? '',
            currency: (transaction.currency ?? 'CAD') as
                | 'CAD'
                | 'USD'
                | 'COP',
            amount: (transaction.amount ?? 0).toString(),
            comments: transaction.comments || '',
            is_recurring: transaction.is_recurring,
            debt_component: (transaction.debt_component || '') as 'principal' | 'interest' | '',
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
            account_id: '',
            currency: 'CAD',
            amount: '',
            comments: '',
            is_recurring: false,
            debt_component: '',
        });
    };

    const formatCurrency = (
        amount: number | null,
        currency: string | null
    ) => {
        if (amount === null || currency === null) {
            return '—';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const clearFilters = () => {
        setFilters({
            period: '',
            category_id: '',
            quincena: '',
            currency: '',
            is_recurring: '',
            search: '',
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

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
                                                <SelectTrigger
                                                    id="quincena"
                                                    aria-label="Quincena"
                                                >
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
                                            <SelectTrigger
                                                id="category"
                                                aria-label="Category"
                                            >
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="account">
                                            Account
                                        </Label>
                                        <Select
                                            value={formData.account_id}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    account_id: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                id="account"
                                                aria-label="Account"
                                                data-testid="account-field"
                                            >
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((account) => (
                                                    <SelectItem
                                                        key={account.id}
                                                        value={account.id.toString()}
                                                    >
                                                        {account.name}
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
                                                <SelectTrigger
                                                    id="currency"
                                                    aria-label="Currency"
                                                >
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
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_recurring"
                                            checked={formData.is_recurring}
                                            onCheckedChange={(checked) =>
                                                setFormData({
                                                    ...formData,
                                                    is_recurring: checked === true,
                                                })
                                            }
                                        />
                                        <Label
                                            htmlFor="is_recurring"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Recurring transaction
                                        </Label>
                                    </div>
                                    {formData.category_id &&
                                        categories.find(
                                            (c) =>
                                                c.id.toString() ===
                                                formData.category_id
                                        )?.is_debt_category && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="debt_component">
                                                    Debt Component
                                                </Label>
                                                <Select
                                                    value={
                                                        formData.debt_component ||
                                                        'none'
                                                    }
                                                    onValueChange={(value) =>
                                                        setFormData({
                                                            ...formData,
                                                            debt_component:
                                                                (value ===
                                                                'none'
                                                                    ? ''
                                                                    : value) as
                                                                    | 'principal'
                                                                    | 'interest'
                                                                    | '',
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="debt_component"
                                                        aria-label="Debt Component"
                                                    >
                                                        <SelectValue placeholder="Select component" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            None
                                                        </SelectItem>
                                                        <SelectItem value="principal">
                                                            Principal
                                                        </SelectItem>
                                                        <SelectItem value="interest">
                                                            Interest
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
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

                {/* Filters Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                <CardTitle className="text-lg">Filters</CardTitle>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div className="grid gap-2">
                                <Label htmlFor="filter-period">Period</Label>
                                <Input
                                    id="filter-period"
                                    placeholder="202501"
                                    value={filters.period}
                                    onChange={(e) =>
                                        setFilters({ ...filters, period: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-category">Category</Label>
                                <Select
                                    value={filters.category_id || 'all'}
                                    onValueChange={(value) =>
                                        setFilters({
                                            ...filters,
                                            category_id:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger id="filter-category">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id.toString()}
                                            >
                                                {cat.code} - {cat.name_en}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-quincena">Quincena</Label>
                                <Select
                                    value={filters.quincena || 'all'}
                                    onValueChange={(value) =>
                                        setFilters({
                                            ...filters,
                                            quincena:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger id="filter-quincena">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Q1">Q1</SelectItem>
                                        <SelectItem value="Q2">Q2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-currency">Currency</Label>
                                <Select
                                    value={filters.currency || 'all'}
                                    onValueChange={(value) =>
                                        setFilters({
                                            ...filters,
                                            currency:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger id="filter-currency">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="CAD">CAD</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="COP">COP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-recurring">Recurring</Label>
                                <Select
                                    value={filters.is_recurring || 'all'}
                                    onValueChange={(value) =>
                                        setFilters({
                                            ...filters,
                                            is_recurring:
                                                value === 'all' ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger id="filter-recurring">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="1">Recurring Only</SelectItem>
                                        <SelectItem value="0">Non-recurring</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-search">Search</Label>
                                <Input
                                    id="filter-search"
                                    placeholder="Search comments..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({ ...filters, search: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                                    {transaction.is_recurring && (
                                                        <Badge variant="secondary">
                                                            Recurring
                                                        </Badge>
                                                    )}
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
                                                            {' / '}
                                                            {
                                                                transaction
                                                                    .category
                                                                    .name_es
                                                            }
                                                        </div>
                                                        {transaction.account && (
                                                            <div>
                                                                <span className="font-medium">
                                                                    Account:
                                                                </span>{' '}
                                                                {
                                                                    transaction
                                                                        .account
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                        {transaction.debt_component && (
                                                            <div>
                                                                <span className="font-medium">
                                                                    Debt Component:
                                                                </span>{' '}
                                                                {transaction.debt_component}
                                                            </div>
                                                        )}
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
                                                    aria-label="Edit transaction"
                                                    onClick={() =>
                                                        handleEdit(transaction)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Delete transaction"
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

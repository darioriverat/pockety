import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
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
import { usePeriod } from '@/hooks/use-period';
import { formatPeriod, generatePeriods, isPeriodFormatValid } from '@/lib/periods';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    Filter,
    X,
    Download,
    PencilLine,
    Copy,
} from 'lucide-react';

const PERIOD_FORMAT_ERROR = 'Period must be in YYYYMM format (e.g. 202501)';
const AMOUNT_POSITIVE_ERROR = 'Amount must be a positive number';
const DATE_VALID_ERROR = 'Date must be a valid date.';
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

function isValidTransactionDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

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
        page?: number;
        per_page?: number;
        last_page?: number;
    };
}

interface PaginationMeta {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
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
    const { period, setPeriod } = usePeriod();
    const periods = generatePeriods();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkCategoryId, setBulkCategoryId] = useState('');
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(DEFAULT_PAGE_SIZE);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        page: 1,
        per_page: DEFAULT_PAGE_SIZE,
        last_page: 1,
    });
    const urlFiltersApplied = useRef(false);
    const highlightApplied = useRef(false);
    const [detailCategoryCode, setDetailCategoryCode] = useState<string | null>(
        null,
    );
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
    const [filters, setFilters] = useState<FilterState>(() => {
        const params =
            typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search)
                : null;
        const urlPeriod = params?.get('period') ?? '';
        return {
            period: urlPeriod || period,
            category_id: '',
            quincena: '',
            currency: '',
            is_recurring: '',
            search: '',
        };
    });

    useEffect(() => {
        if (!urlFiltersApplied.current) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('period') || params.get('category')) {
                return;
            }
        }

        setFilters((prev) =>
            prev.period === period ? prev : { ...prev, period },
        );
    }, [period]);

    useEffect(() => {
        if (urlFiltersApplied.current || categories.length === 0) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const urlPeriod = params.get('period');
        const urlCategoryCode = params.get('category');

        if (!urlPeriod && !urlCategoryCode) {
            urlFiltersApplied.current = true;
            return;
        }

        let nextCategoryId = '';
        if (urlCategoryCode) {
            const matched = categories.find(
                (category) => category.code === urlCategoryCode,
            );
            if (!matched) {
                return;
            }
            nextCategoryId = matched.id.toString();
            setDetailCategoryCode(urlCategoryCode);
        }

        if (urlPeriod) {
            setPeriod(urlPeriod);
        }

        setFilters((prev) => ({
            ...prev,
            period: urlPeriod || prev.period,
            category_id: nextCategoryId || prev.category_id,
        }));
        urlFiltersApplied.current = true;
    }, [categories, setPeriod]);

    useEffect(() => {
        fetchCategories();
        fetchAccounts();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [filters, page, perPage]);

    useEffect(() => {
        if (highlightApplied.current || loading || transactions.length === 0) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const highlightParam = params.get('highlight');
        if (!highlightParam) {
            highlightApplied.current = true;
            return;
        }

        const highlightId = Number.parseInt(highlightParam, 10);
        if (Number.isNaN(highlightId)) {
            highlightApplied.current = true;
            return;
        }

        const target = transactions.find(
            (transaction) => transaction.id === highlightId,
        );
        if (!target) {
            return;
        }

        highlightApplied.current = true;
        setFormError(null);
        setIsDuplicating(false);
        setEditingId(target.id);
        setFormData({
            date: target.date,
            period: target.period,
            quincena: target.quincena as 'Q1' | 'Q2',
            category_id: target.category_id.toString(),
            account_id: target.account_id?.toString() ?? '',
            currency: (target.currency ?? 'CAD') as 'CAD' | 'USD' | 'COP',
            amount: (target.amount ?? 0).toString(),
            comments: target.comments || '',
            is_recurring: target.is_recurring,
            debt_component: (target.debt_component || '') as
                | 'principal'
                | 'interest'
                | '',
        });
        setIsDialogOpen(true);

        requestAnimationFrame(() => {
            document
                .querySelector(`[data-testid="transaction-row-${highlightId}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }, [transactions, loading]);

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

            const params = new URLSearchParams();
            if (filters.period) params.append('period', filters.period);
            if (filters.category_id) params.append('category_id', filters.category_id);
            if (filters.quincena) params.append('quincena', filters.quincena);
            if (filters.currency) params.append('currency', filters.currency);
            if (filters.is_recurring) params.append('is_recurring', filters.is_recurring);
            if (filters.search.trim()) params.append('search', filters.search.trim());
            params.append('page', page.toString());
            params.append('per_page', perPage.toString());

            const url = `/api/transactions?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data: ApiResponse = await response.json();

            setTransactions(data.data);
            setSelectedIds([]);
            setPagination({
                total: data.meta.total,
                page: data.meta.page ?? page,
                per_page: data.meta.per_page ?? perPage,
                last_page: data.meta.last_page ?? 1,
            });
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'An error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    const updateFilters = (next: FilterState) => {
        setPage(1);
        setFilters(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!isValidTransactionDate(formData.date.trim())) {
            setFormError(DATE_VALID_ERROR);
            return;
        }

        if (!isPeriodFormatValid(formData.period.trim())) {
            setFormError(PERIOD_FORMAT_ERROR);
            return;
        }

        const amountNum = parseFloat(formData.amount);
        if (Number.isNaN(amountNum) || amountNum <= 0) {
            setFormError(AMOUNT_POSITIVE_ERROR);
            return;
        }

        const payload: Record<string, unknown> = {
            date: formData.date.trim(),
            period: formData.period.trim(),
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
                const dateErrors = errorData.errors?.date;
                if (Array.isArray(dateErrors) && dateErrors.length > 0) {
                    setFormError(dateErrors[0]);
                    return;
                }
                const periodErrors = errorData.errors?.period;
                if (Array.isArray(periodErrors) && periodErrors.length > 0) {
                    setFormError(periodErrors[0]);
                    return;
                }
                const amountErrors =
                    errorData.errors?.amount_cad ||
                    errorData.errors?.amount_usd ||
                    errorData.errors?.amount_cop;
                if (Array.isArray(amountErrors) && amountErrors.length > 0) {
                    setFormError(amountErrors[0]);
                    return;
                }
                const message =
                    errorData.message ||
                    errorData.error ||
                    'Failed to save transaction';
                setFormError(message);
                return;
            }

            await fetchTransactions();
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setFormError(null);
        setIsDuplicating(false);
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

    const handleDuplicate = (transaction: Transaction) => {
        setFormError(null);
        setEditingId(null);
        setIsDuplicating(true);
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
            debt_component: (transaction.debt_component || '') as
                | 'principal'
                | 'interest'
                | '',
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

    const handleExportCSV = () => {
        const params = new URLSearchParams();
        if (filters.period) params.append('period', filters.period);
        if (filters.category_id)
            params.append('category_id', filters.category_id);
        if (filters.quincena) params.append('quincena', filters.quincena);
        if (filters.currency) params.append('currency', filters.currency);
        if (filters.is_recurring)
            params.append('is_recurring', filters.is_recurring);

        const url = `/api/transactions/export?${params.toString()}`;
        window.location.href = url;
    };

    const toggleSelected = (id: number, checked: boolean) => {
        setSelectedIds((current) => {
            if (checked) {
                return current.includes(id) ? current : [...current, id];
            }
            return current.filter((item) => item !== id);
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(transactions.map((transaction) => transaction.id));
            return;
        }
        setSelectedIds([]);
    };

    const handleBulkEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBulkError(null);

        if (selectedIds.length === 0) {
            setBulkError('Select at least one transaction');
            return;
        }

        if (!bulkCategoryId) {
            setBulkError('Select a category');
            return;
        }

        try {
            setBulkSubmitting(true);
            const response = await fetch('/api/transactions/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    category_id: parseInt(bulkCategoryId, 10),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        errorData.error ||
                        'Failed to bulk update transactions',
                );
            }

            setIsBulkDialogOpen(false);
            setBulkCategoryId('');
            setSelectedIds([]);
            await fetchTransactions();
        } catch (err) {
            setBulkError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        } finally {
            setBulkSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setIsDuplicating(false);
        setFormError(null);
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
        setDetailCategoryCode(null);
        updateFilters({
            period,
            category_id: '',
            quincena: '',
            currency: '',
            is_recurring: '',
            search: '',
        });
    };

    const showPaginationControls = pagination.total > 50;

    const hasActiveFilters =
        filters.category_id !== '' ||
        filters.quincena !== '' ||
        filters.currency !== '' ||
        filters.is_recurring !== '' ||
        filters.search !== '';

    const selectedCategory = categories.find(
        (category) => category.id.toString() === filters.category_id,
    );
    const detailCategory = detailCategoryCode
        ? categories.find((category) => category.code === detailCategoryCode) ??
          selectedCategory
        : selectedCategory;

    return (
        <>
            <Head title="Transactions" />
            <div
                className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
                data-testid="transactions-page"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1
                            className="text-3xl font-bold tracking-tight"
                            data-testid="transactions-heading"
                        >
                            Transactions
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your expense transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportCSV}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export to CSV
                        </Button>
                        <Dialog
                            open={isBulkDialogOpen}
                            onOpenChange={(open) => {
                                setIsBulkDialogOpen(open);
                                if (!open) {
                                    setBulkError(null);
                                    setBulkCategoryId('');
                                }
                            }}
                        >
                            <Button
                                variant="secondary"
                                disabled={selectedIds.length === 0}
                                onClick={() => setIsBulkDialogOpen(true)}
                                data-testid="bulk-edit-button"
                            >
                                <PencilLine className="mr-2 h-4 w-4" />
                                Bulk Edit
                                {selectedIds.length > 0
                                    ? ` (${selectedIds.length})`
                                    : ''}
                            </Button>
                            <DialogContent
                                className="max-w-md"
                                data-testid="bulk-edit-dialog"
                            >
                                <form onSubmit={handleBulkEdit}>
                                    <DialogHeader>
                                        <DialogTitle>Bulk Edit</DialogTitle>
                                        <DialogDescription>
                                            Update the category for{' '}
                                            {selectedIds.length} selected
                                            transaction
                                            {selectedIds.length === 1
                                                ? ''
                                                : 's'}
                                            .
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="bulk-category">
                                                Category
                                            </Label>
                                            <Select
                                                value={bulkCategoryId}
                                                onValueChange={(value) => {
                                                    setBulkError(null);
                                                    setBulkCategoryId(value);
                                                }}
                                            >
                                                <SelectTrigger
                                                    id="bulk-category"
                                                    aria-label="Bulk category"
                                                    data-testid="bulk-category-select"
                                                >
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem
                                                            key={cat.id}
                                                            value={cat.id.toString()}
                                                            data-testid={`bulk-category-option-${cat.code}`}
                                                        >
                                                            {cat.code} -{' '}
                                                            {cat.name_en}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {bulkError && (
                                        <p
                                            className="text-destructive text-sm"
                                            role="alert"
                                            data-testid="bulk-edit-error"
                                        >
                                            {bulkError}
                                        </p>
                                    )}
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsBulkDialogOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={bulkSubmitting}
                                            data-testid="bulk-edit-confirm"
                                        >
                                            {bulkSubmitting
                                                ? 'Saving…'
                                                : 'Confirm changes'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
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
                        <DialogContent
                            className="max-w-md"
                            data-testid="transaction-form-dialog"
                        >
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle data-testid="transaction-form-title">
                                        {editingId
                                            ? 'Edit Transaction'
                                            : isDuplicating
                                              ? 'Duplicate Transaction'
                                              : 'Add Transaction'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isDuplicating
                                            ? 'Review the copied values, update the date if needed, then save'
                                            : 'Fill in the transaction details below'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">
                                            Date (YYYY-MM-DD)
                                        </Label>
                                        <Input
                                            id="date"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="2025-01-15"
                                            value={formData.date}
                                            data-testid="transaction-date-input"
                                            onChange={(e) => {
                                                setFormError(null);
                                                setFormData({
                                                    ...formData,
                                                    date: e.target.value,
                                                });
                                            }}
                                            aria-invalid={
                                                formError !== null &&
                                                formError
                                                    .toLowerCase()
                                                    .includes('date')
                                            }
                                            aria-describedby={
                                                formError
                                                    ? 'transaction-form-error'
                                                    : undefined
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
                                                data-testid="transaction-period-input"
                                                onChange={(e) => {
                                                    setFormError(null);
                                                    setFormData({
                                                        ...formData,
                                                        period: e.target.value,
                                                    });
                                                }}
                                                placeholder="202501"
                                                aria-invalid={
                                                    formError !== null &&
                                                    formError
                                                        .toLowerCase()
                                                        .includes('period')
                                                }
                                                aria-describedby={
                                                    formError
                                                        ? 'transaction-form-error'
                                                        : undefined
                                                }
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
                                                data-testid="transaction-amount-input"
                                                onChange={(e) => {
                                                    setFormError(null);
                                                    setFormData({
                                                        ...formData,
                                                        amount: e.target.value,
                                                    });
                                                }}
                                                aria-invalid={
                                                    formError !== null &&
                                                    formError
                                                        .toLowerCase()
                                                        .includes('amount')
                                                }
                                                aria-describedby={
                                                    formError
                                                        ? 'transaction-form-error'
                                                        : undefined
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
                                {formError && (
                                    <p
                                        id="transaction-form-error"
                                        className="text-destructive text-sm"
                                        role="alert"
                                        data-testid="transaction-form-error"
                                    >
                                        {formError}
                                    </p>
                                )}
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        data-testid="transaction-form-submit"
                                    >
                                        {editingId
                                            ? 'Update'
                                            : isDuplicating
                                              ? 'Create Duplicate'
                                              : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>

                {detailCategory && filters.category_id && (
                    <Card
                        className="border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30"
                        data-testid="category-detail-banner"
                    >
                        <CardHeader className="pb-3">
                            <CardTitle
                                className="text-lg"
                                data-testid="category-detail-heading"
                            >
                                {detailCategory.code} —{' '}
                                {detailCategory.name_es} /{' '}
                                {detailCategory.name_en}
                            </CardTitle>
                            <CardDescription>
                                Detailed transactions for period{' '}
                                {filters.period
                                    ? formatPeriod(filters.period)
                                    : 'all periods'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-3">
                            <p
                                className="text-sm text-muted-foreground"
                                data-testid="category-detail-count"
                            >
                                Showing {transactions.length} of{' '}
                                {pagination.total} transaction
                                {pagination.total === 1 ? '' : 's'}
                            </p>
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={`/category-actuals`}
                                    data-testid="back-to-category-actuals"
                                >
                                    Back to Category Actuals
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

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
                                <Select
                                    value={filters.period || period}
                                    onValueChange={(value) => {
                                        setPeriod(value);
                                        updateFilters({
                                            ...filters,
                                            period: value,
                                        });
                                    }}
                                >
                                    <SelectTrigger
                                        id="filter-period"
                                        data-testid="page-period-selector"
                                    >
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periods.map((item) => (
                                            <SelectItem
                                                key={item}
                                                value={item}
                                            >
                                                {formatPeriod(item)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="filter-category">Category</Label>
                                <Select
                                    value={filters.category_id || 'all'}
                                    onValueChange={(value) => {
                                        const nextId =
                                            value === 'all' ? '' : value;
                                        updateFilters({
                                            ...filters,
                                            category_id: nextId,
                                        });
                                        if (!nextId) {
                                            setDetailCategoryCode(null);
                                        } else {
                                            const matched = categories.find(
                                                (category) =>
                                                    category.id.toString() ===
                                                    nextId,
                                            );
                                            setDetailCategoryCode(
                                                matched?.code ?? null,
                                            );
                                        }
                                    }}
                                >
                                    <SelectTrigger
                                        id="filter-category"
                                        data-testid="filter-category"
                                    >
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
                                        updateFilters({
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
                                        updateFilters({
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
                                        updateFilters({
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
                                        updateFilters({
                                            ...filters,
                                            search: e.target.value,
                                        })
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
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <p
                                    className="text-sm text-muted-foreground"
                                    data-testid="transactions-total"
                                >
                                    Total transactions: {pagination.total}
                                </p>
                                {transactions.length > 0 && (
                                    <div
                                        className="flex items-center gap-2"
                                        data-testid="bulk-select-controls"
                                    >
                                        <Checkbox
                                            id="select-all-transactions"
                                            checked={
                                                selectedIds.length > 0 &&
                                                selectedIds.length ===
                                                    transactions.length
                                            }
                                            onCheckedChange={(checked) =>
                                                toggleSelectAll(checked === true)
                                            }
                                            data-testid="select-all-transactions"
                                            aria-label="Select all transactions"
                                        />
                                        <Label
                                            htmlFor="select-all-transactions"
                                            className="text-sm font-medium"
                                        >
                                            Select all on page
                                        </Label>
                                        {selectedIds.length > 0 && (
                                            <span
                                                className="text-sm text-muted-foreground"
                                                data-testid="selected-count"
                                            >
                                                {selectedIds.length} selected
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {showPaginationControls && (
                                <div
                                    className="flex flex-wrap items-center gap-3"
                                    data-testid="pagination-controls"
                                >
                                    <div className="flex items-center gap-2">
                                        <Label
                                            htmlFor="page-size"
                                            className="text-sm text-muted-foreground"
                                        >
                                            Per page
                                        </Label>
                                        <Select
                                            value={perPage.toString()}
                                            onValueChange={(value) => {
                                                setPage(1);
                                                setPerPage(Number(value));
                                            }}
                                        >
                                            <SelectTrigger
                                                id="page-size"
                                                className="w-[100px]"
                                                data-testid="page-size-select"
                                                aria-label="Page size"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAGE_SIZE_OPTIONS.map(
                                                    (size) => (
                                                        <SelectItem
                                                            key={size}
                                                            value={size.toString()}
                                                        >
                                                            {size}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <p
                                        className="text-sm text-muted-foreground"
                                        data-testid="pagination-status"
                                    >
                                        Page {pagination.page} of{' '}
                                        {pagination.last_page}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page <= 1}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.max(1, current - 1),
                                                )
                                            }
                                            data-testid="pagination-prev"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft className="mr-1 h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                pagination.page >=
                                                pagination.last_page
                                            }
                                            onClick={() =>
                                                setPage((current) =>
                                                    current + 1,
                                                )
                                            }
                                            data-testid="pagination-next"
                                            aria-label="Next page"
                                        >
                                            Next
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className="space-y-2"
                            data-testid="transactions-list"
                        >
                            {transactions.map((transaction) => (
                                <Card
                                    key={transaction.id}
                                    data-testid={`transaction-row-${transaction.id}`}
                                    data-category-code={
                                        transaction.category.code
                                    }
                                    data-transaction-comments={
                                        transaction.comments ?? ''
                                    }
                                    data-selected={
                                        selectedIds.includes(transaction.id)
                                            ? 'true'
                                            : 'false'
                                    }
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Checkbox
                                                    id={`select-transaction-${transaction.id}`}
                                                    checked={selectedIds.includes(
                                                        transaction.id,
                                                    )}
                                                    onCheckedChange={(checked) =>
                                                        toggleSelected(
                                                            transaction.id,
                                                            checked === true,
                                                        )
                                                    }
                                                    data-testid={`select-transaction-${transaction.id}`}
                                                    aria-label={`Select transaction ${transaction.id}`}
                                                    className="mt-1"
                                                />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle
                                                        className="text-lg"
                                                        data-testid={`transaction-amount-${transaction.id}`}
                                                    >
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
                                                        <div
                                                            data-testid={`transaction-date-${transaction.id}`}
                                                        >
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
                                                        <div
                                                            data-testid={`transaction-category-${transaction.id}`}
                                                        >
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
                                                        <div
                                                            data-testid={`transaction-account-${transaction.id}`}
                                                        >
                                                            <span className="font-medium">
                                                                Account:
                                                            </span>{' '}
                                                            {transaction.account
                                                                ?.name ?? '—'}
                                                        </div>
                                                        {transaction.debt_component && (
                                                            <div>
                                                                <span className="font-medium">
                                                                    Debt Component:
                                                                </span>{' '}
                                                                {transaction.debt_component}
                                                            </div>
                                                        )}
                                                        <div
                                                            data-testid={`transaction-comments-${transaction.id}`}
                                                        >
                                                            <span className="font-medium">
                                                                Comments:
                                                            </span>{' '}
                                                            {transaction.comments ??
                                                                '—'}
                                                        </div>
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Duplicate transaction"
                                                    data-testid={`duplicate-transaction-${transaction.id}`}
                                                    onClick={() =>
                                                        handleDuplicate(
                                                            transaction,
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
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

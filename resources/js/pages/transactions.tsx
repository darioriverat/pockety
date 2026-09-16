import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
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
import { DatePicker } from '@/components/ui/date-picker';
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
import { CategoryLanguageToggle } from '@/components/category-language-toggle';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { useCategoryLanguage } from '@/hooks/use-category-language';
import { usePeriod } from '@/hooks/use-period';
import { formatCurrencyAmount } from '@/lib/currency';
import {
    formatPeriod,
    generatePeriods,
    isPeriodFormatValid,
    periodFromDate,
} from '@/lib/periods';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
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
    Receipt,
} from 'lucide-react';

const PERIOD_FORMAT_ERROR = 'Period must be in YYYYMM format (e.g. 202501)';
const AMOUNT_POSITIVE_ERROR = 'Amount must be a positive number';
const DATE_VALID_ERROR = 'Date must be a valid date.';
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;
const SORT_COLUMNS = ['date', 'amount', 'category'] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortDirection = 'asc' | 'desc';

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
        sort_by?: SortColumn;
        sort_dir?: SortDirection;
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
    const { language, setLanguage, getCategoryName } = useCategoryLanguage();
    const periods = generatePeriods();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkCategoryId, setBulkCategoryId] = useState('');
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<SortColumn>('date');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');
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
    const [formData, setFormData] = useState<TransactionFormData>(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            date: today,
            period: periodFromDate(today) ?? '',
            quincena: 'Q1',
            category_id: '',
            account_id: '',
            currency: 'CAD',
            amount: '',
            comments: '',
            is_recurring: false,
            debt_component: '',
        };
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
    }, [filters, page, perPage, sortBy, sortDir]);

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
        setFieldErrors({});
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
            params.append('sort_by', sortBy);
            params.append('sort_dir', sortDir);
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
        setFieldErrors({});

        // Field-level validation for required fields
        const errors: Record<string, string> = {};

        if (!formData.date.trim()) {
            errors.date = 'Date is required';
        } else if (!isValidTransactionDate(formData.date.trim())) {
            errors.date = DATE_VALID_ERROR;
        }

        if (!formData.period.trim()) {
            errors.period = 'Period is required';
        } else if (!isPeriodFormatValid(formData.period.trim())) {
            errors.period = PERIOD_FORMAT_ERROR;
        }

        if (!formData.category_id) {
            errors.category_id = 'Category is required';
        }

        if (!formData.amount.trim()) {
            errors.amount = 'Amount is required';
        } else {
            const amountNum = parseFloat(formData.amount);
            if (Number.isNaN(amountNum) || amountNum <= 0) {
                errors.amount = AMOUNT_POSITIVE_ERROR;
            }
        }

        // If there are validation errors, set them and stop submission
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const amountNum = parseFloat(formData.amount);

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
            
            // Show success message
            if (editingId) {
                toast.success('Transaction updated successfully');
            } else {
                toast.success('Transaction created successfully');
            }
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'An error occurred',
            );
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setFormError(null);
        setFieldErrors({});
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
        setFieldErrors({});
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

    const requestDelete = (id: number) => {
        setDeleteTargetId(id);
    };

    const cancelDelete = () => {
        if (isDeleting) {
            return;
        }
        setDeleteTargetId(null);
    };

    const confirmDelete = async () => {
        if (deleteTargetId === null) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/transactions/${deleteTargetId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            await fetchTransactions();
            setDeleteTargetId(null);
            toast.success('Transaction deleted successfully');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'An error occurred';
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
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
        setFieldErrors({});
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            date: today,
            period: periodFromDate(today) ?? '',
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

    const handleDateChange = (date: string) => {
        setFormError(null);
        const derivedPeriod = periodFromDate(date);
        setFieldErrors((prev) => {
            const next: Record<string, string> = { ...prev, date: '' };
            if (derivedPeriod) {
                next.period = '';
            }
            return next;
        });
        setFormData((prev) => ({
            ...prev,
            date,
            ...(derivedPeriod ? { period: derivedPeriod } : {}),
        }));
    };

    const formatCurrency = (
        amount: number | null,
        currency: string | null
    ) => formatCurrencyAmount(amount, currency);

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

    const handleSort = (column: SortColumn) => {
        setPage(1);
        if (sortBy === column) {
            setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortBy(column);
        setSortDir('asc');
    };

    const sortIcon = (column: SortColumn) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
        }
        return sortDir === 'asc' ? (
            <ArrowUp className="ml-1 h-3.5 w-3.5" />
        ) : (
            <ArrowDown className="ml-1 h-3.5 w-3.5" />
        );
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
            <PageContainer
                className="overflow-x-auto"
                data-testid="transactions-page"
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <PageTitle
                        title="Transactions"
                        description="Manage your expense transactions"
                        data-testid="transactions-heading"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                        <CategoryLanguageToggle
                            value={language}
                            onChange={setLanguage}
                        />
                        <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportCSV}
                        >
                            <Download className="size-4 shrink-0 fill-none" />
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
                                <PencilLine className="size-4 shrink-0 fill-none" />
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
                                                            {getCategoryName(cat)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {bulkError && (
                                        <p
                                            className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                            role="alert"
                                            data-testid="bulk-edit-error"
                                        >
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{bulkError}</span>
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
                                    <Plus className="size-4 shrink-0 fill-none" />
                                    Add Transaction
                                </Button>
                            </DialogTrigger>
                        <DialogContent
                            className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
                            data-testid="transaction-form-dialog"
                        >
                            <form onSubmit={handleSubmit} noValidate>
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
                                    <div className="grid content-start gap-2">
                                        <Label htmlFor="date">
                                            Date (YYYY-MM-DD)
                                        </Label>
                                        <DatePicker
                                            id="date"
                                            placeholder="2025-01-15"
                                            value={formData.date}
                                            data-testid="transaction-date"
                                            onChange={handleDateChange}
                                            aria-invalid={!!fieldErrors.date}
                                            aria-describedby={
                                                fieldErrors.date
                                                    ? 'date-error'
                                                    : undefined
                                            }
                                            required
                                        />
                                        {fieldErrors.date && (
                                            <p
                                                id="date-error"
                                                className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                                role="alert"
                                                data-testid="date-error"
                                            >
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{fieldErrors.date}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 items-start gap-4">
                                        <div className="grid content-start gap-2">
                                            <Label htmlFor="period">
                                                Period (YYYYMM)
                                            </Label>
                                            <Input
                                                id="period"
                                                value={formData.period}
                                                data-testid="transaction-period-input"
                                                onChange={(e) => {
                                                    setFormError(null);
                                                    setFieldErrors((prev) => ({ ...prev, period: '' }));
                                                    setFormData({
                                                        ...formData,
                                                        period: e.target.value,
                                                    });
                                                }}
                                                placeholder="202501"
                                                aria-invalid={!!fieldErrors.period}
                                                aria-describedby={
                                                    fieldErrors.period
                                                        ? 'period-error transaction-period-hint'
                                                        : 'transaction-period-hint'
                                                }
                                                required
                                            />
                                            {fieldErrors.period && (
                                                <p
                                                    id="period-error"
                                                    className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                                    role="alert"
                                                    data-testid="period-error"
                                                >
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    <span>{fieldErrors.period}</span>
                                                </p>
                                            )}
                                            <p
                                                id="transaction-period-hint"
                                                className="text-muted-foreground text-xs"
                                                data-testid="transaction-period-hint"
                                            >
                                                Auto-filled from date
                                            </p>
                                        </div>
                                        <div className="grid content-start gap-2">
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
                                                    className="w-full"
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
                                    <div className="grid content-start gap-2">
                                        <Label htmlFor="category">
                                            Category
                                        </Label>
                                        <Select
                                            value={formData.category_id}
                                            onValueChange={(value) => {
                                                setFieldErrors((prev) => ({ ...prev, category_id: '' }));
                                                setFormData({
                                                    ...formData,
                                                    category_id: value,
                                                });
                                            }}
                                        >
                                            <SelectTrigger
                                                className="w-full"
                                                id="category"
                                                aria-label="Category"
                                                aria-invalid={!!fieldErrors.category_id}
                                                aria-describedby={
                                                    fieldErrors.category_id
                                                        ? 'category-error'
                                                        : undefined
                                                }
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
                                                        {getCategoryName(cat)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.category_id && (
                                            <p
                                                id="category-error"
                                                className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                                role="alert"
                                                data-testid="category-error"
                                            >
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{fieldErrors.category_id}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid content-start gap-2">
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
                                                className="w-full"
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
                                    <div className="grid grid-cols-2 items-start gap-4">
                                        <div className="grid content-start gap-2">
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
                                                    className="w-full"
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
                                        <div className="grid content-start gap-2">
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
                                                    setFieldErrors((prev) => ({ ...prev, amount: '' }));
                                                    setFormData({
                                                        ...formData,
                                                        amount: e.target.value,
                                                    });
                                                }}
                                                aria-invalid={!!fieldErrors.amount}
                                                aria-describedby={
                                                    fieldErrors.amount
                                                        ? 'amount-error'
                                                        : undefined
                                                }
                                                required
                                            />
                                            {fieldErrors.amount && (
                                                <p
                                                    id="amount-error"
                                                    className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                                    role="alert"
                                                    data-testid="amount-error"
                                                >
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    <span>{fieldErrors.amount}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid content-start gap-2">
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
                                            <div className="grid content-start gap-2">
                                                <Label htmlFor="debt_component">
                                                    Debt Component
                                                </Label>
                                                <select
                                                    id="debt_component"
                                                    aria-label="Debt Component"
                                                    data-testid="debt-component-select"
                                                    className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                                    value={
                                                        formData.debt_component ||
                                                        'none'
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            debt_component:
                                                                (e.target
                                                                    .value ===
                                                                'none'
                                                                    ? ''
                                                                    : e.target
                                                                          .value) as
                                                                    | 'principal'
                                                                    | 'interest'
                                                                    | '',
                                                        })
                                                    }
                                                >
                                                    <option value="none">
                                                        None
                                                    </option>
                                                    <option value="principal">
                                                        Principal
                                                    </option>
                                                    <option value="interest">
                                                        Interest
                                                    </option>
                                                </select>
                                            </div>
                                        )}
                                </div>
                                {formError && (
                                    <p
                                        id="transaction-form-error"
                                        className="flex items-center gap-1.5 text-destructive text-sm dark:text-red-400"
                                        role="alert"
                                        data-testid="transaction-form-error"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{formError}</span>
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

                    <Dialog
                        open={deleteTargetId !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                cancelDelete();
                            }
                        }}
                    >
                        <DialogContent data-testid="delete-confirmation-dialog">
                            <DialogHeader>
                                <DialogTitle data-testid="delete-confirmation-title">
                                    Delete transaction?
                                </DialogTitle>
                                <DialogDescription data-testid="delete-confirmation-warning">
                                    This action cannot be undone. The transaction
                                    will be permanently deleted from your records.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    data-testid="delete-cancel-button"
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    data-testid="delete-confirm-button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                        </div>
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
                                {getCategoryName(detailCategory)}
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
                                    <X className="size-4 shrink-0 fill-none" />
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
                                                {cat.code} - {getCategoryName(cat)}
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
                    <LoadingState
                        variant="skeleton-rows"
                        count={5}
                        label="Loading transactions…"
                        data-testid="transactions-loading-state"
                    />
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
                            className="overflow-x-auto rounded-md border"
                            data-testid="transactions-data-table"
                            data-responsive="cards"
                        >
                        <div
                            className="flex flex-wrap items-center gap-2 border-b bg-muted/70 px-3 py-3 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:gap-2"
                            data-testid="transactions-sort-headers"
                            role="row"
                        >
                            <button
                                type="button"
                                className="flex items-center text-left text-sm font-semibold text-foreground hover:text-primary"
                                onClick={() => handleSort('date')}
                                data-testid="sort-header-date"
                                aria-label="Sort by Date"
                                aria-sort={
                                    sortBy === 'date'
                                        ? sortDir === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : 'none'
                                }
                            >
                                Date
                                {sortIcon('date')}
                            </button>
                            <button
                                type="button"
                                className="flex items-center text-left text-sm font-semibold text-foreground hover:text-primary"
                                onClick={() => handleSort('amount')}
                                data-testid="sort-header-amount"
                                aria-label="Sort by Amount"
                                aria-sort={
                                    sortBy === 'amount'
                                        ? sortDir === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : 'none'
                                }
                            >
                                Amount
                                {sortIcon('amount')}
                            </button>
                            <button
                                type="button"
                                className="flex items-center text-left text-sm font-semibold text-foreground hover:text-primary"
                                onClick={() => handleSort('category')}
                                data-testid="sort-header-category"
                                aria-label="Sort by Category"
                                aria-sort={
                                    sortBy === 'category'
                                        ? sortDir === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : 'none'
                                }
                            >
                                Category
                                {sortIcon('category')}
                            </button>
                            <span className="text-sm font-semibold text-foreground">
                                Actions
                            </span>
                        </div>

                        <div
                            className="divide-y"
                            data-testid="transactions-list"
                        >
                            {transactions.map((transaction, index) => (
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
                                    data-row-stripe={
                                        index % 2 === 1 ? 'odd' : 'even'
                                    }
                                    className={cn(
                                        'rounded-none border-0 py-3 shadow-none transition-colors gap-3',
                                        index % 2 === 1 && 'bg-muted/35',
                                        'hover:bg-accent/70',
                                        selectedIds.includes(transaction.id) &&
                                            'bg-muted data-[state=selected]:bg-muted',
                                    )}
                                >
                                    <CardHeader className="px-3">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
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
                                                    className="mt-1 shrink-0"
                                                />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
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
                                                    <div className="space-y-1 break-words">
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
                                                            {getCategoryName(
                                                                transaction.category,
                                                            )}
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
                                            <div
                                                className="flex shrink-0 gap-2 self-end sm:self-start"
                                                data-testid={`transaction-actions-${transaction.id}`}
                                            >
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
                                                    data-testid="edit-transaction-button"
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
                                                    data-testid="delete-transaction-button"
                                                    onClick={() =>
                                                        requestDelete(
                                                            transaction.id,
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
                        </div>

                        {transactions.length === 0 && !loading && (
                            <EmptyState
                                data-testid="transactions-empty-state"
                                icon={Receipt}
                                title={
                                    hasActiveFilters
                                        ? 'No transactions found'
                                        : 'No transactions yet'
                                }
                                description={
                                    hasActiveFilters
                                        ? 'Try clearing filters or add a new transaction.'
                                        : 'Track your expenses by adding your first transaction.'
                                }
                                actionLabel={
                                    hasActiveFilters
                                        ? 'Add Transaction'
                                        : 'Add First Transaction'
                                }
                                actionTestId="add-first-transaction"
                                onAction={() => setIsDialogOpen(true)}
                            />
                        )}
                    </>
                )}
            </PageContainer>
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

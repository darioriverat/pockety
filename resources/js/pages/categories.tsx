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
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Pencil } from 'lucide-react';
import TextLink from '@/components/text-link';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
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
import { Checkbox } from '@/components/ui/checkbox';

type CategoryKind = 'expense' | 'debt' | 'income';

interface Category {
    id: number;
    code: string;
    name: string;
    is_debt_category: boolean;
    is_income_category?: boolean;
    is_active: boolean;
    status: string | null;
}

interface ApiResponse {
    data: Category[];
    links: {
        self: string;
    };
    meta: {
        total: number;
    };
}

function kindFromCategory(category: Category): CategoryKind {
    if (category.is_income_category) {
        return 'income';
    }
    if (category.is_debt_category) {
        return 'debt';
    }
    return 'expense';
}

function extractErrorMessage(errorData: {
    message?: string;
    error?: string;
    messages?: Record<string, string[]>;
}): string {
    const messages = Object.values(errorData.messages ?? {}).flat();
    return (
        messages.join(' ') ||
        errorData.message ||
        errorData.error ||
        'Request failed'
    );
}

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        kind: 'expense' as CategoryKind,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        kind: 'expense' as CategoryKind,
        is_active: true,
    });
    const [editError, setEditError] = useState<string | null>(null);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [kindLocked, setKindLocked] = useState(false);
    const [isCheckingTransactions, setIsCheckingTransactions] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/categories?include_inactive=1');

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data: ApiResponse = await response.json();
            setCategories(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = async (category: Category) => {
        setEditingCategory(category);
        setEditFormData({
            name: category.name,
            kind: kindFromCategory(category),
            is_active: category.is_active,
        });
        setEditError(null);
        setKindLocked(false);
        setIsCheckingTransactions(true);

        try {
            const response = await fetch(
                `/api/categories/${category.code}/transactions`,
            );
            if (response.ok) {
                const payload = await response.json();
                const count = Array.isArray(payload.data)
                    ? payload.data.length
                    : 0;
                setKindLocked(count > 0);
            }
        } catch {
            // If the check fails, leave kind unlocked and rely on server 422.
        } finally {
            setIsCheckingTransactions(false);
        }
    };

    const closeEditDialog = () => {
        setEditingCategory(null);
        setEditError(null);
        setKindLocked(false);
        setIsCheckingTransactions(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: createFormData.name,
                    is_debt_category: createFormData.kind === 'debt',
                    is_income_category: createFormData.kind === 'income',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(extractErrorMessage(errorData));
            }

            const result = await response.json();

            setCategories([...categories, result.data]);
            setCreateFormData({ name: '', kind: 'expense' });
            setCreateDialogOpen(false);
            setCreateError(null);
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) {
            return;
        }

        setEditError(null);
        setIsEditSubmitting(true);

        try {
            const response = await fetch(
                `/api/categories/${editingCategory.code}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: editFormData.name,
                        is_debt_category: editFormData.kind === 'debt',
                        is_income_category: editFormData.kind === 'income',
                        is_active: editFormData.is_active,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(extractErrorMessage(errorData));
            }

            const result = await response.json();
            setCategories(
                categories.map((category) =>
                    category.code === editingCategory.code
                        ? result.data
                        : category,
                ),
            );
            closeEditDialog();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleDelete = async (code: string, categoryName: string) => {
        if (!confirm(`Are you sure you want to delete category ${code} (${categoryName})?`)) {
            return;
        }

        const categoryId = categories.find(c => c.code === code)?.id;
        setDeletingId(categoryId || null);

        try {
            const response = await fetch(`/api/categories/${code}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.has_transactions) {
                    alert(errorData.message || 'This category has associated transactions and cannot be deleted');
                } else if (errorData.has_budgets) {
                    alert(errorData.message || 'This category has associated budgets and cannot be deleted');
                } else {
                    throw new Error(errorData.message || 'Failed to delete category');
                }
                return;
            }

            setCategories(categories.filter(c => c.code !== code));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <Head title="Categories" />
            <PageContainer className="overflow-x-auto">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <PageTitle
                        title="Categories"
                        description="Manage expense, debt, and income categories, including retired categories"
                    />
                    <Button
                        onClick={() => {
                            setCreateError(null);
                            setCreateDialogOpen(true);
                        }}
                        data-testid="create-category-button"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Category
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

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent data-testid="create-category-dialog">
                        <DialogHeader>
                            <DialogTitle data-testid="create-category-title">
                                Create Category
                            </DialogTitle>
                            <DialogDescription>
                                Create a new expense, debt, or income category for tracking your finances.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            {createError && (
                                <p
                                    role="alert"
                                    className="mt-4 text-sm text-destructive"
                                    data-testid="create-category-error"
                                >
                                    {createError}
                                </p>
                            )}
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category-name">
                                        Name
                                    </Label>
                                    <Input
                                        id="category-name"
                                        data-testid="category-name-input"
                                        value={createFormData.name}
                                        onChange={(e) =>
                                            setCreateFormData({
                                                ...createFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Groceries"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Kind</Label>
                                    <div className="grid gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kind"
                                                value="expense"
                                                checked={createFormData.kind === 'expense'}
                                                onChange={() =>
                                                    setCreateFormData({
                                                        ...createFormData,
                                                        kind: 'expense',
                                                    })
                                                }
                                                disabled={isSubmitting}
                                                data-testid="kind-expense"
                                            />
                                            <span>Expense</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kind"
                                                value="debt"
                                                checked={createFormData.kind === 'debt'}
                                                onChange={() =>
                                                    setCreateFormData({
                                                        ...createFormData,
                                                        kind: 'debt',
                                                    })
                                                }
                                                disabled={isSubmitting}
                                                data-testid="kind-debt"
                                            />
                                            <span>Debt</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kind"
                                                value="income"
                                                checked={createFormData.kind === 'income'}
                                                onChange={() =>
                                                    setCreateFormData({
                                                        ...createFormData,
                                                        kind: 'income',
                                                    })
                                                }
                                                disabled={isSubmitting}
                                                data-testid="kind-income"
                                            />
                                            <span>Income</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateDialogOpen(false)}
                                    disabled={isSubmitting}
                                    data-testid="create-category-cancel"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    data-testid="create-category-submit"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={editingCategory !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeEditDialog();
                        }
                    }}
                >
                    <DialogContent data-testid="edit-category-dialog">
                        <DialogHeader>
                            <DialogTitle data-testid="edit-category-title">
                                Edit Category
                                {editingCategory ? ` ${editingCategory.code}` : ''}
                            </DialogTitle>
                            <DialogDescription>
                                Update the name, kind, or active state for this category.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            {editError && (
                                <p
                                    role="alert"
                                    className="mt-4 text-sm text-destructive"
                                    data-testid="edit-category-error"
                                >
                                    {editError}
                                </p>
                            )}
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category-name">
                                        Name
                                    </Label>
                                    <Input
                                        id="edit-category-name"
                                        data-testid="edit-category-name-input"
                                        value={editFormData.name}
                                        onChange={(e) =>
                                            setEditFormData({
                                                ...editFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={isEditSubmitting}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Kind</Label>
                                    {kindLocked && (
                                        <p
                                            className="text-sm text-muted-foreground"
                                            data-testid="edit-kind-locked-message"
                                        >
                                            Debt and income settings are locked because this category has transactions.
                                        </p>
                                    )}
                                    <div className="grid gap-2">
                                        <label className={`flex items-center gap-2 ${kindLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                            <input
                                                type="radio"
                                                name="edit-kind"
                                                value="expense"
                                                checked={editFormData.kind === 'expense'}
                                                onChange={() =>
                                                    setEditFormData({
                                                        ...editFormData,
                                                        kind: 'expense',
                                                    })
                                                }
                                                disabled={
                                                    isEditSubmitting ||
                                                    kindLocked ||
                                                    isCheckingTransactions
                                                }
                                                data-testid="edit-kind-expense"
                                            />
                                            <span>Expense</span>
                                        </label>
                                        <label className={`flex items-center gap-2 ${kindLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                            <input
                                                type="radio"
                                                name="edit-kind"
                                                value="debt"
                                                checked={editFormData.kind === 'debt'}
                                                onChange={() =>
                                                    setEditFormData({
                                                        ...editFormData,
                                                        kind: 'debt',
                                                    })
                                                }
                                                disabled={
                                                    isEditSubmitting ||
                                                    kindLocked ||
                                                    isCheckingTransactions
                                                }
                                                data-testid="edit-kind-debt"
                                            />
                                            <span>Debt</span>
                                        </label>
                                        <label className={`flex items-center gap-2 ${kindLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                            <input
                                                type="radio"
                                                name="edit-kind"
                                                value="income"
                                                checked={editFormData.kind === 'income'}
                                                onChange={() =>
                                                    setEditFormData({
                                                        ...editFormData,
                                                        kind: 'income',
                                                    })
                                                }
                                                disabled={
                                                    isEditSubmitting ||
                                                    kindLocked ||
                                                    isCheckingTransactions
                                                }
                                                data-testid="edit-kind-income"
                                            />
                                            <span>Income</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="edit-category-active"
                                        data-testid="edit-category-active"
                                        checked={editFormData.is_active}
                                        onCheckedChange={(checked) =>
                                            setEditFormData({
                                                ...editFormData,
                                                is_active: checked === true,
                                            })
                                        }
                                        disabled={isEditSubmitting}
                                    />
                                    <Label htmlFor="edit-category-active">
                                        Active
                                    </Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeEditDialog}
                                    disabled={isEditSubmitting}
                                    data-testid="edit-category-cancel"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isEditSubmitting || isCheckingTransactions}
                                    data-testid="edit-category-submit"
                                >
                                    {isEditSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <LoadingState
                        variant="skeleton-cards"
                        count={6}
                        label="Loading categories…"
                        data-testid="categories-loading-state"
                    />
                ) : (
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                                Total categories: {categories.length}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => {
                                const displayName = category.name;

                                return (
                                <Card
                                    key={category.id}
                                    className={
                                        !category.is_active
                                            ? 'opacity-50'
                                            : 'transition-colors hover:bg-muted/40'
                                    }
                                    data-testid={`category-card-${category.code}`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">
                                                <TextLink
                                                    href={`/categories/${category.code}`}
                                                    data-testid={`category-link-${category.code}`}
                                                >
                                                    {category.code}
                                                </TextLink>
                                            </CardTitle>
                                            <div className="flex gap-2 items-center">
                                                {category.is_debt_category && (
                                                    <Badge
                                                        variant="secondary"
                                                        data-testid={`debt-badge-${category.code}`}
                                                    >
                                                        Debt
                                                    </Badge>
                                                )}
                                                {category.is_income_category && (
                                                    <Badge
                                                        variant="secondary"
                                                        data-testid={`income-badge-${category.code}`}
                                                    >
                                                        Income
                                                    </Badge>
                                                )}
                                                {!category.is_active && (
                                                    <Badge variant="outline">
                                                        Retired
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        void openEditDialog(category);
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                    aria-label={`Edit ${category.code}`}
                                                    data-testid={`edit-category-${category.code}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        handleDelete(
                                                            category.code,
                                                            displayName,
                                                        );
                                                    }}
                                                    disabled={deletingId === category.id}
                                                    className="h-8 w-8 p-0"
                                                    aria-label={`Delete ${category.code}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            <TextLink
                                                href={`/categories/${category.code}`}
                                                className="block space-y-1 no-underline hover:underline"
                                            >
                                                <div
                                                    data-testid={`category-name-${category.code}`}
                                                >
                                                    <span className="font-medium">
                                                        {displayName}
                                                    </span>
                                                </div>
                                                {category.status && (
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        {category.status}
                                                    </div>
                                                )}
                                            </TextLink>
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                                );
                            })}
                        </div>

                        {categories.length === 0 && !loading && (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <p className="text-muted-foreground">
                                        No categories found
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </PageContainer>
        </>
    );
}

Categories.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: '/categories',
        },
    ],
};

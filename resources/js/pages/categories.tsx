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
import { Trash2, Plus } from 'lucide-react';
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

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        kind: 'expense' as 'expense' | 'debt' | 'income',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
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
                throw new Error(errorData.message || 'Failed to create category');
            }

            const result = await response.json();

            // Add new category to the list
            setCategories([...categories, result.data]);

            // Reset form and close dialog
            setCreateFormData({ name: '', kind: 'expense' });
            setCreateDialogOpen(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
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

            // Remove category from list on successful deletion
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
                        description="View all active expense and income categories for your finance tracking"
                    />
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
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
                                                onChange={(e) =>
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
                                                onChange={(e) =>
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
                                                onChange={(e) =>
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
                                                    <Badge variant="secondary">
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

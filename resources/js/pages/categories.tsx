import { Head, usePage } from '@inertiajs/react';
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
import { Trash2 } from 'lucide-react';
import { CategoryLanguageToggle } from '@/components/category-language-toggle';
import TextLink from '@/components/text-link';
import { PageTitle } from '@/components/page-title';
import { PageContainer } from '@/components/page-container';
import { useCategoryLanguage } from '@/hooks/use-category-language';
import type { Auth } from '@/types';

interface Category {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
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

type PageProps = {
    auth?: Auth;
};

export default function Categories() {
    const { auth } = usePage<PageProps>().props;
    const { language, setLanguage, getCategoryName } = useCategoryLanguage(
        auth?.user?.category_language === 'es' ||
            auth?.user?.category_language === 'en'
            ? auth.user.category_language
            : undefined,
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/categories');

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
                    <CategoryLanguageToggle
                        value={language}
                        onChange={setLanguage}
                    />
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
                                const displayName = getCategoryName(category);

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
                                                        {language === 'es'
                                                            ? 'ES:'
                                                            : 'EN:'}
                                                    </span>{' '}
                                                    {displayName}
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

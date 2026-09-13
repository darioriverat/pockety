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
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
    id: number;
    code: string;
    name_es: string;
    name_en: string;
    is_debt_category: boolean;
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

    return (
        <>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Expense Categories
                    </h1>
                    <p className="text-muted-foreground">
                        View all active expense categories for your finance tracking
                    </p>
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
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                                Total categories: {categories.length}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                                <Card
                                    key={category.id}
                                    className={
                                        !category.is_active
                                            ? 'opacity-50'
                                            : ''
                                    }
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-lg">
                                                {category.code}
                                            </CardTitle>
                                            {category.is_debt_category && (
                                                <Badge variant="secondary">
                                                    Debt
                                                </Badge>
                                            )}
                                            {!category.is_active && (
                                                <Badge variant="outline">
                                                    Retired
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            <div className="space-y-1">
                                                <div>
                                                    <span className="font-medium">
                                                        ES:
                                                    </span>{' '}
                                                    {category.name_es}
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        EN:
                                                    </span>{' '}
                                                    {category.name_en}
                                                </div>
                                                {category.status && (
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        {category.status}
                                                    </div>
                                                )}
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
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
            </div>
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

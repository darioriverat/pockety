import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type LoadingStateVariant = 'skeleton-rows' | 'skeleton-cards' | 'spinner';

interface LoadingStateProps {
    variant?: LoadingStateVariant;
    count?: number;
    label?: string;
    className?: string;
    'data-testid'?: string;
}

/**
 * Shared loading indicator for data-fetching pages.
 * Uses skeleton screens or a centered spinner so users see clear progress.
 */
function LoadingState({
    variant = 'skeleton-rows',
    count = 5,
    label = 'Loading…',
    className,
    'data-testid': testId = 'page-loading-state',
}: LoadingStateProps) {
    if (variant === 'spinner') {
        return (
            <div
                role="status"
                aria-busy="true"
                aria-live="polite"
                aria-label={label}
                data-testid={testId}
                data-loading-variant="spinner"
                className={cn(
                    'flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground',
                    className,
                )}
            >
                <Spinner
                    className="h-8 w-8"
                    data-testid="loading-spinner"
                />
                <p className="text-sm" data-testid="loading-label">
                    {label}
                </p>
            </div>
        );
    }

    if (variant === 'skeleton-cards') {
        return (
            <div
                role="status"
                aria-busy="true"
                aria-live="polite"
                aria-label={label}
                data-testid={testId}
                data-loading-variant="skeleton-cards"
                className={cn(
                    'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
                    className,
                )}
            >
                <span className="sr-only">{label}</span>
                {Array.from({ length: count }).map((_, index) => (
                    <Card
                        key={index}
                        data-testid="loading-skeleton-card"
                    >
                        <CardHeader className="space-y-3">
                            <Skeleton className="h-6 w-2/5" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label={label}
            data-testid={testId}
            data-loading-variant="skeleton-rows"
            className={cn('space-y-3', className)}
        >
            <span className="sr-only">{label}</span>
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} data-testid="loading-skeleton-row">
                    <CardHeader className="space-y-3">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

export { LoadingState };
export type { LoadingStateProps, LoadingStateVariant };

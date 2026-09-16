import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
    title: ReactNode;
    description?: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    className?: string;
    'data-testid'?: string;
}

/**
 * Shared page H1 for main app screens.
 * Keeps title size, weight, and description styling consistent.
 */
export function PageTitle({
    title,
    description,
    leading,
    trailing,
    className,
    'data-testid': testId = 'page-title',
}: PageTitleProps) {
    return (
        <div className={cn(className)} data-testid="page-header">
            <div className="flex flex-wrap items-center gap-2">
                {leading}
                <h1
                    className="text-foreground text-3xl font-bold tracking-tight"
                    data-testid={testId}
                >
                    {title}
                </h1>
                {trailing}
            </div>
            {description ? (
                <p
                    className="text-muted-foreground mt-1 text-sm sm:text-base"
                    data-testid="page-title-description"
                >
                    {description}
                </p>
            ) : null}
        </div>
    );
}

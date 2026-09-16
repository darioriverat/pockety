import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    actionTestId?: string;
    className?: string;
    'data-testid'?: string;
}

/**
 * Shared empty-list presentation: icon, helpful copy, and optional CTA.
 */
function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    actionLabel,
    onAction,
    actionTestId = 'empty-state-action',
    className,
    'data-testid': testId = 'empty-state',
}: EmptyStateProps) {
    return (
        <Card
            data-testid={testId}
            className={cn('border-dashed', className)}
        >
            <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                <div
                    className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full"
                    data-testid="empty-state-icon"
                    aria-hidden="true"
                >
                    <Icon className="size-8 opacity-80" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                    <p
                        className="text-foreground text-base font-medium"
                        data-testid="empty-state-title"
                    >
                        {title}
                    </p>
                    {description ? (
                        <p
                            className="text-muted-foreground mx-auto max-w-sm text-sm"
                            data-testid="empty-state-description"
                        >
                            {description}
                        </p>
                    ) : null}
                </div>
                {actionLabel && onAction ? (
                    <Button
                        type="button"
                        onClick={onAction}
                        data-testid={actionTestId}
                    >
                        {actionLabel}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}

export { EmptyState };
export type { EmptyStateProps };

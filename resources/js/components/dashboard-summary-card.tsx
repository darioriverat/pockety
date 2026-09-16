import type { LucideIcon } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export type DashboardSummaryCardTone =
    | 'default'
    | 'positive'
    | 'negative'
    | 'warning'
    | 'info';

const valueToneClasses: Record<DashboardSummaryCardTone, string> = {
    default: 'text-foreground',
    positive: 'text-green-600 dark:text-green-500',
    negative: 'text-red-600 dark:text-red-500',
    warning: 'text-orange-600 dark:text-orange-500',
    info: 'text-blue-600 dark:text-blue-500',
};

export interface DashboardSummaryCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone?: DashboardSummaryCardTone;
    testId?: string;
    valueTestId?: string;
    className?: string;
}

/**
 * Shared metric card used across the dashboard summary grids.
 * Keeps border, shadow, padding, and typography consistent.
 */
export function DashboardSummaryCard({
    title,
    value,
    description,
    icon,
    tone = 'default',
    testId,
    valueTestId,
    className,
}: DashboardSummaryCardProps) {
    return (
        <Card
            data-slot="dashboard-summary-card"
            data-testid={testId}
            className={cn(
                // Explicit, uniform chrome for every summary metric card
                'gap-4 border border-border/80 py-5 shadow-sm transition-shadow hover:shadow-md',
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-0">
                <CardTitle className="text-sm font-medium tracking-tight">
                    {title}
                </CardTitle>
                <Icon
                    iconNode={icon}
                    size="md"
                    className="text-muted-foreground"
                />
            </CardHeader>
            <CardContent className="space-y-1 px-5">
                <div
                    className={cn(
                        'text-2xl font-bold tabular-nums tracking-tight',
                        valueToneClasses[tone],
                    )}
                    data-testid={valueTestId}
                >
                    {value}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

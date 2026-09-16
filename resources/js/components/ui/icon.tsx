import type { LucideIcon, LucideProps } from 'lucide-react';
import {
    ICON_OUTLINE_CLASS,
    ICON_SIZE,
    ICON_STROKE,
    type IconSize,
} from '@/lib/icon';
import { cn } from '@/lib/utils';

interface IconProps extends Omit<LucideProps, 'ref'> {
    iconNode?: LucideIcon | null;
    size?: IconSize;
    className?: string;
}

/**
 * Shared Lucide icon renderer — outline stroke, consistent sizes.
 * Prefer this over raw Lucide components when pairing icons with text.
 */
export function Icon({
    iconNode: IconComponent,
    size = 'md',
    className,
    strokeWidth = ICON_STROKE,
    ...props
}: IconProps) {
    if (!IconComponent) {
        return null;
    }

    return (
        <IconComponent
            data-slot="icon"
            className={cn(ICON_SIZE[size], ICON_OUTLINE_CLASS, className)}
            strokeWidth={strokeWidth}
            aria-hidden={props['aria-label'] || props['aria-labelledby'] ? undefined : true}
            {...props}
        />
    );
}

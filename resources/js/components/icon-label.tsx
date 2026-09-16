import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
import { ICON_INLINE_CLASS, type IconSize } from '@/lib/icon';
import { cn } from '@/lib/utils';

interface IconLabelProps {
    icon: LucideIcon;
    children: ReactNode;
    size?: IconSize;
    className?: string;
    iconClassName?: string;
    'data-testid'?: string;
}

/**
 * Icon + text row with consistent vertical alignment and gap.
 */
export function IconLabel({
    icon,
    children,
    size = 'md',
    className,
    iconClassName,
    'data-testid': testId = 'icon-label',
}: IconLabelProps) {
    return (
        <span
            data-slot="icon-label"
            data-testid={testId}
            className={cn(ICON_INLINE_CLASS, className)}
        >
            <Icon iconNode={icon} size={size} className={iconClassName} />
            {children}
        </span>
    );
}

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { TYPOGRAPHY } from '@/lib/typography';
import { cn } from '@/lib/utils';

type SectionHeadingProps<T extends ElementType = 'h2'> = {
    as?: T;
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Major section heading (H2) — visually distinct from page H1 and subsection H3.
 */
export function SectionHeading<T extends ElementType = 'h2'>({
    as,
    children,
    className,
    'data-testid': testId = 'section-heading',
    ...props
}: SectionHeadingProps<T>) {
    const Component = (as ?? 'h2') as ElementType;

    return (
        <Component
            className={cn(TYPOGRAPHY.h2, className)}
            data-testid={testId}
            {...props}
        >
            {children}
        </Component>
    );
}

type SubsectionHeadingProps<T extends ElementType = 'h3'> = {
    as?: T;
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Subsection heading (H3) — used for card titles and nested section labels.
 */
export function SubsectionHeading<T extends ElementType = 'h3'>({
    as,
    children,
    className,
    'data-testid': testId = 'subsection-heading',
    ...props
}: SubsectionHeadingProps<T>) {
    const Component = (as ?? 'h3') as ElementType;

    return (
        <Component
            className={cn(TYPOGRAPHY.h3, className)}
            data-testid={testId}
            {...props}
        >
            {children}
        </Component>
    );
}

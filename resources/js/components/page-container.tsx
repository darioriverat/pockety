import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Canonical page shell spacing for authenticated screens.
 * - Consistent padding from header → content (p-4 / sm:p-6)
 * - Consistent vertical rhythm between major sections (gap-6)
 */
export const PAGE_CONTAINER_CLASS =
    'flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6';

/**
 * Nested section rhythm inside a page (cards, filter blocks, tables).
 */
export const PAGE_SECTION_CLASS = 'flex flex-col gap-4';

type PageContainerProps<T extends ElementType = 'div'> = {
    as?: T;
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function PageContainer<T extends ElementType = 'div'>({
    as,
    children,
    className,
    'data-testid': testId = 'page-container',
    ...props
}: PageContainerProps<T>) {
    const Component = (as ?? 'div') as ElementType;

    return (
        <Component
            className={cn(PAGE_CONTAINER_CLASS, className)}
            data-page-container=""
            data-testid={testId}
            {...props}
        >
            {children}
        </Component>
    );
}

type PageSectionProps = {
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
} & ComponentPropsWithoutRef<'section'>;

export function PageSection({
    children,
    className,
    'data-testid': testId = 'page-section',
    ...props
}: PageSectionProps) {
    return (
        <section
            className={cn(PAGE_SECTION_CLASS, className)}
            data-testid={testId}
            {...props}
        >
            {children}
        </section>
    );
}

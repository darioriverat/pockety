import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { TEXT_LINK_CLASS } from '@/lib/text-link';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

/**
 * In-content hyperlink: teal color + underline, distinct from body text.
 * Use for prose / card content links — not nav chrome or buttons.
 */
export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            data-slot="text-link"
            className={cn(TEXT_LINK_CLASS, className)}
            {...props}
        >
            {children}
        </Link>
    );
}

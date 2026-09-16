import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <Breadcrumb data-testid="breadcrumbs">
            <BreadcrumbList data-testid="breadcrumb-list">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    const href =
                        typeof item.href === 'string'
                            ? item.href
                            : typeof item.href === 'object' &&
                                item.href !== null &&
                                'url' in item.href
                              ? String(item.href.url)
                              : '#';

                    return (
                        <Fragment key={`${item.title}-${index}`}>
                            <BreadcrumbItem
                                data-testid={
                                    isLast
                                        ? 'breadcrumb-current'
                                        : `breadcrumb-item-${index}`
                                }
                            >
                                {isLast ? (
                                    <BreadcrumbPage className="text-foreground font-medium">
                                        {item.title}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={item.href}
                                            data-testid={`breadcrumb-link-${index}`}
                                            data-breadcrumb-href={href}
                                        >
                                            {item.title}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

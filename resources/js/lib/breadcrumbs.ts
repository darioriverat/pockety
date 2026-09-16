import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export const homeBreadcrumb: BreadcrumbItem = {
    title: 'Home',
    href: dashboard(),
};

export function withHomeBreadcrumb(
    ...items: BreadcrumbItem[]
): BreadcrumbItem[] {
    return [homeBreadcrumb, ...items];
}

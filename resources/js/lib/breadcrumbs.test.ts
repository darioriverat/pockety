import { describe, expect, it } from 'vitest';
import { homeBreadcrumb, withHomeBreadcrumb } from '@/lib/breadcrumbs';

describe('breadcrumb helpers', () => {
    it('exposes a Home crumb that links to the dashboard', () => {
        expect(homeBreadcrumb.title).toBe('Home');
        expect(homeBreadcrumb.href).toEqual(
            expect.objectContaining({ url: '/dashboard' }),
        );
    });

    it('prefixes nested crumbs with Home', () => {
        const trail = withHomeBreadcrumb(
            { title: 'Accounts', href: '/accounts' },
            { title: 'Details', href: '#' },
        );

        expect(trail).toHaveLength(3);
        expect(trail[0]?.title).toBe('Home');
        expect(trail[1]?.title).toBe('Accounts');
        expect(trail[2]?.title).toBe('Details');
    });
});

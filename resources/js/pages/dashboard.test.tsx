import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from '@/layouts/app-layout';
import Dashboard from '@/pages/dashboard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { User } from '@/types';

type MockPage = {
    url: string;
    props: {
        name: string;
        auth: {
            user: User;
        };
        sidebarOpen: boolean;
    };
};

const mockPage: MockPage = {
    url: '/dashboard',
    props: {
        name: 'Pockety',
        auth: {
            user: {
                id: 1,
                name: 'Dario Rivera',
                email: 'dario@example.com',
                email_verified_at: '2026-09-13T00:00:00Z',
                created_at: '2026-09-13T00:00:00Z',
                updated_at: '2026-09-13T00:00:00Z',
            },
        },
        sidebarOpen: true,
    },
};

function resolveHref(href: unknown): string {
    if (typeof href === 'string') {
        return href;
    }

    if (
        typeof href === 'object' &&
        href !== null &&
        'url' in href &&
        typeof href.url === 'string'
    ) {
        return href.url;
    }

    return '#';
}

vi.mock('@inertiajs/react', () => {
    const mockUsePage = vi.fn(() => mockPage);

    const Link = React.forwardRef<
        HTMLAnchorElement,
        React.AnchorHTMLAttributes<HTMLAnchorElement> & {
            href?: unknown;
            prefetch?: boolean;
        }
    >(({ href, prefetch: _prefetch, children, ...props }, ref) => (
        <a ref={ref} href={resolveHref(href)} {...props}>
            {children}
        </a>
    ));

    Link.displayName = 'InertiaLink';

    return {
        Head: () => null,
        Link,
        router: {
            flushAll: vi.fn(),
        },
        usePage: mockUsePage,
    };
});

function renderDashboard() {
    return render(
        <TooltipProvider delayDuration={0}>
            <AppLayout breadcrumbs={Dashboard.layout.breadcrumbs}>
                <Dashboard />
            </AppLayout>
        </TooltipProvider>,
    );
}

describe('Dashboard feature', () => {
    it('renders the dashboard page without crashing', () => {
        expect(() => renderDashboard()).not.toThrow();
    });

    it('displays the main dashboard navigation', () => {
        renderDashboard();

        expect(
            screen
                .getAllByRole('link', { name: 'Dashboard' })
                .find((link) => link.getAttribute('href') === '/dashboard'),
        ).toBeDefined();
        expect(
            screen.getByRole('link', { name: 'Categories' }),
        ).toHaveAttribute('href', '/categories');
        expect(
            screen.getByRole('link', { name: 'Transactions' }),
        ).toHaveAttribute('href', '/transactions');
    });
});

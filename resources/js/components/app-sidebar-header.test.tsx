import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSidebarHeader } from '@/components/app-sidebar-header';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        href,
        prefetch: _prefetch,
        ...props
    }: {
        children: React.ReactNode;
        href: string;
        [key: string]: unknown;
    }) => (
        <a href={typeof href === 'string' ? href : '/'} {...props}>
            {children}
        </a>
    ),
    usePage: () => ({
        props: {
            name: 'Pockety',
            auth: { user: { name: 'Test User', email: 'test@example.com' } },
        },
    }),
}));

vi.mock('@/components/breadcrumbs', () => ({
    Breadcrumbs: () => <nav data-testid="breadcrumbs">Breadcrumbs</nav>,
}));

vi.mock('@/components/global-search', () => ({
    GlobalSearch: () => <div data-testid="global-search">Search</div>,
}));

vi.mock('@/components/period-selector', () => ({
    PeriodSelector: () => <div data-testid="period-selector">Period</div>,
}));

vi.mock('@/components/ui/sidebar', () => ({
    SidebarTrigger: (props: Record<string, unknown>) => (
        <button type="button" {...props}>
            Menu
        </button>
    ),
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
}));

describe('AppSidebarHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a professional header with Pockety branding', () => {
        render(<AppSidebarHeader breadcrumbs={[]} />);

        expect(screen.getByTestId('app-header')).toBeInTheDocument();
        expect(screen.getByTestId('app-header-brand')).toHaveTextContent(
            'Pockety',
        );
        expect(screen.getByTestId('nav-menu-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('global-search')).toBeInTheDocument();
        expect(screen.getByTestId('period-selector')).toBeInTheDocument();
    });
});

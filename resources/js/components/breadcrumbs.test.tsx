import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from '@/components/breadcrumbs';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode;
        href: string | { url: string };
        [key: string]: unknown;
    }) => (
        <a
            href={typeof href === 'string' ? href : href.url}
            {...props}
        >
            {children}
        </a>
    ),
}));

describe('Breadcrumbs', () => {
    it('renders nothing when the trail is empty', () => {
        const { container } = render(<Breadcrumbs breadcrumbs={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders a nested trail with clickable ancestors and a highlighted current page', () => {
        render(
            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Home', href: '/dashboard' },
                    { title: 'Accounts', href: '/accounts' },
                    { title: 'Details', href: '#' },
                ]}
            />,
        );

        expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
        expect(screen.getByTestId('breadcrumb-list')).toBeInTheDocument();

        const homeLink = screen.getByTestId('breadcrumb-link-0');
        expect(homeLink).toHaveTextContent('Home');
        expect(homeLink).toHaveAttribute('href', '/dashboard');
        expect(homeLink.tagName).toBe('A');

        const accountsLink = screen.getByTestId('breadcrumb-link-1');
        expect(accountsLink).toHaveTextContent('Accounts');
        expect(accountsLink).toHaveAttribute('href', '/accounts');
        expect(accountsLink.tagName).toBe('A');

        const current = screen.getByTestId('breadcrumb-current');
        expect(current).toHaveTextContent('Details');
        const currentPage = current.querySelector('[aria-current="page"]');
        expect(currentPage).not.toBeNull();
        expect(currentPage).toHaveAttribute('aria-disabled', 'true');
        expect(current.querySelector('a')).toBeNull();
    });

    it('does not link the current page even when an href is provided', () => {
        render(
            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Categories', href: '/categories' },
                    { title: 'Details', href: '/categories/C001' },
                ]}
            />,
        );

        expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
            'href',
            '/categories',
        );
        const current = screen.getByTestId('breadcrumb-current');
        expect(current).toHaveTextContent('Details');
        expect(current.querySelector('a')).toBeNull();
        expect(
            current.querySelector('[data-slot="breadcrumb-page"]'),
        ).toHaveClass('font-medium');
    });
});

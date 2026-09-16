import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TextLink from '@/components/text-link';
import { TEXT_LINK_CLASS } from '@/lib/text-link';

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        className,
        href,
        ...props
    }: {
        children: React.ReactNode;
        className?: string;
        href: string;
        [key: string]: unknown;
    }) => (
        <a href={typeof href === 'string' ? href : '/'} className={className} {...props}>
            {children}
        </a>
    ),
}));

describe('TEXT_LINK_CLASS', () => {
    it('uses distinct link color tokens and underline', () => {
        expect(TEXT_LINK_CLASS).toContain('text-link');
        expect(TEXT_LINK_CLASS).toContain('underline');
        expect(TEXT_LINK_CLASS).toContain('hover:text-link-hover');
        expect(TEXT_LINK_CLASS).toContain('visited:text-link-visited');
    });
});

describe('TextLink', () => {
    it('renders an anchor with content-link styling', () => {
        render(<TextLink href="/reconciliation">View Details →</TextLink>);

        const link = screen.getByRole('link', { name: /view details/i });
        expect(link).toHaveAttribute('href', '/reconciliation');
        expect(link).toHaveAttribute('data-slot', 'text-link');
        expect(link.className).toContain('text-link');
        expect(link.className).toContain('underline');
        expect(link.className).toContain('hover:text-link-hover');
        expect(link.className).toContain('visited:text-link-visited');
    });

    it('merges custom className', () => {
        render(
            <TextLink href="/categories" className="text-sm font-mono">
                C001
            </TextLink>,
        );

        const link = screen.getByRole('link', { name: 'C001' });
        expect(link.className).toContain('text-sm');
        expect(link.className).toContain('font-mono');
        expect(link.className).toContain('text-link');
    });
});

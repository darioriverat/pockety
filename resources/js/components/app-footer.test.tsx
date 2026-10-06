import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppFooter } from './app-footer';

// Mock Inertia's usePage hook
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        props: {
            name: 'Pockety',
            version: '1.0.0',
        },
    }),
}));

describe('AppFooter', () => {
    it('renders app name and version', () => {
        render(<AppFooter />);
        
        expect(screen.getByText(/Pockety/i)).toBeInTheDocument();
        expect(screen.getByText(/v1\.0\.0/i)).toBeInTheDocument();
    });

    it('renders current year in copyright', () => {
        render(<AppFooter />);
        
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument();
    });

    it('does not render repository or documentation links', () => {
        render(<AppFooter />);

        expect(
            screen.queryByRole('link', { name: /repository/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /documentation/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /github/i }),
        ).not.toBeInTheDocument();
    });

    it('has consistent styling with footer semantic element', () => {
        const { container } = render(<AppFooter />);
        
        const footer = container.querySelector('footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveClass('border-t', 'border-border');
    });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppLogo from '@/components/app-logo';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        props: {
            name: 'Laravel',
        },
    }),
}));

describe('AppLogo', () => {
    it('falls back to Pockety when shared name is Laravel', () => {
        render(<AppLogo />);

        expect(screen.getByTestId('app-brand-name')).toHaveTextContent(
            'Pockety',
        );
        expect(screen.getByTestId('app-logo-mark')).toBeInTheDocument();
    });
});

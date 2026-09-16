import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeading, SubsectionHeading } from './section-heading';
import { TYPOGRAPHY } from '@/lib/typography';

describe('typography hierarchy', () => {
    it('exposes distinct class tokens for H1–H3 and body', () => {
        expect(TYPOGRAPHY.h1).toContain('text-3xl');
        expect(TYPOGRAPHY.h1).toContain('font-bold');
        expect(TYPOGRAPHY.h2).toContain('text-2xl');
        expect(TYPOGRAPHY.h2).toContain('font-semibold');
        expect(TYPOGRAPHY.h3).toContain('text-lg');
        expect(TYPOGRAPHY.h3).toContain('font-semibold');
        expect(TYPOGRAPHY.body).toContain('text-base');
        expect(TYPOGRAPHY.body).toContain('leading-relaxed');
        expect(TYPOGRAPHY.body).toContain('font-normal');
    });

    it('renders SectionHeading as a visually distinct H2', () => {
        render(<SectionHeading>Assets</SectionHeading>);

        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Assets');
        expect(heading).toHaveClass('text-2xl', 'font-semibold', 'tracking-tight');
        expect(screen.getByTestId('section-heading')).toBe(heading);
    });

    it('renders SubsectionHeading as a visually distinct H3', () => {
        render(<SubsectionHeading>RBC Checking</SubsectionHeading>);

        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveTextContent('RBC Checking');
        expect(heading).toHaveClass('text-lg', 'font-semibold', 'tracking-tight');
        expect(screen.getByTestId('subsection-heading')).toBe(heading);
    });

    it('allows custom test ids and class overrides', () => {
        render(
            <>
                <SectionHeading data-testid="assets-heading" className="mb-2">
                    Assets
                </SectionHeading>
                <SubsectionHeading data-testid="account-name">
                    CIBC Savings
                </SubsectionHeading>
            </>,
        );

        expect(screen.getByTestId('assets-heading')).toHaveClass('mb-2');
        expect(screen.getByTestId('account-name')).toHaveTextContent(
            'CIBC Savings',
        );
    });
});

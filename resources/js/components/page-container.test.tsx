import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    PAGE_CONTAINER_CLASS,
    PAGE_SECTION_CLASS,
    PageContainer,
    PageSection,
} from './page-container';

describe('PageContainer', () => {
    it('applies canonical page padding and section gap', () => {
        render(
            <PageContainer>
                <div>Header</div>
                <div>Body</div>
            </PageContainer>,
        );

        const container = screen.getByTestId('page-container');
        expect(container).toHaveAttribute('data-page-container');
        expect(container).toHaveClass(
            'flex',
            'h-full',
            'flex-1',
            'flex-col',
            'gap-6',
            'rounded-xl',
            'p-4',
            'sm:p-6',
        );
        expect(PAGE_CONTAINER_CLASS.split(' ').every((c) =>
            container.className.includes(c),
        )).toBe(true);
        expect(container).toHaveTextContent('Header');
        expect(container).toHaveTextContent('Body');
    });

    it('merges custom className and test id', () => {
        render(
            <PageContainer
                className="overflow-x-auto"
                data-testid="dashboard-page"
            >
                Content
            </PageContainer>,
        );

        const container = screen.getByTestId('dashboard-page');
        expect(container).toHaveAttribute('data-page-container');
        expect(container).toHaveClass('overflow-x-auto', 'gap-6', 'p-4');
    });
});

describe('PageSection', () => {
    it('uses consistent nested section spacing', () => {
        render(
            <PageSection>
                <div>A</div>
                <div>B</div>
            </PageSection>,
        );

        const section = screen.getByTestId('page-section');
        expect(section.tagName).toBe('SECTION');
        expect(
            PAGE_SECTION_CLASS.split(' ').every((c) =>
                section.className.includes(c),
            ),
        ).toBe(true);
        expect(section).toHaveClass('flex', 'flex-col', 'gap-4');
    });
});

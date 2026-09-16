import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from './loading-state';

describe('LoadingState', () => {
    it('renders skeleton row placeholders by default', () => {
        render(<LoadingState label="Loading transactions…" count={3} />);

        const state = screen.getByTestId('page-loading-state');
        expect(state).toHaveAttribute('role', 'status');
        expect(state).toHaveAttribute('aria-busy', 'true');
        expect(state).toHaveAttribute(
            'data-loading-variant',
            'skeleton-rows',
        );
        expect(screen.getByText('Loading transactions…')).toBeInTheDocument();
        expect(screen.getAllByTestId('loading-skeleton-row')).toHaveLength(3);
    });

    it('renders skeleton cards variant', () => {
        render(
            <LoadingState
                variant="skeleton-cards"
                label="Loading accounts…"
                count={2}
            />,
        );

        expect(
            screen.getByTestId('page-loading-state'),
        ).toHaveAttribute('data-loading-variant', 'skeleton-cards');
        expect(screen.getAllByTestId('loading-skeleton-card')).toHaveLength(2);
        expect(screen.getByText('Loading accounts…')).toBeInTheDocument();
    });

    it('renders spinner variant with accessible label', () => {
        render(
            <LoadingState
                variant="spinner"
                label="Loading report…"
            />,
        );

        const state = screen.getByTestId('page-loading-state');
        expect(state).toHaveAttribute('data-loading-variant', 'spinner');
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.getByTestId('loading-label')).toHaveTextContent(
            'Loading report…',
        );
    });
});

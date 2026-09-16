import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Receipt } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
    it('renders title, description, and icon', () => {
        render(
            <EmptyState
                title="No transactions yet"
                description="Add your first expense to start tracking."
                icon={Receipt}
            />,
        );

        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
            'No transactions yet',
        );
        expect(
            screen.getByTestId('empty-state-description'),
        ).toHaveTextContent('Add your first expense to start tracking.');
        expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    });

    it('renders CTA and calls onAction when clicked', async () => {
        const user = userEvent.setup();
        const onAction = vi.fn();

        render(
            <EmptyState
                title="No transactions yet"
                actionLabel="Add First Transaction"
                onAction={onAction}
                actionTestId="add-first-transaction"
            />,
        );

        const cta = screen.getByTestId('add-first-transaction');
        expect(cta).toHaveTextContent('Add First Transaction');
        await user.click(cta);
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('omits CTA when action is not provided', () => {
        render(<EmptyState title="Nothing here" />);

        expect(
            screen.queryByTestId('empty-state-action'),
        ).not.toBeInTheDocument();
    });
});

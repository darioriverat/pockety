import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scale } from 'lucide-react';
import { PageTitle } from './page-title';

describe('PageTitle', () => {
    it('renders a prominent H1 with description', () => {
        render(
            <PageTitle
                title="Dashboard"
                description="Financial overview for the selected period"
            />,
        );

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Dashboard');
        expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight');
        expect(screen.getByTestId('page-title')).toBe(heading);
        expect(screen.getByTestId('page-title-description')).toHaveTextContent(
            'Financial overview for the selected period',
        );
        expect(screen.getByTestId('page-header')).toBeInTheDocument();
    });

    it('supports custom test id, leading icon, and trailing content', () => {
        render(
            <PageTitle
                title="Reconciliation"
                description="Compare recorded vs computed balances"
                data-testid="reconciliation-heading"
                leading={<Scale data-testid="title-leading-icon" className="h-7 w-7" />}
                trailing={<span data-testid="title-badge">Live</span>}
            />,
        );

        expect(screen.getByTestId('reconciliation-heading')).toHaveTextContent(
            'Reconciliation',
        );
        expect(screen.getByTestId('title-leading-icon')).toBeInTheDocument();
        expect(screen.getByTestId('title-badge')).toHaveTextContent('Live');
    });

    it('omits description when not provided', () => {
        render(<PageTitle title="Accounts" />);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
            'Accounts',
        );
        expect(
            screen.queryByTestId('page-title-description'),
        ).not.toBeInTheDocument();
    });
});

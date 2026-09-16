import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WalletIcon } from 'lucide-react';
import { DashboardSummaryCard } from '@/components/dashboard-summary-card';

describe('DashboardSummaryCard', () => {
    it('renders title, value, description, and consistent card chrome', () => {
        const { container } = render(
            <DashboardSummaryCard
                title="Total Assets"
                value="$1,234.56"
                description="All bank accounts & investments · CAD"
                icon={WalletIcon}
                tone="default"
                testId="dashboard-card-assets"
                valueTestId="dashboard-total-assets"
            />,
        );

        const card = screen.getByTestId('dashboard-card-assets');
        expect(card).toBeInTheDocument();
        expect(card).toHaveAttribute('data-slot', 'dashboard-summary-card');
        expect(card.className).toMatch(/border/);
        expect(card.className).toMatch(/shadow-sm/);
        expect(card.className).toMatch(/rounded-xl/);

        expect(screen.getByText('Total Assets')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-total-assets')).toHaveTextContent(
            '$1,234.56',
        );
        expect(
            screen.getByText('All bank accounts & investments · CAD'),
        ).toBeInTheDocument();

        // All summary cards share the same structural slots
        expect(
            container.querySelector('[data-slot="card-header"]'),
        ).toBeTruthy();
        expect(
            container.querySelector('[data-slot="card-content"]'),
        ).toBeTruthy();
    });

    it('applies tone classes for positive and negative values', () => {
        const { rerender } = render(
            <DashboardSummaryCard
                title="Income"
                value="$100"
                description="test"
                icon={WalletIcon}
                tone="positive"
                valueTestId="value"
            />,
        );
        expect(screen.getByTestId('value').className).toMatch(/text-green/);

        rerender(
            <DashboardSummaryCard
                title="Expenses"
                value="$50"
                description="test"
                icon={WalletIcon}
                tone="negative"
                valueTestId="value"
            />,
        );
        expect(screen.getByTestId('value').className).toMatch(/text-red/);
    });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

describe('Alert warning variant', () => {
    it('renders yellow/orange warning styling with icon and message', () => {
        render(
            <Alert variant="warning" data-testid="warning-alert">
                <AlertTriangle data-testid="warning-icon" />
                <AlertTitle>Unreconciled variance detected</AlertTitle>
                <AlertDescription>
                    Recorded and computed balances differ for this period.
                </AlertDescription>
            </Alert>,
        );

        const alert = screen.getByTestId('warning-alert');
        expect(alert).toHaveAttribute('role', 'alert');
        expect(alert.className).toMatch(/amber|warning/);
        expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
        expect(
            screen.getByText('Unreconciled variance detected'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Recorded and computed balances differ for this period/,
            ),
        ).toBeInTheDocument();
    });
});

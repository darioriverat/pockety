import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './date-picker';

describe('DatePicker', () => {
    it('shows YYYY-MM-DD value and opens calendar on field click', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <DatePicker
                id="date"
                value="2025-03-15"
                onChange={onChange}
                data-testid="transaction-date"
            />,
        );

        const input = screen.getByTestId('transaction-date-input');
        expect(input).toHaveValue('2025-03-15');
        expect(screen.getByTestId('transaction-date')).toHaveAttribute(
            'data-date-format',
            'YYYY-MM-DD',
        );

        expect(
            screen.queryByTestId('date-picker-calendar'),
        ).not.toBeInTheDocument();

        await user.click(input);

        const calendar = screen.getByTestId('date-picker-calendar');
        expect(calendar).toBeInTheDocument();
        expect(calendar).toHaveAttribute('data-date-format', 'YYYY-MM-DD');
        expect(screen.getByTestId('date-picker-format-hint')).toHaveTextContent(
            'YYYY-MM-DD',
        );
        expect(screen.getByTestId('date-picker-month-label')).toHaveTextContent(
            'March 2025',
        );
        expect(
            screen.getByTestId('date-picker-day-2025-03-15'),
        ).toHaveAttribute('data-selected', 'true');
    });

    it('allows typing a date and selecting from the calendar', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        const { rerender } = render(
            <DatePicker value="" onChange={onChange} data-testid="date-picker" />,
        );

        const input = screen.getByTestId('date-picker-input');
        fireEvent.change(input, { target: { value: '2026-01-10' } });
        expect(onChange).toHaveBeenCalledWith('2026-01-10');

        rerender(
            <DatePicker
                value="2026-01-10"
                onChange={onChange}
                data-testid="date-picker"
            />,
        );

        await user.click(screen.getByTestId('date-picker-trigger'));
        expect(screen.getByTestId('date-picker-calendar')).toBeInTheDocument();

        await user.click(screen.getByTestId('date-picker-day-2026-01-20'));
        expect(onChange).toHaveBeenCalledWith('2026-01-20');
        expect(
            screen.queryByTestId('date-picker-calendar'),
        ).not.toBeInTheDocument();
    });

    it('navigates months with previous and next controls', async () => {
        const user = userEvent.setup();

        render(
            <DatePicker
                value="2025-06-01"
                onChange={vi.fn()}
                data-testid="date-picker"
            />,
        );

        await user.click(screen.getByTestId('date-picker-trigger'));
        expect(screen.getByTestId('date-picker-month-label')).toHaveTextContent(
            'June 2025',
        );

        await user.click(screen.getByTestId('date-picker-prev-month'));
        expect(screen.getByTestId('date-picker-month-label')).toHaveTextContent(
            'May 2025',
        );

        await user.click(screen.getByTestId('date-picker-next-month'));
        await user.click(screen.getByTestId('date-picker-next-month'));
        expect(screen.getByTestId('date-picker-month-label')).toHaveTextContent(
            'July 2025',
        );
    });
});

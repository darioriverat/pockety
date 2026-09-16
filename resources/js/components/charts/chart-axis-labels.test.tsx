import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    CHART_PADDING_WITH_AXIS_LABELS,
    ChartAxisLabels,
} from './chart-axis-labels';

describe('ChartAxisLabels', () => {
    it('renders readable x and y axis labels', () => {
        const { getByTestId } = render(
            <svg>
                <ChartAxisLabels
                    width={900}
                    height={280}
                    padding={CHART_PADDING_WITH_AXIS_LABELS}
                    xLabel="Period"
                    yLabel="Amount (CAD)"
                    testIdPrefix="income-expense-chart"
                />
            </svg>,
        );

        expect(getByTestId('income-expense-chart-y-axis-label').textContent).toBe(
            'Amount (CAD)',
        );
        expect(getByTestId('income-expense-chart-x-axis-label').textContent).toBe(
            'Period',
        );
        expect(getByTestId('income-expense-chart-axis-labels')).toBeTruthy();
    });

    it('rotates the y-axis label for vertical reading', () => {
        const { getByTestId } = render(
            <svg>
                <ChartAxisLabels
                    width={900}
                    height={280}
                    padding={CHART_PADDING_WITH_AXIS_LABELS}
                    xLabel="Period"
                    yLabel="Amount (USD)"
                />
            </svg>,
        );

        const yLabel = getByTestId('chart-y-axis-label');
        expect(yLabel.getAttribute('transform')).toMatch(/rotate\(-90/);
    });
});

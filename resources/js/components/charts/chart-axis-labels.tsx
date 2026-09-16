import type { ChartPadding } from '@/lib/chart-layout';

interface ChartAxisLabelsProps {
    width: number;
    height: number;
    padding: ChartPadding;
    xLabel: string;
    yLabel: string;
    testIdPrefix?: string;
    fontSize?: number;
}

/**
 * Readable X/Y axis titles for SVG charts.
 * Place after grid/ticks so titles sit above tick labels without overlapping series.
 */
export function ChartAxisLabels({
    width,
    height,
    padding,
    xLabel,
    yLabel,
    testIdPrefix = 'chart',
    fontSize = 12,
}: ChartAxisLabelsProps) {
    const plotCenterY = padding.top + (height - padding.top - padding.bottom) / 2;
    const plotCenterX = padding.left + (width - padding.left - padding.right) / 2;
    const yAxisX = Math.max(10, Math.min(14, padding.left * 0.22));

    return (
        <g data-testid={`${testIdPrefix}-axis-labels`} aria-hidden="true">
            <text
                data-testid={`${testIdPrefix}-y-axis-label`}
                transform={`rotate(-90 ${yAxisX} ${plotCenterY})`}
                x={yAxisX}
                y={plotCenterY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize={fontSize}
                fontWeight={500}
            >
                {yLabel}
            </text>
            <text
                data-testid={`${testIdPrefix}-x-axis-label`}
                x={plotCenterX}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={fontSize}
                fontWeight={500}
            >
                {xLabel}
            </text>
        </g>
    );
}

/** Standard padding that leaves room for tick marks and axis titles. */
export const CHART_PADDING_WITH_AXIS_LABELS = {
    top: 24,
    right: 24,
    bottom: 56,
    left: 72,
} as const;

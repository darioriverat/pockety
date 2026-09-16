export interface ChartPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartLayout {
    width: number;
    height: number;
    padding: ChartPadding;
    tickFontSize: number;
    axisFontSize: number;
    /** Target maximum number of visible X-axis tick labels */
    maxXLabels: number;
    /** Rotate X-axis period labels to avoid overlap on narrow screens */
    rotateXLabels: boolean;
    mode: 'mobile' | 'desktop';
}

const DESKTOP_PADDING: ChartPadding = {
    top: 24,
    right: 24,
    bottom: 56,
    left: 72,
};

const MOBILE_PADDING: ChartPadding = {
    top: 20,
    right: 14,
    bottom: 72,
    left: 52,
};

/**
 * Layout presets so SVG charts stay readable when scaled to phone widths.
 * Mobile uses a narrower viewBox so tick/axis text maps to ~12px on a 375px screen.
 */
export function getChartLayout(
    isMobile: boolean,
    options?: { height?: number },
): ChartLayout {
    if (isMobile) {
        return {
            width: 360,
            height: options?.height ?? 260,
            padding: MOBILE_PADDING,
            tickFontSize: 12,
            axisFontSize: 13,
            maxXLabels: 4,
            rotateXLabels: true,
            mode: 'mobile',
        };
    }

    return {
        width: 900,
        height: options?.height ?? 300,
        padding: DESKTOP_PADDING,
        tickFontSize: 11,
        axisFontSize: 12,
        maxXLabels: 8,
        rotateXLabels: false,
        mode: 'desktop',
    };
}

/** Step between labeled X ticks so labels stay spaced and readable. */
export function getXLabelStep(periodCount: number, maxXLabels: number): number {
    if (periodCount <= 0) {
        return 1;
    }

    return Math.max(1, Math.ceil(periodCount / maxXLabels));
}

export function shouldShowXLabel(
    index: number,
    periodCount: number,
    maxXLabels: number,
): boolean {
    const step = getXLabelStep(periodCount, maxXLabels);
    return index % step === 0 || index === periodCount - 1;
}

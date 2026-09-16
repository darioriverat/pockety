import { describe, expect, it } from 'vitest';
import {
    getChartLayout,
    getXLabelStep,
    shouldShowXLabel,
} from './chart-layout';

describe('chart-layout', () => {
    it('returns a compact mobile layout with rotated labels', () => {
        const layout = getChartLayout(true);

        expect(layout.mode).toBe('mobile');
        expect(layout.width).toBe(360);
        expect(layout.height).toBe(260);
        expect(layout.rotateXLabels).toBe(true);
        expect(layout.maxXLabels).toBe(4);
        expect(layout.tickFontSize).toBeGreaterThanOrEqual(12);
        expect(layout.padding.left).toBeLessThan(72);
        expect(layout.padding.bottom).toBeGreaterThan(56);
    });

    it('returns a wide desktop layout', () => {
        const layout = getChartLayout(false, { height: 320 });

        expect(layout.mode).toBe('desktop');
        expect(layout.width).toBe(900);
        expect(layout.height).toBe(320);
        expect(layout.rotateXLabels).toBe(false);
        expect(layout.maxXLabels).toBe(8);
    });

    it('spaces X labels so at most about maxXLabels are shown', () => {
        expect(getXLabelStep(12, 4)).toBe(3);
        expect(getXLabelStep(12, 8)).toBe(2);
        expect(getXLabelStep(3, 8)).toBe(1);

        const visible = Array.from({ length: 12 }, (_, index) =>
            shouldShowXLabel(index, 12, 4),
        ).filter(Boolean).length;

        // First + every step + last; with step 3 over 12 points → ~5 labels max
        expect(visible).toBeLessThanOrEqual(5);
        expect(shouldShowXLabel(0, 12, 4)).toBe(true);
        expect(shouldShowXLabel(11, 12, 4)).toBe(true);
    });
});

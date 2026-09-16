import { describe, expect, it } from 'vitest';
import {
    contrastRatio,
    meetsWcagAaNormalText,
    meetsWcagAaUi,
    relativeLuminance,
    WCAG_AA_NORMAL_TEXT,
} from './contrast';

describe('contrast helpers', () => {
    it('computes relative luminance for black and white', () => {
        expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
        expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    });

    it('reports max contrast for black on white', () => {
        expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
    });

    it('passes WCAG AA for near-black body text on white', () => {
        // Matches --foreground oklch(0.145) ≈ rgb(10,10,10)
        expect(meetsWcagAaNormalText([10, 10, 10], [255, 255, 255])).toBe(
            true,
        );
    });

    it('passes WCAG AA for darkened muted foreground on white', () => {
        // --muted-foreground oklch(0.45) ≈ rgb(85,85,85) → ~7.5:1
        expect(meetsWcagAaNormalText([85, 85, 85], [255, 255, 255])).toBe(
            true,
        );
        expect(contrastRatio([85, 85, 85], [255, 255, 255])).toBeGreaterThan(
            WCAG_AA_NORMAL_TEXT,
        );
    });

    it('fails WCAG AA for light gray that is too faint', () => {
        // Tailwind gray-400 ≈ #9ca3af
        expect(meetsWcagAaNormalText([156, 163, 175], [255, 255, 255])).toBe(
            false,
        );
    });

    it('passes UI contrast for primary button colors', () => {
        expect(meetsWcagAaUi([250, 250, 250], [23, 23, 23])).toBe(true);
    });
});

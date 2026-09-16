/**
 * WCAG contrast helpers for verifying AA (4.5:1 normal text, 3:1 UI).
 */

export type Rgb = readonly [number, number, number];

export function relativeLuminance(rgb: Rgb): number {
    const channels = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(foreground: Rgb, background: Rgb): number {
    const luminances = [
        relativeLuminance(foreground),
        relativeLuminance(background),
    ];
    return (
        (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05)
    );
}

/** WCAG AA minimum for normal text (< 18pt / < 14pt bold). */
export const WCAG_AA_NORMAL_TEXT = 4.5;

/** WCAG AA minimum for UI components and graphical objects. */
export const WCAG_AA_UI = 3;

export function meetsWcagAaNormalText(
    foreground: Rgb,
    background: Rgb,
): boolean {
    return contrastRatio(foreground, background) >= WCAG_AA_NORMAL_TEXT;
}

export function meetsWcagAaUi(foreground: Rgb, background: Rgb): boolean {
    return contrastRatio(foreground, background) >= WCAG_AA_UI;
}

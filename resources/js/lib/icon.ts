/**
 * Shared Lucide icon tokens (feature #168).
 * Outline stroke style, consistent sizes, and text alignment helpers.
 */
export const ICON_STROKE = 2;
export const ICON_STROKE_DECORATIVE = 1.5;

/** Canonical icon sizes used next to text / in chrome */
export const ICON_SIZE = {
    /** Badges, dense status chips */
    xs: 'size-3',
    /** Compact controls */
    sm: 'size-3.5',
    /** Default: buttons, cards, inline labels, nav */
    md: 'size-4',
    /** Section / card headings with icons */
    lg: 'size-5',
    /** Nested page titles */
    xl: 'size-6',
    /** Primary page titles */
    '2xl': 'size-7',
    /** Empty-state decorative icons */
    empty: 'size-8',
} as const;

export type IconSize = keyof typeof ICON_SIZE;

/** Vertically center an icon with adjacent text */
export const ICON_INLINE_CLASS = 'inline-flex items-center gap-2';

/** Outline lucide defaults — avoid accidental solid fills on UI icons */
export const ICON_OUTLINE_CLASS = 'shrink-0 fill-none';

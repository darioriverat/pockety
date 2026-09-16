import { describe, expect, it } from 'vitest';
import {
    ICON_INLINE_CLASS,
    ICON_OUTLINE_CLASS,
    ICON_SIZE,
    ICON_STROKE,
    ICON_STROKE_DECORATIVE,
} from '@/lib/icon';

describe('icon tokens', () => {
    it('uses outline stroke defaults', () => {
        expect(ICON_STROKE).toBe(2);
        expect(ICON_STROKE_DECORATIVE).toBe(1.5);
        expect(ICON_OUTLINE_CLASS).toContain('fill-none');
        expect(ICON_OUTLINE_CLASS).toContain('shrink-0');
    });

    it('defines a consistent size scale', () => {
        expect(ICON_SIZE.xs).toBe('size-3');
        expect(ICON_SIZE.md).toBe('size-4');
        expect(ICON_SIZE.lg).toBe('size-5');
        expect(ICON_SIZE['2xl']).toBe('size-7');
        expect(ICON_SIZE.empty).toBe('size-8');
    });

    it('aligns icons with adjacent text via inline flex', () => {
        expect(ICON_INLINE_CLASS).toContain('inline-flex');
        expect(ICON_INLINE_CLASS).toContain('items-center');
        expect(ICON_INLINE_CLASS).toContain('gap-2');
    });
});

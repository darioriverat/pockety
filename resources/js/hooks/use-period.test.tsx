import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { currentPeriod } from '@/lib/periods';
import { initializePeriod, resetPeriod, usePeriod } from '@/hooks/use-period';

const STORAGE_KEY = 'pockety.selectedPeriod';

describe('usePeriod', () => {
    beforeEach(() => {
        localStorage.clear();
        initializePeriod();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('defaults to the current month and persists it', () => {
        const { result } = renderHook(() => usePeriod());

        expect(result.current.period).toBe(currentPeriod());
        expect(localStorage.getItem(STORAGE_KEY)).toBe(currentPeriod());
    });

    it('updates period and persists to localStorage', () => {
        const { result } = renderHook(() => usePeriod());

        act(() => {
            result.current.setPeriod('202502');
        });

        expect(result.current.period).toBe('202502');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('202502');
    });

    it('ignores invalid periods', () => {
        const { result } = renderHook(() => usePeriod());

        act(() => {
            result.current.setPeriod('not-a-period');
        });

        expect(result.current.period).toBe(currentPeriod());
        expect(localStorage.getItem(STORAGE_KEY)).toBe(currentPeriod());
    });

    it('restores a previously stored valid period on initialize', () => {
        localStorage.setItem(STORAGE_KEY, '202503');
        initializePeriod();

        const { result } = renderHook(() => usePeriod());

        expect(result.current.period).toBe('202503');
    });

    it('shares period updates across hook instances', () => {
        const first = renderHook(() => usePeriod());
        const second = renderHook(() => usePeriod());

        act(() => {
            first.result.current.setPeriod('202504');
        });

        expect(first.result.current.period).toBe('202504');
        expect(second.result.current.period).toBe('202504');
    });

    it('clears the previous account selection on logout for every subscriber and reload', () => {
        const first = renderHook(() => usePeriod());
        const second = renderHook(() => usePeriod());

        act(() => first.result.current.setPeriod('202601'));
        act(() => resetPeriod());

        expect(first.result.current.period).toBe(currentPeriod());
        expect(second.result.current.period).toBe(currentPeriod());
        expect(localStorage.getItem(STORAGE_KEY)).toBe(currentPeriod());
        initializePeriod();
        const reloaded = renderHook(() => usePeriod());
        expect(reloaded.result.current.period).toBe(currentPeriod());
    });
});

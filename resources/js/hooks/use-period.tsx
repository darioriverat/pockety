import { useSyncExternalStore } from 'react';
import {
    DEFAULT_PERIOD,
    isValidPeriod,
} from '@/lib/periods';

export type UsePeriodReturn = {
    readonly period: string;
    readonly setPeriod: (period: string) => void;
};

const STORAGE_KEY = 'pockety.selectedPeriod';
const listeners = new Set<() => void>();
let currentPeriod: string = DEFAULT_PERIOD;

const getStoredPeriod = (): string => {
    if (typeof window === 'undefined') {
        return DEFAULT_PERIOD;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidPeriod(stored)) {
        return stored;
    }

    return DEFAULT_PERIOD;
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
};

const notify = (): void => {
    listeners.forEach((listener) => listener());
};

export function initializePeriod(): void {
    if (typeof window === 'undefined') {
        return;
    }

    currentPeriod = getStoredPeriod();

    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, currentPeriod);
    }
}

export function usePeriod(): UsePeriodReturn {
    const period = useSyncExternalStore(
        subscribe,
        () => currentPeriod,
        () => DEFAULT_PERIOD,
    );

    const setPeriod = (next: string): void => {
        if (!isValidPeriod(next)) {
            return;
        }

        currentPeriod = next;
        localStorage.setItem(STORAGE_KEY, next);
        notify();
    };

    return { period, setPeriod } as const;
}

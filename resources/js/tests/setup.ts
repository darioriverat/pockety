import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(async () => {
    cleanup();
    // Flush Radix FocusScope unmount autofocus timeout so jsdom
    // does not dispatch CustomEvent after the test finishes.
    await new Promise((resolve) => setTimeout(resolve, 0));
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

class ResizeObserverMock {
    observe() {}

    unobserve() {}

    disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

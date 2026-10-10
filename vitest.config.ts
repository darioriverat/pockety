import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['resources/js/**/*.test.{ts,tsx}'],
        setupFiles: ['./resources/js/tests/setup.ts'],
        // GitHub-hosted runners are slower with jsdom and Radix selects.
        testTimeout: process.env.CI ? 30_000 : 15_000,
        hookTimeout: process.env.CI ? 30_000 : 15_000,
    },
});

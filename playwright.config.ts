import { defineConfig, devices } from '@playwright/test';

const defaultRetries = process.env.CI ? 2 : 0;

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8080';
const channel = process.env.PLAYWRIGHT_CHANNEL || 'chromium';
const retries = process.env.PLAYWRIGHT_RETRIES || defaultRetries;

export default defineConfig({
    testDir: './tests/browser',
    fullyParallel: false,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Limit the whole test run, so that it fails with a report instead of hanging.
    globalTimeout: 60 * 60 * 1000,

    workers: 1,
    retries: retries as number,
    reporter: 'list',
    use: {
        baseURL,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        channel,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});

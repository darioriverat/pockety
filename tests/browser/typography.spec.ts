import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-165-typography',
);

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

test('feature 165: typography is hierarchical and readable', async ({
    page,
}) => {
    const errors = trackConsoleErrors(page);
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsBrowserTestUser(page);

    // Ensure accounts exist so H2 section + H3 card titles render
    const listResponse = await page.request.get('/api/accounts');
    expect(listResponse.ok()).toBeTruthy();
    const listJson = await listResponse.json();
    const existing = Array.isArray(listJson.data) ? listJson.data : [];

    if (existing.length === 0) {
        const createResponse = await page.request.post('/api/accounts', {
            data: {
                name: 'Typography Test Checking',
                type: 'bank',
                primary_currency: 'CAD',
                notes: 'Seeded for typography hierarchy verification',
            },
        });
        expect(createResponse.ok()).toBeTruthy();
    }

    // Content-heavy page with H1 (page), H2 (sections), H3 (account cards)
    await page.goto('/accounts');

    const h1 = page.getByTestId('page-title');
    const h2 = page.getByTestId('accounts-assets-heading');
    const h3 = page.getByTestId('account-card-title').first();
    const description = page.getByTestId('page-title-description');

    await expect(h1).toBeVisible();
    await expect(h2).toBeVisible();
    await expect(h3).toBeVisible();
    await expect(h1).toHaveJSProperty('tagName', 'H1');
    await expect(h2).toHaveJSProperty('tagName', 'H2');
    await expect(h3).toHaveJSProperty('tagName', 'H3');

    const metrics = await page.evaluate(() => {
        const measure = (el: Element | null) => {
            if (!el) {
                return null;
            }
            const computed = window.getComputedStyle(el);
            return {
                fontSize: Number.parseFloat(computed.fontSize),
                fontWeight: Number.parseInt(computed.fontWeight, 10),
                lineHeight: Number.parseFloat(computed.lineHeight),
            };
        };

        return {
            h1: measure(document.querySelector('[data-testid="page-title"]')),
            h2: measure(
                document.querySelector(
                    '[data-testid="accounts-assets-heading"]',
                ),
            ),
            h3: measure(
                document.querySelector('[data-testid="account-card-title"]'),
            ),
            body: measure(document.body),
            description: measure(
                document.querySelector(
                    '[data-testid="page-title-description"]',
                ),
            ),
        };
    });

    expect(metrics.h1).not.toBeNull();
    expect(metrics.h2).not.toBeNull();
    expect(metrics.h3).not.toBeNull();
    expect(metrics.body).not.toBeNull();

    // Step 3: heading levels visually distinct (size cascade)
    expect(metrics.h1!.fontSize).toBeGreaterThan(metrics.h2!.fontSize);
    expect(metrics.h2!.fontSize).toBeGreaterThan(metrics.h3!.fontSize);
    expect(metrics.h3!.fontSize).toBeGreaterThan(metrics.body!.fontSize - 0.1);

    // Step 4: body text readable (at least 14–16px)
    expect(metrics.body!.fontSize).toBeGreaterThanOrEqual(14);
    expect(metrics.body!.fontSize).toBeLessThanOrEqual(18);

    // Step 5: line height provides good readability (ratio ≥ 1.4)
    const bodyLineRatio = metrics.body!.lineHeight / metrics.body!.fontSize;
    expect(bodyLineRatio).toBeGreaterThanOrEqual(1.4);

    // Step 6: font weights distinguish headings from body
    expect(metrics.h1!.fontWeight).toBeGreaterThanOrEqual(700);
    expect(metrics.h2!.fontWeight).toBeGreaterThanOrEqual(600);
    expect(metrics.h3!.fontWeight).toBeGreaterThanOrEqual(600);
    expect(metrics.body!.fontWeight).toBeLessThan(600);

    if (metrics.description) {
        expect(metrics.description.fontSize).toBeGreaterThanOrEqual(14);
        expect(metrics.description.fontWeight).toBeLessThan(600);
    }

    await expect(description).toBeVisible();

    await page.screenshot({
        animations: 'disabled',
        path: path.join(verificationDir, '01-accounts-typography.png'),
        fullPage: false,
    });

    // Second content-heavy page for consistency
    await page.goto('/dashboard');
    await expect(page.getByTestId('page-title')).toBeVisible();
    await expect(page.getByTestId('subsection-heading').first()).toBeVisible();

    const dashboardBody = await page.evaluate(() => {
        const computed = window.getComputedStyle(document.body);
        return {
            fontSize: Number.parseFloat(computed.fontSize),
            lineHeight: Number.parseFloat(computed.lineHeight),
            fontWeight: Number.parseInt(computed.fontWeight, 10),
        };
    });
    expect(dashboardBody.fontSize).toBeGreaterThanOrEqual(14);
    expect(
        dashboardBody.lineHeight / dashboardBody.fontSize,
    ).toBeGreaterThanOrEqual(1.4);

    await page.screenshot({
        animations: 'disabled',
        path: path.join(verificationDir, '02-dashboard-typography.png'),
        fullPage: false,
    });

    expect(errors).toEqual([]);
});

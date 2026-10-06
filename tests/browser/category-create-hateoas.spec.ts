import { expect, test } from '@playwright/test';
import {
    loginAsBrowserTestUser,
    resetBrowserState,
    trackConsoleErrors,
} from './helpers';

const SHOT_DIR = 'verification/category-create-hateoas';

test.describe('HATEOAS links on category create response', () => {
    test.beforeAll(() => {
        resetBrowserState();
    });

    test('feature 75: create response links.self returns the same category', async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        page.on('pageerror', (error) => consoleErrors.push(error.message));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page, request);

        await page.goto('/categories');
        await expect(page.getByText('Total categories:')).toBeVisible();
        await page.screenshot({
            path: `${SHOT_DIR}/01-categories-page.png`,
            fullPage: true,
        });

        await page.getByTestId('create-category-button').click();
        await expect(page.getByTestId('create-category-dialog')).toBeVisible();
        await page
            .getByLabel('Name', { exact: true })
            .fill('HATEOAS Create Link');
        await page.getByRole('radio', { name: 'Expense', exact: true }).check();
        await page.screenshot({
            path: `${SHOT_DIR}/02-create-dialog.png`,
        });

        const createdWait = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().endsWith('/api/categories'),
        );
        await page.getByTestId('create-category-submit').click();
        const createResponse = await createdWait;
        expect(createResponse.status()).toBe(201);

        const body = (await createResponse.json()) as {
            data: {
                id: number;
                code: string;
                name: string;
                is_active: boolean;
            };
            links: { self: string };
        };

        expect(body.data).toMatchObject({
            name: 'HATEOAS Create Link',
            is_active: true,
        });
        expect(body.data.code).toMatch(/^C\d{3}$/);
        expect(body.links.self).toBeTruthy();
        expect(body.links.self).toContain(body.data.code);
        expect(body.links.self).toContain(`/api/categories/${body.data.code}`);

        const selfUrl = new URL(body.links.self, page.url());
        const followResponse = await request.get(
            `${selfUrl.pathname}${selfUrl.search}`,
        );
        expect(followResponse.status()).toBe(200);
        const followed = await followResponse.json();
        expect(followed.data).toMatchObject({
            id: body.data.id,
            code: body.data.code,
            name: 'HATEOAS Create Link',
        });

        await expect(page.getByTestId('create-category-dialog')).toHaveCount(0);
        await expect(
            page.getByTestId(`category-name-${body.data.code}`),
        ).toHaveText('HATEOAS Create Link');
        await page
            .getByTestId(`category-card-${body.data.code}`)
            .scrollIntoViewIfNeeded();
        await page.screenshot({
            path: `${SHOT_DIR}/03-category-created.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
});

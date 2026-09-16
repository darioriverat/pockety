import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-152-warning-messages';

function relativeLuminance(rgb: number[]): number {
    const channels = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (
        channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    );
}

function contrastRatio(a: number[], b: number[]): number {
    const luminances = [relativeLuminance(a), relativeLuminance(b)];
    return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}

async function seedUnreconciledAccount(
    request: import('@playwright/test').APIRequestContext,
    name: string,
): Promise<number> {
    const categoriesResponse = await request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categoriesPayload = (await categoriesResponse.json()) as {
        data: Array<{ id: number }>;
    };
    const categoryId = categoriesPayload.data[0].id;

    const accountResponse = await request.post('/api/accounts', {
        data: {
            name,
            type: 'bank',
            primary_currency: 'CAD',
        },
    });
    expect(accountResponse.ok()).toBeTruthy();
    const accountPayload = (await accountResponse.json()) as {
        data: { id: number };
    };
    const accountId = accountPayload.data.id;

    const balanceResponse = await request.post(
        `/api/accounts/${accountId}/balances`,
        {
            data: {
                period: '202501',
                recorded_balance_cad: 1000,
                recorded_balance_usd: 0,
                recorded_balance_cop: 0,
            },
        },
    );
    expect(balanceResponse.ok()).toBeTruthy();

    // Expense reduces computed balance → recorded - computed = +75 (> $10)
    const transactionResponse = await request.post('/api/transactions', {
        data: {
            date: '2025-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId,
            amount_cad: 75,
            amount_usd: null,
            amount_cop: null,
            comments: 'Seed variance for warning style test',
        },
    });
    expect(transactionResponse.ok()).toBeTruthy();

    return accountId;
}

for (const theme of ['light', 'dark'] as const) {
    test(`warning messages are yellow/orange with icons in ${theme}`, async ({
        page,
        request,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);

        const accountId = await seedUnreconciledAccount(
            request,
            `Warning Style ${theme} ${Date.now()}`,
        );

        await page.goto('/reconciliation');
        await expect(page.locator('h1')).toContainText('Reconciliation');
        await page.fill('input#period-input', '202501');
        await page.click('button[type="submit"]');

        const banner = page.getByTestId('reconciliation-warning-banner');
        await expect(banner).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByTestId('reconciliation-warning-icon'),
        ).toBeVisible();
        await expect(
            page.getByTestId('reconciliation-warning-title'),
        ).toContainText('Unreconciled variance detected');
        await expect(
            page.getByTestId('reconciliation-warning-message'),
        ).toContainText(/non-zero difference/i);

        const accountMessage = page.getByTestId(
            `variance-warning-message-${accountId}`,
        );
        await expect(accountMessage).toBeVisible();
        await expect(
            page.getByTestId(`variance-warning-message-icon-${accountId}`),
        ).toBeVisible();
        await expect(accountMessage).toContainText(
            /Significant unreconciled variance/i,
        );
        await expect(accountMessage).toContainText(/\$10\.00 threshold/);

        const bannerColors = await banner.evaluate((element) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            const rgb = (color: string) => {
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                return Array.from(
                    context.getImageData(0, 0, 1, 1).data,
                ).slice(0, 3);
            };
            const style = getComputedStyle(element);
            const title = element.querySelector(
                '[data-testid="reconciliation-warning-title"]',
            );
            const titleStyle = title ? getComputedStyle(title) : style;
            return {
                text: rgb(titleStyle.color),
                background: rgb(style.backgroundColor),
                border: rgb(style.borderColor),
            };
        });

        // Yellow/orange: red and green high relative to blue
        expect(bannerColors.text[0]).toBeGreaterThan(bannerColors.text[2]);
        expect(bannerColors.text[1]).toBeGreaterThan(bannerColors.text[2]);
        expect(bannerColors.background[0]).toBeGreaterThan(
            bannerColors.background[2],
        );
        expect(
            contrastRatio(bannerColors.text, bannerColors.background),
        ).toBeGreaterThanOrEqual(4.5);

        await page.screenshot({
            path: `${evidence}/${theme}-warning-banner.png`,
            fullPage: true,
        });

        await accountMessage.scrollIntoViewIfNeeded();
        await page.screenshot({
            path: `${evidence}/${theme}-account-warning.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}

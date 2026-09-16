import { expect, test } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';

const evidence = 'verification/test-155-modal-dialogs';

/** Parse CSS color strings (rgb/rgba, color(srgb …), oklab/oklch with alpha). */
function parseCssColorChannels(color: string): {
    r: number;
    g: number;
    b: number;
    a: number;
} | null {
    const rgba = color.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
    );
    if (rgba) {
        return {
            r: Number(rgba[1]),
            g: Number(rgba[2]),
            b: Number(rgba[3]),
            a: rgba[4] !== undefined ? Number(rgba[4]) : 1,
        };
    }

    const srgb = color.match(
        /color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i,
    );
    if (srgb) {
        return {
            r: Math.round(Number(srgb[1]) * 255),
            g: Math.round(Number(srgb[2]) * 255),
            b: Math.round(Number(srgb[3]) * 255),
            a: srgb[4] !== undefined ? Number(srgb[4]) : 1,
        };
    }

    // Fallback: treat near-black named colors / lab forms by sampling alpha only.
    const alphaOnly = color.match(/\/\s*([\d.]+)\s*\)/);
    if (/^(black|#000|#000000)$/i.test(color.trim())) {
        return { r: 0, g: 0, b: 0, a: 1 };
    }
    if (alphaOnly && /oklch|oklab|lab|lch/i.test(color)) {
        return { r: 0, g: 0, b: 0, a: Number(alphaOnly[1]) };
    }

    return null;
}

async function openDeleteDialog(
    page: import('@playwright/test').Page,
): Promise<string> {
    const categoriesResponse = await page.request.get('/api/categories');
    expect(categoriesResponse.ok()).toBeTruthy();
    const categoriesPayload = (await categoriesResponse.json()) as {
        data: Array<{ id: number; code: string }>;
    };
    const c001 = categoriesPayload.data.find((item) => item.code === 'C001');
    expect(c001).toBeTruthy();

    const createResponse = await page.request.post('/api/transactions', {
        data: {
            date: '2025-03-12',
            period: '202503',
            quincena: 'Q1',
            category_id: c001!.id,
            amount_cad: 12.5,
            comments: 'Modal dialog verification txn',
        },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = (await createResponse.json()) as {
        data: { id: number };
    };
    const txnId = String(created.data.id);

    await page.goto('/transactions');
    await page.getByTestId('page-period-selector').click();
    await page.getByRole('option', { name: 'March 2025', exact: true }).click();
    await expect(page.getByTestId(`transaction-row-${txnId}`)).toBeVisible({
        timeout: 10000,
    });

    await page
        .getByTestId(`transaction-row-${txnId}`)
        .getByTestId('delete-transaction-button')
        .click();
    await expect(
        page.getByTestId('delete-confirmation-dialog'),
    ).toBeVisible();

    return txnId;
}

for (const theme of ['light', 'dark'] as const) {
    test(`delete confirmation modal is centered with dark backdrop in ${theme}`, async ({
        page,
    }) => {
        const consoleErrors = trackConsoleErrors(page);
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loginAsBrowserTestUser(page);

        await openDeleteDialog(page);

        const overlay = page.getByTestId('dialog-overlay');
        const dialog = page.getByTestId('delete-confirmation-dialog');

        await expect(overlay).toBeVisible();
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('data-modal-centered', 'true');

        const metrics = await page.evaluate(() => {
            const overlayEl = document.querySelector(
                '[data-testid="dialog-overlay"]',
            ) as HTMLElement | null;
            const dialogEl = document.querySelector(
                '[data-testid="delete-confirmation-dialog"]',
            ) as HTMLElement | null;
            if (!overlayEl || !dialogEl) {
                return null;
            }

            const overlayStyle = window.getComputedStyle(overlayEl);
            const dialogStyle = window.getComputedStyle(dialogEl);
            const overlayRect = overlayEl.getBoundingClientRect();
            const dialogRect = dialogEl.getBoundingClientRect();
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            const dialogCenterX = dialogRect.left + dialogRect.width / 2;
            const dialogCenterY = dialogRect.top + dialogRect.height / 2;

            return {
                overlayBg: overlayStyle.backgroundColor,
                overlayClass: overlayEl.className,
                overlayZ: Number(overlayStyle.zIndex),
                dialogZ: Number(dialogStyle.zIndex),
                overlayCoversViewport:
                    overlayRect.width >= window.innerWidth - 2 &&
                    overlayRect.height >= window.innerHeight - 2,
                centerDeltaX: Math.abs(dialogCenterX - viewportCenterX),
                centerDeltaY: Math.abs(dialogCenterY - viewportCenterY),
                dialogVisible: dialogRect.width > 0 && dialogRect.height > 0,
            };
        });

        expect(metrics).not.toBeNull();
        expect(metrics!.overlayCoversViewport).toBe(true);
        expect(metrics!.dialogVisible).toBe(true);
        expect(metrics!.overlayZ).toBeGreaterThanOrEqual(50);
        expect(metrics!.dialogZ).toBeGreaterThan(metrics!.overlayZ);
        expect(metrics!.centerDeltaX).toBeLessThan(24);
        expect(metrics!.centerDeltaY).toBeLessThan(24);

        // Backdrop should use the dark semi-transparent black utility.
        expect(metrics!.overlayClass).toMatch(/bg-black\/80/);

        const channels = parseCssColorChannels(metrics!.overlayBg);
        expect(channels).not.toBeNull();
        expect(channels!.a).toBeGreaterThanOrEqual(0.5);
        expect(channels!.r + channels!.g + channels!.b).toBeLessThan(40);

        await page.screenshot({
            path: `${evidence}/${theme}-delete-modal-centered.png`,
            fullPage: true,
        });

        expect(consoleErrors).toEqual([]);
    });
}

test('clicking backdrop closes the modal', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await loginAsBrowserTestUser(page);

    const txnId = await openDeleteDialog(page);

    const overlay = page.getByTestId('dialog-overlay');
    await expect(overlay).toBeVisible();

    // Click near the corner of the overlay (outside the centered dialog).
    const box = await overlay.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 12, box!.y + 12);

    await expect(
        page.getByTestId('delete-confirmation-dialog'),
    ).toHaveCount(0);
    await expect(page.getByTestId('dialog-overlay')).toHaveCount(0);

    // Transaction still present after dismiss via backdrop.
    await expect(page.getByTestId(`transaction-row-${txnId}`)).toBeVisible();

    await page.screenshot({
        path: `${evidence}/after-backdrop-click.png`,
        fullPage: true,
    });

    expect(consoleErrors).toEqual([]);
});

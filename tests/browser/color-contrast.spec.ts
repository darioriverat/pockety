import { expect, test, type Page } from '@playwright/test';
import { loginAsBrowserTestUser, trackConsoleErrors } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const verificationDir = path.join(
    process.cwd(),
    'verification',
    'test-166-color-contrast',
);

const WCAG_AA_NORMAL = 4.5;

test.beforeAll(() => {
    fs.mkdirSync(verificationDir, { recursive: true });
});

type Sample = {
    name: string;
    text: number[];
    background: number[];
    ratio: number;
    fontSize: number;
    fontWeight: number;
};

async function applyTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((mode) => {
        localStorage.setItem('appearance', mode);
        document.cookie = `appearance=${mode};path=/;max-age=31536000;SameSite=Lax`;
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.style.colorScheme = mode;
    }, theme);
}

async function sampleContrast(
    page: Page,
    selectors: Array<{ name: string; selector: string }>,
): Promise<Sample[]> {
    return page.evaluate((items) => {
        const parseRgb = (color: string): number[] => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            context.fillStyle = '#000';
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return Array.from(context.getImageData(0, 0, 1, 1).data).slice(
                0,
                3,
            );
        };

        const relativeLuminance = (rgb: number[]) => {
            const channels = rgb.map((value) => {
                const channel = value / 255;
                return channel <= 0.04045
                    ? channel / 12.92
                    : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return (
                channels[0] * 0.2126 +
                channels[1] * 0.7152 +
                channels[2] * 0.0722
            );
        };

        const contrastRatio = (a: number[], b: number[]) => {
            const luminances = [relativeLuminance(a), relativeLuminance(b)];
            return (
                (Math.max(...luminances) + 0.05) /
                (Math.min(...luminances) + 0.05)
            );
        };

        const isTransparent = (color: string) => {
            if (!color || color === 'transparent') {
                return true;
            }
            const match = color.match(
                /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/,
            );
            if (match && match[4] !== undefined && Number(match[4]) < 0.05) {
                return true;
            }
            return false;
        };

        const opaqueBackground = (el: Element): string => {
            let current: Element | null = el;
            while (current) {
                const bg = getComputedStyle(current).backgroundColor;
                if (!isTransparent(bg)) {
                    return bg;
                }
                current = current.parentElement;
            }
            return getComputedStyle(document.body).backgroundColor;
        };

        return items
            .map(({ name, selector }) => {
                const el = document.querySelector(selector);
                if (!el) {
                    return null;
                }
                const style = getComputedStyle(el);
                const text = parseRgb(style.color);
                const background = parseRgb(opaqueBackground(el));
                return {
                    name,
                    text,
                    background,
                    ratio: contrastRatio(text, background),
                    fontSize: Number.parseFloat(style.fontSize),
                    fontWeight: Number.parseInt(style.fontWeight, 10) || 400,
                };
            })
            .filter(Boolean) as Sample[];
    }, selectors);
}

async function buttonContrast(page: Page, name: RegExp) {
    const button = page.getByRole('button', { name });
    await expect(button.first()).toBeVisible();
    return button.first().evaluate((el) => {
        const parseRgb = (color: string): number[] => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            return Array.from(context.getImageData(0, 0, 1, 1).data).slice(
                0,
                3,
            );
        };
        const relativeLuminance = (rgb: number[]) => {
            const channels = rgb.map((value) => {
                const channel = value / 255;
                return channel <= 0.04045
                    ? channel / 12.92
                    : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return (
                channels[0] * 0.2126 +
                channels[1] * 0.7152 +
                channels[2] * 0.0722
            );
        };
        const style = getComputedStyle(el);
        const text = parseRgb(style.color);
        const background = parseRgb(style.backgroundColor);
        const luminances = [
            relativeLuminance(text),
            relativeLuminance(background),
        ];
        return {
            text,
            background,
            ratio:
                (Math.max(...luminances) + 0.05) /
                (Math.min(...luminances) + 0.05),
        };
    });
}

for (const theme of ['light', 'dark'] as const) {
    test(`feature 166: WCAG AA contrast on core pages (${theme})`, async ({
        page,
    }) => {
        const errors = trackConsoleErrors(page);
        page.on('pageerror', (error) => errors.push(error.message));

        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAsBrowserTestUser(page);
        await applyTheme(page, theme);

        // Ensure accounts page renders section headings for contrast sampling
        const listResponse = await page.request.get('/api/accounts');
        expect(listResponse.ok()).toBeTruthy();
        const listJson = await listResponse.json();
        const existing = Array.isArray(listJson.data) ? listJson.data : [];
        if (existing.length === 0) {
            const createResponse = await page.request.post('/api/accounts', {
                data: {
                    name: 'Contrast Test Checking',
                    type: 'bank',
                    primary_currency: 'CAD',
                    notes: 'Seeded for WCAG contrast verification',
                },
            });
            expect(createResponse.ok()).toBeTruthy();
        }

        const pages: Array<{
            path: string;
            label: string;
            selectors: Array<{ name: string; selector: string }>;
        }> = [
            {
                path: '/dashboard',
                label: 'dashboard',
                selectors: [
                    { name: 'body', selector: 'body' },
                    {
                        name: 'page-title',
                        selector: '[data-testid="page-title"]',
                    },
                    {
                        name: 'page-description',
                        selector: '[data-testid="page-title-description"]',
                    },
                ],
            },
            {
                path: '/accounts',
                label: 'accounts',
                selectors: [
                    {
                        name: 'page-title',
                        selector: '[data-testid="page-title"]',
                    },
                    {
                        name: 'page-description',
                        selector: '[data-testid="page-title-description"]',
                    },
                    {
                        name: 'section-heading',
                        selector: '[data-testid="accounts-assets-heading"]',
                    },
                ],
            },
            {
                path: '/transactions',
                label: 'transactions',
                selectors: [
                    {
                        name: 'page-title',
                        selector: '[data-testid="transactions-heading"]',
                    },
                    {
                        name: 'page-description',
                        selector: '[data-testid="page-title-description"]',
                    },
                ],
            },
        ];

        for (const target of pages) {
            await page.goto(target.path);
            await applyTheme(page, theme);

            const titleSelector =
                target.selectors.find((s) => s.name === 'page-title')
                    ?.selector ?? target.selectors[0].selector;
            await expect(page.locator(titleSelector).first()).toBeVisible({
                timeout: 10000,
            });

            const samples = await sampleContrast(page, target.selectors);
            expect(
                samples.length,
                `expected samples on ${target.label}`,
            ).toBe(target.selectors.length);

            for (const sample of samples) {
                expect(
                    sample.ratio,
                    `${theme}/${target.label}/${sample.name}: text rgb(${sample.text}) on bg rgb(${sample.background}) = ${sample.ratio.toFixed(2)}`,
                ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
            }

            await page.screenshot({
                path: path.join(
                    verificationDir,
                    `${theme}-${target.label}.png`,
                ),
                fullPage: true,
            });
        }

        await page.goto('/transactions');
        await applyTheme(page, theme);

        const primaryButton = await buttonContrast(
            page,
            /add transaction/i,
        );
        expect(
            primaryButton.ratio,
            `${theme} add-transaction button contrast ${primaryButton.ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);

        await page.screenshot({
            path: path.join(verificationDir, `${theme}-interactive.png`),
        });

        expect(errors).toEqual([]);
    });
}

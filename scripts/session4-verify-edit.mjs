import fs from 'node:fs';
import { chromium } from 'playwright';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';
const channel = process.env.PLAYWRIGHT_CHANNEL || undefined;

async function main() {
    const browser = await chromium.launch({
        headless: true,
        channel,
    });
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('status of 4')) {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard$/);

    const createResponse = await page.request.post(`${baseURL}/api/categories`, {
        data: {
            name: 'Edit Name Target',
            is_debt_category: false,
            is_income_category: false,
        },
    });
    if (createResponse.status() !== 201) {
        throw new Error(`Create failed: ${createResponse.status()}`);
    }
    const created = await createResponse.json();
    const code = created.data.code;

    await page.goto(`${baseURL}/categories`);
    await page.getByTestId(`category-name-${code}`).waitFor();
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-name-before.png',
        fullPage: true,
    });

    await page.getByTestId(`edit-category-${code}`).click();
    await page.getByTestId('edit-category-dialog').waitFor();
    await page.getByTestId('edit-category-name-input').fill('Updated Name');
    await page.screenshot({
        path: 'verification/category-edit-name-dialog.png',
    });

    const updatedPromise = page.waitForResponse(
        (response) =>
            response.request().method() === 'PUT' &&
            response.url().includes(`/api/categories/${code}`),
    );
    await page.getByTestId('edit-category-submit').click();
    const updated = await updatedPromise;
    if (updated.status() !== 200) {
        throw new Error(`Update failed: ${updated.status()}`);
    }
    const payload = await updated.json();
    if (payload.data.name !== 'Updated Name') {
        throw new Error(`Unexpected name: ${payload.data.name}`);
    }
    if (!payload.links?.self || !payload.links?.index) {
        throw new Error('Missing HATEOAS links');
    }

    await page.getByTestId(`category-name-${code}`).waitFor();
    const text = await page.getByTestId(`category-name-${code}`).innerText();
    if (!text.includes('Updated Name')) {
        throw new Error(`UI did not update: ${text}`);
    }
    await page.getByTestId(`category-card-${code}`).scrollIntoViewIfNeeded();
    await page.screenshot({
        path: 'verification/category-edit-name-after.png',
        fullPage: true,
    });

    await browser.close();

    fs.writeFileSync(
        'verification/category-edit-name-result.json',
        JSON.stringify(
            {
                ok: true,
                code,
                payload,
                consoleErrors,
            },
            null,
            2,
        ),
    );
    console.log('OK', code);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

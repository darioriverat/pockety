import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'tests/browser';

for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    const path = join(dir, file);
    let source = readFileSync(path, 'utf8');
    const original = source;

    // If a test/callback already destructures request, pass it into login.
    source = source.replace(
        /async \(\{([^}]*)\}\) => \{(\s*)await loginAsBrowserTestUser\(page\);/g,
        (match, params, ws) => {
            if (!/\brequest\b/.test(params) || /loginAsBrowserTestUser\(page, request\)/.test(match)) {
                return match;
            }
            return `async ({${params}}) => {${ws}await loginAsBrowserTestUser(page, request);`;
        },
    );

    source = source.replace(
        /test\.beforeEach\(async \(\{ page \}\) => \{\s*await loginAsBrowserTestUser\(page\);\s*\}\);/g,
        'test.beforeEach(async ({ page, request }) => {\n    await loginAsBrowserTestUser(page, request);\n});',
    );

    if (source !== original) {
        writeFileSync(path, source);
        console.log('patched', path);
    }
}

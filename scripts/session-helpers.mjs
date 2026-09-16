#!/usr/bin/env node
/**
 * Small helpers for session verification via /dev/* HTTP endpoints.
 * Usage:
 *   node scripts/session-helpers.mjs frontend [filter]
 *   node scripts/session-helpers.mjs browser [spec]
 *   node scripts/session-helpers.mjs phpunit [filter]
 *   node scripts/session-helpers.mjs build
 *   node scripts/session-helpers.mjs feature-next
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.APP_BASE_URL || 'http://dev.pockety.com:8080';
const cmd = process.argv[2];
const arg = process.argv[3] || '';

async function getJson(path) {
    const res = await fetch(`${BASE}${path}`);
    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        console.error('Non-JSON response:', text.slice(0, 500));
        process.exit(1);
    }
    return { status: res.status, json };
}

function printTail(output, n = 2000) {
    const s = String(output || '');
    console.log(s.length > n ? s.slice(-n) : s);
}

if (cmd === 'feature-next') {
    const data = JSON.parse(
        await (await import('node:fs/promises')).readFile('feature_list.json', 'utf8'),
    );
    const fails = data
        .map((t, i) => ({ i, ...t }))
        .filter((t) => !t.passes);
    console.log(
        JSON.stringify(
            {
                total: data.length,
                passing: data.length - fails.length,
                failing: fails.length,
                next: fails.slice(0, 3).map(({ i, category, description, steps, passes }) => ({
                    i,
                    category,
                    description,
                    steps,
                    passes,
                })),
            },
            null,
            2,
        ),
    );
    process.exit(0);
}

const routes = {
    frontend: (f) => `/dev/frontend-tests${f ? `?filter=${encodeURIComponent(f)}` : ''}`,
    browser: (s) => `/dev/browser-tests${s ? `?spec=${encodeURIComponent(s)}` : ''}`,
    phpunit: (f) => `/dev/run-tests${f ? `?filter=${encodeURIComponent(f)}` : ''}`,
    build: () => `/dev/build-assets`,
    reset: () => `/dev/reset-test-user`,
    seed: () => `/dev/seed-browser`,
};

if (!routes[cmd]) {
    console.error('Unknown command:', cmd);
    process.exit(1);
}

const { status, json } = await getJson(routes[cmd](arg));
mkdirSync('logs', { recursive: true });
const outPath = `logs/session-${cmd}-${Date.now()}.json`;
writeFileSync(outPath, JSON.stringify(json, null, 2));
console.log('HTTP', status, 'saved', outPath);
console.log('success:', json.success, 'exit_code:', json.exit_code);
printTail(json.output);
process.exit(json.success ? 0 : 1);

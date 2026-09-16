/**
 * Live verification for API features #123-138.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';
const outDir = 'verification/session72-api-suite';
mkdirSync(outDir, { recursive: true });

class Jar {
    constructor() {
        this.cookies = new Map();
    }

    store(response) {
        const raw = response.headers.getSetCookie?.() ?? [];
        for (const line of raw) {
            const [pair] = line.split(';');
            const eq = pair.indexOf('=');
            if (eq === -1) continue;
            this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
        }
    }

    header() {
        return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    }

    xsrf() {
        const raw = this.cookies.get('XSRF-TOKEN');
        return raw ? decodeURIComponent(raw) : '';
    }
}

async function request(jar, path, options = {}) {
    const method = options.method ?? 'GET';
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers ?? {}),
    };
    const cookie = jar.header();
    if (cookie) headers.Cookie = cookie;
    const xsrf = jar.xsrf();
    if (xsrf && method !== 'GET') headers['X-XSRF-TOKEN'] = xsrf;
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        method,
        headers,
        redirect: 'manual',
    });
    jar.store(response);
    return response;
}

async function login(jar) {
    const loginPage = await fetch(`${BASE}/login`, {
        headers: { Accept: 'text/html' },
        redirect: 'manual',
    });
    jar.store(loginPage);

    const body = new URLSearchParams({
        email: 'test@example.com',
        password: 'password',
    });

    const response = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html, application/xhtml+xml',
            Cookie: jar.header(),
            'X-XSRF-TOKEN': jar.xsrf(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body,
        redirect: 'manual',
    });
    jar.store(response);

    if (![200, 302].includes(response.status)) {
        throw new Error(`Login failed: ${response.status}`);
    }

    const location = response.headers.get('location');
    if (location) {
        const next = location.startsWith('http') ? location : `${BASE}${location}`;
        const followed = await fetch(next, {
            headers: { Cookie: jar.header(), Accept: 'text/html' },
            redirect: 'manual',
        });
        jar.store(followed);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

const results = [];

async function run(name, fn) {
    try {
        await fn();
        results.push({ name, ok: true });
        console.log('PASS', name);
    } catch (err) {
        results.push({ name, ok: false, error: String(err) });
        console.error('FAIL', name, err);
    }
}

const jar = new Jar();
await login(jar);

let categoryId;
let accountId;
let createdId;
const stamp = Date.now();

await run('#123 POST create', async () => {
    const cats = await (await request(jar, '/api/categories')).json();
    categoryId = cats.data[0].id;
    const accounts = await (await request(jar, '/api/accounts')).json();
    accountId = accounts.data[0]?.id;

    const response = await request(jar, '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: '2026-01-15',
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            account_id: accountId ?? null,
            amount_cad: 42.5,
            comments: `api-suite-create-${stamp}`,
        }),
    });
    assert(response.status === 201, `status ${response.status}`);
    const body = await response.json();
    createdId = body.data.id;
    writeFileSync(`${outDir}/123.json`, JSON.stringify(body, null, 2));
});

await run('#124 GET show', async () => {
    const response = await request(jar, `/api/transactions/${createdId}`);
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    assert(body.data.id === createdId, 'id');
    assert(body.data.comments.includes(`api-suite-create-${stamp}`), 'comments');
});

await run('#125 PUT update', async () => {
    const response = await request(jar, `/api/transactions/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: '2026-01-16',
            period: '202501',
            quincena: 'Q2',
            category_id: categoryId,
            account_id: accountId ?? null,
            amount_cad: 99.99,
            comments: `api-suite-updated-${stamp}`,
        }),
    });
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    assert(Number(body.data.amount_cad) === 99.99, 'amount');
});

await run('#126 DELETE', async () => {
    const response = await request(jar, `/api/transactions/${createdId}`, {
        method: 'DELETE',
    });
    assert([200, 204].includes(response.status), `status ${response.status}`);
    const getAgain = await request(jar, `/api/transactions/${createdId}`);
    assert(getAgain.status === 404, `get status ${getAgain.status}`);
});

await run('#127 categories', async () => {
    const response = await request(jar, '/api/categories');
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    assert(body.data.length === 45, `count ${body.data.length}`);
    const s = body.data[0];
    assert(s.code && s.name_es && s.name_en && 'is_debt_category' in s, 'fields');
});

await run('#128 accounts grouped', async () => {
    const response = await request(jar, '/api/accounts');
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    assert(Array.isArray(body.data) && body.data.length > 0, 'data');
    assert(body.grouped?.assets && body.grouped?.liabilities, 'grouped');
    writeFileSync(
        `${outDir}/128.json`,
        JSON.stringify(
            {
                total: body.data.length,
                assets: body.grouped.assets.length,
                liabilities: body.grouped.liabilities.length,
            },
            null,
            2,
        ),
    );
});

await run('#129 reconciliation', async () => {
    const response = await request(jar, '/api/periods/202501/reconciliation');
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    assert(Array.isArray(body.data?.accounts), 'accounts');
    const sample = body.data.accounts[0];
    if (sample) {
        assert(
            'recorded' in sample ||
                'recorded_balance' in sample ||
                'computed' in sample ||
                'computed_balance' in sample ||
                'variance' in sample,
            `balance fields ${JSON.stringify(Object.keys(sample))}`,
        );
    }
    assert(
        body.meta?.status || body.data?.status,
        `status field ${JSON.stringify(body.meta)}`,
    );
    writeFileSync(`${outDir}/129.json`, JSON.stringify({ meta: body.meta, sample }, null, 2));
});

await run('#131 budget-vs-actual', async () => {
    const response = await request(jar, '/api/periods/202501/budget-vs-actual');
    assert(response.status === 200, `status ${response.status} ${await response.clone().text()}`);
    const body = await response.json();
    assert(Array.isArray(body.data), 'rows');
    assert(body.data.length === 45, `categories ${body.data.length}`);
    const row = body.data[0];
    assert(
        ('budget' in row || 'budget_cad' in row || 'budgeted' in row) &&
            ('actual' in row || 'actual_cad' in row) &&
            ('variance' in row || 'variance_cad' in row),
        `row fields ${JSON.stringify(Object.keys(row))}`,
    );
    writeFileSync(`${outDir}/131.json`, JSON.stringify({ count: body.data.length, row }, null, 2));
});

// Seed a couple of filter fixtures
const filterIds = [];
await run('seed filter fixtures', async () => {
    for (const comments of [
        `api-filter-a-${stamp}`,
        `api-filter-b-${stamp}`,
    ]) {
        const response = await request(jar, '/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: '2025-01-10',
                period: '202501',
                quincena: 'Q1',
                category_id: categoryId,
                account_id: accountId ?? null,
                amount_cad: 12.34,
                comments,
            }),
        });
        assert(response.status === 201, `create ${response.status}`);
        filterIds.push((await response.json()).data.id);
    }
});

await run('#132 filter period', async () => {
    const response = await request(
        jar,
        `/api/transactions?period=202501&search=${encodeURIComponent(`api-filter-`)}&page=1&per_page=25`,
    );
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    const ours = body.data.filter((t) => String(t.comments).includes(String(stamp)));
    assert(ours.length >= 2, `count ${ours.length}`);
    assert(ours.every((t) => t.period === '202501'), 'period');
});

await run('#133 filter category', async () => {
    const cats = await (await request(jar, '/api/categories')).json();
    const code = cats.data.find((c) => c.id === categoryId)?.code ?? 'C001';
    const response = await request(
        jar,
        `/api/transactions?category=${code}&search=${encodeURIComponent(`api-filter-`)}&page=1&per_page=25`,
    );
    assert(response.status === 200, `status ${response.status}`);
    const body = await response.json();
    const ours = body.data.filter((t) => String(t.comments).includes(String(stamp)));
    assert(ours.length >= 2, `count ${ours.length}`);
    assert(
        ours.every(
            (t) =>
                t.category_id === categoryId ||
                t.category?.code === code ||
                t.category?.id === categoryId,
        ),
        'category',
    );
});

await run('#134 filter account', async () => {
    assert(accountId, 'no account');
    const response = await request(
        jar,
        `/api/transactions?account=${accountId}&search=${encodeURIComponent(`api-filter-`)}&page=1&per_page=25`,
    );
    // Some APIs use account_id — try that if account param fails filter
    let body = await response.json();
    if (response.status !== 200) {
        throw new Error(`status ${response.status}`);
    }
    let ours = body.data.filter((t) => String(t.comments).includes(String(stamp)));
    if (ours.length === 0) {
        const alt = await request(
            jar,
            `/api/transactions?account_id=${accountId}&search=${encodeURIComponent(`api-filter-`)}&page=1&per_page=25`,
        );
        assert(alt.status === 200, `alt status ${alt.status}`);
        body = await alt.json();
        ours = body.data.filter((t) => String(t.comments).includes(String(stamp)));
    }
    assert(ours.length >= 2, `count ${ours.length}`);
    assert(
        ours.every((t) => t.account_id === accountId || t.account?.id === accountId),
        'account',
    );
});

await run('#135 404 missing', async () => {
    const response = await request(jar, '/api/transactions/999999');
    assert(response.status === 404, `status ${response.status}`);
    const body = await response.json();
    assert(body.error || body.message, 'error message');
});

await run('#136 422 validation', async () => {
    const response = await request(jar, '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            period: '202501',
            quincena: 'Q1',
            category_id: categoryId,
            amount_cad: 10,
        }),
    });
    assert(response.status === 422, `status ${response.status}`);
    const body = await response.json();
    assert(body.errors?.date, `errors ${JSON.stringify(body.errors)}`);
});

await run('#137 exchange rates by period', async () => {
    // Ensure a rate exists
    await request(jar, '/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            period: '202501',
            usd_cop: 4000,
            usd_cad: 1.35,
            cad_cop: 2960,
        }),
    });

    const response = await request(jar, '/api/exchange-rates/202501');
    assert(response.status === 200, `status ${response.status} ${await response.clone().text()}`);
    const body = await response.json();
    const rate = body.data;
    assert(typeof Number(rate.usd_cop) === 'number' && Number(rate.usd_cop) > 0, 'usd_cop');
    assert(typeof Number(rate.usd_cad) === 'number' && Number(rate.usd_cad) > 0, 'usd_cad');
    assert(typeof Number(rate.cad_cop) === 'number' && Number(rate.cad_cop) > 0, 'cad_cop');
    writeFileSync(`${outDir}/137.json`, JSON.stringify(rate, null, 2));
});

await run('#138 pagination', async () => {
    const page1 = await request(jar, '/api/transactions?page=1&per_page=25');
    assert(page1.status === 200, `status ${page1.status}`);
    const body1 = await page1.json();
    assert(body1.meta?.total != null, 'total');
    assert(body1.meta?.per_page === 25, `per_page ${body1.meta?.per_page}`);
    assert(body1.meta?.current_page === 1 || body1.meta?.page === 1, 'page');
    assert(body1.meta?.last_page != null, 'last_page');
    assert(body1.data.length <= 25, 'page size');

    if ((body1.meta.last_page ?? 1) > 1) {
        const page2 = await request(jar, '/api/transactions?page=2&per_page=25');
        assert(page2.status === 200, `page2 ${page2.status}`);
        const body2 = await page2.json();
        const ids1 = body1.data.map((t) => t.id).join(',');
        const ids2 = body2.data.map((t) => t.id).join(',');
        assert(ids1 !== ids2, 'pages differ');
    }
    writeFileSync(`${outDir}/138.json`, JSON.stringify(body1.meta, null, 2));
});

writeFileSync(`${outDir}/summary.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log('\nSummary:', results.filter((r) => r.ok).length, '/', results.length);
if (failed.length) process.exit(1);

import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';
const outDir = 'verification/session72-api-crud';
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
        const next = location.startsWith('http')
            ? location
            : `${BASE}${location}`;
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
let createdId;

await run('#123 POST /api/transactions creates', async () => {
    const cats = await request(jar, '/api/categories');
    assert(cats.ok, `categories ${cats.status}`);
    const catBody = await cats.json();
    categoryId = catBody.data[0].id;

    const response = await request(jar, '/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: '2026-09-15',
            period: '202609',
            quincena: 'Q1',
            category_id: categoryId,
            amount_cad: 42.5,
            comments: 'session72-api-create',
        }),
    });
    assert(response.status === 201, `expected 201 got ${response.status}`);
    const body = await response.json();
    createdId = body.data?.id ?? body.id;
    assert(createdId, 'missing created id');
    writeFileSync(`${outDir}/123-create.json`, JSON.stringify(body, null, 2));
});

await run('#124 GET /api/transactions/{id}', async () => {
    assert(createdId, 'no created id');
    const response = await request(jar, `/api/transactions/${createdId}`);
    assert(response.status === 200, `expected 200 got ${response.status}`);
    const body = await response.json();
    const txn = body.data ?? body;
    assert(txn.id === createdId, 'id mismatch');
    assert(
        String(txn.comments).includes('session72-api-create') ||
            String(txn.comment ?? '').includes('session72-api-create'),
        'comment mismatch',
    );
    writeFileSync(`${outDir}/124-show.json`, JSON.stringify(body, null, 2));
});

await run('#125 PUT /api/transactions/{id}', async () => {
    assert(createdId, 'no created id');
    const response = await request(jar, `/api/transactions/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: '2026-09-16',
            period: '202609',
            quincena: 'Q2',
            category_id: categoryId,
            amount_cad: 99.99,
            comments: 'session72-api-updated',
        }),
    });
    assert(response.status === 200, `expected 200 got ${response.status}`);
    const body = await response.json();
    const txn = body.data ?? body;
    assert(Number(txn.amount_cad) === 99.99, `amount ${txn.amount_cad}`);
    writeFileSync(`${outDir}/125-update.json`, JSON.stringify(body, null, 2));
});

await run('#126 DELETE /api/transactions/{id}', async () => {
    assert(createdId, 'no created id');
    const response = await request(jar, `/api/transactions/${createdId}`, {
        method: 'DELETE',
    });
    assert([200, 204].includes(response.status), `expected 200/204 got ${response.status}`);
    const getAgain = await request(jar, `/api/transactions/${createdId}`);
    assert(getAgain.status === 404, `expected 404 got ${getAgain.status}`);
    writeFileSync(
        `${outDir}/126-delete.json`,
        JSON.stringify({ deleteStatus: response.status, getStatus: getAgain.status }, null, 2),
    );
});

await run('#127 GET /api/categories', async () => {
    const response = await request(jar, '/api/categories');
    assert(response.status === 200, `expected 200 got ${response.status}`);
    const body = await response.json();
    const list = body.data ?? body;
    assert(Array.isArray(list), 'categories not array');
    assert(list.length === 45, `expected 45 got ${list.length}`);
    const sample = list[0];
    assert(sample.code, 'missing code');
    assert(sample.name_es || sample.nameEs, 'missing name_es');
    assert(sample.name_en || sample.nameEn, 'missing name_en');
    assert(
        'is_debt_category' in sample ||
            'isDebtCategory' in sample ||
            'is_debt' in sample,
        'missing debt flag',
    );
    writeFileSync(`${outDir}/127-categories.json`, JSON.stringify({ count: list.length, sample }, null, 2));
});

await run('#128 GET /api/accounts', async () => {
    const response = await request(jar, '/api/accounts');
    assert(response.status === 200, `expected 200 got ${response.status}`);
    const body = await response.json();
    const list = body.data ?? body;
    assert(Array.isArray(list), 'accounts not array');
    assert(list.length > 0, 'no accounts');
    const hasAsset = list.some((a) => a.is_asset || a.isAsset || a.type === 'asset');
    const hasLiability = list.some(
        (a) => a.is_liability || a.isLiability || a.type === 'liability',
    );
    assert(hasAsset || hasLiability, 'no asset/liability typing');
    writeFileSync(
        `${outDir}/128-accounts.json`,
        JSON.stringify({ count: list.length, sample: list[0], hasAsset, hasLiability }, null, 2),
    );
});

writeFileSync(`${outDir}/summary.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log('\nSummary:', results.filter((r) => r.ok).length, '/', results.length);
if (failed.length) process.exit(1);

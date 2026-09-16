/**
 * End-to-end API verification for transaction sorting (features 120-122).
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://dev.pockety.com:8080';

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
            const name = pair.slice(0, eq).trim();
            const value = pair.slice(eq + 1).trim();
            this.cookies.set(name, value);
        }
    }

    header() {
        return [...this.cookies.entries()]
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
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
    if (xsrf && method !== 'GET') {
        headers['X-XSRF-TOKEN'] = xsrf;
    }
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

    if (!jar.xsrf()) {
        throw new Error('Missing XSRF-TOKEN cookie after GET /login');
    }

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
        throw new Error(
            `Login failed with status ${response.status}: ${await response.text()}`,
        );
    }

    // Follow redirect to establish session if needed
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

function assertEqual(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
            `${label} failed.\n expected: ${JSON.stringify(expected)}\n actual:   ${JSON.stringify(actual)}`,
        );
    }
}

async function main() {
    const jar = new Jar();
    await login(jar);

    const catsRes = await request(jar, '/api/categories');
    if (!catsRes.ok) {
        throw new Error(
            `categories failed: ${catsRes.status} ${await catsRes.text()}`,
        );
    }
    const cats = (await catsRes.json()).data;
    const groceries =
        cats.find((c) => c.name_en === 'Groceries') ?? cats[0];
    const transport =
        cats.find((c) => c.name_en === 'Transportation') ?? cats[1];
    const utilities =
        cats.find((c) => c.name_en === 'Utilities') ?? cats[2];

    const stamp = Date.now();
    const payloads = [
        {
            date: '2026-09-10',
            period: '202609',
            quincena: 'Q1',
            category_id: groceries.id,
            amount_cad: 10,
            comments: `sort-verify-mid-${stamp}`,
        },
        {
            date: '2026-09-01',
            period: '202609',
            quincena: 'Q1',
            category_id: transport.id,
            amount_cad: 50,
            comments: `sort-verify-early-${stamp}`,
        },
        {
            date: '2026-09-20',
            period: '202609',
            quincena: 'Q2',
            category_id: utilities.id,
            amount_cad: 25,
            comments: `sort-verify-late-${stamp}`,
        },
    ];

    for (const data of payloads) {
        const res = await request(jar, '/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            throw new Error(
                `create failed ${res.status}: ${await res.text()}`,
            );
        }
    }

    const filter = `period=202609&search=${encodeURIComponent(`sort-verify-`)}&page=1&per_page=25`;

    const ours = (rows) =>
        rows.filter((t) => String(t.comments).includes(String(stamp)));

    const dateAsc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=date&sort_dir=asc`,
        )
    ).json();
    const dateAscDates = ours(dateAsc.data).map((t) => t.date);
    assertEqual(
        dateAscDates,
        ['2026-09-01', '2026-09-10', '2026-09-20'],
        'date asc',
    );

    const dateDesc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=date&sort_dir=desc`,
        )
    ).json();
    const dateDescDates = ours(dateDesc.data).map((t) => t.date);
    assertEqual(
        dateDescDates,
        ['2026-09-20', '2026-09-10', '2026-09-01'],
        'date desc',
    );

    const amountAsc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=amount&sort_dir=asc`,
        )
    ).json();
    const amounts = ours(amountAsc.data).map((t) => Number(t.amount));
    assertEqual(amounts, [10, 25, 50], 'amount asc');

    const amountDesc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=amount&sort_dir=desc`,
        )
    ).json();
    const amountsDesc = ours(amountDesc.data).map((t) => Number(t.amount));
    assertEqual(amountsDesc, [50, 25, 10], 'amount desc');

    const catAsc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=category&sort_dir=asc`,
        )
    ).json();
    const catNames = ours(catAsc.data).map((t) => t.category.name_en);
    assertEqual(
        catNames,
        ['Groceries', 'Transportation', 'Utilities'],
        'category asc',
    );

    const catDesc = await (
        await request(
            jar,
            `/api/transactions?${filter}&sort_by=category&sort_dir=desc`,
        )
    ).json();
    const catNamesDesc = ours(catDesc.data).map((t) => t.category.name_en);
    assertEqual(
        catNamesDesc,
        ['Utilities', 'Transportation', 'Groceries'],
        'category desc',
    );

    // Confirm rebuilt transactions bundle exposes sort headers
    const assetRes = await fetch(
        `${BASE}/build/assets/transactions-hWQ73EXi.js`,
    );
    const assetJs = await assetRes.text();
    const hasSortHeaders =
        assetJs.includes('sort-header-date') &&
        assetJs.includes('sort-header-amount') &&
        assetJs.includes('sort-header-category');

    if (!hasSortHeaders) {
        throw new Error('Built transactions bundle missing sort header test ids');
    }

    mkdirSync('verification/test-120-sort-date', { recursive: true });
    mkdirSync('verification/test-121-sort-amount', { recursive: true });
    mkdirSync('verification/test-122-sort-category', { recursive: true });

    const summary = {
        ok: true,
        dateAscDates,
        dateDescDates,
        amounts,
        amountsDesc,
        catNames,
        catNamesDesc,
        hasSortHeaders,
        meta: {
            dateAsc: { sort_by: dateAsc.meta?.sort_by, sort_dir: dateAsc.meta?.sort_dir },
            amountAsc: {
                sort_by: amountAsc.meta?.sort_by,
                sort_dir: amountAsc.meta?.sort_dir,
            },
            catAsc: { sort_by: catAsc.meta?.sort_by, sort_dir: catAsc.meta?.sort_dir },
        },
    };

    writeFileSync(
        'verification/test-120-sort-date/api-verification.json',
        JSON.stringify(summary, null, 2),
    );
    writeFileSync(
        'verification/test-121-sort-amount/api-verification.json',
        JSON.stringify(
            { ok: true, amounts, amountsDesc, hasSortHeaders },
            null,
            2,
        ),
    );
    writeFileSync(
        'verification/test-122-sort-category/api-verification.json',
        JSON.stringify(
            { ok: true, catNames, catNamesDesc, hasSortHeaders },
            null,
            2,
        ),
    );

    console.log('SORT API + ASSET VERIFICATION PASSED');
    console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

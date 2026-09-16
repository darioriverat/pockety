import fs from 'fs';
import { execFileSync } from 'child_process';

const cookieJar = 'verification/session-57/cookies.txt';
try {
    fs.unlinkSync(cookieJar);
} catch {
    // ignore
}

function curl(args) {
    return execFileSync('curl', ['-s', '-c', cookieJar, '-b', cookieJar, ...args], {
        encoding: 'utf8',
    });
}

function readCookie(name) {
    const lines = fs.readFileSync(cookieJar, 'utf8').split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length >= 7 && parts[5] === name) {
            return decodeURIComponent(parts[6]);
        }
    }
    return null;
}

function parseInertiaPage(html) {
    const match = html.match(
        /<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (!match) {
        return null;
    }
    return JSON.parse(match[1]);
}

curl(['http://dev.pockety.com:8080/login', '-o', 'verification/session-57/login.html']);
const xsrf = readCookie('XSRF-TOKEN');
if (!xsrf) {
    console.error('NO_XSRF');
    process.exit(1);
}

const loginStatus = curl([
    '-X',
    'POST',
    'http://dev.pockety.com:8080/login',
    '-H',
    'Content-Type: application/json',
    '-H',
    'Accept: application/json',
    '-H',
    `X-XSRF-TOKEN: ${xsrf}`,
    '-H',
    'X-Requested-With: XMLHttpRequest',
    '-d',
    JSON.stringify({
        email: 'test@example.com',
        password: 'password',
    }),
    '-o',
    'verification/session-57/login-result.json',
    '-w',
    '%{http_code}',
]);
console.log('login_status=', loginStatus);

for (const [url, out] of [
    ['http://dev.pockety.com:8080/dashboard', 'verification/session-57/dashboard.html'],
    [
        'http://dev.pockety.com:8080/reports/year-to-date?year=2025',
        'verification/session-57/ytd-2025.html',
    ],
    [
        'http://dev.pockety.com:8080/reports/year-to-date?year=2026',
        'verification/session-57/ytd-2026.html',
    ],
    [
        'http://dev.pockety.com:8080/reconciliation',
        'verification/session-57/reconciliation.html',
    ],
]) {
    const status = curl([url, '-o', out, '-w', '%{http_code}']);
    const html = fs.readFileSync(out, 'utf8');
    const page = parseInertiaPage(html);
    if (!page) {
        console.log(out, 'status=', status, 'NO_PAGE');
        continue;
    }
    console.log(out, 'status=', status, 'component=', page.component);
    if (page.props?.ytd_totals) {
        console.log('  ytd_totals=', JSON.stringify(page.props.ytd_totals));
    }
    if (page.props?.available_years) {
        console.log('  years=', page.props.available_years);
    }
}

const recon = JSON.parse(
    curl(['http://dev.pockety.com:8080/api/periods/202501/reconciliation']),
);
fs.writeFileSync(
    'verification/session-57/reconciliation-api.json',
    JSON.stringify(recon, null, 2),
);
const reviewed = recon.data.accounts.filter((a) => a.is_reviewed);
const unbalanced = recon.data.accounts.filter((a) => !a.is_balanced);
console.log('unbalanced=', unbalanced.length, 'reviewed=', reviewed.length);
console.log(
    'reviewed details=',
    reviewed.map((a) => ({
        name: a.account_name,
        note: a.review_note,
        variance_cad: a.variance.cad,
        is_balanced: a.is_balanced,
    })),
);
console.log(
    'significant warnings would show for=',
    unbalanced
        .filter(
            (a) =>
                Math.abs(a.variance.cad) > 10 ||
                Math.abs(a.variance.usd) > 10 ||
                Math.abs(a.variance.cop) > 10,
        )
        .map((a) => a.account_name),
);

fs.writeFileSync(
    'verification/session-57/SUMMARY.txt',
    [
        `login_status=${loginStatus}`,
        `ytd_2025=${JSON.stringify(parseInertiaPage(fs.readFileSync('verification/session-57/ytd-2025.html', 'utf8'))?.props?.ytd_totals)}`,
        `ytd_2026=${JSON.stringify(parseInertiaPage(fs.readFileSync('verification/session-57/ytd-2026.html', 'utf8'))?.props?.ytd_totals)}`,
        `reviewed=${reviewed.length}`,
        `unbalanced=${unbalanced.length}`,
        '',
    ].join('\n'),
);

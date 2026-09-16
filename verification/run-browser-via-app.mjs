import { writeFileSync } from 'node:fs';

const BASE = 'http://dev.pockety.com:8080';
const spec = process.argv[2] ?? 'tests/browser/transaction-sort.spec.ts';
const url = `${BASE}/dev/browser-tests?spec=${encodeURIComponent(spec)}`;
const out = process.argv[3] ?? 'verification/session72-sort-browser.json';

console.log('GET', url);
const response = await fetch(url);
const text = await response.text();
writeFileSync(out, text);
console.log('status', response.status);
try {
    const json = JSON.parse(text);
    console.log('success', json.success, 'exit', json.exit_code);
    console.log((json.output ?? '').slice(-4000));
} catch {
    console.log(text.slice(0, 1000));
}

import { writeFileSync } from 'node:fs';

const url =
    process.argv[2] ??
    'http://dev.pockety.com:8080/dev/run-tests?filter=TransactionSortTest';
const out =
    process.argv[3] ?? 'verification/session72-sort-phpunit.json';

const response = await fetch(url);
const text = await response.text();
writeFileSync(out, text);
console.log('status', response.status);
console.log('wrote', out);
try {
    const json = JSON.parse(text);
    console.log('success', json.success, 'exit', json.exit_code);
    const output = json.output ?? '';
    console.log(output.slice(-2500));
} catch {
    console.log(text.slice(0, 500));
}

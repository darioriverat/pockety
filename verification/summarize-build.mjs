import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2] ?? 'verification/test-85-periods-history/build-assets.json';
const json = JSON.parse(readFileSync(path, 'utf8'));
const summary = {
    success: json.success,
    exit_code: json.exit_code,
    output_tail: String(json.output ?? '').slice(-1200),
};
writeFileSync(
    'verification/test-85-periods-history/build-summary.json',
    JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
process.exit(json.success ? 0 : 1);

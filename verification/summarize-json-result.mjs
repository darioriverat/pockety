import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
const out = process.argv[3];
const json = JSON.parse(readFileSync(path, 'utf8'));
const summary = {
    success: json.success,
    exit_code: json.exit_code,
    filter: json.filter ?? null,
    output_tail: String(json.output ?? '').slice(-2000),
};
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(json.success ? 0 : 1);

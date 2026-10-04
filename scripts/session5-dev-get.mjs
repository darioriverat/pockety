#!/usr/bin/env node
/**
 * GET a /dev/* endpoint and print truncated JSON result.
 * Usage: node scripts/session5-dev-get.mjs /dev/playwright-install
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.APP_BASE_URL || 'http://dev.pockety.com:8080';
const path = process.argv[2];
if (!path) {
    console.error('Usage: node scripts/session5-dev-get.mjs /dev/...');
    process.exit(1);
}

const url = path.startsWith('http') ? path : `${BASE}${path}`;
const res = await fetch(url);
const text = await res.text();
let json;
try {
    json = JSON.parse(text);
} catch {
    console.error('HTTP', res.status, text.slice(0, 2000));
    process.exit(1);
}

mkdirSync('logs', { recursive: true });
const outPath = `logs/session5-dev-${Date.now()}.json`;
writeFileSync(outPath, JSON.stringify(json, null, 2));
console.log('HTTP', res.status, 'saved', outPath);
console.log('success:', json.success, 'exit_code:', json.exit_code);
const output = String(json.output || json.error || '');
console.log(output.length > 3000 ? output.slice(-3000) : output);
process.exit(json.success === false || (json.exit_code !== undefined && json.exit_code !== 0) ? 1 : 0);

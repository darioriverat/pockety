#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const needle = process.argv[3];
const json = JSON.parse(readFileSync(path, 'utf8'));
const output = String(json.output || '');

const marker = `› ${needle}`;
let idx = 0;
while (true) {
    const found = output.indexOf(marker, idx);
    if (found < 0) break;
    const before = output.slice(Math.max(0, found - 80), found);
    if (/\d+\)\s*\[chromium\]/.test(before) || output.slice(found - 200, found).includes(') [chromium]')) {
        console.log(output.slice(found - 120, found + 1800));
        console.log('\n---\n');
    }
    idx = found + marker.length;
}

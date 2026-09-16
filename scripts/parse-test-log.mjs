#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const json = JSON.parse(readFileSync(path, 'utf8'));
console.log('success:', json.success, 'exit_code:', json.exit_code);
const output = String(json.output || json.error || '');
const lines = output.split('\n');
const interesting = lines.filter((line) =>
    /Error:|failed|passed|✓|✘|Timeout|strict mode|Call log|locator\.|expect\(|feature |attachment/.test(
        line,
    ),
);
console.log(interesting.slice(-80).join('\n'));

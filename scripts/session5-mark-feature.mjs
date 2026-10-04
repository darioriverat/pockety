#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));
const index = Number(process.argv[2]);
const expected = process.argv[3];

if (!Number.isInteger(index) || !expected) {
    console.error('Usage: node scripts/session5-mark-feature.mjs <0-based-index> <expected description>');
    process.exit(1);
}

if (features[index]?.description !== expected) {
    console.error('Description mismatch at index', index);
    console.error('Found:', features[index]?.description);
    console.error('Expected:', expected);
    process.exit(1);
}

if (features[index].passes === true) {
    console.log('Already passing');
} else {
    features[index].passes = true;
    writeFileSync(path, `${JSON.stringify(features, null, 2)}\n`);
    console.log('Marked passing');
}

console.log(
    'Passing:',
    features.filter((f) => f.passes).length,
    '/',
    features.length,
);

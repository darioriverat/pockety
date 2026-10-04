#!/usr/bin/env node
/**
 * Mark period-balance overwrite dialog features as passing.
 * Only flips "passes" for matching descriptions.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));

const targets = [
    'Period balance overwrite dialog is wider than default',
    'Period balance overwrite dialog shows current and proposed figures side-by-side on desktop',
    'Period balance overwrite dialog stacks columns on mobile',
    'Period balance overwrite dialog FigureGrid is single column per section',
    'Period balance overwrite dialog close control doesn\'t cover title',
    'Period balance overwrite dialog test IDs remain functional',
    'Period balance overwrite dialog cancel preserves stored balance',
    'Browser test for period balance overwrite dialog layout',
];

const marked = [];
for (const [index, feature] of features.entries()) {
    if (targets.includes(feature.description) && feature.passes === false) {
        feature.passes = true;
        marked.push({ index: index + 1, description: feature.description });
    }
}

if (marked.length === 0) {
    console.error('No matching features marked');
    process.exit(1);
}

writeFileSync(path, JSON.stringify(features, null, 2) + '\n');
console.log(JSON.stringify({ marked, passing: features.filter((f) => f.passes).length, total: features.length }, null, 2));

/**
 * Set passes=true for one feature by 1-based index or exact description.
 * Usage:
 *   node scripts/mark-feature-passes.mjs 72
 *   node scripts/mark-feature-passes.mjs --description "Exact description"
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const descIdx = args.indexOf('--description');
const byDescription = descIdx >= 0 ? args[descIdx + 1] : null;
const byIndex = byDescription ? null : Number.parseInt(args[0], 10);

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));

let index = -1;
if (byDescription) {
    index = features.findIndex((f) => f.description === byDescription);
} else if (Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= features.length) {
    index = byIndex - 1;
}

if (index < 0) {
    console.error('Feature not found');
    process.exit(1);
}

features[index].passes = true;
writeFileSync(path, `${JSON.stringify(features, null, 2)}\n`);

const passing = features.filter((f) => f.passes).length;
console.log(
    JSON.stringify(
        {
            index: index + 1,
            description: features[index].description,
            passes: features[index].passes,
            passing,
            total: features.length,
            remaining: features.length - passing,
        },
        null,
        2,
    ),
);

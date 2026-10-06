import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));

// 1-based indices for locale features 41-53
const indices = [];
for (let i = 41; i <= 53; i++) {
    indices.push(i);
}

for (const n of indices) {
    features[n - 1].passes = true;
}

writeFileSync(path, `${JSON.stringify(features, null, 2)}\n`);
const passing = features.filter((f) => f.passes).length;
console.log(
    JSON.stringify(
        {
            marked: indices,
            passing,
            total: features.length,
            remaining: features.length - passing,
        },
        null,
        2,
    ),
);

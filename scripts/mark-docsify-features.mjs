import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));

// Features 74-84 (1-based) are the docsify section.
for (let i = 73; i <= 83; i += 1) {
  features[i].passes = true;
}

writeFileSync(path, `${JSON.stringify(features, null, 2)}\n`);
const passing = features.filter((f) => f.passes).length;
console.log(
  JSON.stringify(
    {
      marked: '74-84',
      passing,
      total: features.length,
      remaining: features.length - passing,
    },
    null,
    2,
  ),
);

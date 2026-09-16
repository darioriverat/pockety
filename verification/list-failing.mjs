import { readFileSync } from 'node:fs';

const features = JSON.parse(readFileSync('feature_list.json', 'utf8'));
const start = Number(process.argv[2] ?? 0);

for (let i = start; i < features.length; i++) {
    const f = features[i];
    if (f.passes) continue;
    console.log(`#${i}: ${f.description}`);
    for (const s of f.steps ?? []) console.log(`  ${s}`);
    console.log();
}

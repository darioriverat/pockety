import { readFileSync } from 'node:fs';

const features = JSON.parse(readFileSync('feature_list.json', 'utf8'));
const pass = features.filter((x) => x.passes).length;
const fail = features.filter((x) => !x.passes).length;
console.log('pass', pass, 'fail', fail, 'total', features.length);
console.log(
    'sort',
    features
        .filter((x) => x.description.includes('sort transactions'))
        .map((x) => ({ d: x.description, p: x.passes })),
);

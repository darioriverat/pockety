import { readFileSync } from 'node:fs';

const path = process.argv[2];
const output = JSON.parse(readFileSync(path, 'utf8')).output || '';
const lines = output.split('\n').filter(
    (l) =>
        /\) Tests\\/.test(l) ||
        /NOT NULL|UniqueConstraint|Error:|FAILED|There were/.test(l),
);
console.log(lines.join('\n'));

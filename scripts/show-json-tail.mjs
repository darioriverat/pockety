import { readFileSync } from 'node:fs';
const path = process.argv[2];
const j = JSON.parse(readFileSync(path, 'utf8'));
console.log('success', j.success, 'exit', j.exit_code);
console.log((j.output || j.error || JSON.stringify(j)).slice(-1200));

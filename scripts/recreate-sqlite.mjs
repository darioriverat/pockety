import { writeFileSync, chmodSync, statSync } from 'node:fs';

const path = 'database/database.sqlite';
writeFileSync(path, '');
chmodSync(path, 0o666);
console.log('recreated', path, 'size', statSync(path).size);

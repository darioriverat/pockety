import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const data = JSON.parse(readFileSync(path, 'utf8'));

const descriptions = new Set([
    'Add user_id column to categories table',
    'Add user_id column to all financial tables',
    'Backfill user_id to smallest user id for existing data',
    'Copy category template to existing users during backfill',
    'Change categories.code unique constraint to (user_id, code)',
    'Change period unique constraints to (user_id, period)',
    'CreateNewUser copies category template to new user',
    'CategorySeeder applies template to all existing users',
    'Owner resolver returns authenticated user id',
    'Financial API routes require authentication',
    'CategoryService scopes all queries to authenticated user',
    'Category creation assigns code unique per user',
    'Category lookup by code scopes to (user_id, code)',
    "Accessing another user's category returns 404",
]);

let marked = 0;
for (const feature of data) {
    if (descriptions.has(feature.description) && feature.passes === false) {
        feature.passes = true;
        marked += 1;
        console.log('marked', feature.description);
    }
}

writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const passing = data.filter((f) => f.passes).length;
console.log(`marked ${marked}; now ${passing}/${data.length} passing`);

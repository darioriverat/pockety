import { readFileSync, writeFileSync } from 'node:fs';

const path = 'feature_list.json';
const features = JSON.parse(readFileSync(path, 'utf8'));

const needles = [
    'Import page shows empty file inputs and no preselected or hardcoded personal filenames',
    "Comprehensive transaction JSON upload through the Import page creates only that user's transactions and reports imported/skipped/errors",
    'Comprehensive transaction CSV upload maps cad, usd, cop columns onto the nested value fields and ignores extra columns',
    'Comprehensive accounts import accepts one or more uploaded month-sheet JSON files without requiring a directory on disk',
    'Comprehensive balance sheet JSON upload is parsed by BalanceSheetImportService from an uploaded file',
    'Submitting an import card with no file is rejected in the browser before calling the API',
    'Comprehensive import validation returns 422 with readable messages for invalid JSON, wrong shape, and disallowed extensions and never a 500',
    'Import API no longer accepts file_path or directory and rejects any request that names plan/extracted',
    'Uploaded import temp files are stored temporarily, parsed, and deleted',
    'Import through uploads is owner-scoped so a user only ever creates and sees their own data',
    'Import page remains reachable from the navigation after the upload change',
    'Synthetic import fixtures exist under tests/fixtures and no personal ledger data is copied from plan/extracted',
    'Import page presents three clearly separated upload cards with empty, accessible file inputs',
];

const flipped = [];
for (const description of needles) {
    const index = features.findIndex((feature) => feature.description === description);
    if (index < 0) {
        console.error('Missing:', description);
        process.exit(1);
    }
    features[index].passes = true;
    flipped.push(index + 1);
}

writeFileSync(path, `${JSON.stringify(features, null, 2)}\n`);

const passing = features.filter((feature) => feature.passes).length;
console.log(
    JSON.stringify(
        {
            flipped,
            passing,
            total: features.length,
            remaining: features.length - passing,
        },
        null,
        2,
    ),
);

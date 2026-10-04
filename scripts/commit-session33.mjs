import { execFileSync } from 'node:child_process';

execFileSync(
    'git',
    [
        'add',
        'feature_list.json',
        'tests/browser/e2e-category-edit-workflow.spec.ts',
        'claude-progress.txt',
        'scripts/append-session33-progress.mjs',
        'scripts/commit-session33.mjs',
    ],
    { stdio: 'inherit' },
);

execFileSync(
    'git',
    [
        'add',
        '-f',
        'verification/e2e-edit-workflow/01-before-edit.png',
        'verification/e2e-edit-workflow/02-edit-dialog.png',
        'verification/e2e-edit-workflow/03-after-edit.png',
    ],
    { stdio: 'inherit' },
);

const message = `Verify category edit browser workflow end-to-end

- Isolate edit workflow with unique registration instead of shared seeder
- Exercise create then edit dialogs; assert PUT 200 and reactive name update
- Tested with Playwright via /dev/browser-tests; mark feature #103 passing
- Screenshots in verification/e2e-edit-workflow/
`;

execFileSync('git', ['commit', '-m', message], { stdio: 'inherit' });
execFileSync('git', ['status', '--short'], { stdio: 'inherit' });
execFileSync('git', ['log', '-1', '--oneline'], { stdio: 'inherit' });

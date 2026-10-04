import { execFileSync } from 'node:child_process';

const message = `Verify category create browser workflow end-to-end

- Isolate create workflow with unique registration instead of shared seeder
- Assert C047 assignment, reactive card update, and no full page reload
- Tested with Playwright via /dev/browser-tests; mark feature #102 passing
- Screenshots in verification/e2e-create-workflow/
`;

execFileSync('git', ['commit', '-m', message], { stdio: 'inherit' });
execFileSync('git', ['status', '--short'], { stdio: 'inherit' });
execFileSync('git', ['log', '-1', '--oneline'], { stdio: 'inherit' });

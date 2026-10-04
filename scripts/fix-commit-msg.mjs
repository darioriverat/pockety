import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const message = `Implement per-user ownership foundation - verified end-to-end

- Added user_id to all financial tables with backfill, per-user uniques, and template seeding
- Scoped category and financial services via OwnerResolver; API routes require session auth
- Tested with PHPUnit, Playwright browser automation, and UI screenshots
- Updated feature_list.json: marked tests #33-#46 as passing
- Screenshots in verification/user-ownership/
`;

writeFileSync('/tmp/pockety-commit-msg.txt', message);
execSync('git commit --amend -F /tmp/pockety-commit-msg.txt', { stdio: 'inherit' });
execSync('git log -1 --format=%B', { stdio: 'inherit' });

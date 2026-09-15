import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'test-85-periods-history');
mkdirSync(outDir, { recursive: true });

const raw = readFileSync(join(outDir, 'api-response.json'), 'utf8');
const json = JSON.parse(raw);
const periods = json.data.periods;
const codes = periods.map((p) => p.period);
const sorted = [...codes].sort();

const report = {
    period_count: periods.length,
    meta_period_count: json.meta.period_count,
    first: periods[0]?.period,
    last: periods[periods.length - 1]?.period,
    chronological: JSON.stringify(codes) === JSON.stringify(sorted),
    has_stats_keys: ['transaction_count', 'income_total_cad', 'expenses_total_cad'].every(
        (k) => k in (periods[0] ?? {}),
    ),
    sample_202501: periods[0],
    sample_202609: periods[periods.length - 1],
    ok:
        periods.length === 21 &&
        json.meta.period_count === 21 &&
        periods[0]?.period === '202501' &&
        periods[periods.length - 1]?.period === '202609' &&
        JSON.stringify(codes) === JSON.stringify(sorted),
};

writeFileSync(join(outDir, 'api-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) {
    process.exit(1);
}

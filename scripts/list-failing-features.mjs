import fs from 'fs';

const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
let shown = 0;
features.forEach((feat, idx) => {
  if (!feat.passes) {
    console.log(`#${idx + 1}`);
    console.log(feat.description);
    console.log('STEPS:');
    feat.steps.forEach((s) => console.log(' ', s));
    console.log('');
    shown += 1;
    if (shown >= 3) process.exit(0);
  }
});

import fs from 'fs';
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
features.forEach((feat, idx) => {
  if (!feat.passes) {
    console.log(`#${idx + 1} [${feat.category}] ${feat.description}`);
  }
});
console.log(
  'passing',
  features.filter((f) => f.passes).length,
  '/',
  features.length,
);

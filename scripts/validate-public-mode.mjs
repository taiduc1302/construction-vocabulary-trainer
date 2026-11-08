import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const publicJs=fs.readFileSync(new URL('../src/public-mode.js',import.meta.url),'utf8');
const publicCss=fs.readFileSync(new URL('../src/public-mode.css',import.meta.url),'utf8');
const termHtml=fs.readFileSync(new URL('../term.html',import.meta.url),'utf8');
const termJs=fs.readFileSync(new URL('../src/term-page.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');

for(const id of ['learnerPathCard','learningPackGrid','publicCaptureInput','addExistingTerm','explainTerm','toggleMaintainerMode']){
  assert.ok(index.includes(`id="${id}"`),`index missing public learner control ${id}`);
}
assert.match(index,/Construction English for real work/i);
assert.match(index,/maintainer-only/,'owner GitHub bridge should be hidden behind maintainer mode');
assert.match(index,/src\/public-mode\.js/);
assert.match(index,/src\/public-mode\.css/);
assert.match(publicJs,/applyPackToFocus/);
assert.match(publicJs,/startPackSession/);
assert.match(publicJs,/bindPublicSmart10/,'public Smart 10 must route through the active learning pack');
assert.match(publicJs,/stopImmediatePropagation/,'public Smart 10 must suppress the global all-vocabulary shortcut');
assert.match(app,/function startPackSession\(/,'learning engine must expose pack-scoped practice');
assert.match(app,/scope:\`pack:/,'pack sessions must freeze a pack-specific scope');
assert.match(publicJs,/learner-focus-changed/);
assert.match(publicJs,/Explain the construction term/);
assert.match(publicCss,/\.maintainer-only/);
assert.match(publicCss,/data-support-language/);
assert.match(termHtml,/src\/term-page\.js/);
assert.match(termJs,/Add to My Words/);
assert.match(termJs,/renderTermVisual/);
console.log('Public learner UX contract OK: onboarding, packs, personal Focus, work capture, maintainer separation and shareable term page.');

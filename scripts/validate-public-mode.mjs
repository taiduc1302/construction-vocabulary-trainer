import fs from 'node:fs';
import assert from 'node:assert/strict';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const publicJs=fs.readFileSync(new URL('../src/public-mode.js',import.meta.url),'utf8');
const publicCss=fs.readFileSync(new URL('../src/public-mode.css',import.meta.url),'utf8');
const termHtml=fs.readFileSync(new URL('../term.html',import.meta.url),'utf8');
const termJs=fs.readFileSync(new URL('../src/term-page.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');

for(const id of ['learnerPathCard','learningPackGrid','publicCaptureInput','publicCaptureMatches','addExistingTerm','explainTerm','toggleMaintainerMode']){
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

assert.match(app,/searchTerms/,'trainer API must expose multilingual fuzzy search');
assert.match(app,/getProgressForIds/,'trainer API must expose pack progress');
assert.match(app,/learnerProfile:loadProfile\(\)/,'progress export must include the learner path');
assert.match(app,/personalFocus:loadPersonalFocus\(\)/,'progress export must include personal My Words');
assert.match(app,/learner-profile-imported/,'profile import must notify public mode');
assert.match(publicJs,/progressForPack/,'learning packs must show measurable learner progress');
assert.match(publicJs,/trainer-progress-changed/,'pack progress must refresh after answers');
assert.match(publicJs,/searchLocalTerms/,'work capture must use fuzzy search suggestions');
assert.match(publicJs,/publicCaptureMatches/,'work capture must render selectable term matches');
assert.match(publicCss,/pack-progress-track/,'pack progress needs a visible progress bar');
assert.match(publicCss,/capture-match/,'work-term suggestions need mobile-friendly styling');

assert.match(publicCss,/\.maintainer-only/);
assert.match(publicCss,/data-support-language/);
assert.match(termHtml,/src\/term-page\.js/);
assert.match(termJs,/Add to My Words/);
assert.match(termJs,/renderTermVisual/);
assert.match(termJs,/findExactVocabularyTerm/,'Public term pages should reuse validated multilingual lookup');
assert.match(publicJs,/function resumeActiveSession\(/,'Pack switches must guard against active Quick 10 sessions');
assert.match(app,/isSessionActive:\(\)=>session.active/,'Trainer API must expose session state without mutating it');
console.log('Public learner UX contract OK: onboarding, pack progress, multilingual work-term search, personal Focus backup, maintainer separation and shareable term page.');

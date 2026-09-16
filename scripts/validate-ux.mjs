import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const index=read('index.html');
const ux=read('src/ux.css');
const dark=read('src/dark.css');
const ui=read('src/ui-enhancements.js');

assert.match(index,/id="homeView" class="view active"/,'Today/Home must be the default active view');
assert.match(index,/class="tab active" data-view="home"/,'Today tab must be the default active navigation item');
assert.match(index,/id="dictionaryView" class="view"/,'Dictionary should remain available but not be the default landing view');

const navBlock=index.match(/<nav class="tabs"[\s\S]*?<\/nav>/)?.[0]||'';
const primaryViews=[...navBlock.matchAll(/data-view="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(primaryViews,['home','practice','dictionary','drawing','progress'],'primary navigation should stay focused on five daily destinations');
assert.match(index,/class="view-router-only"[\s\S]*data-view="review"[\s\S]*data-view="weak"/,'Due and Weak views need hidden routing controls after leaving primary navigation');

for(const id of ['stats','dailyGoalCard','searchInput','categoryFilter','practiceScope','practiceCategory','practiceMode','newQuestion','quickSession','quizCard','drawingChallenge','progressOverview','exportProgress','importProgress','toggleCardDensity']){
  assert.ok(index.includes(`id="${id}"`),`index.html missing required UX/runtime id ${id}`);
}

for(const action of ['smart10','focus','due','estimator','drawing-label','drawing','dictionary','progress','review','weak']){
  assert.ok(index.includes(`data-quick-action="${action}"`),`interface missing quick action ${action}`);
  assert.ok(ui.includes(`case '${action}'`),`ui-enhancements.js does not route quick action ${action}`);
}

assert.ok(index.includes('src/ux.css'),'index.html must load the mobile-first UX stylesheet');
assert.ok(index.includes('src/dark.css'),'index.html must load automatic dark-theme overrides');
assert.ok(index.includes('src/ui-enhancements.js'),'index.html must load the UX behavior module');
assert.match(index,/class="practice-settings"/,'advanced practice selectors should live behind Practice settings');
assert.match(index,/class="data-menu"/,'export/import should be grouped into a secondary Data menu');
assert.match(index,/viewport-fit=cover/,'viewport must support iPhone safe areas');
assert.match(index,/class="progress-shortcuts"/,'Due and Weak lists should remain directly reachable from Progress');

assert.ok(ux.includes('safe-area-inset-bottom'),'mobile UX must account for iPhone safe-area bottom inset');
assert.match(ux,/@media\(max-width:640px\)[\s\S]*\.tabs\{position:fixed/,'mobile navigation should remain reachable at the bottom of the screen');
assert.ok(ux.includes('min-height:44px'),'interactive controls should preserve a minimum touch target');
assert.ok(!ux.includes('min-height:40px'),'mobile overrides must not shrink controls below the 44px touch target');
assert.ok(ux.includes('.tab{flex:1 1 0'),'five mobile tabs should share the available width rather than require horizontal scrolling');
assert.ok(ux.includes('.compact-cards'),'dictionary compact mode styling is missing');
assert.ok(ux.includes('.view-router-only{display:none}'),'routing-only controls must stay out of the visual interface');
assert.ok(ux.includes(':focus-visible'),'keyboard focus styling is required');
assert.ok(ux.includes('prefers-reduced-motion'),'reduced-motion accessibility handling is required');

assert.match(dark,/@media\(prefers-color-scheme:dark\)/,'dark theme must follow the device color scheme automatically');
assert.ok(dark.includes('color-scheme:dark'),'dark theme should advertise native dark controls');
assert.ok(dark.includes('.quick-launch'),'dark theme must cover Today quick-launch cards');
assert.ok(dark.includes('.quiz-option'),'dark theme must cover practice answers');
assert.ok(dark.includes('.visual-box,.technical-visual,.drawing-sheet svg'),'technical diagrams should retain a readable light-style rendering in dark mode');

assert.ok(ui.includes("construction-vocab-card-density-v1"),'dictionary density preference must be persisted separately');
assert.ok(ui.includes("window.matchMedia('(max-width: 640px)')"),'mobile should default to compact dictionary cards when no preference exists');
assert.ok(ui.includes("setSelect('#practiceScope'"),'quick-start actions must configure practice scope');
assert.ok(ui.includes("document.querySelector('#quickSession')?.click()"),'Smart 10 shortcut must start the existing Quick 10 engine');
assert.ok(ui.includes("document.querySelector('#newQuestion')?.click()"),'mode shortcuts must force a fresh question instead of resurfacing stale practice');
assert.ok(ui.includes('MutationObserver'),'feedback must be enhanced without coupling the UX layer to learning-state internals');
assert.ok(ui.includes('ensurePracticeNext')&&ui.includes('ensureDrawingNext'),'answered practice and drawing questions need inline next actions');
assert.ok(ui.includes("document.querySelector('#newDrawingQuestion')?.click()"),'inline drawing Next must route through the existing drawing engine');
assert.ok(ui.includes('trainerReady()'),'quick actions should wait until app data has loaded');
assert.ok(ui.includes('aria-current'),'navigation must expose the current view to assistive technology');
assert.ok(ui.includes("view==='review'||view==='weak'"),'review subviews should preserve Progress as their visible navigation parent');

console.log('UX contract OK: Today-first flow, five-tab mobile navigation, one-tap shortcuts, inline next actions, compact dictionary, automatic dark mode, 44px touch targets and iPhone-safe layout.');

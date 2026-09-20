import assert from 'node:assert/strict';
import {normalizeRequestedTerms,buildPrompt,recentFocusItems,syncedInboxKeysForFocus} from '../src/onboarding.js';

assert.deepEqual(
  normalizeRequestedTerms('Bedding, duct spacer\nBedding; valve box'),
  ['Bedding','duct spacer','valve box'],
  'batch parsing should split comma/newline/semicolon input and deduplicate case-insensitively'
);
assert.deepEqual(normalizeRequestedTerms('  stub-out  '),['stub-out']);
assert.deepEqual(normalizeRequestedTerms(''),[]);

const prompt=buildPrompt('bedding, duct spacer');
assert.match(prompt,/подключенный GitHub/i,'prompt should explicitly request the connected GitHub integration');
assert.match(prompt,/taiduc1302\/construction-vocabulary-trainer/,'prompt should target the correct repository');
assert.match(prompt,/"bedding"/,'prompt should include the first requested term');
assert.match(prompt,/"duct spacer"/,'prompt should include the second requested term');
assert.match(prompt,/атомар/i,'prompt should require one atomic change');
assert.match(prompt,/My focus list/i,'prompt should preserve learning intent');
assert.match(prompt,/GitHub Actions/i,'prompt should require validation completion');
assert.match(prompt,/Pages deployment/i,'prompt should require the validated change to reach the live trainer before completion');

const recent=recentFocusItems(
  {terms:[
    {id:'old',added_at:'2026-08-01',last_requested_at:'2026-08-01',request_count:1},
    {id:'newer',added_at:'2026-09-18',last_requested_at:'2026-09-18',request_count:2},
    {id:'missing',added_at:'2026-09-19',last_requested_at:'2026-09-19',request_count:1}
  ]},
  [{id:'old',term:'old term',category:'estimating'},{id:'newer',term:'new term',category:'utilities'}],
  5
);
assert.deepEqual(recent.map(item=>item.id),['newer','old'],'recent focus should sort newest first and ignore IDs missing from vocabulary');
assert.equal(recent[0].request_count,2);

const synced=syncedInboxKeysForFocus(
  {terms:[
    {id:'watermain',added_at:'2026-09-10',last_requested_at:'2026-09-20'},
    {id:'catch-basin',added_at:'2026-09-01',last_requested_at:'2026-09-18'}
  ]},
  [{id:'watermain',term:'watermain'},{id:'catch-basin',term:'catch basin'}],
  {terms:{
    watermain:{aliases_en:['water main'],drawing_labels:['WM']},
    'catch-basin':{drawing_labels:['CB']}
  }},
  [
    {term:'water main',addedAt:'2026-09-20T08:00:00.000Z'},
    {term:'CB',addedAt:'2026-09-20T08:00:00.000Z'},
    {term:'duct bank',addedAt:'2026-09-20T08:00:00.000Z'}
  ]
);
assert.equal(synced.has('water main'),true,'English aliases should sync when the published Focus request is fresh enough');
assert.equal(synced.has('cb'),false,'an old Focus entry must not satisfy a newly captured repeat-learning request');
assert.equal(synced.has('duct bank'),false,'unfocused terms must stay unsynced');

const drawingLabelSynced=syncedInboxKeysForFocus(
  {terms:[{id:'catch-basin',added_at:'2026-09-01',last_requested_at:'2026-09-20'}]},
  [{id:'catch-basin',term:'catch basin'}],
  {terms:{'catch-basin':{drawing_labels:['CB']}}},
  [{term:'CB',addedAt:'2026-09-20T08:00:00.000Z'}]
);
assert.equal(drawingLabelSynced.has('cb'),true,'drawing labels should sync after the canonical Focus request is refreshed');



console.log('Onboarding bridge tests OK: batch parsing, recent-focus sorting, alias/label sync matching and repository-aware atomic ChatGPT prompt generation.');

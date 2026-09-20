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
  {terms:[{id:'watermain'},{id:'catch-basin'}]},
  [{id:'watermain',term:'watermain'},{id:'catch-basin',term:'catch basin'}],
  {terms:{
    watermain:{aliases_en:['water main'],drawing_labels:['WM']},
    'catch-basin':{drawing_labels:['CB']}
  }},
  [{term:'water main'},{term:'CB'},{term:'duct bank'}]
);
assert.equal(synced.has('water main'),true,'English aliases should sync to their focused canonical term');
assert.equal(synced.has('cb'),true,'drawing labels should sync to their focused canonical term');
assert.equal(synced.has('duct bank'),false,'unfocused terms must stay unsynced');



console.log('Onboarding bridge tests OK: batch parsing, recent-focus sorting, alias/label sync matching and repository-aware atomic ChatGPT prompt generation.');

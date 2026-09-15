import assert from 'node:assert/strict';
import {normalizeRecall,recallMatches,filterByCategory,selectPracticePool,preferUnseen,buildUniqueOptions} from '../src/practice-engine.js';

const terms=[
  {id:'duct-bank',term:'duct bank',category:'electrical'},
  {id:'conduit',term:'conduit',category:'electrical'},
  {id:'ditch',term:'ditch',category:'drainage'},
  {id:'culvert',term:'culvert',category:'drainage'}
];
const records={
  'duct-bank':{status:'learning',wrong:1,due:'2026-09-01T00:00:00.000Z'},
  conduit:{status:'new',wrong:0,due:null},
  ditch:{status:'review',wrong:0,due:'2099-01-01T00:00:00.000Z'},
  culvert:{status:'new',wrong:2,due:null}
};
const recordFor=id=>records[id];
const dueNow=record=>Boolean(record.due&&record.due<'2026-09-15T00:00:00.000Z');
const weaknessScore=record=>record.wrong||0;

assert.equal(normalizeRecall(' Tie-in '),'tie in');
assert.equal(recallMatches('tie in','tie-in'),true);
assert.equal(recallMatches('water main','watermain'),true,'spacing variants should match');
assert.equal(recallMatches('D.B.','duct bank',['DB']),true,'aliases should be accepted');
assert.doesNotThrow(()=>recallMatches('duct bank','duct bank',42),'malformed alias metadata should not crash recall');
assert.equal(recallMatches('storm sewer','sanitary sewer'),false);

assert.deepEqual(filterByCategory(terms,'drainage').map(t=>t.id),['ditch','culvert']);
assert.deepEqual(selectPracticePool({terms,scope:'focus',category:'all',focusIds:new Set(['duct-bank']),recordFor,dueNow,weaknessScore}).map(t=>t.id),['duct-bank']);
assert.deepEqual(selectPracticePool({terms,scope:'focus',category:'drainage',focusIds:new Set(['duct-bank']),recordFor,dueNow,weaknessScore}),[],'focus scope must not silently fall back to non-focus words');
assert.deepEqual(selectPracticePool({terms,scope:'due',category:'drainage',focusIds:new Set(),recordFor,dueNow,weaknessScore}),[],'due scope must stay strict after category filtering');
assert.deepEqual(selectPracticePool({terms,scope:'new',category:'drainage',focusIds:new Set(),recordFor,dueNow,weaknessScore}).map(t=>t.id),['culvert']);
assert.deepEqual(selectPracticePool({terms,scope:'weak',category:'all',focusIds:new Set(),recordFor,dueNow,weaknessScore}).map(t=>t.id),['duct-bank','culvert']);

assert.deepEqual(preferUnseen(terms,new Set(['duct-bank','conduit','ditch'])).map(t=>t.id),['culvert']);
assert.equal(preferUnseen(terms,new Set(terms.map(t=>t.id))).length,terms.length,'pool should reset after all terms have been seen');
assert.deepEqual(buildUniqueOptions('duct bank',['conduit','conduit'],['ditch','culvert']),['duct bank','conduit','ditch','culvert']);

console.log('Practice-engine tests OK: recall normalization, strict scopes, category filtering, unseen preference and option uniqueness.');

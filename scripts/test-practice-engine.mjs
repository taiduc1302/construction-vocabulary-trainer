import assert from 'node:assert/strict';
import {
  normalizeRecall,recallMatches,mergeTermMetadata,typedPromptCandidates,pickTypedPrompt,
  drawingLabelTerms,pickDrawingLabel,estimatorChallengesForPool,pickEstimatorChallenge,
  filterByCategory,selectPracticePool,preferUnseen,buildUniqueOptions
} from '../src/practice-engine.js';

const terms=[
  {id:'duct-bank',term:'duct bank',category:'electrical',translation_ru:['банк каналов'],translation_vi:['ống cáp'],definition_en:'Concrete encasement containing multiple conduits.',scenario:'Several conduits are grouped inside concrete.'},
  {id:'conduit',term:'conduit',category:'electrical',translation_ru:['труба'],translation_vi:['ống luồn'],definition_en:'A raceway for cable.',scenario:'Cable is pulled through a protective raceway.'},
  {id:'ditch',term:'ditch',category:'drainage',translation_ru:['канава'],translation_vi:['mương'],definition_en:'An open drainage channel.',scenario:'Surface runoff travels through an open channel.'},
  {id:'culvert',term:'culvert',category:'drainage',translation_ru:['водопропускная труба'],translation_vi:['cống'],definition_en:'A drainage pipe under a road.',scenario:'Water passes beneath a road through a pipe.'}
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

const enriched=mergeTermMetadata(terms,{terms:{'duct-bank':{aliases_en:['ductbank'],drawing_labels:['DB']},culvert:{drawing_labels:['CULV']}}});
assert.deepEqual(enriched[0].aliases_en,['ductbank']);
assert.deepEqual(enriched[0].drawing_labels,['DB']);
assert.deepEqual(drawingLabelTerms(enriched).map(t=>t.id),['duct-bank','culvert']);
assert.equal(pickDrawingLabel(enriched[0],()=>0),'DB');
const prompts=typedPromptCandidates(enriched[0]);
assert.ok(prompts.some(p=>p.kind==='ru'));
assert.ok(prompts.some(p=>p.kind==='vi'));
assert.ok(prompts.some(p=>p.kind==='definition'));
assert.ok(prompts.some(p=>p.kind==='scenario'));
assert.ok(prompts.some(p=>p.kind==='drawing-label'));
assert.equal(pickTypedPrompt(enriched[0],()=>0).kind,'ru');
assert.doesNotThrow(()=>mergeTermMetadata(terms,{terms:{'duct-bank':{aliases_en:42,drawing_labels:null}}}));

const aliasLeakTerm={
  id:'rfi',term:'RFI',aliases_en:['request for information'],translation_ru:['запрос информации'],translation_vi:['yêu cầu thông tin'],
  definition_en:'Request for Information: a formal clarification question.',
  scenario:'A conflict in the drawings needs formal clarification.'
};
const aliasSafePrompts=typedPromptCandidates(aliasLeakTerm);
assert.equal(aliasSafePrompts.some(p=>p.kind==='definition'),false,'typed prompts must not expose an accepted English alias');
assert.equal(aliasSafePrompts.some(p=>p.kind==='scenario'),true,'safe scenarios should remain available');

const challenges=[
  {id:'duct-cost',term_id:'duct-bank',options:[{text:'A',correct:true},{text:'B',correct:false}]},
  {id:'culvert-check',term_id:'culvert',options:[{text:'A',correct:true},{text:'B',correct:false}]}
];
assert.deepEqual(estimatorChallengesForPool(challenges,[enriched[0]]).map(c=>c.id),['duct-cost']);
assert.equal(pickEstimatorChallenge(challenges,[enriched[3]],()=>0).id,'culvert-check');
assert.equal(pickEstimatorChallenge(challenges,[enriched[1]],()=>0),null);

assert.deepEqual(filterByCategory(terms,'drainage').map(t=>t.id),['ditch','culvert']);
assert.deepEqual(selectPracticePool({terms,scope:'focus',category:'all',focusIds:new Set(['duct-bank']),recordFor,dueNow,weaknessScore}).map(t=>t.id),['duct-bank']);
assert.deepEqual(selectPracticePool({terms,scope:'focus',category:'drainage',focusIds:new Set(['duct-bank']),recordFor,dueNow,weaknessScore}),[],'focus scope must not silently fall back to non-focus words');
assert.deepEqual(selectPracticePool({terms,scope:'due',category:'drainage',focusIds:new Set(),recordFor,dueNow,weaknessScore}),[],'due scope must stay strict after category filtering');
assert.deepEqual(selectPracticePool({terms,scope:'new',category:'drainage',focusIds:new Set(),recordFor,dueNow,weaknessScore}).map(t=>t.id),['culvert']);
assert.deepEqual(selectPracticePool({terms,scope:'weak',category:'all',focusIds:new Set(),recordFor,dueNow,weaknessScore}).map(t=>t.id),['duct-bank','culvert']);

assert.deepEqual(preferUnseen(terms,new Set(['duct-bank','conduit','ditch'])).map(t=>t.id),['culvert']);
assert.equal(preferUnseen(terms,new Set(terms.map(t=>t.id))).length,terms.length,'pool should reset after all terms have been seen');
assert.deepEqual(buildUniqueOptions('duct bank',['conduit','conduit'],['ditch','culvert']),['duct bank','conduit','ditch','culvert']);

console.log('Practice-engine tests OK: recall normalization, alias-safe prompt generation, metadata merge, varied typed prompts, drawing labels, estimator selection, strict scopes, unseen preference and option uniqueness.');

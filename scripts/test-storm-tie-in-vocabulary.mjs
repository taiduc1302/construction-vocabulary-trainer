import fs from 'node:fs';
import assert from 'node:assert/strict';
import {findExactVocabularyTerm,searchVocabulary} from '../src/term-search.js';
import {renderTermVisual} from '../src/visuals-all.js';

const load=relative=>JSON.parse(fs.readFileSync(new URL('../'+relative,import.meta.url),'utf8'));
const entries=[...load('data/terms.json'),...load('data/terms-expansion.json')];
const meta=load('data/term-meta.json').terms;
const packs=load('data/learning-packs.json');
const ids=['saddle-connection','wye-fitting','pipe-coupling','short-pipe-section','pipe-reducer','transition-coupling'];
const byId=new Map(entries.map(t=>[t.id,t]));

assert.equal(new Set(entries.map(t=>t.id)).size,entries.length,'all vocabulary IDs must be unique');
for(const id of ids){
  const term=byId.get(id);
  assert.ok(term,`missing term ${id}`);
  assert.equal(term.category,'drainage',`${id} is a storm-drainage term`);
  for(const key of ['term','pronunciation','definition_en','explanation_ru','example_en','scenario','visual']){
    assert.ok(typeof term[key]==='string'&&term[key].length>=10,`${id} has meaningful ${key}`);
  }
  for(const key of ['translation_ru','translation_vi']){
    assert.ok(Array.isArray(term[key])&&term[key].length&&term[key].every(Boolean),`${id} has ${key}`);
  }
  assert.ok(term.example_en.toLowerCase().includes(term.term.toLowerCase()),`${id} has canonical term in active-recall example`);
  assert.ok(!term.scenario.toLowerCase().includes(term.term.toLowerCase()),`${id} scenario does not disclose answer`);
  assert.ok(Array.isArray(term.common_mistakes)&&term.common_mistakes.length>=2,`${id} has safety/estimating cautions`);
  assert.ok(meta[id]?.aliases_en?.length>=2,`${id} has discoverable aliases`);
  for(const related of term.related_terms)assert.ok(byId.has(related),`${id} related term ${related} must exist`);
  const detail=renderTermVisual(term);
  const quiz=renderTermVisual(term,{quiz:true});
  assert.ok(detail.includes('<svg')&&detail.includes('<text'),`${id} has a non-generic labelled schematic`);
  assert.ok(quiz.includes('Construction vocabulary diagram'),`${id} has a safe generic quiz aria-label`);
  assert.ok(!/<text\b/i.test(quiz),`${id} quiz image cannot show diagram labels`);
  assert.ok(!quiz.includes(term.definition_en),`${id} quiz must not reveal description`);
}
const utilityPack=packs.find(p=>p.id==='underground-utilities');
assert.ok(utilityPack,'the existing underground utilities pack remains available');
for(const id of ['catch-basin-lead',...ids])assert.ok(utilityPack.term_ids.includes(id),`pack should include ${id}`);
const vocabulary=entries.map(t=>({...t,...(meta[t.id]||{})}));
for(const [query,wanted] of [
  ['saddle connection','saddle-connection'],['tap saddle','saddle-connection'],
  ['manufactured wye','wye-fitting'],['Y fitting','wye-fitting'],
  ['pipe coupling','pipe-coupling'],['repair coupling','pipe-coupling'],
  ['short pipe insert','short-pipe-section'],['short pipe section','short-pipe-section'],
  ['reducer','pipe-reducer'],['reducing fitting','pipe-reducer'],
  ['transition coupling','transition-coupling'],['reducer / transition coupling','transition-coupling'],
  ['CB lead','catch-basin-lead'],['отводящая труба от дождеприёмника','catch-basin-lead'],
  ['tê chữ Y','wye-fitting'],['седловая врезка','saddle-connection']
]){
  assert.equal(findExactVocabularyTerm(vocabulary,query)?.id,wanted,`exact lookup should resolve ${query}`);
  assert.equal(searchVocabulary(vocabulary,query)[0]?.term.id,wanted,`search should prefer ${wanted} for ${query}`);
}
assert.equal(searchVocabulary(vocabulary,'saddle')[0]?.term.id,'saddle-connection','partial query finds the lateral fitting');
assert.ok(/existing sewer main/i.test(byId.get('saddle-connection').definition_en));
assert.ok(/manufactured Y-shaped/i.test(byId.get('wye-fitting').definition_en));
assert.ok(/joins the ends of two compatible pipe sections/i.test(byId.get('pipe-coupling').definition_en));
assert.ok(/cut-to-length/i.test(byId.get('short-pipe-section').definition_en));
assert.ok(/different pipe diameters/i.test(byId.get('pipe-reducer').definition_en));
assert.ok(/different materials/i.test(byId.get('transition-coupling').definition_en));
assert.notEqual(renderTermVisual(byId.get('saddle-connection')),renderTermVisual(byId.get('wye-fitting')),'wye and saddle should not share one generic diagram');

console.log('Storm/CB-lead vocabulary OK: six distinct terms, RU/VI, aliases, related IDs, learning pack, six diagrams, safe quiz visuals and correct connection distinctions.');

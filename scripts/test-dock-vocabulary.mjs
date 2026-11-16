import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderLoadingVisual} from '../src/visuals-loading.js';
import {renderTermVisual} from '../src/visuals-all.js';

const readJson=(name)=>JSON.parse(fs.readFileSync(new URL(`../data/${name}`,import.meta.url),'utf8'));
const terms=[...readJson('terms.json'),...readJson('terms-expansion.json')];
const termById=new Map(terms.map(term=>[term.id,term]));
const focus=readJson('focus-terms.json');
const focusById=new Map(focus.terms.map(item=>[item.id,item]));
const packs=readJson('learning-packs.json');
const expectedPackIds=[
  'dock-design-equipment',
  'trailer-yard-logistics',
  'truck-court-construction',
  'dock-operations-safety'
];
const anchors=new Set(['dolly-pad','loading-dock']);
const taught=new Set();
const packCounts=[];
for(const packId of expectedPackIds){
  const pack=packs.find(entry=>entry.id===packId);
  assert.ok(pack,`missing dock learning pack ${packId}`);
  assert.ok(pack.term_ids.length>=10,`learning pack ${packId} is too small`);
  assert.equal(new Set(pack.term_ids).size,pack.term_ids.length,`duplicates within ${packId}`);
  for(const id of pack.term_ids){
    assert.ok(termById.has(id),`missing term ${id} in ${packId}`);
    assert.ok(!taught.has(id),`dock term ${id} appears in multiple new packs`);
    taught.add(id);
  }
  packCounts.push(`${packId}: ${pack.term_ids.length}`);
}
assert.equal(taught.size,102,'four new learning packs must include 100 new words plus the two existing anchor terms');
for(const id of anchors)assert.ok(taught.has(id),`missing anchor term ${id}`);
const newIds=[...taught].filter(id=>!anchors.has(id));
assert.equal(newIds.length,100,'the new learning packs must collectively contain exactly 100 new terms');
assert.equal(terms.length,new Set(terms.map(term=>term.id)).size,'canonical vocabulary IDs must be unique');
assert.equal(focus.terms.length,new Set(focus.terms.map(item=>item.id)).size,'focus entries must be unique');
for(const id of newIds){
  const term=termById.get(id);
  for(const field of ['term','pronunciation','definition_en','explanation_ru','example_en','scenario','visual']){
    assert.ok(typeof term[field]==='string'&&term[field].trim(),`${id}: missing ${field}`);
  }
  for(const field of ['translation_ru','translation_vi']){
    assert.ok(Array.isArray(term[field])&&term[field].every(value=>typeof value==='string'&&value.trim()),`${id}: invalid ${field}`);
    assert.ok(term[field].length>0,`${id}: missing ${field}`);
  }
  assert.ok(focusById.has(id),`${id}: must be in maintainer Focus`);
  const detailed=renderLoadingVisual(term);
  assert.ok(detailed&&detailed.includes('<svg')&&detailed.includes('<figcaption>'),`${id}: dedicated SVG not rendered`);
  const quiz=renderTermVisual(term,{quiz:true});
  assert.ok(quiz&&quiz.includes('Construction vocabulary diagram'),`${id}: quiz diagram missing or wrong accessibility label`);
  assert.ok(!/<text\\b/i.test(quiz),`${id}: SVG quiz leaked visible text`);
  assert.ok(!quiz.includes('<figcaption>'+term.visual),`${id}: quiz leaked term-specific caption`);
}
console.log(`Dock vocabulary tests OK: ${newIds.length} newly taught terms, ${anchors.size} anchor terms, ${expectedPackIds.length} packs, 100 multilingual cards, SVGs, Focus records and answer-safe quizzes. ${packCounts.join('; ')}.`);

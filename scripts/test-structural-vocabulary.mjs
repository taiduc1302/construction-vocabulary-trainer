import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findExactVocabularyTerm,searchVocabulary} from '../src/term-search.js';
import {renderTermVisual} from '../src/visuals-all.js';

const read=(path)=>JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const terms=[...read('data/terms.json'),...read('data/terms-expansion.json')];
const termById=new Map(terms.map(t=>[t.id,t]));
const meta=read('data/term-meta.json').terms;
const packs=read('data/learning-packs.json');
const focus=read('data/focus-terms.json').terms;
const freshIds=[
  'suspended-slab','one-way-slab','two-way-slab','flat-plate','flat-slab','slab-soffit','slab-edge','drop-panel','slab-thickening','composite-slab','post-tensioned-slab',
  'metal-deck','slab-formwork','falsework','reshoring','pour-strip','construction-joint','cold-joint',
  'topping-slab','bonded-topping','unbonded-topping','floor-screed','screeding','power-trowel','float-finish','broom-finish','concrete-bonding-agent',
  'rebar-chair','concrete-cover','lap-splice','rebar-dowel','welded-wire-mesh','punching-shear','shear-stud',
  'embedded-conduit','conduit-sleeve','slab-penetration','slab-blockout','electrical-floor-box','electrical-rough-in','conduit-offset','pipe-sleeve',
  'stepped-footing','footing-reinforcement','foundation-wall','stem-wall','footing-keyway','under-slab-vapour-barrier','slab-depression','concrete-vibration'
];

assert.equal(freshIds.length,50,'requested expansion should contain 50 distinct, related terms');
assert.equal(new Set(freshIds).size,50,'no duplicate new ID');
assert.equal(terms.length,new Set(terms.map(t=>t.id)).size,'all vocabulary IDs are unique');
assert.ok(terms.length>=387,'corpus must retain 337 existing words plus 50 new words');

function normalization(text){return String(text||'').toLocaleLowerCase().replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')}
for(const id of freshIds){
  const t=termById.get(id);
  assert.ok(t,'missing term: '+id);
  assert.ok(['concrete','electrical','utilities'].includes(t.category),id+' has correct domain category');
  for(const name of ['term','pronunciation','definition_en','explanation_ru','example_en','scenario','visual']){
    assert.ok(typeof t[name]==='string'&&t[name].trim().length>=(name==='term'||name==='pronunciation'?1:10),id+' lacks '+name);
  }
  for(const name of ['translation_ru','translation_vi']){
    assert.ok(Array.isArray(t[name])&&t[name].length>=1&&t[name].every(s=>typeof s==='string'&&s.trim()),id+' lacks '+name);
  }
  assert.ok(Array.isArray(t.common_mistakes)&&t.common_mistakes.length,id+' requires a construction/estimate caution');
  assert.ok(Array.isArray(t.related_terms)&&t.related_terms.every(ref=>termById.has(ref)),id+' related entries must resolve');
  assert.ok(normalization(t.example_en).includes(normalization(t.term)),id+' example must teach canonical phrase');
  assert.ok(!normalization(t.scenario).includes(normalization(t.term)),id+' scenario must not leak quiz answer');
  assert.ok(meta[id]?.aliases_en?.length>=2,id+' must have English search aliases');
  const html=renderTermVisual(t);
  assert.ok(html.includes('<svg')&&html.includes('<figcaption>'),id+' must have SVG learning diagram');
  assert.ok(html.includes(t.visual.replaceAll('&','&amp;'))||html.includes(t.term),id+' diagram should carry accessible context');
  assert.ok(html.includes('<text'),id+' SVG should label the element outside quiz');
  const quiz=renderTermVisual(t,{quiz:true});
  assert.ok(quiz.includes('aria-label="Construction vocabulary diagram"'),id+' must have generic quiz image label');
  assert.ok(!/<text\b/i.test(quiz),id+' quiz cannot show answer SVG text');
  assert.ok(!quiz.includes('<figcaption>'+t.visual),id+' quiz cannot show answer caption');
  assert.ok(focus.some(f=>f.id===id),id+' must appear in requested Focus practice list');
}

const structural=packs.find(p=>p.id==='structural-slabs');
const topping=packs.find(p=>p.id==='concrete-toppings-and-embeds');
const foundation=packs.find(p=>p.id==='concrete-foundations');
assert.ok(structural&&topping&&foundation,'structural, toppings/services and foundation packs must exist');
assert.ok(structural.term_ids.length>=20&&topping.term_ids.length>=20,'new learning packs should be meaningful');
for(const pack of [structural,topping,foundation]){
  assert.equal(new Set(pack.term_ids).size,pack.term_ids.length,pack.id+' should have no duplicates');
  assert.ok(pack.term_ids.every(id=>termById.has(id)),pack.id+' references unknown term');
}
for(const id of freshIds)assert.ok([structural,topping,foundation].some(pack=>pack.term_ids.includes(id)),id+' not found in learning packs');

const searchTerms=terms.map(t=>({...t,...(meta[t.id]||{})}));
for(const [query,id] of [
  ['suspended slab','suspended-slab'],
  ['structural slab','suspended-slab'],
  ['continuous footing','strip-footing'],
  ['strip footing','strip-footing'],
  ['conduit','conduit'],
  ['conduits','conduit'],
  ['topping','topping-slab'],
  ['topping slab','topping-slab'],
  ['PT slab','post-tensioned-slab'],
  ['steel decking','metal-deck'],
  ['bar chair','rebar-chair'],
  ['WWM','welded-wire-mesh'],
  ['conduit in slab','embedded-conduit'],
  ['vapour retarder','under-slab-vapour-barrier'],
  ['côn thu ống','pipe-reducer']
]){
  // Existing vocabulary outside this change (e.g. pipe reducer) must continue to be searchable.
  assert.equal(findExactVocabularyTerm(searchTerms,query)?.id,id,'exact search '+query+' should return '+id);
  assert.equal(searchVocabulary(searchTerms,query)[0]?.term.id,id,'ranked search '+query+' should prefer '+id);
}
assert.equal(termById.get('strip-footing').term,'strip footing','existing term must not be duplicated');
assert.equal(termById.get('conduit').term,'conduit','conduits is an alias, not a duplicate vocabulary card');
assert.notEqual(renderTermVisual(termById.get('suspended-slab')),renderTermVisual(termById.get('topping-slab')),'load-bearing slab and topping drawings must differ');
assert.notEqual(renderTermVisual(termById.get('flat-plate')),renderTermVisual(termById.get('flat-slab')),'flat plate and flat slab diagrams must differ');

console.log('Structural vocabulary tests OK: 50 new terms, RU/VI, 50 SVGs, 2 new packs, foundation updates, searched aliases and quiz-safe diagrams.');

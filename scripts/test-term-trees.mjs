import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateTermTrees,familiesForTerm,renderTermTrees} from '../src/term-tree.js';
import {matchesDictionaryTerm} from '../src/learning-quality.js';
import {searchVocabulary} from '../src/term-search.js';
import {mergeTermMetadata} from '../src/practice-engine.js';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));
const terms=mergeTermMetadata([...json('data/terms.json'),...json('data/terms-expansion.json')],json('data/term-meta.json'));
const graph=json('data/term-trees.json');
const app=read('src/app.js');
const termPage=read('src/term-page.js');
const home=read('index.html');
const detail=read('term.html');
const sw=read('sw.js');

assert.deepEqual(validateTermTrees(graph,terms),[],'concept trees must be well formed and only reference existing terms');
assert.equal(graph.version,1);
assert.equal(graph.families.length,4,'seed slabs, footings, conduit and topping trees');
const byId=new Map(terms.map(t=>[t.id,t]));
assert.equal(terms.length,387,'preserve all 387 vocabulary items');
assert.equal(byId.get('suspended-slab')?.term,'suspended slab','canonical suspended slab term is present');
assert.equal(matchesDictionaryTerm(byId.get('suspended-slab'),'suspended slab'),true);
assert.equal(matchesDictionaryTerm(byId.get('suspended-slab'),'structural slab'),true);
assert.equal(searchVocabulary(terms,'suspended slab')[0]?.term.id,'suspended-slab','search must rank exact term first');
assert.ok(home.includes('term.html?term=suspended-slab'),'home must expose a direct Suspended slab entry');
assert.ok(home.includes('term.html?term=concrete-slab'),'home must expose the slab tree root');
assert.ok(app.includes("if(els.search.value.trim())els.category.value='all'"),'typing dictionary search must clear a stale category filter');
assert.ok(app.includes('searchVocabulary(matches,q,{limit:20})'),'dictionary exact query ranking must be used');

const slabs=graph.families.find(f=>f.id==='slabs');
const footings=graph.families.find(f=>f.id==='footings');
const conduits=graph.families.find(f=>f.id==='conduits');
const toppings=graph.families.find(f=>f.id==='toppings');
assert.equal(slabs.root,'concrete-slab');
assert.ok(slabs.nodes.some(n=>n.id==='suspended-slab'&&n.parent==='concrete-slab'));
assert.ok(slabs.nodes.some(n=>n.id==='slab-on-grade'&&n.parent==='concrete-slab'));
assert.ok(slabs.nodes.some(n=>n.id==='one-way-slab'&&n.parent==='suspended-slab'));
assert.ok(slabs.nodes.some(n=>n.id==='two-way-slab'&&n.parent==='suspended-slab'));
assert.ok(slabs.connections.some(c=>c.owner==='suspended-slab'&&c.id==='slab-formwork'&&c.group==='methods'));
assert.ok(slabs.connections.some(c=>c.owner==='suspended-slab'&&c.id==='slab-soffit'&&c.group==='parts'));
assert.ok(slabs.connections.some(c=>c.owner==='concrete-slab'&&c.id==='embedded-conduit'&&c.group==='coordination'));
assert.equal(footings.root,'footing');
assert.ok(footings.nodes.some(n=>n.id==='strip-footing'));
assert.ok(footings.connections.some(c=>c.id==='footing-reinforcement'&&c.group==='parts'));
assert.equal(conduits.root,'conduit');
assert.ok(conduits.connections.some(c=>c.id==='conduit-bend'));
assert.equal(toppings.root,'topping-slab');
assert.ok(toppings.nodes.some(n=>n.id==='bonded-topping'));
assert.ok(toppings.nodes.some(n=>n.id==='unbonded-topping'));

const slabHtml=renderTermTrees(graph,terms,'suspended-slab');
assert.ok(slabHtml.includes('Explore the term tree'));
assert.ok(slabHtml.includes('href="term.html?term=concrete-slab"'));
assert.ok(slabHtml.includes('href="term.html?term=one-way-slab"'));
assert.ok(slabHtml.includes('href="term.html?term=two-way-slab"'));
assert.ok(slabHtml.includes('href="term.html?term=slab-formwork"'));
assert.ok(slabHtml.includes('aria-current="page"'));
assert.ok(slabHtml.includes('Parts and associated work'));
assert.ok(slabHtml.includes('Construction and temporary works'));
assert.ok(slabHtml.includes('role="region" tabindex="0"'),'tree has a keyboard-scrollable area');
assert.ok(slabHtml.includes('learning groupings'),'classification limitation must be visible');
assert.ok(!slabHtml.includes('No term found'));

assert.ok(familiesForTerm(graph,'topping-slab').some(f=>f.id==='slabs'));
assert.ok(familiesForTerm(graph,'topping-slab').some(f=>f.id==='toppings'),'topping is both an optional layer and a category root');
assert.ok(familiesForTerm(graph,'slab-formwork').some(f=>f.id==='slabs'),'associated method has family navigation');
assert.equal(renderTermTrees(graph,terms,'storm-sewer'),'','unmapped terms should retain their original page');
assert.ok(renderTermTrees(graph,terms,'strip-footing').includes('Foundations and footings'),'footings show family tree');
assert.ok(renderTermTrees(graph,terms,'embedded-conduit').includes('Electrical conduit systems'));

const corrupted=structuredClone(graph);
corrupted.families[0].nodes.find(node=>node.id==='suspended-slab').parent='missing-parent';
assert.ok(validateTermTrees(corrupted,terms).some(message=>message.includes('invalid parent')));
const badRef=structuredClone(graph);
badRef.families[0].connections[0].id='not-a-term';
assert.ok(validateTermTrees(badRef,terms).some(message=>message.includes('unknown related term')));
const cyclic=structuredClone(graph);
cyclic.families[0].nodes.find(node=>node.id==='suspended-slab').parent='two-way-slab';
assert.ok(validateTermTrees(cyclic,terms).some(message=>message.includes('cycle')));

for(const file of ["./src/term-tree.js","./src/term-tree.css","./data/term-trees.json"]){
  assert.ok(sw.includes("'"+file+"'"),file+' must be cached for offline term pages');
}
assert.ok(sw.includes("const CACHE='construction-vocab-v25'"),'new content must bump PWA cache');
assert.ok(detail.includes('src/term-tree.css'),'term detail must load tree styles');
assert.ok(home.includes('src/term-tree.css'),'home explorer must load tree styles');
assert.ok(termPage.includes("fetchJson('data/term-trees.json')"),'term detail loads curated tree data');
assert.ok(termPage.includes('renderTermTrees(treeData,terms,term.id)'),'term detail renders the actual tree');
assert.ok(termPage.includes("catch(error=>{console.warn('Term trees unavailable; showing standard term page.'"),'missing optional tree data must not break term details');
console.log('Concept tree tests OK: 387 words, discoverable Suspended slab, four validated trees, typed relationships, navigation, integrity checks and offline assets.');

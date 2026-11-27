import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findExactVocabularyTerm,searchVocabulary} from '../src/term-search.js';
import {renderTermVisual} from '../src/visuals-all.js';
import {validateTermTrees,renderTermTrees,familiesForTerm} from '../src/term-tree.js';

const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const vocabulary=[...read('data/terms.json'),...read('data/terms-expansion.json')];
const meta=read('data/term-meta.json').terms;
const packs=read('data/learning-packs.json');
const graph=read('data/term-trees.json');
const focus=read('data/focus-terms.json').terms;
const byId=new Map(vocabulary.map(t=>[t.id,t]));
const priorCount=387;
const newIds=[
'pipe-section','gravity-pipe','pressure-pipe','reinforced-concrete-pipe','non-reinforced-concrete-pipe',
'ductile-iron-pipe','corrugated-hdpe-pipe','pvc-sdr35','pvc-sdr28','pipe-nominal-diameter',
'pipe-inside-diameter','pipe-outside-diameter','pipe-wall-thickness','pipe-class','pipe-stiffness',
'pipe-invert','pipe-crown','pipe-springline','pipe-haunch','pipe-cover-depth','pipe-gradient',
'pipe-embedment','initial-backfill','final-backfill','pipe-zone','pipe-alignment','pipe-cut-length','pipe-deflection',
'pipe-bell-end','pipe-spigot-end','bell-and-spigot-joint','pipe-rubber-gasket','pipe-o-ring','gasket-groove',
'push-on-joint','restrained-joint','mechanical-joint','flanged-joint','butt-fusion-joint','flange-adaptor',
'pipe-elbow','pipe-tee','pipe-cross','pipe-cap','pipe-plug','pipe-flange','pipe-thrust-restraint',
'casing-pipe','carrier-pipe','casing-spacer','pipe-repair-clamp','pipe-tapping-sleeve','pipe-joint-deflection',
'open-cut-pipe-installation','pipe-jacking','horizontal-directional-drilling','pipe-stringing','pipe-lowering',
'pipe-cutting','pipe-laser-level','pipe-deflection-test','pipe-air-test','hydrostatic-pressure-test',
'pipe-leakage-test','cctv-pipe-inspection','pipe-flushing','watermain-disinfection','pipe-plugging',
'pipe-isolation','pipe-trench-shoring','pipe-joint-testing',
'precast-manhole','precast-manhole-base','precast-riser-section','eccentric-cone-section',
'concentric-cone-section','precast-flat-top','precast-grade-ring','manhole-steps','manhole-benching',
'manhole-channel','manhole-sump','drop-manhole','manhole-pipe-boot','manhole-cored-opening',
'precast-catch-basin','catch-basin-sump','catch-basin-outlet','precast-utility-vault',
'precast-junction-box','precast-box-culvert','box-culvert-joint','precast-headwall','precast-wingwall',
'precast-lifting-anchor','precast-lifting-clutch','precast-joint-sealant',
'utility-casting','cast-iron-casting','ductile-iron-casting','manhole-frame','manhole-cover',
'manhole-frame-and-cover','adjustable-manhole-frame','manhole-riser-ring',
'catch-basin-frame','catch-basin-grate','curb-inlet-casting','side-inlet-casting',
'combination-inlet','catch-basin-hood','trench-drain-grate','watertight-manhole-cover',
'vented-manhole-cover','locking-manhole-cover','traffic-rated-casting','casting-grade-adjustment',
'top-of-pipe','bottom-of-pipe','pipe-centerline-elevation','upstream-invert','downstream-invert',
'manhole-invert-drop','crown-matching','pipe-barrel','pipe-lay-length','pipe-crossing-clearance','hydraulic-grade-line',
'pipe'
];
assert.equal(newIds.length,129,'new vocabulary baseline');
assert.equal(new Set(newIds).size,newIds.length,'new unique IDs');
assert.equal(vocabulary.length,priorCount+newIds.length,'existing words and newly added terms');
assert.equal(new Set(vocabulary.map(t=>t.id)).size,vocabulary.length,'global vocabulary unique IDs');

for(const id of newIds){
 const t=byId.get(id);
 assert.ok(t,'missing new vocabulary '+id);
 for(const key of ['term','pronunciation','definition_en','explanation_ru','scenario','example_en','visual']){
  assert.ok(typeof t[key]==='string'&&t[key].length>=(key==='pronunciation'?1:10),'invalid '+id+'.'+key);
 }
 for(const lang of ['translation_ru','translation_vi']){
  assert.ok(Array.isArray(t[lang])&&t[lang].length>=1&&t[lang].every(Boolean),'missing '+id+'.'+lang);
 }
 assert.ok(t.example_en.toLowerCase().includes(t.term.toLowerCase()),id+' example teaches correct term');
 assert.ok(!t.scenario.toLowerCase().includes(t.term.toLowerCase()),id+' scenario reveals quiz answer');
 assert.ok(Array.isArray(t.common_mistakes)&&t.common_mistakes.length>=1,id+' needs warning');
 assert.ok(meta[id]?.aliases_en?.length>=2,id+' needs search aliases');
 for(const rel of t.related_terms)assert.ok(byId.has(rel),id+' related ID not found: '+rel);
 assert.ok(focus.some(t=>t.id===id),id+' absent from maintainer Focus');
 const visual=renderTermVisual(t);
 const quiz=renderTermVisual(t,{quiz:true});
 assert.ok(visual.includes('<svg')&&visual.includes('<text'),id+' must have illustrated SVG and visible label');
 assert.ok(quiz.includes('aria-label="Construction vocabulary diagram"'),id+' quiz must have generic accessible label');
 assert.ok(!/<text\b/i.test(quiz),id+' answer should be hidden in quiz');
}

const expectedPacks=[
'pipe-materials-and-sizes','pipe-elevations-and-embedment','pipe-joints-and-fittings',
'pipe-installation-and-qa','precast-drainage-structures','castings-frames-and-grates'
];
assert.equal(packs.length,22,'maintain 16 existing learning packs and six new packs');
for(const id of expectedPacks){
 const pack=packs.find(p=>p.id===id);
 assert.ok(pack,id+' exists');
 assert.ok(pack.term_ids.length>=15,id+' learning pack is sufficiently rich');
 assert.equal(new Set(pack.term_ids).size,pack.term_ids.length,id+' no duplicates');
 for(const termId of pack.term_ids)assert.ok(byId.has(termId),id+' references missing term '+termId);
}
const allPackIds=new Set(packs.flatMap(p=>p.term_ids));
for(const id of newIds)assert.ok(allPackIds.has(id),id+' appears in a learning pack');

const searchTerms=vocabulary.map(t=>({...t,...(meta[t.id]||{})}));
const aliases=[
 ['obvert','pipe-crown'],['pipe obvert','pipe-crown'],['crown overt','pipe-crown'],
 ['pipe crown','pipe-crown'],['pipe invert','pipe-invert'],
 ['top of pipe','top-of-pipe'],['bottom of pipe','bottom-of-pipe'],
 ['pipe springline','pipe-springline'],['RCP','reinforced-concrete-pipe'],
 ['DIP','ductile-iron-pipe'],['SDR35','pvc-sdr35'],['pipe OD','pipe-outside-diameter'],
 ['precast MH','precast-manhole'],['precast CB','precast-catch-basin'],
 ['MH frame and cover','manhole-frame-and-cover'],['F&C','manhole-frame-and-cover'],
 ['castings','utility-casting'],['CB grate','catch-basin-grate'],
 ['pipe lay length','pipe-lay-length'],['HGL','hydraulic-grade-line']
];
for(const [query,id] of aliases){
 assert.equal(findExactVocabularyTerm(searchTerms,query)?.id,id,'exact lookup '+query);
 assert.equal(searchVocabulary(searchTerms,query)[0]?.term.id,id,'ranked lookup '+query);
}

assert.ok(/upper inside/i.test(byId.get('pipe-crown').definition_en),'crown should describe internal upper point');
assert.ok(/lowest internal point/i.test(byId.get('pipe-invert').definition_en),'invert should describe internal bottom');
assert.ok(/outside surface/i.test(byId.get('top-of-pipe').definition_en),'top of pipe is exterior');
assert.ok(/outside surface/i.test(byId.get('bottom-of-pipe').definition_en),'bottom of pipe is exterior');

assert.deepEqual(validateTermTrees(graph,vocabulary),[],'all concept families and IDs resolve');
const neededFamilies=['pipe-types','pipe-geometry','precast-drainage','utility-castings'];
for(const id of neededFamilies)assert.ok(graph.families.some(f=>f.id===id),'new tree missing '+id);
assert.equal(graph.families.length,8,'four existing and four new concept families');
for(const [id,title] of [
 ['pipe-crown','Pipe section: obvert, invert and elevations'],
 ['pipe-invert','Pipe section: obvert, invert and elevations'],
 ['precast-manhole','Precast structures: pieces and assemblies'],
 ['manhole-frame','Utility castings: metal frames, lids and grates']
]){
 const family=familiesForTerm(graph,id).find(f=>f.title===title);
 assert.ok(family,id+' must show the correct group');
 const html=renderTermTrees(graph,vocabulary,id);
 assert.ok(html.includes('href="term.html?term='),'navigation links are available');
 assert.ok(html.includes('aria-current="page"'),id+' current term is identified');
}
const crownHtml=renderTermTrees(graph,vocabulary,'pipe-crown');
for(const target of ['pipe-invert','top-of-pipe','pipe-springline','pipe-cover-depth']){
 assert.ok(crownHtml.includes('term.html?term='+target),'crown family connects '+target);
}
assert.notEqual(renderTermVisual(byId.get('pipe-crown')),renderTermVisual(byId.get('pipe-invert')),'upper and lower pipe points have distinct diagrams');
console.log('Pipe, precast and casting vocabulary OK: 129 terms, 129 diagrams, six packs, four new typed trees, RU/VI, obvert and pipe search aliases.');

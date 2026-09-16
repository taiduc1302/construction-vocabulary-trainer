import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const readJson=path=>JSON.parse(read(path));
const terms=[...readJson('data/terms.json'),...readJson('data/terms-expansion.json')];
const termMap=new Map(terms.map(term=>[term.id,term]));
const metadata=readJson('data/term-meta.json');
const challenges=readJson('data/estimator-challenges.json');
const index=read('index.html');
const app=read('src/app.js');
const sw=read('sw.js');

assert.equal(new Set(terms.map(t=>t.id)).size,terms.length,'vocabulary IDs must stay unique');
assert.ok(metadata&&typeof metadata==='object'&&!Array.isArray(metadata),'term-meta.json must be an object');
assert.ok(metadata.terms&&typeof metadata.terms==='object'&&!Array.isArray(metadata.terms),'term-meta.json must contain a terms object');
assert.ok(Array.isArray(challenges)&&challenges.length>0,'estimator-challenges.json must contain challenges');
assert.ok(typeof metadata.note==='string'&&/verify/i.test(metadata.note),'drawing metadata must tell the learner to verify the project legend/specifications');

const labelOwners=new Map();
for(const [id,meta] of Object.entries(metadata.terms)){
  assert.ok(termMap.has(id),`term metadata references missing term ${id}`);
  assert.ok(meta&&typeof meta==='object'&&!Array.isArray(meta),`metadata for ${id} must be an object`);
  for(const field of ['aliases_en','drawing_labels']){
    if(meta[field]===undefined)continue;
    assert.ok(Array.isArray(meta[field]),`${id}.${field} must be an array`);
    assert.ok(meta[field].every(value=>typeof value==='string'&&value.trim()),`${id}.${field} must contain non-empty strings`);
    const normalized=meta[field].map(value=>value.trim().toLowerCase());
    assert.equal(new Set(normalized).size,normalized.length,`${id}.${field} must not contain duplicates`);
  }
  for(const label of meta.drawing_labels||[]){
    const key=label.trim().toLowerCase();
    const previous=labelOwners.get(key);
    assert.ok(!previous||previous===id,`drawing label ${label} is ambiguous between ${previous} and ${id}`);
    labelOwners.set(key,id);
  }
}
assert.ok(labelOwners.size>=8,'provide a useful minimum set of drawing abbreviations');

const challengeIds=new Set();
for(const challenge of challenges){
  assert.ok(challenge&&typeof challenge==='object'&&!Array.isArray(challenge),'challenge must be an object');
  for(const field of ['id','term_id','category','title','scenario','question','explanation']){
    assert.ok(typeof challenge[field]==='string'&&challenge[field].trim(),`${challenge.id||'challenge'} missing ${field}`);
  }
  assert.ok(!challengeIds.has(challenge.id),`duplicate estimator challenge id ${challenge.id}`);
  challengeIds.add(challenge.id);
  const term=termMap.get(challenge.term_id);
  assert.ok(term,`${challenge.id} references missing term ${challenge.term_id}`);
  assert.equal(challenge.category,term.category,`${challenge.id} category must match linked term category`);
  assert.ok(Array.isArray(challenge.options)&&challenge.options.length>=3,`${challenge.id} needs at least three options`);
  const optionTexts=challenge.options.map(option=>option?.text);
  assert.ok(optionTexts.every(text=>typeof text==='string'&&text.trim()),`${challenge.id} options need non-empty text`);
  assert.equal(new Set(optionTexts.map(text=>text.trim().toLowerCase())).size,optionTexts.length,`${challenge.id} options must be unique`);
  assert.equal(challenge.options.filter(option=>option.correct===true).length,1,`${challenge.id} must have exactly one correct option`);
  assert.ok(challenge.options.every(option=>typeof option.correct==='boolean'),`${challenge.id} option correctness must be boolean`);
}

assert.ok(index.includes('value="drawing-label"'),'index.html must expose Drawing abbreviations practice');
assert.ok(index.includes('value="estimator"'),'index.html must expose Estimator scenarios practice');
assert.ok(app.includes("fetchJson('data/term-meta.json')"),'app must load term-meta.json');
assert.ok(app.includes("fetchJson('data/estimator-challenges.json')"),'app must load estimator-challenges.json');
assert.ok(app.includes('makeDrawingLabelQuestion'),'app must wire Drawing abbreviations practice');
assert.ok(app.includes('makeEstimatorQuestion'),'app must wire Estimator scenarios practice');
assert.ok(app.includes('pickTypedPrompt'),'app must use varied typed active recall prompts');
for(const asset of ['./data/term-meta.json','./data/estimator-challenges.json']){
  assert.ok(sw.includes(`'${asset}'`),`service worker must precache ${asset}`);
}

console.log(`Learning-content tests OK: ${Object.keys(metadata.terms).length} metadata records, ${labelOwners.size} drawing labels, ${challenges.length} estimator challenges, UI/runtime/PWA wiring verified.`);

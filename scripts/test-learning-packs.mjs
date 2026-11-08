import fs from 'node:fs';
import assert from 'node:assert/strict';

const core=JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8'));
const expanded=JSON.parse(fs.readFileSync(new URL('../data/terms-expansion.json',import.meta.url),'utf8'));
const packs=JSON.parse(fs.readFileSync(new URL('../data/learning-packs.json',import.meta.url),'utf8'));
const ids=new Set([...core,...expanded].map(term=>term.id));

assert.ok(Array.isArray(packs)&&packs.length>=7,'public launch needs at least seven focused learning packs');
assert.equal(new Set(packs.map(pack=>pack.id)).size,packs.length,'learning pack IDs must be unique');
for(const pack of packs){
  assert.ok(pack.title&&pack.description&&pack.focus,'each pack needs title, description and focus');
  assert.ok(Array.isArray(pack.term_ids)&&pack.term_ids.length>=10,`${pack.id} should contain at least 10 terms`);
  assert.equal(new Set(pack.term_ids).size,pack.term_ids.length,`${pack.id} term IDs must be unique`);
  for(const id of pack.term_ids)assert.ok(ids.has(id),`${pack.id} references missing term ${id}`);
}
for(const required of ['civil-starter','estimator-starter','earthworks','underground-utilities','duct-bank','road-restoration','drawing-english']){
  assert.ok(packs.some(pack=>pack.id===required),`missing required starter pack ${required}`);
}
console.log(`Learning packs OK: ${packs.length} packs, all term IDs resolve.`);

import fs from 'node:fs';
import assert from 'node:assert/strict';

const core=JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8'));
const expanded=JSON.parse(fs.readFileSync(new URL('../data/terms-expansion.json',import.meta.url),'utf8'));
const packs=JSON.parse(fs.readFileSync(new URL('../data/learning-packs.json',import.meta.url),'utf8'));

const ids=new Set([...core,...expanded].map(term=>term.id));
assert.ok(Array.isArray(packs)&&packs.length>=6,'learning-packs.json should contain a useful starter library');

const packIds=new Set();
for(const pack of packs){
  assert.match(pack.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'pack id must be kebab-case');
  assert.ok(!packIds.has(pack.id),'learning pack ids must be unique');
  packIds.add(pack.id);
  assert.ok(typeof pack.title==='string'&&pack.title.trim(),'pack title is required');
  assert.ok(typeof pack.tagline==='string'&&pack.tagline.trim(),'pack tagline is required');
  assert.ok(typeof pack.description==='string'&&pack.description.trim(),'pack description is required');
  assert.ok(Array.isArray(pack.roles)&&pack.roles.length,'pack roles are required');
  assert.ok(Array.isArray(pack.interests)&&pack.interests.length,'pack interests are required');
  assert.ok(Array.isArray(pack.term_ids)&&pack.term_ids.length>=10&&pack.term_ids.length<=40,'packs should stay focused between 10 and 40 terms');
  assert.equal(new Set(pack.term_ids).size,pack.term_ids.length,pack.id+' contains duplicate term ids');
  for(const id of pack.term_ids)assert.ok(ids.has(id),pack.id+' references missing vocabulary id '+id);
}

for(const required of ['civil-starter','estimator-starter','earthworks','underground-utilities','duct-bank-electrical','deep-excavation','road-restoration','pump-station']){
  assert.ok(packIds.has(required),'starter library is missing '+required);
}

console.log('Learning-pack contract OK: '+packs.length+' focused packs reference valid vocabulary only.');

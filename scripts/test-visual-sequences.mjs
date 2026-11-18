import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SEQUENCES,supportedSequenceIds,renderConstructionSequence} from '../src/visual-sequences.js';
import {renderTermVisual} from '../src/visuals-all.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const css=read('src/visual-sequences.css');
const terms=[...JSON.parse(read('data/terms.json')),...JSON.parse(read('data/terms-expansion.json'))];
const ids=['duct-bank','culvert','trench-box'];
assert.deepEqual(supportedSequenceIds(),ids);
for(const id of ids){
  const term=terms.find(t=>t.id===id);
  assert.ok(term,`missing canonical term ${id}`);
  const seq=SEQUENCES[id];
  assert.equal(seq.steps.length,4);
  assert.ok(seq.steps.every(s=>typeof s==='string'&&s.length>20));
  assert.ok(seq.caution.length>=50,`missing safety/technical caution for ${id}`);
  const html=renderConstructionSequence(id);
  assert.match(html,/<section class="construction-sequence"/);
  assert.ok(html.includes(`data-sequence-id="${id}"`));
  assert.match(html,/data-state="idle" data-step="0"/);
  assert.match(html,/<svg viewBox="0 0 320 180" role="img"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/data-sequence-action="play"/);
  assert.match(html,/data-sequence-action="pause" disabled/);
  assert.match(html,/data-sequence-action="replay"/);
  assert.match(html,/data-sequence-action="next"/);
  for(const part of ['seq-at-1','seq-at-2','seq-at-3'])assert.ok(html.includes(part),`${id} missing stage ${part}`);
  assert.ok(html.includes(seq.steps[0]));
  assert.ok(html.includes(seq.caution));
  assert.doesNotMatch(html,/<script\b|<foreignObject\b|onclick=|href="http|<image\b/i);
  // Quiz preview is the existing static answer-safe renderer, NEVER the learning sequence.
  const quiz=renderTermVisual(term,{quiz:true});
  assert.doesNotMatch(quiz,/construction-sequence|data-sequence-action|seq-at-[123]/);
  assert.doesNotMatch(quiz,/<text\b/i,'quiz diagram should not leak SVG label text');
}
assert.equal(renderConstructionSequence('random-id'),'');
assert.match(css,/prefers-reduced-motion:reduce/);
for(const step of [1,2,3])assert.ok(css.includes(`[data-step="${step}"]`));
for(const file of ['index.html','term.html']){
  const html=read(file);
  assert.match(html,/src\/visual-sequences\.css/);
}
for(const file of ['src/app.js','src/term-page.js']){
  const code=read(file);
  assert.ok(code.includes("from './visual-sequences.js'"),`${file} does not import sequence controller`);
  assert.match(code,/renderConstructionSequence\(t\.id\)|renderConstructionSequence\(term\.id\)/);
  assert.match(code,/installSequenceControls\(document\)/);
}
const sw=read('sw.js');
for(const asset of ['./src/visual-sequences.js','./src/visual-sequences.css'])assert.ok(sw.includes(asset),`PWA missing ${asset}`);
console.log('Construction sequence tests OK: canonical terms, stage SVGs, safe quiz separation, PWA and accessibility wiring.');

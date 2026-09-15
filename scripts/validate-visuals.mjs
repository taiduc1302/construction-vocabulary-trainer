import fs from 'node:fs';
import {getDrawingScenes} from '../src/drawing-challenges.js';

const terms=[
  ...JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8')),
  ...JSON.parse(fs.readFileSync(new URL('../data/terms-expansion.json',import.meta.url),'utf8'))
];
const termIds=new Set(terms.map(t=>t.id));
const termById=new Map(terms.map(t=>[t.id,t]));
const visualSources=[
  fs.readFileSync(new URL('../src/visuals.js',import.meta.url),'utf8'),
  fs.readFileSync(new URL('../src/visuals-extra.js',import.meta.url),'utf8')
].join('\n');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cssSources=[
  fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8'),
  fs.readFileSync(new URL('../src/quiz.css',import.meta.url),'utf8'),
  fs.readFileSync(new URL('../src/progress.css',import.meta.url),'utf8')
].join('\n');
const scenes=getDrawingScenes();
const errors=[];

const missing=terms.filter(term=>!visualSources.includes(`'${term.id}':`)).map(term=>term.id);
if(missing.length)errors.push(`Missing dedicated visual diagrams: ${missing.join(', ')}`);

const requiredIds=[
  'practiceScope','practiceCategory','practiceMode','quizCard','dictionaryGrid','quickSession',
  'dailyGoalCard','drawingSceneSelect','newDrawingQuestion','drawingChallenge',
  'progressOverview','hardestWords','sessionHistory'
];
for(const requiredId of requiredIds){
  if(!index.includes(`id="${requiredId}"`))errors.push(`index.html is missing required element #${requiredId}`);
}

for(const importPath of ['./visuals-all.js','./learning-state.js','./practice-engine.js','./drawing-challenges.js']){
  if(!app.includes(`from '${importPath}'`))errors.push(`app.js is not wired to ${importPath}`);
}
if(!app.includes("mode==='contrast'"))errors.push('app.js is missing similar-term contrast practice');
if(!app.includes("mode==='typed'"))errors.push('app.js is missing typed active-recall practice');
if(!app.includes('adaptiveWeight')||!app.includes('weightedPick'))errors.push('app.js is missing adaptive smart-review weighting');
if(!index.includes('value="contrast"')||!index.includes('value="typed"'))errors.push('index.html is missing advanced practice options');
if(!index.includes('value="focus"'))errors.push('index.html is missing My focus list practice scope');
if(!app.includes("fetchJson('data/focus-terms.json')"))errors.push('app.js is not loading data/focus-terms.json');
if(!app.includes('session.poolIds.length')||!app.includes('poolIds:initialPool.map'))errors.push('Quick 10 is not freezing its starting practice pool');

function classesUsed(source,prefix){
  const out=new Set();
  for(const match of source.matchAll(/class="([^"]+)"/g)){
    for(const name of match[1].split(/\s+/))if(name.startsWith(prefix))out.add(name);
  }
  return out;
}
function classesDefined(source,prefix){
  const out=new Set();
  for(const match of source.matchAll(/\.([A-Za-z0-9_-]+)/g))if(match[1].startsWith(prefix))out.add(match[1]);
  return out;
}

const definedTv=classesDefined(cssSources,'tv-');
const missingTv=[...classesUsed(visualSources,'tv-')].filter(name=>!definedTv.has(name));
if(missingTv.length)errors.push(`Visual SVG classes missing CSS definitions: ${missingTv.join(', ')}`);

const sceneIds=new Set();
let drawingTargets=0;
for(const scene of scenes){
  if(!scene||typeof scene!=='object'){errors.push('Drawing challenge scene must be an object');continue}
  if(!scene.id||sceneIds.has(scene.id))errors.push(`Drawing challenge has missing/duplicate scene id: ${scene.id||'(missing)'}`);
  sceneIds.add(scene.id);
  if(!scene.title||!scene.description||!scene.svg)errors.push(`Drawing scene ${scene.id} is missing title, description, or SVG`);
  if(!Array.isArray(scene.targets)||scene.targets.length<2){errors.push(`Drawing scene ${scene.id} needs at least two targets`);continue}
  const labels=new Set();
  const sceneTermIds=new Set();
  const visibleText=[...scene.svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ').trim().toLowerCase()).join(' ');
  for(const target of scene.targets){
    drawingTargets++;
    if(!target.label||labels.has(target.label))errors.push(`Drawing scene ${scene.id} has missing/duplicate label ${target.label||'(missing)'}`);
    labels.add(target.label);
    if(!target.termId||!termIds.has(target.termId))errors.push(`Drawing scene ${scene.id} references missing term ${target.termId||'(missing)'}`);
    if(sceneTermIds.has(target.termId))errors.push(`Drawing scene ${scene.id} repeats target term ${target.termId}`);
    sceneTermIds.add(target.termId);
    if(target.label&&!new RegExp(`>${target.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}<\\/text>`).test(scene.svg))errors.push(`Drawing scene ${scene.id} target ${target.label} has no visible callout label in SVG`);
    const term=termById.get(target.termId)?.term?.toLowerCase();
    if(term&&visibleText.includes(term))errors.push(`Drawing scene ${scene.id} leaks answer term “${term}” in visible SVG text`);
  }
}

const drawingSource=scenes.map(scene=>scene.svg).join('\n');
const definedDc=classesDefined(cssSources,'dc-');
const missingDc=[...classesUsed(drawingSource,'dc-')].filter(name=>!definedDc.has(name));
if(missingDc.length)errors.push(`Drawing SVG classes missing CSS definitions: ${missingDc.join(', ')}`);

if(errors.length){
  console.error(`Visual/app validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Visual coverage OK: ${terms.length}/${terms.length} terms have dedicated diagrams.`);
console.log(`Visual CSS coverage OK: ${definedTv.size} tv-* classes defined; every used class resolves.`);
console.log(`Drawing challenge coverage OK: ${scenes.length} scenes / ${drawingTargets} valid callouts; every dc-* class resolves.`);
console.log('Practice app contract OK: focus scope, strict practice engine and frozen Quick 10 pool are wired.');

import fs from 'node:fs';

const terms=[
  ...JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8')),
  ...JSON.parse(fs.readFileSync(new URL('../data/terms-expansion.json',import.meta.url),'utf8'))
];
const termIds=new Set(terms.map(t=>t.id));
const visualSources=[
  fs.readFileSync(new URL('../src/visuals.js',import.meta.url),'utf8'),
  fs.readFileSync(new URL('../src/visuals-extra.js',import.meta.url),'utf8')
].join('\n');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const drawings=fs.readFileSync(new URL('../src/drawing-challenges.js',import.meta.url),'utf8');
const serviceWorker=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

const missing=terms.filter(term=>!visualSources.includes(`'${term.id}':`)).map(term=>term.id);
if(missing.length){
  console.error(`Missing dedicated visual diagrams: ${missing.join(', ')}`);
  process.exit(1);
}

const requiredIds=[
  'practiceScope','practiceCategory','practiceMode','quizCard','dictionaryGrid','quickSession',
  'dailyGoalCard','drawingSceneSelect','newDrawingQuestion','drawingChallenge',
  'progressOverview','hardestWords','sessionHistory'
];
for(const requiredId of requiredIds){
  if(!index.includes(`id="${requiredId}"`)){
    console.error(`index.html is missing required element #${requiredId}`);
    process.exit(1);
  }
}

for(const importPath of ["./visuals-all.js","./learning-state.js","./drawing-challenges.js"]){
  if(!app.includes(`from '${importPath}'`)){
    console.error(`app.js is not wired to ${importPath}`);
    process.exit(1);
  }
}
if(!app.includes("mode==='contrast'")){
  console.error('app.js is missing similar-term contrast practice');
  process.exit(1);
}
if(!app.includes("mode==='typed'")){
  console.error('app.js is missing typed active-recall practice');
  process.exit(1);
}
if(!app.includes('adaptiveWeight')||!app.includes('weightedPick')){
  console.error('app.js is missing adaptive smart-review weighting');
  process.exit(1);
}
if(!index.includes('value="contrast"')||!index.includes('value="typed"')){
  console.error('index.html is missing advanced practice options');
  process.exit(1);
}
if(!index.includes('value="focus"')||!app.includes("case 'focus'")||!app.includes("fetchJson('data/focus-terms.json')")){
  console.error('Focus-list practice is not fully wired into the frontend');
  process.exit(1);
}
if(!serviceWorker.includes("'./data/focus-terms.json'")||!serviceWorker.includes('isVocabularyData')){
  console.error('Service worker is not configured to cache and refresh focus/vocabulary data');
  process.exit(1);
}

const drawingTermIds=[...drawings.matchAll(/termId:'([^']+)'/g)].map(match=>match[1]);
if(!drawingTermIds.length){
  console.error('No drawing challenge targets found');
  process.exit(1);
}
const missingDrawingTerms=[...new Set(drawingTermIds.filter(id=>!termIds.has(id)))];
if(missingDrawingTerms.length){
  console.error(`Drawing challenges reference missing terms: ${missingDrawingTerms.join(', ')}`);
  process.exit(1);
}

console.log(`Visual coverage OK: ${terms.length}/${terms.length} terms have dedicated diagrams.`);
console.log(`Drawing challenge coverage OK: ${drawingTermIds.length} callouts reference valid terms.`);
console.log('Focus-list practice and refresh contract OK.');

import fs from 'node:fs';

const terms=[
  ...JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8')),
  ...JSON.parse(fs.readFileSync(new URL('../data/terms-expansion.json',import.meta.url),'utf8'))
];
const visualSources=[
  fs.readFileSync(new URL('../src/visuals.js',import.meta.url),'utf8'),
  fs.readFileSync(new URL('../src/visuals-extra.js',import.meta.url),'utf8')
].join('\n');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const missing=terms.filter(term=>!visualSources.includes(`'${term.id}':`)).map(term=>term.id);
if(missing.length){
  console.error(`Missing dedicated visual diagrams: ${missing.join(', ')}`);
  process.exit(1);
}

for(const requiredId of ['practiceScope','practiceCategory','practiceMode','quizCard','dictionaryGrid','quickSession']){
  if(!index.includes(`id="${requiredId}"`)){
    console.error(`index.html is missing required element #${requiredId}`);
    process.exit(1);
  }
}

if(!app.includes("from './visuals-all.js'")){
  console.error('app.js is not wired to the combined visual renderer');
  process.exit(1);
}
if(!app.includes("mode==='contrast'")){
  console.error('app.js is missing similar-term contrast practice');
  process.exit(1);
}
if(!app.includes("mode==='typed'")){
  console.error('app.js is missing typed active-recall practice');
  process.exit(1);
}
if(!index.includes('value="contrast"')||!index.includes('value="typed"')){
  console.error('index.html is missing advanced practice options');
  process.exit(1);
}

console.log(`Visual coverage OK: ${terms.length}/${terms.length} terms have dedicated diagrams.`);

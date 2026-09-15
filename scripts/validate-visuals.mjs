import fs from 'node:fs';

const terms=JSON.parse(fs.readFileSync(new URL('../data/terms.json',import.meta.url),'utf8'));
const visuals=fs.readFileSync(new URL('../src/visuals.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const missing=terms.filter(term=>!visuals.includes(`'${term.id}':`)).map(term=>term.id);
if(missing.length){
  console.error(`Missing dedicated visual diagrams: ${missing.join(', ')}`);
  process.exit(1);
}

for(const requiredId of ['practiceScope','practiceMode','quizCard','dictionaryGrid','quickSession']){
  if(!index.includes(`id="${requiredId}"`)){
    console.error(`index.html is missing required element #${requiredId}`);
    process.exit(1);
  }
}

if(!app.includes("renderTermVisual")){
  console.error('app.js is not wired to the visual renderer');
  process.exit(1);
}

console.log(`Visual coverage OK: ${terms.length}/${terms.length} terms have dedicated diagrams.`);

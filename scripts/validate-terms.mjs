import fs from 'node:fs';

const termFiles=['../data/terms.json','../data/terms-expansion.json'];
const groups=termFiles.map(path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8')));
const terms=groups.flat();
const categories=JSON.parse(fs.readFileSync(new URL('../data/categories.json',import.meta.url),'utf8'));
const categoryIds=new Set(categories.map(c=>c.id));
const required=['id','term','category','definition_en','explanation_ru','translation_ru','translation_vi','example_en','scenario','visual','related_terms','difficulty'];
const seen=new Set();
const errors=[];

for(const [index,t] of terms.entries()){
  for(const key of required){if(t[key]===undefined||t[key]===null||t[key]==='')errors.push(`#${index+1} ${t.term||t.id||'unknown'}: missing ${key}`)}
  if(seen.has(t.id))errors.push(`${t.id}: duplicate id across vocabulary files`);seen.add(t.id);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.id))errors.push(`${t.id}: id must be kebab-case`);
  if(!categoryIds.has(t.category))errors.push(`${t.id}: unknown category ${t.category}`);
  if(!Array.isArray(t.translation_ru)||!t.translation_ru.length)errors.push(`${t.id}: translation_ru must be a non-empty array`);
  if(!Array.isArray(t.translation_vi)||!t.translation_vi.length)errors.push(`${t.id}: translation_vi must be a non-empty array`);
  if(!Array.isArray(t.related_terms))errors.push(`${t.id}: related_terms must be an array`);
  if(t.common_mistakes!==undefined&&!Array.isArray(t.common_mistakes))errors.push(`${t.id}: common_mistakes must be an array`);
  if(!Number.isInteger(t.difficulty)||t.difficulty<1||t.difficulty>5)errors.push(`${t.id}: difficulty must be integer 1-5`);
}

if(errors.length){console.error(`Validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);process.exit(1)}
console.log(`OK: ${terms.length} terms (${groups.map((g,i)=>`${termFiles[i].split('/').pop()}: ${g.length}`).join(', ')}) across ${new Set(terms.map(t=>t.category)).size} used categories.`);

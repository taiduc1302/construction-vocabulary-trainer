import fs from 'node:fs';

const termFiles=['../data/terms.json','../data/terms-expansion.json'];
const groups=termFiles.map(path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8')));
const terms=groups.flat();
const categories=JSON.parse(fs.readFileSync(new URL('../data/categories.json',import.meta.url),'utf8'));
const focus=JSON.parse(fs.readFileSync(new URL('../data/focus-terms.json',import.meta.url),'utf8'));
const fillExamples=JSON.parse(fs.readFileSync(new URL('../data/fill-examples.json',import.meta.url),'utf8'));
const errors=[];
const warnings=[];

function normalized(value){
  return String(value||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function phraseIncluded(text,phrase){
  const hay=` ${normalized(text)} `;
  const needle=normalized(phrase);
  return needle?hay.includes(` ${needle} `):false;
}
function validDateOnly(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const date=new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function nonEmptyStringArray(value){return Array.isArray(value)&&value.length>0&&value.every(v=>typeof v==='string'&&v.trim())}

const ids=new Set(terms.map(t=>t.id));
const termsByNormalizedName=new Map();
const knownNames=new Set();
for(const term of terms){
  knownNames.add(normalized(term.term));
  knownNames.add(normalized(term.id));
}

if(!fillExamples||Array.isArray(fillExamples)||typeof fillExamples!=='object'){
  errors.push('fill-examples.json must be an object keyed by vocabulary term id');
}else{
  for(const [id,example] of Object.entries(fillExamples)){
    if(!ids.has(id))errors.push(`fill example ${id}: id does not exist in vocabulary`);
    if(typeof example!=='string'||example.trim().length<10)errors.push(`fill example ${id}: value must be a meaningful string`);
    const term=terms.find(item=>item.id===id);
    if(term&&typeof example==='string'&&!phraseIncluded(example,term.term))errors.push(`fill example ${id}: must contain exact canonical term phrase “${term.term}”`);
  }
}

for(const term of terms){
  const name=normalized(term.term);
  if(termsByNormalizedName.has(name))errors.push(`${term.id}: duplicate normalized term name with ${termsByNormalizedName.get(name)}`);
  else termsByNormalizedName.set(name,term.id);

  if(typeof term.pronunciation!=='string'||!term.pronunciation.trim())errors.push(`${term.id}: pronunciation is required`);
  for(const field of ['definition_en','explanation_ru','example_en','scenario','visual']){
    if(typeof term[field]!=='string'||term[field].trim().length<10)errors.push(`${term.id}: ${field} must contain at least 10 meaningful characters`);
  }
  if(!nonEmptyStringArray(term.translation_ru))errors.push(`${term.id}: translation_ru must contain non-empty strings`);
  if(!nonEmptyStringArray(term.translation_vi))errors.push(`${term.id}: translation_vi must contain non-empty strings`);
  if(!Array.isArray(term.related_terms)||!term.related_terms.every(v=>typeof v==='string'&&v.trim()))errors.push(`${term.id}: related_terms must contain only non-empty strings`);
  if(term.common_mistakes!==undefined&&(!Array.isArray(term.common_mistakes)||!term.common_mistakes.every(v=>typeof v==='string'&&v.trim())))errors.push(`${term.id}: common_mistakes must contain only non-empty strings`);
  if(phraseIncluded(term.scenario,term.term))errors.push(`${term.id}: scenario leaks the answer term “${term.term}”`);

  const fillSource=fillExamples?.[term.id]||term.example_en;
  if(!phraseIncluded(fillSource,term.term))errors.push(`${term.id}: Fill-in-the-blank source must contain exact canonical term phrase “${term.term}”; add an override to data/fill-examples.json when example_en intentionally uses an inflected form`);

  for(const related of term.related_terms||[]){
    const key=normalized(related);
    if(!ids.has(related)&&!knownNames.has(key))warnings.push(`${term.id}: related term “${related}” does not resolve to a current id or term name`);
  }
}

if(!focus||focus.version!==1||!Array.isArray(focus.terms)){
  errors.push('focus-terms.json must have version 1 and a terms array');
}else{
  const seenFocus=new Set();
  for(const item of focus.terms){
    if(!item||typeof item!=='object'){errors.push('focus list entries must be objects');continue}
    if(!ids.has(item.id))errors.push(`focus ${item.id}: id does not exist in vocabulary`);
    if(seenFocus.has(item.id))errors.push(`focus ${item.id}: duplicate focus entry`);
    seenFocus.add(item.id);
    if(!validDateOnly(item.added_at))errors.push(`focus ${item.id}: invalid added_at calendar date`);
    if(!validDateOnly(item.last_requested_at))errors.push(`focus ${item.id}: invalid last_requested_at calendar date`);
    if(validDateOnly(item.added_at)&&validDateOnly(item.last_requested_at)&&item.last_requested_at<item.added_at)errors.push(`focus ${item.id}: last_requested_at cannot be before added_at`);
    if(!Number.isInteger(item.request_count)||item.request_count<1)errors.push(`focus ${item.id}: request_count must be a positive integer`);
  }
}

const usedCategories=new Set(terms.map(t=>t.category));
for(const category of categories)if(!usedCategories.has(category.id))warnings.push(`category ${category.id}: currently unused`);

if(warnings.length){
  console.warn(`Content audit warnings (${warnings.length}):\n- ${warnings.join('\n- ')}`);
}
if(errors.length){
  console.error(`Content audit failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Content audit OK: ${terms.length} terms checked for structure, answer leakage, canonical duplicates, fill prompts and focus metadata.`);

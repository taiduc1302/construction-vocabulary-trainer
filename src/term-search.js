function cleanStrings(values){
  const out=[];
  const seen=new Set();
  for(const raw of Array.isArray(values)?values:[]){
    const value=String(raw||'').trim();
    if(!value)continue;
    const key=normalizeTermSearch(value);
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function normalizeTermSearch(value){
  return String(value||'')
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function searchableAliases(term){
  return cleanStrings([...(term?.aliases_en||[]),...(term?.drawing_labels||[])]);
}

function translations(term){
  return cleanStrings([...(term?.translation_ru||[]),...(term?.translation_vi||[])]);
}

export function findExactVocabularyTerm(terms,value){
  const key=normalizeTermSearch(value);
  if(!key)return null;
  for(const term of Array.isArray(terms)?terms:[]){
    if(normalizeTermSearch(term?.id)===key||normalizeTermSearch(term?.term)===key)return term;
    if(searchableAliases(term).some(alias=>normalizeTermSearch(alias)===key))return term;
    if(translations(term).some(item=>normalizeTermSearch(item)===key))return term;
  }
  return null;
}

export function searchVocabulary(terms,value,{limit=5}={}){
  const query=normalizeTermSearch(value);
  if(!query)return [];
  const scored=[];
  for(const term of Array.isArray(terms)?terms:[]){
    const canonical=normalizeTermSearch(term?.term);
    const id=normalizeTermSearch(term?.id);
    const aliases=searchableAliases(term).map(normalizeTermSearch);
    const translated=translations(term).map(normalizeTermSearch);
    const definition=normalizeTermSearch(term?.definition_en);
    const explanation=normalizeTermSearch(term?.explanation_ru);

    let score=0;
    let match='';

    if(canonical===query||id===query){score=100;match='term'}
    else if(aliases.includes(query)){score=96;match='alias'}
    else if(translated.includes(query)){score=92;match='translation'}
    else if(canonical.startsWith(query)||id.startsWith(query)){score=82;match='term'}
    else if(aliases.some(alias=>alias.startsWith(query))){score=78;match='alias'}
    else if(translated.some(item=>item.startsWith(query))){score=70;match='translation'}
    else if(canonical.includes(query)||id.includes(query)){score=64;match='term'}
    else if(aliases.some(alias=>alias.includes(query))){score=60;match='alias'}
    else if(translated.some(item=>item.includes(query))){score=52;match='translation'}
    else if(definition.includes(query)){score=30;match='definition'}
    else if(explanation.includes(query)){score=20;match='explanation'}

    if(score)scored.push({term,score,match});
  }
  return scored
    .sort((a,b)=>b.score-a.score||String(a.term.term).localeCompare(String(b.term.term)))
    .slice(0,Math.max(1,Math.min(20,Number(limit)||5)));
}

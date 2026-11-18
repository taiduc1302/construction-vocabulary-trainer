import {normalizeTermSearch} from './term-search.js';

function allStrings(value){
  if(Array.isArray(value))return value.flatMap(allStrings);
  return typeof value==='string'?[value]:[];
}

/** Match visible vocabulary fields consistently across English, Russian and Vietnamese. */
export function matchesDictionaryTerm(term,rawQuery){
  const query=normalizeTermSearch(rawQuery);
  if(!query)return true;
  if(!term||typeof term!=='object')return false;
  const visible=[
    term.id,term.term,term.pronunciation,term.definition_en,term.explanation_ru,
    term.example_en,term.scenario,term.visual,term.category,
    term.aliases_en,term.drawing_labels,term.translation_ru,term.translation_vi,
    term.related_terms,term.common_mistakes
  ];
  return visible.flatMap(allStrings).some(value=>normalizeTermSearch(value).includes(query));
}

/** Hide whole answer terms in definition questions, without changing stored definitions. */
export function maskDefinitionAnswer(term){
  const definition=String(term?.definition_en||'');
  const answer=String(term?.term||'').trim();
  if(!answer)return definition;
  const escaped=answer.replace(/[.*+?^{}()|[\]\\$]/g,'\\$&');
  const re=new RegExp('(^|[^\\p{L}\\p{N}])('+escaped+')(?=$|[^\\p{L}\\p{N}])','giu');
  return definition.replace(re,(match,before)=>before+'_____');
}

/** Only the learner-selected supplementary language is shown after answering. */
export function selectedFeedbackLanguage(term,language){
  if(language==='ru'){
    const content=String(term?.explanation_ru||'').trim()||allStrings(term?.translation_ru).join(', ');
    return content?{label:'RU',text:content}:null;
  }
  if(language==='vi'){
    const content=allStrings(term?.translation_vi).join(', ');
    return content?{label:'VI',text:content}:null;
  }
  return null;
}

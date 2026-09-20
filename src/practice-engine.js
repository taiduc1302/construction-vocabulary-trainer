export function normalizeRecall(value){
  return String(value||'')
    .toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

export function recallMatches(input,answer,aliases=[]){
  const typed=normalizeRecall(input);
  if(!typed)return false;
  const compact=typed.replace(/\s+/g,'');
  const aliasList=Array.isArray(aliases)?aliases:[];
  return [answer,...aliasList].some(candidate=>{
    const normalized=normalizeRecall(candidate);
    return normalized===typed||normalized.replace(/\s+/g,'')===compact;
  });
}

function cleanStrings(values=[]){
  const source=Array.isArray(values)?values:[];
  const seen=new Set();
  const out=[];
  for(const value of source){
    if(typeof value!=='string'||!value.trim())continue;
    const cleaned=value.trim();
    const key=cleaned.toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);out.push(cleaned);
  }
  return out;
}

export function mergeTermMetadata(terms,metadata={}){
  const metaMap=metadata&&typeof metadata==='object'&&!Array.isArray(metadata)
    ?(metadata.terms&&typeof metadata.terms==='object'?metadata.terms:metadata)
    :{};
  return terms.map(term=>{
    const meta=metaMap[term.id]&&typeof metaMap[term.id]==='object'?metaMap[term.id]:{};
    return {
      ...term,
      aliases_en:cleanStrings([...(Array.isArray(term.aliases_en)?term.aliases_en:[]),...(Array.isArray(meta.aliases_en)?meta.aliases_en:[])]),
      drawing_labels:cleanStrings([...(Array.isArray(term.drawing_labels)?term.drawing_labels:[]),...(Array.isArray(meta.drawing_labels)?meta.drawing_labels:[])])
    };
  });
}

function promptLeaksAnswer(text,term){
  const source=normalizeRecall(text);
  if(!source)return false;
  const accepted=cleanStrings([term?.term,...(Array.isArray(term?.aliases_en)?term.aliases_en:[])])
    .map(normalizeRecall)
    .filter(Boolean);
  return accepted.some(answer=>source.includes(answer));
}

export function typedPromptCandidates(term){
  if(!term||typeof term!=='object')return [];
  const candidates=[];
  const ru=Array.isArray(term.translation_ru)?term.translation_ru[0]:'';
  const vi=Array.isArray(term.translation_vi)?term.translation_vi[0]:'';
  if(ru)candidates.push({kind:'ru',prompt:`Type the English construction term for “${ru}”.`});
  if(vi)candidates.push({kind:'vi',prompt:`Type the English construction term for “${vi}”.`});
  if(term.definition_en&&!promptLeaksAnswer(term.definition_en,term))candidates.push({kind:'definition',prompt:`Type the construction term described here: ${term.definition_en}`});
  if(term.scenario&&!promptLeaksAnswer(term.scenario,term))candidates.push({kind:'scenario',prompt:`Type the construction term that best fits this situation: ${term.scenario}`});
  for(const label of cleanStrings(term.drawing_labels)){
    if(normalizeRecall(label)!==normalizeRecall(term.term))candidates.push({kind:'drawing-label',prompt:`A civil drawing uses “${label}”. Type the full English construction term.`});
  }
  return candidates;
}

export function pickTypedPrompt(term,random=Math.random){
  const candidates=typedPromptCandidates(term);
  if(!candidates.length)return {kind:'fallback',prompt:'Type the English construction term.'};
  const value=Math.max(0,Math.min(.999999,Number(random())||0));
  return candidates[Math.floor(value*candidates.length)];
}

export function drawingLabelTerms(pool=[]){
  return pool.filter(term=>Array.isArray(term.drawing_labels)&&term.drawing_labels.length>0);
}

export function pickDrawingLabel(term,random=Math.random){
  const labels=cleanStrings(term?.drawing_labels);
  if(!labels.length)return null;
  const value=Math.max(0,Math.min(.999999,Number(random())||0));
  return labels[Math.floor(value*labels.length)];
}

export function estimatorChallengesForPool(challenges=[],pool=[]){
  const allowed=new Set(pool.map(term=>term.id));
  return challenges.filter(challenge=>challenge&&allowed.has(challenge.term_id)&&Array.isArray(challenge.options));
}

export function pickEstimatorChallenge(challenges,pool,random=Math.random){
  const eligible=estimatorChallengesForPool(challenges,pool);
  if(!eligible.length)return null;
  const value=Math.max(0,Math.min(.999999,Number(random())||0));
  return eligible[Math.floor(value*eligible.length)];
}

export function focusRecencyMultiplier(entry,nowMs=Date.now()){
  if(!entry||typeof entry!=='object')return 1;
  const raw=entry.last_requested_at||entry.added_at;
  if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw))return 1;
  const stamp=Date.parse(`${raw}T12:00:00Z`);
  if(!Number.isFinite(stamp))return 1;
  const days=Math.max(0,(Number(nowMs)-stamp)/86400000);
  if(days<=3)return 3;
  if(days<=14)return 2;
  if(days<=30)return 1.5;
  if(days<=90)return 1.15;
  return 1;
}

export function filterByCategory(pool,category){
  if(category==='all')return [...pool];
  return pool.filter(term=>term.category===category);
}

export function selectPracticePool({terms,scope='smart',category='all',focusIds=new Set(),recordFor,dueNow,weaknessScore}){
  let pool;
  switch(scope){
    case 'focus':
      pool=terms.filter(term=>focusIds.has(term.id));
      break;
    case 'due':
      pool=terms.filter(term=>{
        const record=recordFor(term.id);
        return record.status!=='new'&&dueNow(record);
      });
      break;
    case 'weak':
      pool=terms.filter(term=>weaknessScore(recordFor(term.id))>0);
      break;
    case 'new':
      pool=terms.filter(term=>recordFor(term.id).status==='new');
      break;
    case 'all':
    case 'smart':
    default:
      pool=[...terms];
      break;
  }
  return filterByCategory(pool,category);
}

export function preferUnseen(pool,seenIds=[]){
  const seen=seenIds instanceof Set?seenIds:new Set(seenIds);
  const unseen=pool.filter(term=>!seen.has(term.id));
  return unseen.length?unseen:pool;
}

export function buildUniqueOptions(answer,candidates,fallbackCandidates=[],limit=4){
  const out=[];
  for(const value of [answer,...candidates,...fallbackCandidates]){
    if(value===undefined||value===null||value==='')continue;
    if(!out.includes(value))out.push(value);
    if(out.length>=limit)break;
  }
  return out;
}

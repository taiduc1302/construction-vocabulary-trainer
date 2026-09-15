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

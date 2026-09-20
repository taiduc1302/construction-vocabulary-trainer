export const VOCAB_INBOX_KEY='construction-vocab-inbox-v1';
export const VOCAB_INBOX_LIMIT=100;

function cleanTerm(value){
  return String(value||'').trim().replace(/\s+/g,' ').replace(/[“”]/g,'"');
}

export function normalizeRequestedTerms(value){
  const seen=new Set();
  const out=[];
  String(value||'')
    .split(/[\n,;]+/)
    .map(cleanTerm)
    .filter(Boolean)
    .forEach(term=>{
      const key=term.toLocaleLowerCase();
      if(seen.has(key))return;
      seen.add(key);
      out.push(term);
    });
  return out;
}

function validIso(value){
  if(typeof value!=='string'||!value.trim())return null;
  const time=Date.parse(value);
  return Number.isFinite(time)?new Date(time).toISOString():null;
}

export function normalizeInbox(value){
  const source=Array.isArray(value)?value:[];
  const seen=new Set();
  const out=[];
  for(const raw of source){
    const term=cleanTerm(typeof raw==='string'?raw:raw?.term);
    if(!term)continue;
    const key=term.toLocaleLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    out.push({
      term,
      addedAt:validIso(typeof raw==='object'?raw?.addedAt:null)||new Date(0).toISOString()
    });
    if(out.length>=VOCAB_INBOX_LIMIT)break;
  }
  return out;
}

export function addInboxTerms(items,value,now=()=>new Date().toISOString()){
  const current=normalizeInbox(items);
  const incoming=normalizeRequestedTerms(value);
  if(!incoming.length)return current;

  const map=new Map(current.map(item=>[item.term.toLocaleLowerCase(),item]));
  const stamp=validIso(now())||new Date().toISOString();
  for(const term of incoming){
    const key=term.toLocaleLowerCase();
    if(map.has(key))continue;
    map.set(key,{term,addedAt:stamp});
    if(map.size>=VOCAB_INBOX_LIMIT)break;
  }
  return [...map.values()].slice(0,VOCAB_INBOX_LIMIT);
}

export function removeInboxTerm(items,term){
  const key=cleanTerm(term).toLocaleLowerCase();
  return normalizeInbox(items).filter(item=>item.term.toLocaleLowerCase()!==key);
}

export function inboxTerms(items){
  return normalizeInbox(items).map(item=>item.term);
}

export function loadInbox(storage=globalThis.localStorage){
  if(!storage?.getItem)return [];
  try{
    const raw=storage.getItem(VOCAB_INBOX_KEY);
    return raw?normalizeInbox(JSON.parse(raw)):[];
  }catch{
    return [];
  }
}

export function saveInbox(items,storage=globalThis.localStorage){
  const normalized=normalizeInbox(items);
  if(!storage?.setItem)return normalized;
  try{storage.setItem(VOCAB_INBOX_KEY,JSON.stringify(normalized))}catch{}
  return normalized;
}

export function clearInbox(storage=globalThis.localStorage){
  try{storage?.removeItem?.(VOCAB_INBOX_KEY)}catch{}
  return [];
}

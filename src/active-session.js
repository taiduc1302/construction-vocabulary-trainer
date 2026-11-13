export const ACTIVE_SESSION_KEY='construction-vocab-active-session-v1';
const VERSION=1;
const validId=id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);

export function normalizeActiveSession(raw,knownIds){
  if(!raw||raw.version!==VERSION||raw.active!==true||!Array.isArray(raw.poolIds))return null;
  const allowed=new Set(knownIds||[]);
  const poolIds=[...new Set(raw.poolIds)];
  if(!poolIds.length||!poolIds.every(id=>validId(id)&&allowed.has(id)))return null;
  if(!Number.isInteger(raw.total)||raw.total<1||raw.total>10)return null;
  if(!Number.isInteger(raw.done)||raw.done<0||raw.done>=raw.total)return null;
  if(!Number.isInteger(raw.correct)||raw.correct<0||raw.correct>raw.done)return null;
  if(raw.mode!=='mixed'||typeof raw.scope!=='string'||!raw.scope||typeof raw.category!=='string')return null;
  if(typeof raw.startedAt!=='string'||Number.isNaN(Date.parse(raw.startedAt)))return null;
  const seen=new Set((Array.isArray(raw.seenIds)?raw.seenIds:[]).filter(id=>poolIds.includes(id)));
  return {
    active:true,total:raw.total,done:raw.done,correct:raw.correct,startedAt:raw.startedAt,
    mode:'mixed',scope:raw.scope,category:raw.category,
    seenIds:seen,poolIds
  };
}

export function saveActiveSession(session,storage=globalThis.localStorage){
  if(!session?.active)return false;
  try{
    storage?.setItem(ACTIVE_SESSION_KEY,JSON.stringify({
      version:VERSION,active:true,total:session.total,done:session.done,correct:session.correct,
      startedAt:session.startedAt,mode:session.mode,scope:session.scope,category:session.category,
      poolIds:session.poolIds,seenIds:[...session.seenIds]
    }));
    return Boolean(storage?.setItem);
  }catch{return false}
}

export function loadActiveSession(knownIds,storage=globalThis.localStorage){
  try{
    const raw=storage?.getItem(ACTIVE_SESSION_KEY);
    return raw?normalizeActiveSession(JSON.parse(raw),knownIds):null;
  }catch{return null}
}

export function clearActiveSession(storage=globalThis.localStorage){
  try{storage?.removeItem(ACTIVE_SESSION_KEY);return true}catch{return false}
}

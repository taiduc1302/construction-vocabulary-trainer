export const PROFILE_KEY='construction-vocab-learner-profile-v1';
export const PERSONAL_FOCUS_KEY='construction-vocab-personal-focus-v1';
export const MAINTAINER_KEY='construction-vocab-maintainer-v1';

function clean(value){return typeof value==='string'?value.trim():''}
export function localDate(value=new Date()){
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return localDate(new Date());
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function normalizeProfile(raw={}){
  const role=clean(raw?.role);
  const focus=clean(raw?.focus);
  const supportLanguage=['en','ru','vi'].includes(raw?.supportLanguage)?raw.supportLanguage:'en';
  const activePackId=clean(raw?.activePackId);
  const createdAt=clean(raw?.createdAt)||new Date(0).toISOString();
  const updatedAt=clean(raw?.updatedAt)||createdAt;
  return {version:1,role,focus,supportLanguage,activePackId,createdAt,updatedAt};
}

export function loadProfile(storage=globalThis.localStorage){
  if(!storage?.getItem)return null;
  try{
    const raw=storage.getItem(PROFILE_KEY);
    return raw?normalizeProfile(JSON.parse(raw)):null;
  }catch{return null}
}

export function saveProfile(profile,storage=globalThis.localStorage){
  const now=new Date().toISOString();
  const normalized=normalizeProfile({...profile,createdAt:profile?.createdAt||now,updatedAt:now});
  try{storage?.setItem?.(PROFILE_KEY,JSON.stringify(normalized))}catch{}
  return normalized;
}

function normalizeFocusEntry(raw){
  const id=clean(raw?.id);
  if(!id)return null;
  const added_at=/^\d{4}-\d{2}-\d{2}$/.test(raw?.added_at||'')?raw.added_at:localDate();
  const last_requested_at=/^\d{4}-\d{2}-\d{2}$/.test(raw?.last_requested_at||'')?raw.last_requested_at:added_at;
  const request_count=Math.max(1,Math.floor(Number(raw?.request_count)||1));
  const source=raw?.source==='capture'?'capture':'pack';
  return {id,added_at,last_requested_at,request_count,source};
}

export function normalizePersonalFocus(raw){
  const source=Array.isArray(raw?.terms)?raw.terms:[];
  const byId=new Map();
  for(const item of source){
    const entry=normalizeFocusEntry(item);
    if(!entry)continue;
    const existing=byId.get(entry.id);
    if(!existing||entry.source==='capture')byId.set(entry.id,entry);
  }
  return {version:1,terms:[...byId.values()]};
}

export function loadPersonalFocus(storage=globalThis.localStorage){
  if(!storage?.getItem)return {version:1,terms:[]};
  try{
    const raw=storage.getItem(PERSONAL_FOCUS_KEY);
    return raw?normalizePersonalFocus(JSON.parse(raw)):{version:1,terms:[]};
  }catch{return {version:1,terms:[]}}
}

export function savePersonalFocus(data,storage=globalThis.localStorage){
  const normalized=normalizePersonalFocus(data);
  try{storage?.setItem?.(PERSONAL_FOCUS_KEY,JSON.stringify(normalized))}catch{}
  return normalized;
}

export function applyPackToFocus(current,termIds,{date=localDate()}={}){
  const existing=normalizePersonalFocus(current).terms.filter(item=>item.source!=='pack');
  const byId=new Map(existing.map(item=>[item.id,item]));
  for(const id of [...new Set((termIds||[]).filter(Boolean))]){
    if(byId.has(id))continue;
    byId.set(id,{id,added_at:date,last_requested_at:date,request_count:1,source:'pack'});
  }
  return {version:1,terms:[...byId.values()]};
}

export function addCapturedFocus(current,id,{date=localDate()}={}){
  const data=normalizePersonalFocus(current);
  const row=data.terms.find(item=>item.id===id);
  if(row){
    row.last_requested_at=date;
    row.request_count=(Number(row.request_count)||0)+1;
    row.source='capture';
  }else{
    data.terms.push({id,added_at:date,last_requested_at:date,request_count:1,source:'capture'});
  }
  return normalizePersonalFocus(data);
}

export function maintainerEnabled(storage=globalThis.localStorage){
  try{return storage?.getItem?.(MAINTAINER_KEY)==='on'}catch{return false}
}
export function setMaintainerEnabled(enabled,storage=globalThis.localStorage){
  try{
    if(enabled)storage?.setItem?.(MAINTAINER_KEY,'on');
    else storage?.removeItem?.(MAINTAINER_KEY);
  }catch{}
  return Boolean(enabled);
}

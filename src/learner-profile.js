export const LEARNER_PROFILE_VERSION=1;
export const LEARNER_PROFILE_KEY='construction-vocab-learner-profile-v1';

const VALID_MODES=new Set(['learner','maintainer']);
const VALID_ROLES=new Set(['estimator','project-coordinator','field','civil-engineer','student','other']);
const VALID_LANGUAGES=new Set(['en','ru','vi','uk','es','other']);

function cleanStrings(values){
  if(!Array.isArray(values))return [];
  const seen=new Set();
  const out=[];
  for(const raw of values){
    const value=String(raw||'').trim();
    if(!value||seen.has(value))continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function dateKey(value=new Date()){
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return dateKey(new Date());
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function defaultProfile(){
  return {
    version:LEARNER_PROFILE_VERSION,
    onboarded:false,
    mode:'learner',
    role:'',
    language:'en',
    interests:[],
    packIds:[],
    packAddedAt:{},
    manualFocus:[],
    activePackId:''
  };
}

export function normalizeLearnerProfile(raw){
  const base=defaultProfile();
  if(!raw||typeof raw!=='object')return base;
  const mode=VALID_MODES.has(raw.mode)?raw.mode:'learner';
  const role=VALID_ROLES.has(raw.role)?raw.role:'';
  const language=VALID_LANGUAGES.has(raw.language)?raw.language:'en';
  const packIds=cleanStrings(raw.packIds);
  const packAddedAt={};
  if(raw.packAddedAt&&typeof raw.packAddedAt==='object'){
    for(const id of packIds){
      const value=raw.packAddedAt[id];
      if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))packAddedAt[id]=value;
    }
  }
  const manualFocus=[];
  const seen=new Set();
  for(const item of Array.isArray(raw.manualFocus)?raw.manualFocus:[]){
    const id=typeof item==='string'?item:String(item?.id||'').trim();
    if(!id||seen.has(id))continue;
    seen.add(id);
    const added=(typeof item==='object'&&/^\d{4}-\d{2}-\d{2}$/.test(item?.added_at||''))?item.added_at:dateKey();
    const requested=(typeof item==='object'&&/^\d{4}-\d{2}-\d{2}$/.test(item?.last_requested_at||''))?item.last_requested_at:added;
    manualFocus.push({id,added_at:added,last_requested_at:requested});
  }
  const activePackId=packIds.includes(raw.activePackId)?raw.activePackId:(packIds[0]||'');
  return {
    version:LEARNER_PROFILE_VERSION,
    onboarded:Boolean(raw.onboarded),
    mode,
    role,
    language,
    interests:cleanStrings(raw.interests),
    packIds,
    packAddedAt,
    manualFocus,
    activePackId
  };
}

export function loadLearnerProfile(storage=globalThis.localStorage){
  try{
    const raw=storage?.getItem?.(LEARNER_PROFILE_KEY);
    return raw?normalizeLearnerProfile(JSON.parse(raw)):defaultProfile();
  }catch{
    return defaultProfile();
  }
}

export function saveLearnerProfile(profile,storage=globalThis.localStorage){
  const normalized=normalizeLearnerProfile(profile);
  try{storage?.setItem?.(LEARNER_PROFILE_KEY,JSON.stringify(normalized))}catch{}
  return normalized;
}

export function completeLearnerOnboarding(profile,{role,language,interests=[],packId=''},{now=new Date(),storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  const next={
    ...current,
    onboarded:true,
    mode:'learner',
    role:VALID_ROLES.has(role)?role:'other',
    language:VALID_LANGUAGES.has(language)?language:'en',
    interests:cleanStrings(interests)
  };
  let normalized=saveLearnerProfile(next,storage);
  if(packId)normalized=activatePack(normalized,packId,{now,storage});
  return normalized;
}

export function setLearnerMode(profile,mode,{storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  return saveLearnerProfile({...current,onboarded:true,mode:VALID_MODES.has(mode)?mode:'learner'},storage);
}

export function activatePack(profile,packId,{now=new Date(),storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  const id=String(packId||'').trim();
  if(!id)return current;
  const packIds=current.packIds.includes(id)?current.packIds:[...current.packIds,id];
  const packAddedAt={...current.packAddedAt,[id]:current.packAddedAt[id]||dateKey(now)};
  return saveLearnerProfile({...current,packIds,packAddedAt,activePackId:id},storage);
}

export function deactivatePack(profile,packId,{storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  const packIds=current.packIds.filter(id=>id!==packId);
  const packAddedAt={...current.packAddedAt};
  delete packAddedAt[packId];
  return saveLearnerProfile({
    ...current,
    packIds,
    packAddedAt,
    activePackId:current.activePackId===packId?(packIds[0]||''):current.activePackId
  },storage);
}

export function setActivePack(profile,packId,{storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  if(!current.packIds.includes(packId))return current;
  return saveLearnerProfile({...current,activePackId:packId},storage);
}

export function toggleManualFocus(profile,id,{now=new Date(),storage=globalThis.localStorage}={}){
  const current=normalizeLearnerProfile(profile);
  const termId=String(id||'').trim();
  if(!termId)return current;
  const existing=current.manualFocus.find(item=>item.id===termId);
  const manualFocus=existing
    ?current.manualFocus.filter(item=>item.id!==termId)
    :[...current.manualFocus,{id:termId,added_at:dateKey(now),last_requested_at:dateKey(now)}];
  return saveLearnerProfile({...current,manualFocus},storage);
}

export function packTermIds(profile,packs=[]){
  const current=normalizeLearnerProfile(profile);
  const selected=new Set(current.packIds);
  const ids=new Set();
  for(const pack of Array.isArray(packs)?packs:[]){
    if(!selected.has(pack?.id))continue;
    for(const id of Array.isArray(pack?.term_ids)?pack.term_ids:[])ids.add(id);
  }
  return ids;
}

export function focusEntriesForProfile(profile,packs=[]){
  const current=normalizeLearnerProfile(profile);
  const entries=new Map(current.manualFocus.map(item=>[item.id,{...item}]));
  const byPack=new Map((Array.isArray(packs)?packs:[]).map(pack=>[pack.id,pack]));
  for(const packId of current.packIds){
    const pack=byPack.get(packId);
    if(!pack)continue;
    const added=current.packAddedAt[packId]||dateKey();
    for(const id of Array.isArray(pack.term_ids)?pack.term_ids:[]){
      if(!entries.has(id))entries.set(id,{id,added_at:added,last_requested_at:added});
    }
  }
  return [...entries.values()];
}

export function recommendPackId({role='',interests=[]}={},packs=[]){
  const interestSet=new Set(cleanStrings(interests));
  let best=null;
  let bestScore=-1;
  for(const pack of Array.isArray(packs)?packs:[]){
    let score=0;
    if(Array.isArray(pack.roles)&&pack.roles.includes(role))score+=2;
    if(Array.isArray(pack.interests))score+=pack.interests.filter(x=>interestSet.has(x)).length*4;
    if(pack.id==='civil-starter')score+=.5;
    if(score>bestScore){best=pack;bestScore=score}
  }
  return best?.id||packs?.[0]?.id||'';
}

export function exportLearnerProfile(profile){
  return normalizeLearnerProfile(profile);
}

export function importLearnerProfile(raw,storage=globalThis.localStorage){
  return saveLearnerProfile(raw,storage);
}

import {STATE_KEY,exportableState,importLearningState} from './learning-state.js';
import {PROFILE_KEY,PERSONAL_FOCUS_KEY,normalizeProfile,normalizePersonalFocus} from './learner-profile.js';
import {ACTIVE_SESSION_KEY} from './active-session.js';

export const BACKUP_TYPE='construction-vocabulary-progress';
export const BACKUP_VERSION=1;
export const PRE_IMPORT_SNAPSHOT_KEY='construction-vocab-pre-import-snapshot-v1';
const STORAGE_KEYS=[STATE_KEY,PROFILE_KEY,PERSONAL_FOCUS_KEY,ACTIVE_SESSION_KEY];
const RECORD_FIELDS=['status','level','correct','wrong','lastReviewed','due','recentResults'];
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function validProgressRecord(value){
  if(!isObject(value)||!RECORD_FIELDS.some(key=>Object.hasOwn(value,key)))return false;
  for(const key of ['correct','wrong','level']){
    if(value[key]!==undefined&&(!Number.isFinite(Number(value[key]))||Number(value[key])<0))return false;
  }
  if(value.status!==undefined&&!['new','learning','review','mastered'].includes(value.status))return false;
  if(value.recentResults!==undefined&&!Array.isArray(value.recentResults))return false;
  return true;
}

export function createProgressBackup(state,profile,focus,now=new Date()){
  return {
    ...exportableState(state),
    backupType:BACKUP_TYPE,
    backupVersion:BACKUP_VERSION,
    learnerProfile:profile??null,
    personalFocus:normalizePersonalFocus(focus),
    exportedAt:now.toISOString()
  };
}

export function parseProgressBackup(raw){
  if(!isObject(raw))throw new Error('The file is not a progress backup object.');
  if(raw.backupType!==undefined&&raw.backupType!==BACKUP_TYPE)throw new Error('This backup belongs to another application.');
  if(raw.backupVersion!==undefined&&raw.backupVersion!==BACKUP_VERSION)throw new Error('Unsupported backup format version.');
  if(raw.learningState!==undefined&&!isObject(raw.learningState))throw new Error('Invalid learningState in backup.');
  let source=raw.learningState??raw;
  if(!isObject(source.progress)){
    const entries=Object.entries(source);
    const isLegacy=entries.length>0&&entries.every(([id,value])=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&validProgressRecord(value));
    if(!isLegacy)throw new Error('No valid learning progress found in this file.');
    source={progress:source};
  }
  if(source.version!==undefined&&![1,2,3].includes(source.version))throw new Error('Unsupported learning-state version.');
  if(source.daily!==undefined&&!isObject(source.daily))throw new Error('Invalid daily history.');
  if(source.sessions!==undefined&&!Array.isArray(source.sessions))throw new Error('Invalid session history.');
  if(source.settings!==undefined&&!isObject(source.settings))throw new Error('Invalid learning settings.');
  const records=Object.entries(source.progress);
  if(!records.length&&source.version===undefined&&raw.backupType===undefined)throw new Error('An unversioned empty backup cannot replace your progress.');
  for(const [id,record] of records){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||!validProgressRecord(record))throw new Error('Invalid progress record: '+id);
  }
  if(raw.learnerProfile!==undefined&&raw.learnerProfile!==null&&!isObject(raw.learnerProfile))throw new Error('Invalid learner profile.');
  if(raw.personalFocus!==undefined&&(!isObject(raw.personalFocus)||!Array.isArray(raw.personalFocus.terms)))throw new Error('Invalid My Words list.');
  return {
    learningState:importLearningState(source),
    learnerProfile:raw.learnerProfile==null?undefined:normalizeProfile(raw.learnerProfile),
    personalFocus:raw.personalFocus===undefined?undefined:normalizePersonalFocus(raw.personalFocus),
    importedTerms:records.length
  };
}

function readValues(storage){
  return Object.fromEntries(STORAGE_KEYS.map(key=>[key,storage.getItem(key)]));
}
function writeValues(storage,values){
  for(const key of STORAGE_KEYS){
    if(values[key]===null||values[key]===undefined)storage.removeItem(key);
    else storage.setItem(key,values[key]);
  }
}

export function hasPreImportSnapshot(storage=globalThis.localStorage){
  try{
    const value=JSON.parse(storage?.getItem(PRE_IMPORT_SNAPSHOT_KEY)||'null');
    return value?.type===BACKUP_TYPE&&isObject(value.values);
  }catch{return false}
}

export function applyProgressBackup(parsed,storage=globalThis.localStorage){
  if(!storage?.getItem||!storage?.setItem||!storage?.removeItem)throw new Error('Local storage is unavailable. Export your progress first.');
  if(!isObject(parsed?.learningState)||!isObject(parsed.learningState.progress))throw new Error('Import has not been validated.');
  const previous=readValues(storage);
  const snapshot={type:BACKUP_TYPE,createdAt:new Date().toISOString(),values:previous};
  storage.setItem(PRE_IMPORT_SNAPSHOT_KEY,JSON.stringify(snapshot));
  const changed=[];
  const put=(key,value)=>{storage.setItem(key,value);changed.push(key)};
  try{
    put(STATE_KEY,JSON.stringify(parsed.learningState));
    if(parsed.learnerProfile!==undefined)put(PROFILE_KEY,JSON.stringify(parsed.learnerProfile));
    if(parsed.personalFocus!==undefined)put(PERSONAL_FOCUS_KEY,JSON.stringify(parsed.personalFocus));
    changed.push(ACTIVE_SESSION_KEY);
    storage.removeItem(ACTIVE_SESSION_KEY);
  }catch(error){
    try{
      for(const key of changed.reverse()){
        if(previous[key]===null)storage.removeItem(key);
        else storage.setItem(key,previous[key]);
      }
    }catch{throw new Error('Import failed and automatic rollback failed. Use Undo last import.')}
    throw new Error('Import was cancelled because saving failed. Previous data was restored.');
  }
  return true;
}

export function undoLastProgressImport(storage=globalThis.localStorage){
  if(!hasPreImportSnapshot(storage))throw new Error('No previous import to undo.');
  const snapshot=JSON.parse(storage.getItem(PRE_IMPORT_SNAPSHOT_KEY));
  const current=readValues(storage);
  try{
    writeValues(storage,snapshot.values);
    storage.removeItem(PRE_IMPORT_SNAPSHOT_KEY);
  }catch(error){
    try{writeValues(storage,current)}catch{throw new Error('Restore failed; your restore point remains available.')}
    throw new Error('Restore failed; existing data was preserved.');
  }
  return true;
}

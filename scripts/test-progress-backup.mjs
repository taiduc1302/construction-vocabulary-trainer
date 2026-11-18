import assert from 'node:assert/strict';
import {STATE_KEY} from '../src/learning-state.js';
import {PROFILE_KEY,PERSONAL_FOCUS_KEY} from '../src/learner-profile.js';
import {ACTIVE_SESSION_KEY} from '../src/active-session.js';
import {
  createProgressBackup,parseProgressBackup,applyProgressBackup,undoLastProgressImport,
  hasPreImportSnapshot,PRE_IMPORT_SNAPSHOT_KEY
} from '../src/progress-backup.js';

class MemoryStorage{
  constructor(){this.map=new Map();this.failKey=null}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){if(key===this.failKey)throw new Error('quota exceeded');this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}
function mustReject(value,fragment){
  assert.throws(()=>parseProgressBackup(value),new RegExp(fragment,'i'));
}
const oldState={version:3,progress:{'duct-bank':{status:'review',level:2,correct:3,wrong:1}},daily:{},sessions:[],settings:{dailyGoal:10}};
const importedState={version:3,progress:{culvert:{status:'learning',level:1,correct:1,wrong:0}},daily:{},sessions:[],settings:{dailyGoal:12}};
const profile={version:1,role:'estimator',focus:'estimating',supportLanguage:'ru',activePackId:'estimator-starter'};
const focus={version:1,terms:[{id:'culvert',source:'capture',added_at:'2026-11-13',last_requested_at:'2026-11-13',request_count:1}]};

const exported=createProgressBackup(importedState,profile,focus,new Date('2026-11-13T12:00:00.000Z'));
assert.equal(exported.backupType,'construction-vocabulary-progress');
assert.equal(exported.exportedAt,'2026-11-13T12:00:00.000Z');
const parsed=parseProgressBackup(exported);
assert.equal(parsed.learningState.progress.culvert.correct,1);
assert.equal(parsed.learnerProfile.supportLanguage,'ru');
assert.deepEqual(parsed.personalFocus.terms.map(x=>x.id),['culvert']);
assert.equal(parsed.importedTerms,1);

mustReject({},'No valid');
mustReject({unrelated:true},'No valid');
mustReject({backupType:'banking-tool',version:3,progress:{}},'another application');
mustReject({backupVersion:99,version:3,progress:{}},'Unsupported backup');
mustReject({version:3,progress:'invalid'},'No valid');
mustReject({version:3,progress:{culvert:{something:'else'}}},'Invalid progress');
mustReject({version:3,progress:{culvert:{correct:-1}}},'Invalid progress');
mustReject({version:3,progress:{culvert:{correct:1}},personalFocus:[]},'Invalid My Words');
mustReject({version:3,progress:{culvert:{correct:1}},learnerProfile:42},'Invalid learner profile');
mustReject({progress:{}},'unversioned empty');
mustReject({version:999,progress:{}},'Unsupported learning-state');
assert.equal(parseProgressBackup({version:3,progress:{}}).importedTerms,0);
assert.equal(parseProgressBackup({progress:{'duct-bank':{status:'review',correct:2}}}).importedTerms,1);
assert.equal(parseProgressBackup({'duct-bank':{status:'review',correct:2}}).importedTerms,1);
assert.equal(parseProgressBackup({version:2,progress:{'duct-bank':{status:'review',correct:2}}}).importedTerms,1);

const storage=new MemoryStorage();
storage.setItem(STATE_KEY,JSON.stringify(oldState));
storage.setItem(PROFILE_KEY,JSON.stringify({role:'student'}));
storage.setItem(PERSONAL_FOCUS_KEY,JSON.stringify({version:1,terms:[]}));
storage.setItem(ACTIVE_SESSION_KEY,'{"active":true}');
assert.equal(hasPreImportSnapshot(storage),false);
applyProgressBackup(parsed,storage);
assert.equal(JSON.parse(storage.getItem(STATE_KEY)).progress.culvert.correct,1);
assert.equal(JSON.parse(storage.getItem(PROFILE_KEY)).role,'estimator');
assert.equal(storage.getItem(ACTIVE_SESSION_KEY),null,'import must discard an unrelated running session');
assert.equal(hasPreImportSnapshot(storage),true);
undoLastProgressImport(storage);
assert.equal(JSON.parse(storage.getItem(STATE_KEY)).progress['duct-bank'].correct,3);
assert.equal(JSON.parse(storage.getItem(PROFILE_KEY)).role,'student');
assert.equal(storage.getItem(ACTIVE_SESSION_KEY),'{"active":true}');
assert.equal(hasPreImportSnapshot(storage),false);
assert.throws(()=>undoLastProgressImport(storage),/No previous import/);

storage.failKey=PERSONAL_FOCUS_KEY;
assert.throws(()=>applyProgressBackup(parsed,storage),/Previous data was restored/);
assert.equal(JSON.parse(storage.getItem(STATE_KEY)).progress['duct-bank'].correct,3,'failed import must restore previous learning state');
storage.failKey=PRE_IMPORT_SNAPSHOT_KEY;
assert.throws(()=>applyProgressBackup(parsed,storage),/quota exceeded/);
assert.equal(JSON.parse(storage.getItem(STATE_KEY)).progress['duct-bank'].correct,3,'snapshot failure must prevent import');
console.log('Progress backup tests OK: verified formats, legacy imports, malformed JSON rejection, restore point and rollback.');

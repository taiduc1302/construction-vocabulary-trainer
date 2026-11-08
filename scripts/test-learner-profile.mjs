import assert from 'node:assert/strict';
import {
  PROFILE_KEY,PERSONAL_FOCUS_KEY,MAINTAINER_KEY,normalizeProfile,normalizePersonalFocus,
  applyPackToFocus,addCapturedFocus,loadProfile,saveProfile,loadPersonalFocus,savePersonalFocus,
  maintainerEnabled,setMaintainerEnabled
} from '../src/learner-profile.js';

const memory=new Map();
const storage={
  getItem:key=>memory.has(key)?memory.get(key):null,
  setItem:(key,value)=>memory.set(key,value),
  removeItem:key=>memory.delete(key)
};

const p=saveProfile({role:'estimator',focus:'estimating',supportLanguage:'ru',activePackId:'estimator-starter'},storage);
assert.equal(loadProfile(storage).role,'estimator');
assert.equal(loadProfile(storage).supportLanguage,'ru');
assert.ok(memory.has(PROFILE_KEY));

let focus=applyPackToFocus({version:1,terms:[]},['a','b'],{date:'2026-11-08'});
assert.deepEqual(focus.terms.map(x=>x.id),['a','b']);
focus=addCapturedFocus(focus,'b',{date:'2026-11-08'});
assert.equal(focus.terms.find(x=>x.id==='b').source,'capture');
focus=applyPackToFocus(focus,['c','d'],{date:'2026-11-09'});
assert.deepEqual(focus.terms.map(x=>x.id).sort(),['b','c','d'],'switching packs should keep captured terms and replace prior pack terms');
savePersonalFocus(focus,storage);
assert.deepEqual(loadPersonalFocus(storage).terms.map(x=>x.id).sort(),['b','c','d']);
assert.ok(memory.has(PERSONAL_FOCUS_KEY));

assert.equal(maintainerEnabled(storage),false);
setMaintainerEnabled(true,storage);assert.equal(maintainerEnabled(storage),true);assert.equal(memory.get(MAINTAINER_KEY),'on');
setMaintainerEnabled(false,storage);assert.equal(maintainerEnabled(storage),false);

assert.equal(normalizeProfile({supportLanguage:'xx'}).supportLanguage,'en');
assert.deepEqual(normalizePersonalFocus({terms:[{id:'a'},{id:'a',source:'capture'}]}).terms.map(x=>x.id),['a']);

console.log('Learner profile tests OK: profile persistence, personal Focus, pack switching, captured-term retention and maintainer mode.');

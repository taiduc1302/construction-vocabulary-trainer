import assert from 'node:assert/strict';
import {
  LEARNER_PROFILE_KEY,normalizeLearnerProfile,loadLearnerProfile,saveLearnerProfile,
  completeLearnerOnboarding,setLearnerMode,activatePack,deactivatePack,setActivePack,
  toggleManualFocus,packTermIds,focusEntriesForProfile,recommendPackId
} from '../src/learner-profile.js';

const memory=new Map();
const storage={
  getItem:key=>memory.has(key)?memory.get(key):null,
  setItem:(key,value)=>memory.set(key,value),
  removeItem:key=>memory.delete(key)
};

const blank=loadLearnerProfile(storage);
assert.equal(blank.onboarded,false);
assert.equal(blank.mode,'learner');

const packs=[
  {id:'civil-starter',roles:['estimator','student'],interests:['general-civil'],term_ids:['excavation','backfill']},
  {id:'estimating',roles:['estimator'],interests:['estimating'],term_ids:['quantity-takeoff','backfill']}
];

assert.equal(recommendPackId({role:'estimator',interests:['estimating']},packs),'estimating');

let profile=completeLearnerOnboarding(blank,{
  role:'estimator',language:'ru',interests:['estimating'],packId:'estimating'
},{now:new Date('2026-11-08T12:00:00Z'),storage});
assert.equal(profile.onboarded,true);
assert.equal(profile.mode,'learner');
assert.deepEqual(profile.packIds,['estimating']);
assert.equal(profile.activePackId,'estimating');
assert.ok(memory.has(LEARNER_PROFILE_KEY));

profile=activatePack(profile,'civil-starter',{now:new Date('2026-11-09T12:00:00Z'),storage});
assert.deepEqual(profile.packIds,['estimating','civil-starter']);
assert.equal(profile.activePackId,'civil-starter');

profile=setActivePack(profile,'estimating',{storage});
assert.equal(profile.activePackId,'estimating');

const packIds=packTermIds(profile,packs);
assert.deepEqual([...packIds].sort(),['backfill','excavation','quantity-takeoff']);

profile=toggleManualFocus(profile,'duct-bank',{now:new Date('2026-11-10T12:00:00Z'),storage});
let focus=focusEntriesForProfile(profile,packs);
assert.deepEqual(new Set(focus.map(item=>item.id)),new Set(['backfill','excavation','quantity-takeoff','duct-bank']));
assert.equal(focus.filter(item=>item.id==='backfill').length,1,'overlapping packs must not duplicate focus terms');

profile=toggleManualFocus(profile,'duct-bank',{storage});
assert.equal(focusEntriesForProfile(profile,packs).some(item=>item.id==='duct-bank'),false);

profile=deactivatePack(profile,'estimating',{storage});
assert.deepEqual(profile.packIds,['civil-starter']);
assert.equal(profile.activePackId,'civil-starter');

profile=setLearnerMode(profile,'maintainer',{storage});
assert.equal(profile.mode,'maintainer');
assert.equal(profile.onboarded,true);

const malformed=normalizeLearnerProfile({
  mode:'bad',role:'bad',language:'bad',packIds:['a','a',''],manualFocus:[{id:'x'},{id:'x'}]
});
assert.equal(malformed.mode,'learner');
assert.equal(malformed.role,'');
assert.equal(malformed.language,'en');
assert.deepEqual(malformed.packIds,['a']);
assert.equal(malformed.manualFocus.length,1);

const brokenStorage={getItem:()=>'{bad json',setItem:()=>{throw new Error('blocked')}};
assert.doesNotThrow(()=>loadLearnerProfile(brokenStorage));
assert.doesNotThrow(()=>saveLearnerProfile(profile,brokenStorage));

console.log('Learner-profile tests OK: onboarding, recommendation, pack focus, manual focus, mode switching and storage safety.');

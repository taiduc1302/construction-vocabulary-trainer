import assert from 'node:assert/strict';
import {ACTIVE_SESSION_KEY,normalizeActiveSession,saveActiveSession,loadActiveSession,clearActiveSession} from '../src/active-session.js';

class MemoryStorage{
  constructor(){this.map=new Map();this.fail=false}
  getItem(key){if(this.fail)throw new Error('blocked');return this.map.get(key)??null}
  setItem(key,value){if(this.fail)throw new Error('blocked');this.map.set(key,String(value))}
  removeItem(key){if(this.fail)throw new Error('blocked');this.map.delete(key)}
}
const storage=new MemoryStorage();
const ids=['duct-bank','culvert','trench-box'];
const session={
  active:true,total:10,done:4,correct:3,startedAt:'2026-11-13T12:00:00.000Z',
  mode:'mixed',scope:'pack:civil-starter',category:'all',
  seenIds:new Set(['duct-bank','culvert']),poolIds:ids
};
assert.equal(saveActiveSession(session,storage),true);
const restored=loadActiveSession(ids,storage);
assert.equal(restored.active,true);
assert.equal(restored.done,4);
assert.equal(restored.correct,3);
assert.equal(restored.scope,'pack:civil-starter');
assert.deepEqual([...restored.seenIds],['duct-bank','culvert']);
assert.deepEqual(restored.poolIds,ids);
assert.equal(loadActiveSession(['duct-bank'],storage),null,'vocabulary changes must invalidate an incompatible session');
for(const patch of [
  {done:10},{done:-1},{correct:5},{total:0},{mode:'invalid'},
  {poolIds:['unknown-id']},{startedAt:'invalid'}
]){
  const raw={version:1,...session,seenIds:[...session.seenIds],...patch};
  assert.equal(normalizeActiveSession(raw,ids),null,'invalid session should be rejected');
}
storage.setItem(ACTIVE_SESSION_KEY,'bad json');
assert.equal(loadActiveSession(ids,storage),null,'malformed session must not crash app');
storage.fail=true;
assert.equal(saveActiveSession(session,storage),false,'blocked storage should not crash practice');
assert.equal(loadActiveSession(ids,storage),null);
assert.equal(clearActiveSession(storage),false);
storage.fail=false;
assert.equal(clearActiveSession(storage),true);
assert.equal(loadActiveSession(ids,storage),null);
console.log('Active-session tests OK: session resume, frozen pools, invalid input rejection, storage failures and cleanup.');

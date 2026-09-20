import assert from 'node:assert/strict';
import {
  VOCAB_INBOX_KEY,VOCAB_INBOX_LIMIT,normalizeRequestedTerms,normalizeInbox,
  addInboxTerms,removeInboxTerm,inboxTerms,loadInbox,saveInbox,clearInbox
} from '../src/vocab-inbox.js';

assert.deepEqual(
  normalizeRequestedTerms('Bedding, duct spacer\nBedding; valve box'),
  ['Bedding','duct spacer','valve box']
);

const base=addInboxTerms([], 'Bedding, duct spacer', ()=> '2026-09-20T08:00:00.000Z');
assert.deepEqual(inboxTerms(base),['Bedding','duct spacer']);
assert.equal(base[0].addedAt,'2026-09-20T08:00:00.000Z');

const deduped=addInboxTerms(base,'bedding; valve box',()=> '2026-09-20T09:00:00.000Z');
assert.deepEqual(inboxTerms(deduped),['Bedding','duct spacer','valve box'],'existing terms should keep order and duplicate requests should not multiply rows');
assert.equal(deduped[0].addedAt,'2026-09-20T08:00:00.000Z','duplicate save should preserve original capture time');

assert.deepEqual(inboxTerms(removeInboxTerm(deduped,'DUCT SPACER')),['Bedding','valve box']);
assert.deepEqual(normalizeInbox([{term:' '},{term:'A',addedAt:'bad'},{term:'a'}]).map(x=>x.term),['A']);

const many=Array.from({length:VOCAB_INBOX_LIMIT+10},(_,i)=>'term '+i).join(',');
assert.equal(addInboxTerms([],many).length,VOCAB_INBOX_LIMIT,'inbox should be bounded');

const memory=new Map();
const storage={
  getItem:key=>memory.has(key)?memory.get(key):null,
  setItem:(key,value)=>memory.set(key,value),
  removeItem:key=>memory.delete(key)
};
saveInbox(deduped,storage);
assert.ok(memory.has(VOCAB_INBOX_KEY));
assert.deepEqual(inboxTerms(loadInbox(storage)),['Bedding','duct spacer','valve box']);
clearInbox(storage);
assert.deepEqual(loadInbox(storage),[]);

const broken={getItem:()=>'{not-json',setItem:()=>{throw new Error('quota')},removeItem:()=>{throw new Error('blocked')}};
assert.deepEqual(loadInbox(broken),[]);
assert.doesNotThrow(()=>saveInbox(base,broken));
assert.doesNotThrow(()=>clearInbox(broken));

console.log('Vocabulary inbox tests OK: parsing, deduplication, persistence, removal, bounds and storage failure safety.');

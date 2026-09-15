import assert from 'node:assert/strict';
import {
  LEARNING_STATE_VERSION,normalizeLearningState,loadLearningState,recordFor,recordAnswer,
  dueNow,weaknessScore,adaptiveWeight,weightedPick,dailySummary,calculateStreak,
  setDailyGoal,recordSession,importLearningState,localDateKey
} from '../src/learning-state.js';

class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
  clear(){this.map.clear()}
}

const V3='construction-vocab-state-v3';
const V2='construction-vocab-state-v2';
const LEGACY='construction-vocab-progress-v1';
const intervals=[0,1,3,7,14,30,60];
const now=new Date('2026-09-15T12:00:00.000Z');

globalThis.localStorage=new MemoryStorage();

{
  const state=loadLearningState();
  assert.equal(state.version,LEARNING_STATE_VERSION);
  assert.deepEqual(state.progress,{});
  assert.equal(state.settings.dailyGoal,10);
  assert.ok(localStorage.getItem(V3),'blank state should persist safely');
}

{
  localStorage.clear();
  localStorage.setItem(LEGACY,JSON.stringify({
    'duct-bank':{status:'review',level:3,correct:4,wrong:1,lastReviewed:'2026-09-10T12:00:00.000Z',due:'2026-09-17T12:00:00.000Z'}
  }));
  const state=loadLearningState();
  assert.equal(state.version,3);
  assert.equal(state.progress['duct-bank'].correct,4);
  assert.deepEqual(state.progress['duct-bank'].recentResults,[]);
  assert.ok(localStorage.getItem(V3),'legacy progress should migrate to v3');
}

{
  localStorage.clear();
  localStorage.setItem(V2,JSON.stringify({
    version:2,
    progress:{broken:{status:'???',level:'2',correct:'bad',wrong:-9,due:'not-a-date',recentResults:[1,0,true,false]}},
    daily:{'2026-09-14':{attempts:'8',correct:99}},
    sessions:[{total:'10',correct:20}],
    settings:{dailyGoal:12}
  }));
  const state=loadLearningState();
  const record=state.progress.broken;
  assert.equal(record.status,'review');
  assert.equal(record.correct,0);
  assert.equal(record.wrong,0);
  assert.equal(record.due,null);
  assert.deepEqual(record.recentResults,[true,false,true,false]);
  assert.deepEqual(state.daily['2026-09-14'],{attempts:8,correct:8,goal:12});
  assert.equal(state.sessions[0].correct,state.sessions[0].total);
}

{
  const state=normalizeLearningState({settings:{dailyGoal:10}});
  const r1=recordAnswer(state,'culvert',true,intervals,now);
  assert.equal(r1.level,1);
  assert.equal(r1.status,'learning');
  assert.equal(r1.due,'2026-09-16T12:00:00.000Z');
  assert.equal(dailySummary(state,localDateKey(now)).attempts,1);
  const r2=recordAnswer(state,'culvert',false,intervals,new Date('2026-09-16T12:00:00.000Z'));
  assert.equal(r2.level,0);
  assert.equal(r2.wrong,1);
  assert.equal(r2.due,'2026-09-16T12:00:00.000Z');
  assert.equal(dueNow(r2,new Date('2026-09-16T12:00:00.000Z')),true);
  assert.ok(weaknessScore(r2)>0);
}

{
  const dueWeak={status:'learning',level:1,correct:1,wrong:3,due:'2026-09-01T00:00:00.000Z',recentResults:[false,false,true,false]};
  const masteredFuture={status:'mastered',level:6,correct:30,wrong:0,due:'2026-10-15T00:00:00.000Z',recentResults:[true,true,true]};
  assert.ok(adaptiveWeight(dueWeak,now)>adaptiveWeight(masteredFuture,now),'weak overdue term should have greater weight');
  const items=['a','b','c'];
  assert.equal(weightedPick(items,x=>({a:1,b:2,c:7}[x]),()=>0),'a');
  assert.equal(weightedPick(items,x=>({a:1,b:2,c:7}[x]),()=>0.99),'c');
}

{
  const state=normalizeLearningState({
    settings:{dailyGoal:20},
    daily:{
      '2026-09-13':{attempts:5,correct:4,goal:5},
      '2026-09-14':{attempts:10,correct:8,goal:10},
      '2026-09-15':{attempts:2,correct:2,goal:20}
    }
  });
  assert.equal(calculateStreak(state,now),2,'incomplete current day should preserve completed streak through yesterday');
  setDailyGoal(state,2,now);
  assert.equal(state.daily['2026-09-15'].goal,2,'changing goal should update current day');
  assert.equal(state.daily['2026-09-14'].goal,10,'changing goal must not rewrite historical goals');
  assert.equal(calculateStreak(state,now),3,'current day joins streak once its own goal is actually met');
}

{
  const state=normalizeLearningState({});
  for(let i=0;i<105;i++)recordSession(state,{id:`s${i}`,total:10,correct:i%11,startedAt:now.toISOString(),completedAt:now.toISOString()});
  assert.equal(state.sessions.length,100);
  assert.equal(state.sessions[0].id,'s104');
  assert.ok(state.sessions.every(s=>s.correct<=s.total));
}

{
  const imported=importLearningState({progress:{x:{correct:2,wrong:1,level:2,status:'review'}}});
  assert.equal(imported.version,3);
  assert.equal(recordFor(imported,'x').correct,2);
  assert.equal(recordFor(imported,'missing').status,'new');
}

{
  const previous=globalThis.localStorage;
  delete globalThis.localStorage;
  assert.doesNotThrow(()=>loadLearningState(),'storage failures should not crash the trainer');
  globalThis.localStorage=previous;
}

console.log('Learning-state tests OK: migration, sanitization, scheduling, adaptive weighting, daily goals, streaks and sessions.');

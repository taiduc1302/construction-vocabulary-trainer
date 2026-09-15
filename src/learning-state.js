export const LEARNING_STATE_VERSION=3;
const STATE_KEY='construction-vocab-state-v3';
const PREVIOUS_STATE_KEY='construction-vocab-state-v2';
const LEGACY_PROGRESS_KEY='construction-vocab-progress-v1';
const DEFAULT_DAILY_GOAL=10;
const MAX_SESSIONS=100;
const MAX_RECENT_RESULTS=6;
const VALID_STATUSES=new Set(['new','learning','review','mastered']);

function clampInt(value,min,max,fallback=min){
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  return Math.max(min,Math.min(max,Math.round(n)));
}

function validTimestamp(value){
  return typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:null;
}

function storageGet(key){
  try{return globalThis.localStorage?.getItem(key)??null}catch{return null}
}

function storageSet(key,value){
  try{
    if(!globalThis.localStorage)return false;
    globalThis.localStorage.setItem(key,value);
    return true;
  }catch{return false}
}

function blankState(){
  return {
    version:LEARNING_STATE_VERSION,
    progress:{},
    daily:{},
    sessions:[],
    settings:{dailyGoal:DEFAULT_DAILY_GOAL}
  };
}

function sanitizeGoal(value,fallback=DEFAULT_DAILY_GOAL){
  return clampInt(value,1,100,fallback);
}

function sanitizeRecord(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const level=clampInt(source.level,0,6,0);
  const correct=clampInt(source.correct,0,1000000,0);
  const wrong=clampInt(source.wrong,0,1000000,0);
  const status=VALID_STATUSES.has(source.status)
    ?source.status
    :level>=5?'mastered':level>=2?'review':(correct+wrong)>0?'learning':'new';
  return {
    status,
    level,
    correct,
    wrong,
    lastReviewed:validTimestamp(source.lastReviewed),
    due:validTimestamp(source.due),
    recentResults:Array.isArray(source.recentResults)
      ?source.recentResults.slice(-MAX_RECENT_RESULTS).map(Boolean)
      :[]
  };
}

function sanitizeDaily(raw,fallbackGoal){
  const out={};
  if(!raw||typeof raw!=='object')return out;
  for(const [key,value] of Object.entries(raw)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!value||typeof value!=='object')continue;
    const attempts=clampInt(value.attempts,0,1000000,0);
    const correct=Math.min(attempts,clampInt(value.correct,0,1000000,0));
    out[key]={attempts,correct,goal:sanitizeGoal(value.goal,fallbackGoal)};
  }
  return out;
}

function sanitizeSession(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const total=clampInt(source.total,0,1000,0);
  const correct=Math.min(total,clampInt(source.correct,0,1000,0));
  return {
    id:typeof source.id==='string'&&source.id?source.id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    startedAt:validTimestamp(source.startedAt)||new Date().toISOString(),
    completedAt:validTimestamp(source.completedAt)||new Date().toISOString(),
    total,
    correct,
    mode:typeof source.mode==='string'&&source.mode?source.mode:'mixed',
    scope:typeof source.scope==='string'&&source.scope?source.scope:'smart',
    category:typeof source.category==='string'&&source.category?source.category:'all'
  };
}

export function normalizeLearningState(raw){
  const base=blankState();
  if(!raw||typeof raw!=='object')return base;
  const dailyGoal=sanitizeGoal(raw.settings?.dailyGoal,DEFAULT_DAILY_GOAL);
  const progress={};
  if(raw.progress&&typeof raw.progress==='object'){
    for(const [id,record] of Object.entries(raw.progress)){
      if(typeof id==='string'&&id&&record&&typeof record==='object')progress[id]=sanitizeRecord(record);
    }
  }
  return {
    version:LEARNING_STATE_VERSION,
    progress,
    daily:sanitizeDaily(raw.daily,dailyGoal),
    sessions:Array.isArray(raw.sessions)?raw.sessions.slice(0,MAX_SESSIONS).map(sanitizeSession):[],
    settings:{dailyGoal}
  };
}

export function localDateKey(date=new Date()){
  const d=date instanceof Date?date:new Date(date);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export function loadLearningState(){
  for(const key of [STATE_KEY,PREVIOUS_STATE_KEY]){
    try{
      const stored=storageGet(key);
      if(stored){
        const normalized=normalizeLearningState(JSON.parse(stored));
        saveLearningState(normalized);
        return normalized;
      }
    }catch{}
  }

  const migrated=blankState();
  try{
    const legacy=JSON.parse(storageGet(LEGACY_PROGRESS_KEY)||'{}');
    if(legacy&&typeof legacy==='object')migrated.progress=legacy;
  }catch{}
  const normalized=normalizeLearningState(migrated);
  saveLearningState(normalized);
  return normalized;
}

export function saveLearningState(state){
  return storageSet(STATE_KEY,JSON.stringify(normalizeLearningState(state)));
}

export function recordFor(state,id){
  return sanitizeRecord(state?.progress?.[id]);
}

export function dueNow(record,now=new Date()){
  if(!record?.due)return true;
  const dueMs=Date.parse(record.due);
  if(Number.isNaN(dueMs))return true;
  const nowMs=(now instanceof Date?now:new Date(now)).getTime();
  return dueMs<=nowMs;
}

export function recordAnswer(state,id,correct,intervals,now=new Date()){
  const timestamp=now instanceof Date?now:new Date(now);
  const schedule=Array.isArray(intervals)&&intervals.length?intervals:[0,1,3,7,14,30,60];
  if(!state.progress||typeof state.progress!=='object')state.progress={};
  if(!state.daily||typeof state.daily!=='object')state.daily={};
  if(!state.settings||typeof state.settings!=='object')state.settings={dailyGoal:DEFAULT_DAILY_GOAL};

  const r={...recordFor(state,id)};
  if(correct){
    r.correct+=1;
    r.level=Math.min(r.level+1,schedule.length-1);
    r.status=r.level>=5?'mastered':r.level>=2?'review':'learning';
  }else{
    r.wrong+=1;
    r.level=Math.max(0,r.level-1);
    r.status='learning';
  }
  r.recentResults=[...r.recentResults,Boolean(correct)].slice(-MAX_RECENT_RESULTS);
  r.lastReviewed=timestamp.toISOString();
  const days=correct?Math.max(0,Number(schedule[r.level])||0):0;
  r.due=new Date(timestamp.getTime()+days*86400000).toISOString();
  state.progress[id]=r;

  const today=localDateKey(timestamp);
  const existing=state.daily[today]&&typeof state.daily[today]==='object'?state.daily[today]:{};
  const day={
    attempts:clampInt(existing.attempts,0,1000000,0)+1,
    correct:clampInt(existing.correct,0,1000000,0)+(correct?1:0),
    goal:sanitizeGoal(existing.goal,state.settings.dailyGoal||DEFAULT_DAILY_GOAL)
  };
  day.correct=Math.min(day.correct,day.attempts);
  state.daily[today]=day;
  saveLearningState(state);
  return r;
}

export function weaknessScore(record){
  const r=sanitizeRecord(record);
  const attempts=r.correct+r.wrong;
  if(!attempts)return 0;
  const errorRate=r.wrong/attempts;
  const recentWrong=r.recentResults.filter(v=>!v).length;
  const lastWrong=r.recentResults.length&&!r.recentResults[r.recentResults.length-1]?1:0;
  return r.wrong*2.5+errorRate*6+recentWrong*1.5+lastWrong*2;
}

export function adaptiveWeight(record,now=new Date()){
  const r=sanitizeRecord(record);
  if(r.status==='new')return 3;
  let weight=1+weaknessScore(r);
  if(dueNow(r,now)){
    weight+=6;
    if(r.due){
      const overdueDays=Math.max(0,((now instanceof Date?now:new Date(now))-new Date(r.due))/86400000);
      weight+=Math.min(8,overdueDays*.5);
    }
  }
  if(r.status==='mastered'&&!dueNow(r,now))weight*=.25;
  return Math.max(.2,weight);
}

export function weightedPick(items,weightFn,rng=Math.random){
  if(!items.length)return null;
  const weights=items.map(item=>Math.max(0,Number(weightFn(item))||0));
  const total=weights.reduce((a,b)=>a+b,0);
  if(total<=0)return items[Math.floor(rng()*items.length)];
  let roll=Math.max(0,Math.min(.999999999,Number(rng())||0))*total;
  for(let i=0;i<items.length;i++){
    roll-=weights[i];
    if(roll<=0)return items[i];
  }
  return items[items.length-1];
}

export function dailySummary(state,dateKey=localDateKey()){
  const raw=state?.daily?.[dateKey];
  const fallbackGoal=sanitizeGoal(state?.settings?.dailyGoal,DEFAULT_DAILY_GOAL);
  const day=raw&&typeof raw==='object'
    ?{attempts:clampInt(raw.attempts,0,1000000,0),correct:clampInt(raw.correct,0,1000000,0),goal:sanitizeGoal(raw.goal,fallbackGoal)}
    :{attempts:0,correct:0,goal:fallbackGoal};
  day.correct=Math.min(day.correct,day.attempts);
  return {...day,complete:day.attempts>=day.goal};
}

function shiftedDateKey(baseDate,daysAgo){
  const d=new Date(baseDate instanceof Date?baseDate:new Date(baseDate));
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()-daysAgo);
  return localDateKey(d);
}

export function calculateStreak(state,now=new Date()){
  const todayKey=shiftedDateKey(now,0);
  let offset=dailySummary(state,todayKey).complete?0:1;
  let streak=0;
  while(offset<3660){
    const key=shiftedDateKey(now,offset);
    const raw=state?.daily?.[key];
    if(!raw||!dailySummary(state,key).complete)break;
    streak+=1;
    offset+=1;
  }
  return streak;
}

export function setDailyGoal(state,goal,now=new Date()){
  const parsed=sanitizeGoal(goal,DEFAULT_DAILY_GOAL);
  if(!state.settings||typeof state.settings!=='object')state.settings={};
  if(!state.daily||typeof state.daily!=='object')state.daily={};
  state.settings.dailyGoal=parsed;
  const today=localDateKey(now);
  if(state.daily[today]&&typeof state.daily[today]==='object')state.daily[today].goal=parsed;
  saveLearningState(state);
  return parsed;
}

export function recordSession(state,session){
  if(!Array.isArray(state.sessions))state.sessions=[];
  state.sessions.unshift(sanitizeSession(session));
  state.sessions=state.sessions.slice(0,MAX_SESSIONS);
  saveLearningState(state);
}

export function exportableState(state){
  return normalizeLearningState(state);
}

export function importLearningState(raw){
  if(raw?.version===LEARNING_STATE_VERSION||raw?.version===2||raw?.daily||raw?.sessions)return normalizeLearningState(raw);
  if(raw?.progress)return normalizeLearningState({progress:raw.progress});
  return normalizeLearningState({progress:raw});
}

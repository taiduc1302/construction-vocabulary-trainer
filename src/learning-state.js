const STATE_KEY='construction-vocab-state-v2';
const LEGACY_PROGRESS_KEY='construction-vocab-progress-v1';

function blankState(){
  return {
    version:2,
    progress:{},
    daily:{},
    sessions:[],
    settings:{dailyGoal:10}
  };
}

export function localDateKey(date=new Date()){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function normalizeState(raw){
  const base=blankState();
  if(!raw||typeof raw!=='object')return base;
  return {
    version:2,
    progress:raw.progress&&typeof raw.progress==='object'?raw.progress:{},
    daily:raw.daily&&typeof raw.daily==='object'?raw.daily:{},
    sessions:Array.isArray(raw.sessions)?raw.sessions.slice(0,100):[],
    settings:{
      dailyGoal:Number.isInteger(raw.settings?.dailyGoal)&&raw.settings.dailyGoal>0?raw.settings.dailyGoal:10
    }
  };
}

export function loadLearningState(){
  try{
    const stored=localStorage.getItem(STATE_KEY);
    if(stored)return normalizeState(JSON.parse(stored));
  }catch{}

  const migrated=blankState();
  try{
    const legacy=JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY)||'{}');
    if(legacy&&typeof legacy==='object')migrated.progress=legacy;
  }catch{}
  saveLearningState(migrated);
  return migrated;
}

export function saveLearningState(state){
  localStorage.setItem(STATE_KEY,JSON.stringify(normalizeState(state)));
}

export function recordFor(state,id){
  return state.progress[id]||{
    status:'new',level:0,correct:0,wrong:0,lastReviewed:null,due:null,recentResults:[]
  };
}

export function dueNow(record,now=new Date()){
  return !record.due||new Date(record.due)<=now;
}

export function recordAnswer(state,id,correct,intervals){
  const r={...recordFor(state,id)};
  r.recentResults=Array.isArray(r.recentResults)?[...r.recentResults]:[];
  if(correct){
    r.correct++;
    r.level=Math.min(r.level+1,intervals.length-1);
    r.status=r.level>=5?'mastered':r.level>=2?'review':'learning';
  }else{
    r.wrong++;
    r.level=Math.max(0,r.level-1);
    r.status='learning';
  }
  r.recentResults.push(Boolean(correct));
  r.recentResults=r.recentResults.slice(-6);
  r.lastReviewed=new Date().toISOString();
  const days=correct?intervals[r.level]:0;
  r.due=new Date(Date.now()+days*86400000).toISOString();
  state.progress[id]=r;

  const today=localDateKey();
  const day=state.daily[today]||{attempts:0,correct:0};
  day.attempts++;
  if(correct)day.correct++;
  state.daily[today]=day;
  saveLearningState(state);
  return r;
}

export function weaknessScore(record){
  const attempts=(record.correct||0)+(record.wrong||0);
  if(!attempts)return 0;
  const errorRate=(record.wrong||0)/attempts;
  const recent=Array.isArray(record.recentResults)?record.recentResults:[];
  const recentWrong=recent.filter(v=>!v).length;
  const lastWrong=recent.length&&!recent[recent.length-1]?1:0;
  return (record.wrong||0)*2.5+errorRate*6+recentWrong*1.5+lastWrong*2;
}

export function adaptiveWeight(record,now=new Date()){
  if(record.status==='new')return 3;
  let weight=1+weaknessScore(record);
  if(dueNow(record,now)){
    weight+=6;
    if(record.due){
      const overdueDays=Math.max(0,(now-new Date(record.due))/86400000);
      weight+=Math.min(8,overdueDays*.5);
    }
  }
  if(record.status==='mastered'&&!dueNow(record,now))weight*=.25;
  return Math.max(.2,weight);
}

export function weightedPick(items,weightFn){
  if(!items.length)return null;
  const weights=items.map(item=>Math.max(0,Number(weightFn(item))||0));
  const total=weights.reduce((a,b)=>a+b,0);
  if(total<=0)return items[Math.floor(Math.random()*items.length)];
  let roll=Math.random()*total;
  for(let i=0;i<items.length;i++){
    roll-=weights[i];
    if(roll<=0)return items[i];
  }
  return items[items.length-1];
}

export function dailySummary(state,dateKey=localDateKey()){
  const day=state.daily[dateKey]||{attempts:0,correct:0};
  const goal=state.settings.dailyGoal||10;
  return {...day,goal,complete:day.attempts>=goal};
}

function shiftedDateKey(daysAgo){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()-daysAgo);
  return localDateKey(d);
}

export function calculateStreak(state){
  const goal=state.settings.dailyGoal||10;
  let offset=(state.daily[shiftedDateKey(0)]?.attempts||0)>=goal?0:1;
  let streak=0;
  while(offset<3660){
    const attempts=state.daily[shiftedDateKey(offset)]?.attempts||0;
    if(attempts<goal)break;
    streak++;
    offset++;
  }
  return streak;
}

export function setDailyGoal(state,goal){
  const parsed=Math.max(1,Math.min(100,Number(goal)||10));
  state.settings.dailyGoal=Math.round(parsed);
  saveLearningState(state);
}

export function recordSession(state,session){
  state.sessions.unshift({
    id:session.id||`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    startedAt:session.startedAt||new Date().toISOString(),
    completedAt:session.completedAt||new Date().toISOString(),
    total:session.total||0,
    correct:session.correct||0,
    mode:session.mode||'mixed',
    scope:session.scope||'smart',
    category:session.category||'all'
  });
  state.sessions=state.sessions.slice(0,100);
  saveLearningState(state);
}

export function exportableState(state){
  return normalizeState(state);
}

export function importLearningState(raw){
  if(raw?.version===2||raw?.daily||raw?.sessions)return normalizeState(raw);
  if(raw?.progress)return normalizeState({progress:raw.progress});
  return normalizeState({progress:raw});
}

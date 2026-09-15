import {renderTermVisual} from './visuals-all.js';
import {getDrawingScenes,randomDrawingTarget,renderDrawingScene} from './drawing-challenges.js';
import {recallMatches,selectPracticePool,preferUnseen,buildUniqueOptions} from './practice-engine.js';
import {
  loadLearningState,saveLearningState,recordFor,dueNow,recordAnswer,weaknessScore,
  adaptiveWeight,weightedPick,dailySummary,calculateStreak,setDailyGoal,recordSession,
  exportableState,importLearningState,localDateKey
} from './learning-state.js';

const els={
  stats:document.querySelector('#stats'),
  dailyGoal:document.querySelector('#dailyGoalCard'),
  grid:document.querySelector('#dictionaryGrid'),
  search:document.querySelector('#searchInput'),
  category:document.querySelector('#categoryFilter'),
  practiceScope:document.querySelector('#practiceScope'),
  practiceCategory:document.querySelector('#practiceCategory'),
  practiceMode:document.querySelector('#practiceMode'),
  quiz:document.querySelector('#quizCard'),
  reviewList:document.querySelector('#reviewList'),
  weakList:document.querySelector('#weakList'),
  sessionStatus:document.querySelector('#sessionStatus'),
  drawingScene:document.querySelector('#drawingSceneSelect'),
  drawingChallenge:document.querySelector('#drawingChallenge'),
  progressOverview:document.querySelector('#progressOverview'),
  hardestWords:document.querySelector('#hardestWords'),
  sessionHistory:document.querySelector('#sessionHistory')
};

const intervals=[0,1,3,7,14,30,60];
const confusablePairs=[
  ['culvert','storm-sewer'],['catch-basin','manhole'],['trench-box','shoring'],
  ['subgrade','subbase'],['allowance','contingency'],['milling','overlay'],
  ['bedding','backfill'],['duct-bank','conduit'],['unit-price','lump-sum'],
  ['plan-view','profile'],['rfi','rfq'],['cut','fill'],
  ['sanitary-sewer','storm-sewer'],['force-main','sanitary-sewer'],
  ['base-course','subbase'],['daylighting','excavation']
];

const drawingScenes=getDrawingScenes();
let terms=[];
let categories=[];
let fillExamples={};
let focusEntries=[];
let focusIds=new Set();
let learningState=loadLearningState();
let currentQuestion=null;
let currentDrawingTarget=null;
let session={active:false,total:0,done:0,correct:0,startedAt:null,mode:null,scope:null,category:null,seenIds:new Set(),poolIds:[]};

function progressRecord(id){return recordFor(learningState,id)}
function termById(id){return terms.find(t=>t.id===id)}
function categoryLabel(id){return categories.find(c=>c.id===id)?.label||id}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function viewActive(name){return document.querySelector(`#${name}View`)?.classList.contains('active')}

function speak(text){
  if(!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-CA';u.rate=.82;
  speechSynthesis.speak(u);
}

function updateProgress(id,correct){
  recordAnswer(learningState,id,correct,intervals);
  renderStats();
  renderDailyGoal();
  renderReviewLists();
  renderProgressView();
  if(viewActive('dictionary'))renderDictionary();
}

function renderStats(){
  const records=terms.map(t=>progressRecord(t.id));
  const mastered=records.filter(r=>r.status==='mastered').length;
  const learning=records.filter(r=>r.status==='learning'||r.status==='review').length;
  const due=records.filter(r=>r.status!=='new'&&dueNow(r)).length;
  const attempts=records.reduce((s,r)=>s+(r.correct||0)+(r.wrong||0),0);
  const correct=records.reduce((s,r)=>s+(r.correct||0),0);
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  els.stats.innerHTML=[
    ['Terms',terms.length],['Learning',learning],['Mastered',mastered],['Due now',due],['Accuracy',`${accuracy}%`]
  ].map(([a,b])=>`<div class="stat"><span>${a}</span><strong>${b}</strong></div>`).join('');
}

function renderDailyGoal(){
  const today=dailySummary(learningState);
  const streak=calculateStreak(learningState);
  const pct=Math.min(100,Math.round(today.attempts/today.goal*100));
  const options=[5,10,15,20,30].includes(today.goal)?[5,10,15,20,30]:[today.goal,5,10,15,20,30];
  els.dailyGoal.innerHTML=`
    <div class="goal-copy">
      <div><span class="goal-kicker">Today</span><strong>${today.attempts}/${today.goal} reviews</strong></div>
      <div class="goal-streak">🔥 ${streak} day${streak===1?'':'s'} streak</div>
    </div>
    <div class="goal-progress" aria-label="${pct}% of daily goal"><span style="width:${pct}%"></span></div>
    <div class="goal-controls">
      <span>${today.complete?'Daily goal complete':'Keep going — every answered question counts'}</span>
      <label>Goal <select id="dailyGoalSelect">${[...new Set(options)].sort((a,b)=>a-b).map(v=>`<option value="${v}" ${v===today.goal?'selected':''}>${v}/day</option>`).join('')}</select></label>
    </div>`;
  document.querySelector('#dailyGoalSelect')?.addEventListener('change',e=>{
    setDailyGoal(learningState,Number(e.target.value));
    renderDailyGoal();renderProgressView();
  });
}

function renderDictionary(){
  if(!terms.length)return;
  const q=els.search.value.trim().toLowerCase();
  const cat=els.category.value;
  const filtered=terms.filter(t=>(cat==='all'||t.category===cat)&&(!q||JSON.stringify(t).toLowerCase().includes(q)));
  els.grid.innerHTML='';
  const tpl=document.querySelector('#termCardTemplate');
  filtered.forEach(t=>{
    const node=tpl.content.cloneNode(true);
    node.querySelector('.category-pill').textContent=categoryLabel(t.category);
    node.querySelector('.term-title').textContent=t.term;
    node.querySelector('.pronunciation').textContent=t.pronunciation||'';
    const status=progressRecord(t.id).status;
    node.querySelector('.status-badge').textContent=focusIds.has(t.id)?`${status} · focus`:status;
    node.querySelector('.visual-box').innerHTML=renderTermVisual(t);
    node.querySelector('.definition').textContent=t.definition_en;
    node.querySelector('.ru-text').textContent=t.translation_ru.join(', ');
    node.querySelector('.vi-text').textContent=t.translation_vi.join(', ');
    node.querySelector('.ru-explanation').textContent=t.explanation_ru;
    node.querySelector('.related-text').textContent=`Related: ${t.related_terms?.length?t.related_terms.join(', '):'—'}`;
    node.querySelector('.mistakes-text').textContent=t.common_mistakes?.length?`Watch out: ${t.common_mistakes.join(' ')}`:'No common mistake note yet.';
    node.querySelector('.example-text').textContent=t.example_en;
    node.querySelector('.listen-btn').addEventListener('click',()=>speak(t.term));
    els.grid.appendChild(node);
  });
  if(!filtered.length)els.grid.innerHTML='<div class="empty">No terms match this filter.</div>';
}

function shuffle(a){
  const out=[...a];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function unique(values){return [...new Set(values.filter(Boolean))]}
function chooseDistractors(correct,field,pool=terms){return unique(shuffle(pool.filter(t=>t.id!==correct.id)).map(t=>field(t))).slice(0,3)}
function blankExample(t){
  const source=fillExamples[t.id]||t.example_en;
  const re=new RegExp(t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  const blanked=source.replace(re,'_____');
  return blanked===source?`The relevant construction term is _____: ${t.definition_en}`:blanked;
}

function dueTerms(){return terms.filter(t=>{const r=progressRecord(t.id);return r.status!=='new'&&dueNow(r)})}
function weakTerms(){return terms.filter(t=>weaknessScore(progressRecord(t.id))>0).sort((a,b)=>weaknessScore(progressRecord(b.id))-weaknessScore(progressRecord(a.id)))}

function selectedPool(){
  if(session.active&&session.poolIds.length){
    return session.poolIds.map(termById).filter(Boolean);
  }
  return selectPracticePool({
    terms,
    scope:els.practiceScope.value,
    category:els.practiceCategory.value,
    focusIds,
    recordFor:progressRecord,
    dueNow,
    weaknessScore
  });
}

function pickPracticeTerm(pool){
  if(!pool.length)return null;
  const candidates=session.active?preferUnseen(pool,session.seenIds):pool;
  const scope=session.active?session.scope:els.practiceScope.value;
  if(scope==='smart'||scope==='focus')return weightedPick(candidates,t=>adaptiveWeight(progressRecord(t.id)));
  return candidates[Math.floor(Math.random()*candidates.length)];
}

function markSessionTerm(term){if(session.active&&term)session.seenIds.add(term.id)}

function makeContrastQuestion(pool){
  const allowed=new Set(pool.map(t=>t.id));
  const available=confusablePairs
    .map(([a,b])=>[termById(a),termById(b)])
    .filter(([a,b])=>a&&b&&(allowed.has(a.id)||allowed.has(b.id)));
  if(!available.length)return null;
  const pair=available[Math.floor(Math.random()*available.length)];
  const [first,second]=pair;
  let candidates=[first,second].filter(t=>allowed.has(t.id));
  if(session.active)candidates=preferUnseen(candidates,session.seenIds);
  const target=weightedPick(candidates,t=>adaptiveWeight(progressRecord(t.id)));
  const other=target.id===first.id?second:first;
  const sameCategory=shuffle(terms.filter(t=>t.category===target.category&&t.id!==target.id&&t.id!==other.id)).map(t=>t.term);
  const fallback=shuffle(terms.filter(t=>t.id!==target.id&&t.id!==other.id)).map(t=>t.term);
  return {
    term:target,compareWith:other,answer:target.term,
    prompt:`Which term best fits this situation? ${target.scenario}`,
    options:shuffle(buildUniqueOptions(target.term,[other.term,...sameCategory],fallback,4)),extra:''
  };
}

function renderChoiceQuestion({t,prompt,answer,mode,options,extra='',compareWith=null}){
  currentQuestion={term:t,answer,mode,compareWith};
  markSessionTerm(t);
  els.quiz.dataset.answered='no';
  const canSpeakBeforeAnswer=mode==='en-ru';
  const speakButton=canSpeakBeforeAnswer?'<button class="speak-question secondary" type="button">🔊 Listen</button>':'';
  els.quiz.innerHTML=`${extra}<div class="quiz-meta"><span>${escapeHtml(categoryLabel(t.category))}</span>${speakButton}</div><div class="quiz-question">${escapeHtml(prompt)}</div><div class="quiz-options">${options.map(o=>`<button class="quiz-option" data-answer="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}</div><div id="feedback"></div>`;
  if(canSpeakBeforeAnswer)els.quiz.querySelector('.speak-question').addEventListener('click',()=>speak(t.term));
  els.quiz.querySelectorAll('.quiz-option').forEach(b=>b.addEventListener('click',()=>answerQuestion(b)));
}

function renderTypedQuestion(t){
  currentQuestion={term:t,answer:t.term,mode:'typed',compareWith:null};
  markSessionTerm(t);
  els.quiz.dataset.answered='no';
  const prompt=`Type the English construction term for “${t.translation_ru[0]}”.`;
  els.quiz.innerHTML=`<div class="quiz-meta"><span>${escapeHtml(categoryLabel(t.category))}</span><span class="recall-badge">Active recall</span></div><div class="quiz-question">${escapeHtml(prompt)}</div><div class="typed-answer-row"><input id="typedAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the English term" /><button id="checkTypedAnswer" type="button">Check answer</button></div><div class="small-muted typed-hint">Hyphens, spaces and capitalization are normalized.</div><div id="feedback"></div>`;
  const input=document.querySelector('#typedAnswer');
  document.querySelector('#checkTypedAnswer').addEventListener('click',submitTypedAnswer);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')submitTypedAnswer()});
  input.focus();
}

function renderEmptyPractice(message){
  currentQuestion=null;
  els.quiz.dataset.answered='yes';
  els.quiz.innerHTML=`<div class="empty">${escapeHtml(message)}</div>`;
  renderSessionStatus();
}

function scopeEmptyMessage(){
  const scope=els.practiceScope.value;
  const cat=els.practiceCategory.value;
  const suffix=cat==='all'?'':` in ${categoryLabel(cat)}`;
  if(scope==='focus')return `No focus words${suffix}. Add a word from chat or change the category.`;
  if(scope==='due')return `No words are due${suffix}.`;
  if(scope==='weak')return `No weak words${suffix} yet.`;
  if(scope==='new')return `No new words${suffix}.`;
  return `No words match this practice selection${suffix}.`;
}

function makeQuestion(){
  if(!terms.length)return;
  const pool=selectedPool();
  if(!pool.length){renderEmptyPractice(scopeEmptyMessage());return}

  let mode=els.practiceMode.value;
  const mixed=mode==='mixed';
  if(mixed)mode=shuffle(['typed','en-ru','ru-en','vi-en','definition','scenario','visual','fill','contrast'])[0];

  if(mode==='typed'){
    const t=pickPracticeTerm(pool);
    renderTypedQuestion(t);renderSessionStatus();return;
  }

  let t,prompt,answer,field,extra='',options=[],compareWith=null;
  if(mode==='contrast'){
    const q=makeContrastQuestion(pool);
    if(!q){
      if(mixed)mode='scenario';
      else{renderEmptyPractice('No Similar terms pair exists for this practice selection. Choose another mode or broader scope.');return}
    }else{
      t=q.term;prompt=q.prompt;answer=q.answer;options=q.options;extra=q.extra;compareWith=q.compareWith;
    }
  }

  if(mode!=='contrast'){
    t=pickPracticeTerm(pool);
    if(mode==='en-ru'){prompt=`What does “${t.term}” mean in Russian?`;answer=t.translation_ru[0];field=x=>x.translation_ru[0]}
    else if(mode==='ru-en'){prompt=`What is the English term for “${t.translation_ru[0]}”?`;answer=t.term;field=x=>x.term}
    else if(mode==='vi-en'){prompt=`What is the English construction term for “${t.translation_vi[0]}”?`;answer=t.term;field=x=>x.term}
    else if(mode==='definition'){prompt=t.definition_en;answer=t.term;field=x=>x.term}
    else if(mode==='scenario'){prompt=t.scenario;answer=t.term;field=x=>x.term}
    else if(mode==='visual'){prompt='Identify the construction term shown by this diagram.';answer=t.term;field=x=>x.term;extra=renderTermVisual(t,{quiz:true})}
    else{prompt=`Complete the sentence: ${blankExample(t)}`;answer=t.term;field=x=>x.term}
    const candidates=chooseDistractors(t,field);
    const fallback=shuffle(terms.filter(x=>x.id!==t.id)).map(field);
    options=shuffle(buildUniqueOptions(answer,candidates,fallback,4));
  }

  renderChoiceQuestion({t,prompt,answer,mode,options,extra,compareWith});
  renderSessionStatus();
}

function feedbackMarkup(correct,userAnswer=''){
  const contrast=currentQuestion.compareWith?`<div class="contrast-note"><strong>Compare with ${escapeHtml(currentQuestion.compareWith.term)}:</strong> ${escapeHtml(currentQuestion.compareWith.definition_en)}</div>`:'';
  const caution=currentQuestion.term.common_mistakes?.length?`<div class="contrast-note"><strong>Watch out:</strong> ${escapeHtml(currentQuestion.term.common_mistakes.join(' '))}</div>`:'';
  const aliases=currentQuestion.term.aliases_en?.length?`<div class="small-muted">Also accepted: ${escapeHtml(currentQuestion.term.aliases_en.join(', '))}</div>`:'';
  const yourAnswer=userAnswer&&!correct?`<div class="small-muted">Your answer: ${escapeHtml(userAnswer)}</div>`:'';
  return `<div class="feedback"><strong>${correct?'Correct':'Not quite'}.</strong> <strong>${escapeHtml(currentQuestion.term.term)}</strong> — ${escapeHtml(currentQuestion.term.definition_en)}${yourAnswer}${aliases}<br><span class="small-muted">RU: ${escapeHtml(currentQuestion.term.explanation_ru)}</span><br><span class="small-muted">VI: ${escapeHtml(currentQuestion.term.translation_vi.join(', '))}</span>${contrast}${caution}<button class="feedback-speak secondary" type="button">🔊 Listen to ${escapeHtml(currentQuestion.term.term)}</button></div>`;
}

function setSessionControlsLocked(locked){
  els.practiceScope.disabled=locked;
  els.practiceCategory.disabled=locked;
  els.practiceMode.disabled=locked;
  const quick=document.querySelector('#quickSession');
  quick.disabled=locked;
  quick.textContent=locked?'Quick 10 running':'Quick 10';
  document.querySelector('#newQuestion').textContent=locked?'Next question':'New question';
}

function finishSessionIfNeeded(){
  if(!session.active||session.done<session.total)return false;
  const finished={...session,completedAt:new Date().toISOString()};
  recordSession(learningState,finished);
  const pct=Math.round(session.correct/session.total*100);
  session.active=false;
  setSessionControlsLocked(false);
  els.sessionStatus.innerHTML=`Session complete: <strong>${session.correct}/${session.total}</strong> correct (${pct}%). Saved to Progress.`;
  renderProgressView();
  return true;
}

function completeAnswer(correct,{button=null,userAnswer=''}={}){
  if(!currentQuestion||els.quiz.dataset.answered==='yes')return;
  els.quiz.dataset.answered='yes';
  updateProgress(currentQuestion.term.id,correct);
  if(session.active){session.done++;if(correct)session.correct++}

  els.quiz.querySelectorAll('.quiz-option').forEach(b=>{
    if(b.dataset.answer===currentQuestion.answer)b.classList.add('correct');
    else if(b===button)b.classList.add('wrong');
    b.disabled=true;
  });
  const typedInput=document.querySelector('#typedAnswer');
  const typedButton=document.querySelector('#checkTypedAnswer');
  if(typedInput)typedInput.disabled=true;
  if(typedButton)typedButton.disabled=true;

  document.querySelector('#feedback').innerHTML=feedbackMarkup(correct,userAnswer);
  document.querySelector('.feedback-speak')?.addEventListener('click',()=>speak(currentQuestion.term.term));
  renderSessionStatus();
  const finished=finishSessionIfNeeded();
  if(!finished&&session.active){
    document.querySelector('#feedback').insertAdjacentHTML('beforeend','<button class="feedback-next" type="button">Next question</button>');
    document.querySelector('.feedback-next')?.addEventListener('click',nextQuestion);
  }
}

function answerQuestion(button){completeAnswer(button.dataset.answer===currentQuestion.answer,{button})}
function submitTypedAnswer(){
  if(!currentQuestion||els.quiz.dataset.answered==='yes')return;
  const input=document.querySelector('#typedAnswer');
  const raw=input?.value.trim()||'';
  if(!raw){input?.focus();return}
  completeAnswer(recallMatches(raw,currentQuestion.answer,currentQuestion.term.aliases_en||[]),{userAnswer:raw});
}

function nextQuestion(){makeQuestion()}
function startQuickSession(){
  const initialPool=selectedPool();
  if(!initialPool.length){
    renderEmptyPractice(scopeEmptyMessage());
    return;
  }
  session={
    active:true,total:10,done:0,correct:0,startedAt:new Date().toISOString(),
    mode:'mixed',scope:els.practiceScope.value,category:els.practiceCategory.value,
    seenIds:new Set(),poolIds:initialPool.map(term=>term.id)
  };
  els.practiceMode.value='mixed';
  setSessionControlsLocked(true);
  makeQuestion();
}
function renderSessionStatus(){
  if(!session.active){
    if(!els.sessionStatus.textContent)els.sessionStatus.textContent=`Smart review adapts to your mistakes. My focus list currently contains ${focusIds.size} word${focusIds.size===1?'':'s'} explicitly added from chat.`;
    return;
  }
  els.sessionStatus.innerHTML=`Quick 10: <strong>${session.done}/${session.total}</strong> answered · score ${session.correct}/${session.done}`;
}

function renderReviewLists(){
  if(!terms.length)return;
  const due=dueTerms().sort((a,b)=>new Date(progressRecord(a.id).due)-new Date(progressRecord(b.id).due));
  els.reviewList.innerHTML=due.length?due.map(t=>row(t,'Due now')).join(''):'<div class="empty">Nothing is due yet. Practice some words first.</div>';
  const weak=weakTerms();
  els.weakList.innerHTML=weak.length?weak.map(t=>row(t,`Weakness ${weaknessScore(progressRecord(t.id)).toFixed(1)}`)).join(''):'<div class="empty">No weak words yet.</div>';
}
function row(t,right){
  const r=progressRecord(t.id);
  const focus=focusIds.has(t.id)?' · focus':'';
  return `<div class="list-row"><div><strong>${escapeHtml(t.term)}</strong><div class="small-muted">${escapeHtml(t.definition_en)}</div><div class="tiny-muted">${escapeHtml(categoryLabel(t.category))}${focus} · ${r.correct||0} correct / ${r.wrong||0} wrong</div></div><span>${escapeHtml(right)}</span></div>`;
}

function lastDays(count=7){
  const out=[];
  for(let i=count-1;i>=0;i--){
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);
    const key=localDateKey(d);const day=dailySummary(learningState,key);
    out.push({key,label:d.toLocaleDateString(undefined,{weekday:'short'}),attempts:day.attempts,correct:day.correct,goal:day.goal});
  }
  return out;
}

function renderProgressView(){
  if(!terms.length)return;
  const days=lastDays(7);
  const sevenAttempts=days.reduce((s,d)=>s+d.attempts,0);
  const sevenCorrect=days.reduce((s,d)=>s+d.correct,0);
  const sevenAccuracy=sevenAttempts?Math.round(sevenCorrect/sevenAttempts*100):0;
  const allAttempts=Object.values(learningState.daily).reduce((s,d)=>s+(Number(d.attempts)||0),0);
  const streak=calculateStreak(learningState);
  const maxAttempts=Math.max(1,...days.map(d=>d.attempts));
  els.progressOverview.innerHTML=`
    <div class="progress-metrics">
      <div class="stat"><span>Total reviews</span><strong>${allAttempts}</strong></div>
      <div class="stat"><span>7-day accuracy</span><strong>${sevenAccuracy}%</strong></div>
      <div class="stat"><span>Current streak</span><strong>${streak}</strong></div>
      <div class="stat"><span>Focus words</span><strong>${focusIds.size}</strong></div>
      <div class="stat"><span>Saved sessions</span><strong>${learningState.sessions.length}</strong></div>
    </div>
    <div class="week-chart" aria-label="Reviews during the last seven days">
      ${days.map(d=>`<div class="day-bar"><span class="bar-count">${d.attempts}</span><div class="bar-track"><span style="height:${Math.max(4,Math.round(d.attempts/maxAttempts*100))}%"></span></div><small>${escapeHtml(d.label)}</small></div>`).join('')}
    </div>`;

  const hardest=weakTerms().slice(0,8);
  els.hardestWords.innerHTML=hardest.length?hardest.map(t=>row(t,weaknessScore(progressRecord(t.id)).toFixed(1))).join(''):'<div class="empty">Answer some questions and your hardest words will appear here.</div>';

  const recent=learningState.sessions.slice(0,10);
  els.sessionHistory.innerHTML=recent.length?recent.map(s=>{
    const pct=s.total?Math.round(s.correct/s.total*100):0;
    const when=new Date(s.completedAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    const cat=s.category==='all'?'All categories':categoryLabel(s.category);
    return `<div class="list-row"><div><strong>Quick ${s.total}</strong><div class="small-muted">${escapeHtml(cat)} · ${escapeHtml(s.scope)}</div><div class="tiny-muted">${escapeHtml(when)}</div></div><span>${s.correct}/${s.total} · ${pct}%</span></div>`;
  }).join(''):'<div class="empty">Completed Quick 10 sessions will be saved here.</div>';
}

function renderDrawingQuestion(){
  if(!terms.length)return;
  const scene=drawingScenes.find(s=>s.id===els.drawingScene.value)||drawingScenes[0];
  const previous=currentDrawingTarget?.termId;
  currentDrawingTarget=randomDrawingTarget(scene,previous);
  const term=termById(currentDrawingTarget.termId);
  if(!term){els.drawingChallenge.innerHTML='<div class="empty">This scene references a missing vocabulary term.</div>';return}
  const labels=scene.targets.map(t=>t.label);
  els.drawingChallenge.dataset.answered='no';
  els.drawingChallenge.innerHTML=`
    ${renderDrawingScene(scene)}
    <div class="drawing-question-card">
      <div class="quiz-meta"><span>${escapeHtml(scene.title)}</span><span class="recall-badge">Drawing reading</span></div>
      <div class="quiz-question">Which callout identifies <strong>${escapeHtml(term.term)}</strong>?</div>
      <div class="drawing-options">${labels.map(label=>`<button class="drawing-option" data-label="${label}">${label}</button>`).join('')}</div>
      <div id="drawingFeedback"></div>
    </div>`;
  els.drawingChallenge.querySelectorAll('.drawing-option').forEach(btn=>btn.addEventListener('click',()=>answerDrawingQuestion(btn,term)));
}

function answerDrawingQuestion(button,term){
  if(els.drawingChallenge.dataset.answered==='yes')return;
  els.drawingChallenge.dataset.answered='yes';
  const correct=button.dataset.label===currentDrawingTarget.label;
  updateProgress(term.id,correct);
  els.drawingChallenge.querySelectorAll('.drawing-option').forEach(btn=>{
    if(btn.dataset.label===currentDrawingTarget.label)btn.classList.add('correct');
    else if(btn===button)btn.classList.add('wrong');
    btn.disabled=true;
  });
  document.querySelector('#drawingFeedback').innerHTML=`<div class="feedback"><strong>${correct?'Correct':'Not quite'}.</strong> Callout <strong>${currentDrawingTarget.label}</strong> is ${escapeHtml(term.term)} — ${escapeHtml(term.definition_en)}<br><span class="small-muted">RU: ${escapeHtml(term.explanation_ru)}</span><br><span class="small-muted">VI: ${escapeHtml(term.translation_vi.join(', '))}</span><button class="drawing-speak secondary" type="button">🔊 Listen</button></div>`;
  document.querySelector('.drawing-speak')?.addEventListener('click',()=>speak(term.term));
}

function switchView(view){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===view));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelector(`#${view}View`).classList.add('active');
  if(view==='practice'&&(!currentQuestion||els.quiz.dataset.answered==='yes'))nextQuestion();
  if(view==='drawing')renderDrawingQuestion();
  if(view==='progress')renderProgressView();
  if(view==='review'||view==='weak')renderReviewLists();
}

function exportProgress(){
  const payload={...exportableState(learningState),exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  const href=URL.createObjectURL(blob);
  a.href=href;a.download='construction-vocabulary-progress-v3.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(href),0);
}
function importProgress(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      learningState=importLearningState(data);saveLearningState(learningState);
      renderStats();renderDailyGoal();renderDictionary();renderReviewLists();renderProgressView();
      alert('Progress imported.');
    }catch{alert('Could not read that progress file.')}
  };
  reader.readAsText(file);
}

async function fetchJson(path){
  const response=await fetch(path);
  if(!response.ok)throw new Error(`Could not load ${path}`);
  return response.json();
}

async function fetchFocusData(){
  try{return await fetchJson('data/focus-terms.json')}
  catch(error){console.warn('Focus list unavailable; continuing without it.',error);return {version:1,terms:[]}}
}

async function init(){
  const [coreTerms,expandedTerms,loadedCategories,loadedFillExamples,focusData]=await Promise.all([
    fetchJson('data/terms.json'),
    fetchJson('data/terms-expansion.json'),
    fetchJson('data/categories.json'),
    fetchJson('data/fill-examples.json'),
    fetchFocusData()
  ]);
  terms=[...coreTerms,...expandedTerms];categories=loadedCategories;
  fillExamples=loadedFillExamples&&typeof loadedFillExamples==='object'&&!Array.isArray(loadedFillExamples)?loadedFillExamples:{};
  const ids=terms.map(t=>t.id);
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate vocabulary IDs detected.');
  const idSet=new Set(ids);
  const rawFocus=Array.isArray(focusData?.terms)?focusData.terms:[];
  const missingFocus=rawFocus.filter(item=>!idSet.has(item.id));
  if(missingFocus.length)console.warn(`Ignoring focus IDs missing from current vocabulary: ${missingFocus.map(item=>item.id).join(', ')}`);
  focusEntries=rawFocus.filter(item=>idSet.has(item.id));
  focusIds=new Set(focusEntries.map(item=>item.id));

  categories.forEach(c=>{
    const option=`<option value="${c.id}">${escapeHtml(c.label)}</option>`;
    els.category.insertAdjacentHTML('beforeend',option);
    els.practiceCategory.insertAdjacentHTML('beforeend',option);
  });
  drawingScenes.forEach(scene=>els.drawingScene.insertAdjacentHTML('beforeend',`<option value="${scene.id}">${escapeHtml(scene.title)}</option>`));

  renderStats();renderDailyGoal();renderDictionary();renderReviewLists();renderProgressView();renderSessionStatus();
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
  els.search.addEventListener('input',renderDictionary);
  els.category.addEventListener('change',renderDictionary);
  document.querySelector('#newQuestion').addEventListener('click',nextQuestion);
  document.querySelector('#quickSession').addEventListener('click',startQuickSession);
  els.practiceMode.addEventListener('change',nextQuestion);
  els.practiceScope.addEventListener('change',()=>{els.sessionStatus.textContent='';nextQuestion();renderSessionStatus()});
  els.practiceCategory.addEventListener('change',nextQuestion);
  els.drawingScene.addEventListener('change',renderDrawingQuestion);
  document.querySelector('#newDrawingQuestion').addEventListener('click',renderDrawingQuestion);
  document.querySelector('#exportProgress').addEventListener('click',exportProgress);
  document.querySelector('#importProgress').addEventListener('change',e=>e.target.files[0]&&importProgress(e.target.files[0]));
}

init().catch(err=>{
  document.body.insertAdjacentHTML('beforeend',`<div class="empty fatal-error">App failed to load: ${escapeHtml(err.message)}. Run it through a local web server.</div>`);
  console.error(err);
});

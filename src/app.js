import {renderTermVisual} from './visuals-all.js';

const els={
  stats:document.querySelector('#stats'),
  grid:document.querySelector('#dictionaryGrid'),
  search:document.querySelector('#searchInput'),
  category:document.querySelector('#categoryFilter'),
  practiceScope:document.querySelector('#practiceScope'),
  practiceCategory:document.querySelector('#practiceCategory'),
  practiceMode:document.querySelector('#practiceMode'),
  quiz:document.querySelector('#quizCard'),
  reviewList:document.querySelector('#reviewList'),
  weakList:document.querySelector('#weakList'),
  sessionStatus:document.querySelector('#sessionStatus')
};

const STORAGE_KEY='construction-vocab-progress-v1';
const intervals=[0,1,3,7,14,30,60];
const confusablePairs=[
  ['culvert','storm-sewer'],
  ['catch-basin','manhole'],
  ['trench-box','shoring'],
  ['subgrade','subbase'],
  ['allowance','contingency'],
  ['milling','overlay'],
  ['bedding','backfill'],
  ['duct-bank','conduit'],
  ['unit-price','lump-sum'],
  ['plan-view','profile'],
  ['rfi','rfq'],
  ['cut','fill'],
  ['sanitary-sewer','storm-sewer'],
  ['force-main','sanitary-sewer'],
  ['base-course','subbase'],
  ['daylighting','excavation']
];

let terms=[];
let categories=[];
let progress=loadProgress();
let currentQuestion=null;
let session={active:false,total:0,done:0,correct:0};

function loadProgress(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
function saveProgress(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));renderStats();renderReviewLists();renderDictionary()}
function recordFor(id){return progress[id]||{status:'new',level:0,correct:0,wrong:0,lastReviewed:null,due:null}}
function dueNow(r){return !r.due||new Date(r.due)<=new Date()}
function termById(id){return terms.find(t=>t.id===id)}
function updateProgress(id,correct){
  const r={...recordFor(id)};
  if(correct){
    r.correct++;
    r.level=Math.min(r.level+1,intervals.length-1);
    r.status=r.level>=5?'mastered':r.level>=2?'review':'learning';
  }else{
    r.wrong++;
    r.level=Math.max(0,r.level-1);
    r.status='learning';
  }
  r.lastReviewed=new Date().toISOString();
  const days=correct?intervals[r.level]:0;
  r.due=new Date(Date.now()+days*86400000).toISOString();
  progress[id]=r;
  saveProgress();
}

function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function categoryLabel(id){return categories.find(c=>c.id===id)?.label||id}
function speak(text){
  if(!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-CA';u.rate=.82;
  speechSynthesis.speak(u);
}
function normalizeRecall(v){
  return String(v||'')
    .toLowerCase()
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function renderStats(){
  const records=terms.map(t=>recordFor(t.id));
  const mastered=records.filter(r=>r.status==='mastered').length;
  const learning=records.filter(r=>r.status==='learning'||r.status==='review').length;
  const due=records.filter(r=>r.status!=='new'&&dueNow(r)).length;
  const attempts=records.reduce((s,r)=>s+r.correct+r.wrong,0);
  const correct=records.reduce((s,r)=>s+r.correct,0);
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  els.stats.innerHTML=[['Terms',terms.length],['Learning',learning],['Mastered',mastered],['Due now',due],['Accuracy',`${accuracy}%`]].map(([a,b])=>`<div class="stat"><span>${a}</span><strong>${b}</strong></div>`).join('');
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
    node.querySelector('.status-badge').textContent=recordFor(t.id).status;
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
function blankExample(t){const re=new RegExp(t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');return t.example_en.replace(re,'_____')}

function dueTerms(){return terms.filter(t=>{const r=recordFor(t.id);return r.status!=='new'&&dueNow(r)})}
function weakTerms(){return terms.filter(t=>recordFor(t.id).wrong>0).sort((a,b)=>recordFor(b.id).wrong-recordFor(a.id).wrong)}
function newTerms(){return terms.filter(t=>recordFor(t.id).status==='new')}
function smartPool(){
  const due=dueTerms();if(due.length)return due;
  const weak=weakTerms();if(weak.length)return weak;
  const fresh=newTerms();if(fresh.length)return fresh;
  return terms;
}
function applyPracticeCategory(pool){
  const cat=els.practiceCategory.value;
  if(cat==='all')return pool;
  const filtered=pool.filter(t=>t.category===cat);
  if(filtered.length)return filtered;
  const categoryTerms=terms.filter(t=>t.category===cat);
  return categoryTerms.length?categoryTerms:pool;
}
function selectedPool(){
  let pool;
  switch(els.practiceScope.value){
    case 'due':pool=dueTerms().length?dueTerms():terms;break;
    case 'weak':pool=weakTerms().length?weakTerms():terms;break;
    case 'new':pool=newTerms().length?newTerms():terms;break;
    case 'all':pool=terms;break;
    default:pool=smartPool();
  }
  return applyPracticeCategory(pool);
}

function makeContrastQuestion(){
  const selectedCategory=els.practiceCategory.value;
  let available=confusablePairs
    .map(([a,b])=>[termById(a),termById(b)])
    .filter(([a,b])=>a&&b);
  if(selectedCategory!=='all'){
    const categoryPairs=available.filter(([a,b])=>a.category===selectedCategory||b.category===selectedCategory);
    if(categoryPairs.length)available=categoryPairs;
  }
  const [first,second]=available[Math.floor(Math.random()*available.length)];
  const possibleTargets=selectedCategory==='all'?[first,second]:[first,second].filter(t=>t.category===selectedCategory);
  const target=(possibleTargets.length?possibleTargets:[first,second])[Math.floor(Math.random()*(possibleTargets.length||2))];
  const other=target.id===first.id?second:first;
  const sameCategory=terms.filter(t=>t.category===target.category&&t.id!==target.id&&t.id!==other.id);
  const distractors=shuffle(sameCategory.length?sameCategory:terms).slice(0,2).map(t=>t.term);
  return {
    term:target,
    compareWith:other,
    answer:target.term,
    prompt:`Which term best fits this situation? ${target.scenario}`,
    options:shuffle(unique([target.term,other.term,...distractors])).slice(0,4),
    extra:''
  };
}

function renderChoiceQuestion({t,prompt,answer,mode,options,extra='',compareWith=null}){
  currentQuestion={term:t,answer,mode,compareWith};
  els.quiz.dataset.answered='no';
  const canSpeakBeforeAnswer=mode==='en-ru';
  const speakButton=canSpeakBeforeAnswer?`<button class="speak-question secondary" type="button">🔊 Listen</button>`:'';
  els.quiz.innerHTML=`${extra}<div class="quiz-meta"><span>${escapeHtml(categoryLabel(t.category))}</span>${speakButton}</div><div class="quiz-question">${escapeHtml(prompt)}</div><div class="quiz-options">${options.map(o=>`<button class="quiz-option" data-answer="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}</div><div id="feedback"></div>`;
  if(canSpeakBeforeAnswer)els.quiz.querySelector('.speak-question').addEventListener('click',()=>speak(t.term));
  els.quiz.querySelectorAll('.quiz-option').forEach(b=>b.addEventListener('click',()=>answerQuestion(b)));
}

function renderTypedQuestion(t){
  currentQuestion={term:t,answer:t.term,mode:'typed',compareWith:null};
  els.quiz.dataset.answered='no';
  const prompt=`Type the English construction term for “${t.translation_ru[0]}”.`;
  els.quiz.innerHTML=`<div class="quiz-meta"><span>${escapeHtml(categoryLabel(t.category))}</span><span class="recall-badge">Active recall</span></div><div class="quiz-question">${escapeHtml(prompt)}</div><div class="typed-answer-row"><input id="typedAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the English term" /><button id="checkTypedAnswer" type="button">Check answer</button></div><div class="small-muted typed-hint">Hyphens and capitalization do not matter.</div><div id="feedback"></div>`;
  const input=document.querySelector('#typedAnswer');
  document.querySelector('#checkTypedAnswer').addEventListener('click',submitTypedAnswer);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')submitTypedAnswer()});
  input.focus();
}

function makeQuestion(){
  if(!terms.length)return;
  const pool=selectedPool();
  let mode=els.practiceMode.value;
  if(mode==='mixed')mode=shuffle(['typed','en-ru','ru-en','vi-en','definition','scenario','visual','fill','contrast'])[0];

  if(mode==='typed'){
    const t=pool[Math.floor(Math.random()*pool.length)];
    renderTypedQuestion(t);
    renderSessionStatus();
    return;
  }

  let t,prompt,answer,field,extra='',options=[],compareWith=null;
  if(mode==='contrast'){
    const q=makeContrastQuestion();
    t=q.term;prompt=q.prompt;answer=q.answer;options=q.options;extra=q.extra;compareWith=q.compareWith;
  }else{
    t=pool[Math.floor(Math.random()*pool.length)];
    if(mode==='en-ru'){
      prompt=`What does “${t.term}” mean in Russian?`;answer=t.translation_ru[0];field=x=>x.translation_ru[0];
    }else if(mode==='ru-en'){
      prompt=`What is the English term for “${t.translation_ru[0]}”?`;answer=t.term;field=x=>x.term;
    }else if(mode==='vi-en'){
      prompt=`What is the English construction term for “${t.translation_vi[0]}”?`;answer=t.term;field=x=>x.term;
    }else if(mode==='definition'){
      prompt=t.definition_en;answer=t.term;field=x=>x.term;
    }else if(mode==='scenario'){
      prompt=t.scenario;answer=t.term;field=x=>x.term;
    }else if(mode==='visual'){
      prompt='Identify the construction term shown by this diagram.';answer=t.term;field=x=>x.term;extra=renderTermVisual(t,{quiz:true});
    }else{
      prompt=`Complete the sentence: ${blankExample(t)}`;answer=t.term;field=x=>x.term;
    }
    options=unique([answer,...chooseDistractors(t,field)]);
    if(options.length<4)options=unique([...options,...shuffle(terms).map(field)]).slice(0,4);
    options=shuffle(options);
  }

  renderChoiceQuestion({t,prompt,answer,mode,options,extra,compareWith});
  renderSessionStatus();
}

function feedbackMarkup(correct,userAnswer=''){
  const contrast=currentQuestion.compareWith
    ?`<div class="contrast-note"><strong>Compare with ${escapeHtml(currentQuestion.compareWith.term)}:</strong> ${escapeHtml(currentQuestion.compareWith.definition_en)}</div>`
    :'';
  const caution=currentQuestion.term.common_mistakes?.length
    ?`<div class="contrast-note"><strong>Watch out:</strong> ${escapeHtml(currentQuestion.term.common_mistakes.join(' '))}</div>`
    :'';
  const yourAnswer=userAnswer&&!correct?`<div class="small-muted">Your answer: ${escapeHtml(userAnswer)}</div>`:'';
  return `<div class="feedback"><strong>${correct?'Correct':'Not quite'}.</strong> <strong>${escapeHtml(currentQuestion.term.term)}</strong> — ${escapeHtml(currentQuestion.term.definition_en)}${yourAnswer}<br><span class="small-muted">RU: ${escapeHtml(currentQuestion.term.explanation_ru)}</span><br><span class="small-muted">VI: ${escapeHtml(currentQuestion.term.translation_vi.join(', '))}</span>${contrast}${caution}<button class="feedback-speak secondary" type="button">🔊 Listen to ${escapeHtml(currentQuestion.term.term)}</button></div>`;
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
  if(session.active&&session.done>=session.total){
    const pct=Math.round(session.correct/session.total*100);
    els.sessionStatus.innerHTML=`Session complete: <strong>${session.correct}/${session.total}</strong> correct (${pct}%). Start another Quick 10 whenever you want.`;
    session.active=false;
  }
}

function answerQuestion(button){
  completeAnswer(button.dataset.answer===currentQuestion.answer,{button});
}
function submitTypedAnswer(){
  if(!currentQuestion||els.quiz.dataset.answered==='yes')return;
  const input=document.querySelector('#typedAnswer');
  const raw=input?.value.trim()||'';
  if(!raw){input?.focus();return}
  const correct=normalizeRecall(raw)===normalizeRecall(currentQuestion.answer);
  completeAnswer(correct,{userAnswer:raw});
}

function nextQuestion(){makeQuestion()}
function startQuickSession(){session={active:true,total:10,done:0,correct:0};els.practiceMode.value='mixed';makeQuestion()}
function renderSessionStatus(){
  if(!session.active){if(!els.sessionStatus.textContent)els.sessionStatus.textContent='Smart review prioritizes due words, then weak words, then new words. Choose a category to focus a session.';return}
  els.sessionStatus.innerHTML=`Quick 10: question <strong>${Math.min(session.done+1,session.total)}</strong> of ${session.total} · score ${session.correct}/${session.done}`;
}

function renderReviewLists(){
  if(!terms.length)return;
  const due=dueTerms();
  els.reviewList.innerHTML=due.length?due.map(t=>row(t,'Due now')).join(''):'<div class="empty">Nothing is due yet. Practice some words first.</div>';
  const weak=weakTerms();
  els.weakList.innerHTML=weak.length?weak.map(t=>row(t,`${recordFor(t.id).wrong} mistake${recordFor(t.id).wrong===1?'':'s'}`)).join(''):'<div class="empty">No weak words yet.</div>';
}
function row(t,right){
  const r=recordFor(t.id);
  return `<div class="list-row"><div><strong>${escapeHtml(t.term)}</strong><div class="small-muted">${escapeHtml(t.definition_en)}</div><div class="tiny-muted">${escapeHtml(categoryLabel(t.category))} · ${r.correct} correct / ${r.wrong} wrong</div></div><span>${escapeHtml(right)}</span></div>`;
}

function switchView(view){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===view));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelector(`#${view}View`).classList.add('active');
  if(view==='practice')nextQuestion();
  if(view==='review'||view==='weak')renderReviewLists();
}

function exportProgress(){
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),progress},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='construction-vocabulary-progress.json';a.click();URL.revokeObjectURL(a.href);
}
function importProgress(file){
  const reader=new FileReader();
  reader.onload=()=>{try{const data=JSON.parse(reader.result);progress=data.progress||data;saveProgress();alert('Progress imported.')}catch{alert('Could not read that progress file.')}};
  reader.readAsText(file);
}

async function fetchJson(path){
  const response=await fetch(path);
  if(!response.ok)throw new Error(`Could not load ${path}`);
  return response.json();
}

async function init(){
  const [coreTerms,expandedTerms,loadedCategories]=await Promise.all([
    fetchJson('data/terms.json'),
    fetchJson('data/terms-expansion.json'),
    fetchJson('data/categories.json')
  ]);
  terms=[...coreTerms,...expandedTerms];
  categories=loadedCategories;
  const ids=terms.map(t=>t.id);
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate vocabulary IDs detected.');

  categories.forEach(c=>{
    const option=`<option value="${c.id}">${escapeHtml(c.label)}</option>`;
    els.category.insertAdjacentHTML('beforeend',option);
    els.practiceCategory.insertAdjacentHTML('beforeend',option);
  });
  renderStats();renderDictionary();renderReviewLists();renderSessionStatus();
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchView(t.dataset.view)));
  els.search.addEventListener('input',renderDictionary);
  els.category.addEventListener('change',renderDictionary);
  document.querySelector('#newQuestion').addEventListener('click',nextQuestion);
  document.querySelector('#quickSession').addEventListener('click',startQuickSession);
  els.practiceMode.addEventListener('change',nextQuestion);
  els.practiceScope.addEventListener('change',nextQuestion);
  els.practiceCategory.addEventListener('change',nextQuestion);
  document.querySelector('#exportProgress').addEventListener('click',exportProgress);
  document.querySelector('#importProgress').addEventListener('change',e=>e.target.files[0]&&importProgress(e.target.files[0]));
}

init().catch(err=>{
  document.body.insertAdjacentHTML('beforeend',`<div class="empty fatal-error">App failed to load: ${escapeHtml(err.message)}. Run it through a local web server.</div>`);
  console.error(err);
});

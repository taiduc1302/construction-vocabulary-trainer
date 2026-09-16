const DENSITY_KEY='construction-vocab-card-density-v1';

function anyViewButton(view){
  return document.querySelector(`.tab[data-view="${view}"]`);
}

function updateTabAria(){
  document.querySelectorAll('.tabs .tab').forEach(tab=>{
    if(tab.classList.contains('active'))tab.setAttribute('aria-current','page');
    else tab.removeAttribute('aria-current');
  });
}

function openView(view){
  anyViewButton(view)?.click();
  if(view==='review'||view==='weak'){
    const progress=document.querySelector('.tabs .tab[data-view="progress"]');
    progress?.classList.add('active');
    updateTabAria();
  }
}

function setSelect(selector,value){
  const el=document.querySelector(selector);
  if(!el)return;
  el.value=value;
}

function reducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToElement(selector){
  requestAnimationFrame(()=>{
    document.querySelector(selector)?.scrollIntoView({block:'start',behavior:reducedMotion()?'auto':'smooth'});
  });
}

function openPractice({scope='smart',mode='mixed',category='all',quick=false}={}){
  setSelect('#practiceScope',scope);
  setSelect('#practiceMode',mode);
  setSelect('#practiceCategory',category);

  if(quick)document.querySelector('#quickSession')?.click();
  else document.querySelector('#newQuestion')?.click();

  openView('practice');
  scrollToElement('#quizCard');
}

function handleQuickAction(action){
  switch(action){
    case 'smart10':
      openPractice({scope:'smart',mode:'mixed',quick:true});
      break;
    case 'focus':
      openPractice({scope:'focus',mode:'mixed'});
      break;
    case 'due':
      openPractice({scope:'due',mode:'mixed'});
      break;
    case 'estimator':
      openPractice({scope:'all',mode:'estimator'});
      break;
    case 'drawing-label':
      openPractice({scope:'all',mode:'drawing-label'});
      break;
    case 'drawing':
    case 'dictionary':
    case 'progress':
    case 'review':
    case 'weak':
      openView(action);
      break;
    default:
      break;
  }
}

function trainerReady(){
  return (document.querySelector('#categoryFilter')?.options.length||0)>1;
}

function setQuickActionsReady(ready){
  document.querySelectorAll('[data-quick-action]').forEach(button=>{
    button.disabled=!ready;
    if(ready)button.removeAttribute('aria-busy');
    else button.setAttribute('aria-busy','true');
  });
}

function bindQuickActions(){
  const buttons=[...document.querySelectorAll('[data-quick-action]')];
  buttons.forEach(button=>button.addEventListener('click',()=>handleQuickAction(button.dataset.quickAction)));
  setQuickActionsReady(false);

  let attempts=0;
  const wait=()=>{
    if(trainerReady()){
      setQuickActionsReady(true);
      return;
    }
    attempts++;
    if(attempts<120)setTimeout(wait,50);
  };
  wait();
}

function bindTabAria(){
  document.querySelectorAll('.tabs .tab').forEach(tab=>{
    tab.addEventListener('click',()=>queueMicrotask(updateTabAria));
  });
  updateTabAria();
}

function storedDensity(){
  try{return localStorage.getItem(DENSITY_KEY)}catch{return null}
}

function storeDensity(value){
  try{localStorage.setItem(DENSITY_KEY,value)}catch{}
}

function applyDensity(compact){
  document.body.classList.toggle('compact-cards',compact);
  const button=document.querySelector('#toggleCardDensity');
  if(button){
    button.setAttribute('aria-pressed',String(compact));
    button.textContent=compact?'Detailed cards':'Compact cards';
    button.title=compact?'Show diagrams, examples and extra notes':'Show a faster scan-friendly dictionary';
  }
}

function bindCardDensity(){
  const button=document.querySelector('#toggleCardDensity');
  if(!button)return;
  const saved=storedDensity();
  const compact=saved?saved==='compact':window.matchMedia('(max-width: 640px)').matches;
  applyDensity(compact);
  button.addEventListener('click',()=>{
    const next=!document.body.classList.contains('compact-cards');
    applyDensity(next);
    storeDensity(next?'compact':'detailed');
  });
}

function ensurePracticeNext(){
  const feedback=document.querySelector('#feedback');
  if(!feedback?.querySelector('.feedback')||feedback.querySelector('.feedback-next'))return;
  const sessionComplete=document.querySelector('#sessionStatus')?.textContent.includes('Session complete');
  if(sessionComplete)return;

  const button=document.createElement('button');
  button.type='button';
  button.className='feedback-next';
  button.textContent='Next question';
  button.addEventListener('click',()=>{
    document.querySelector('#newQuestion')?.click();
    scrollToElement('#quizCard');
  });
  feedback.appendChild(button);
}

function ensureDrawingNext(){
  const feedback=document.querySelector('#drawingFeedback');
  if(!feedback?.querySelector('.feedback')||feedback.querySelector('.drawing-inline-next'))return;

  const button=document.createElement('button');
  button.type='button';
  button.className='feedback-next drawing-inline-next';
  button.textContent='Next drawing';
  button.addEventListener('click',()=>{
    document.querySelector('#newDrawingQuestion')?.click();
    scrollToElement('#drawingChallenge');
  });
  feedback.appendChild(button);
}

function bindInlineNextActions(){
  const observer=new MutationObserver(()=>{
    ensurePracticeNext();
    ensureDrawingNext();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

function bindDataMenu(){
  const menu=document.querySelector('.data-menu');
  if(!menu)return;
  document.addEventListener('click',event=>{
    if(menu.open&&!menu.contains(event.target))menu.removeAttribute('open');
  });
  document.querySelector('#exportProgress')?.addEventListener('click',()=>menu.removeAttribute('open'));
  document.querySelector('#importProgress')?.addEventListener('change',()=>menu.removeAttribute('open'));
}

bindQuickActions();
bindTabAria();
bindCardDensity();
bindInlineNextActions();
bindDataMenu();

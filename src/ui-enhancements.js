const DENSITY_KEY='construction-vocab-card-density-v1';

function navButton(view){
  return document.querySelector(`.tabs .tab[data-view="${view}"]`);
}

function openView(view){
  navButton(view)?.click();
}

function setSelect(selector,value){
  const el=document.querySelector(selector);
  if(!el)return;
  el.value=value;
}

function openPractice({scope='smart',mode='mixed',category='all',quick=false}={}){
  setSelect('#practiceScope',scope);
  setSelect('#practiceMode',mode);
  setSelect('#practiceCategory',category);
  openView('practice');
  requestAnimationFrame(()=>{
    if(quick)document.querySelector('#quickSession')?.click();
    document.querySelector('#quizCard')?.scrollIntoView({block:'start',behavior:'smooth'});
  });
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

function bindQuickActions(){
  document.querySelectorAll('[data-quick-action]').forEach(button=>{
    button.addEventListener('click',()=>handleQuickAction(button.dataset.quickAction));
  });
}

function updateTabAria(){
  document.querySelectorAll('.tabs .tab').forEach(tab=>{
    if(tab.classList.contains('active'))tab.setAttribute('aria-current','page');
    else tab.removeAttribute('aria-current');
  });
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

function bindDataMenu(){
  const menu=document.querySelector('.data-menu');
  if(!menu)return;
  document.addEventListener('click',event=>{
    if(menu.open&&!menu.contains(event.target))menu.removeAttribute('open');
  });
  menu.querySelectorAll('button,.file-label').forEach(item=>item.addEventListener('click',()=>{
    if(item.id==='exportProgress')menu.removeAttribute('open');
  }));
}

bindQuickActions();
bindTabAria();
bindCardDensity();
bindDataMenu();

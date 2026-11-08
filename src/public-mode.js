import {
  loadProfile,saveProfile,loadPersonalFocus,savePersonalFocus,applyPackToFocus,addCapturedFocus,
  maintainerEnabled,setMaintainerEnabled
} from './learner-profile.js';

const ROLE_LABELS={
  estimator:'Estimator',coordinator:'Project Coordinator',field:'Field / Superintendent',
  engineer:'Civil Engineer',student:'Student / New to Civil'
};
const LANGUAGE_LABELS={en:'English only',ru:'Russian support',vi:'Vietnamese support'};
const DEFAULT_PACK_BY_ROLE={
  estimator:'estimator-starter',coordinator:'civil-starter',field:'civil-starter',
  engineer:'drawing-english',student:'civil-starter'
};

let packs=[];
let profile=loadProfile();
let trainer=null;

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function byId(id){return packs.find(pack=>pack.id===id)}
function recommendedPack(role,focus){
  return packs.find(pack=>pack.focus===focus)||byId(DEFAULT_PACK_BY_ROLE[role])||packs[0];
}
function dispatchFocusChanged(){window.dispatchEvent(new CustomEvent('learner-focus-changed'))}
function applySupportLanguage(){
  document.body.dataset.supportLanguage=profile?.supportLanguage||'en';
}
function applyMaintainerMode(){
  const enabled=maintainerEnabled();
  document.body.classList.toggle('maintainer-mode',enabled);
  const button=document.querySelector('#toggleMaintainerMode');
  if(button){
    button.textContent=enabled?'Maintainer mode: on':'Maintainer mode: off';
    button.setAttribute('aria-pressed',String(enabled));
  }
}

function usePack(pack,{start=false}={}){
  if(!pack)return;
  const now=new Date().toISOString();
  profile=saveProfile({
    ...(profile||{}),
    activePackId:pack.id,
    focus:pack.focus,
    role:profile?.role||pack.roles?.[0]||'student',
    supportLanguage:profile?.supportLanguage||'en',
    createdAt:profile?.createdAt||now
  });
  const focus=applyPackToFocus(loadPersonalFocus(),pack.term_ids);
  savePersonalFocus(focus);
  applySupportLanguage();
  dispatchFocusChanged();
  renderPathCard();
  renderPacks();
  if(start&&trainer){
    trainer.startPackSession(pack.term_ids,pack.id);
  }
}

function progressForPack(pack){
  return trainer?.getProgressForIds?.(pack?.term_ids||[])||{
    total:pack?.term_ids?.length||0,started:0,mastered:0,due:0,attempts:0,correct:0,accuracy:0
  };
}

function progressMarkup(progress,{compact=false}={}){
  const pct=progress.total?Math.round(progress.mastered/progress.total*100):0;
  const details=compact
    ?progress.mastered+' mastered · '+progress.started+' started'
    :progress.mastered+' mastered · '+progress.started+' started · '+progress.due+' due';
  return '<div class="pack-learning-progress">'+
    '<div class="pack-progress-track" aria-label="'+pct+'% of pack mastered"><span style="width:'+pct+'%"></span></div>'+
    '<div class="pack-progress-copy">'+details+(progress.attempts?' · '+progress.accuracy+'% accuracy':'')+'</div>'+
  '</div>';
}

function renderPathCard(){
  const host=document.querySelector('#learnerPathCard');
  if(!host)return;
  const pack=byId(profile?.activePackId)||recommendedPack(profile?.role,profile?.focus);
  if(!profile||!pack){
    host.innerHTML='<div class="path-empty"><strong>Set your learning path</strong><span>Choose your role and work area to get a focused starter pack.</span><button id="startOnboarding" type="button">Choose my path</button></div>';
    document.querySelector('#startOnboarding')?.addEventListener('click',()=>openOnboarding());
    return;
  }
  const progress=progressForPack(pack);
  host.innerHTML=\`
    <div class="path-copy">
      <p class="system-kicker">Your learning path</p>
      <h2>\${escapeHtml(pack.icon)} \${escapeHtml(pack.title)}</h2>
      <p>\${escapeHtml(ROLE_LABELS[profile.role]||'Learner')} · \${escapeHtml(LANGUAGE_LABELS[profile.supportLanguage]||'English')}</p>
      <span>\${escapeHtml(pack.description)}</span>
      \${progressMarkup(progress)}
    </div>
    <div class="path-actions">
      <button id="learnActivePack" type="button">\${progress.started?'Continue · Learn 10':'Start · Learn 10'}</button>
      <button id="changeLearningPath" type="button" class="secondary">Change path</button>
    </div>\`;
  document.querySelector('#learnActivePack')?.addEventListener('click',()=>usePack(pack,{start:true}));
  document.querySelector('#changeLearningPath')?.addEventListener('click',()=>openOnboarding(true));
}

function renderPacks(){
  const grid=document.querySelector('#learningPackGrid');
  if(!grid)return;
  grid.innerHTML=packs.map(pack=>{
    const active=profile?.activePackId===pack.id;
    const progress=progressForPack(pack);
    return \`<article class="pack-card \${active?'is-active':''}">
      <div class="pack-card-head"><span class="pack-icon" aria-hidden="true">\${escapeHtml(pack.icon)}</span><span class="pack-level">\${escapeHtml(pack.level)}</span></div>
      <h3>\${escapeHtml(pack.title)}</h3>
      <p>\${escapeHtml(pack.description)}</p>
      <div class="pack-meta">\${pack.term_ids.length} terms\${active?' · your active pack':''}</div>
      \${progressMarkup(progress,{compact:true})}
      <div class="pack-actions">
        <button type="button" data-pack-learn="\${escapeHtml(pack.id)}">\${progress.started?'Continue 10':'Learn 10'}</button>
        <button type="button" class="secondary" data-pack-use="\${escapeHtml(pack.id)}">\${active?'Selected':'Use pack'}</button>
      </div>
    </article>\`;
  }).join('');
  grid.querySelectorAll('[data-pack-learn]').forEach(button=>button.addEventListener('click',()=>usePack(byId(button.dataset.packLearn),{start:true})));
  grid.querySelectorAll('[data-pack-use]').forEach(button=>button.addEventListener('click',()=>usePack(byId(button.dataset.packUse))));
}

function optionButtons(values,current,type){
  return values.map(item=>`<button type="button" class="onboarding-choice ${item.id===current?'selected':''}" data-choice-type="${type}" data-choice-value="${escapeHtml(item.id)}" aria-pressed="${item.id===current}">
    <strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.note||'')}</span>
  </button>`).join('');
}

function openOnboarding(edit=false){
  document.querySelector('#learnerOnboarding')?.remove();
  const current=profile||{};
  const role=current.role||'estimator';
  const focus=current.focus||'estimating';
  const language=current.supportLanguage||'en';
  const roleOptions=[
    {id:'estimator',label:'Estimator',note:'Takeoff, pricing, scope and production'},
    {id:'coordinator',label:'Project Coordinator',note:'Drawings, RFIs, site and subcontractor language'},
    {id:'field',label:'Field / Superintendent',note:'Site work, crews, utilities and sequencing'},
    {id:'engineer',label:'Civil Engineer',note:'Drawings, details, utilities and technical terms'},
    {id:'student',label:'Student / New to Civil',note:'Start with the essential civil vocabulary'}
  ];
  const focusOptions=[
    {id:'estimating',label:'Estimating',note:'Takeoff, bid and scope language'},
    {id:'general',label:'General Civil',note:'A broad starter path'},
    {id:'earthworks',label:'Earthworks',note:'Excavation, haul and soils'},
    {id:'utilities',label:'Underground Utilities',note:'Water, sewer, drainage and trenching'},
    {id:'duct-bank',label:'Duct Bank / Electrical',note:'DB2, conduit, spacers and encasement'},
    {id:'roadworks',label:'Road & Restoration',note:'Pavement, curb, asphalt and markings'},
    {id:'concrete',label:'Concrete & Foundations',note:'Footings, slabs, rebar and formwork'},
    {id:'deep-excavation',label:'Deep Excavation',note:'Shoring, sheet pile and temporary works'},
    {id:'pump-station',label:'Pump Station',note:'Wet wells, bypass and pressure piping'},
    {id:'drawings',label:'Drawing English',note:'Plans, profiles, grades and callouts'}
  ];
  const languageOptions=[
    {id:'en',label:'English only',note:'Definitions and examples in English'},
    {id:'ru',label:'Russian support',note:'Show Russian explanation while learning'},
    {id:'vi',label:'Vietnamese support',note:'Show Vietnamese translation while learning'}
  ];
  document.body.insertAdjacentHTML('beforeend',`
    <div id="learnerOnboarding" class="learner-onboarding" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
      <form class="onboarding-panel">
        <div class="onboarding-head">
          <div><p class="system-kicker">Construction English for real work</p><h2 id="onboardingTitle">${edit?'Change your learning path':'Build your first learning pack'}</h2><p>Three quick choices. You can change them anytime.</p></div>
          ${edit?'<button id="closeOnboarding" type="button" class="icon-button" aria-label="Close">×</button>':''}
        </div>
        <fieldset><legend>1. What do you do?</legend><div class="onboarding-grid" data-choice-group="role">${optionButtons(roleOptions,role,'role')}</div></fieldset>
        <fieldset><legend>2. What do you work with most?</legend><div class="onboarding-grid onboarding-grid-focus" data-choice-group="focus">${optionButtons(focusOptions,focus,'focus')}</div></fieldset>
        <fieldset><legend>3. Learning support</legend><div class="onboarding-grid" data-choice-group="supportLanguage">${optionButtons(languageOptions,language,'supportLanguage')}</div></fieldset>
        <div class="onboarding-recommendation" id="onboardingRecommendation"></div>
        <button id="finishOnboarding" class="onboarding-primary" type="submit">Start learning</button>
      </form>
    </div>`);
  const overlay=document.querySelector('#learnerOnboarding');
  const selection={role,focus,supportLanguage:language};
  const refreshRecommendation=()=>{
    const pack=recommendedPack(selection.role,selection.focus);
    document.querySelector('#onboardingRecommendation').innerHTML=pack
      ?`Recommended: <strong>${escapeHtml(pack.icon)} ${escapeHtml(pack.title)}</strong> · ${pack.term_ids.length} terms`
      :'';
  };
  overlay.querySelectorAll('[data-choice-type]').forEach(button=>button.addEventListener('click',()=>{
    const type=button.dataset.choiceType;
    selection[type]=button.dataset.choiceValue;
    overlay.querySelectorAll(`[data-choice-type="${type}"]`).forEach(item=>{
      const selected=item===button;
      item.classList.toggle('selected',selected);
      item.setAttribute('aria-pressed',String(selected));
    });
    refreshRecommendation();
  }));
  document.querySelector('#closeOnboarding')?.addEventListener('click',()=>overlay.remove());
  overlay.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    const pack=recommendedPack(selection.role,selection.focus);
    profile=saveProfile({...profile,...selection,activePackId:pack?.id||'',createdAt:profile?.createdAt});
    if(pack)savePersonalFocus(applyPackToFocus(loadPersonalFocus(),pack.term_ids));
    overlay.remove();
    applySupportLanguage();dispatchFocusChanged();renderPathCard();renderPacks();
  });
  refreshRecommendation();
}

async function copyText(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';
  document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;
}
function captureStatus(message,state='neutral'){
  const node=document.querySelector('#publicCaptureStatus');if(!node)return;
  node.textContent=message;node.dataset.state=state;
}
function findLocalTerm(raw){
  if(!trainer)return null;
  return trainer.findTerm(raw);
}
function searchLocalTerms(raw){
  if(!trainer?.searchTerms)return [];
  return trainer.searchTerms(raw,5);
}
function clearCaptureMatches(){
  const host=document.querySelector('#publicCaptureMatches');
  if(host)host.innerHTML='';
}
function addTermToMyWords(term,{clearInput=true}={}){
  if(!term)return;
  savePersonalFocus(addCapturedFocus(loadPersonalFocus(),term.id));
  dispatchFocusChanged();
  captureStatus(\`Added “\${term.term}” to My Words.\`,'success');
  if(clearInput){
    const input=document.querySelector('#publicCaptureInput');
    if(input)input.value='';
    clearCaptureMatches();
  }else{
    renderCaptureMatches(document.querySelector('#publicCaptureInput')?.value||'');
  }
}
function renderCaptureMatches(raw){
  const host=document.querySelector('#publicCaptureMatches');
  if(!host)return;
  const query=String(raw||'').trim();
  if(query.length<2){host.innerHTML='';return}
  const matches=searchLocalTerms(query);
  if(!matches.length){host.innerHTML='';return}
  const myWords=new Set(loadPersonalFocus().terms.map(item=>item.id));
  host.innerHTML=matches.map(({term,match})=>\`
    <article class="capture-match">
      <div class="capture-match-copy">
        <span>\${escapeHtml(match||term.category)}</span>
        <strong>\${escapeHtml(term.term)}</strong>
        <p>\${escapeHtml(term.definition_en)}</p>
        <small>RU: \${escapeHtml((term.translation_ru||[]).join(', '))} · VI: \${escapeHtml((term.translation_vi||[]).join(', '))}</small>
      </div>
      <div class="capture-match-actions">
        <button type="button" data-capture-add="\${escapeHtml(term.id)}">\${myWords.has(term.id)?'✓ My Words':'+ My Words'}</button>
        <a class="secondary capture-open-link" href="term.html?term=\${encodeURIComponent(term.id)}">Open</a>
      </div>
    </article>\`).join('');
  host.querySelectorAll('[data-capture-add]').forEach(button=>button.addEventListener('click',()=>{
    const result=searchLocalTerms(query).find(item=>item.term.id===button.dataset.captureAdd);
    addTermToMyWords(result?.term,{clearInput:false});
  }));
}
function addExistingTerm(){
  const input=document.querySelector('#publicCaptureInput');
  const raw=input?.value.trim()||'';
  if(!raw){input?.focus();captureStatus('Type a construction term first.','error');return}
  const term=findLocalTerm(raw);
  if(term){addTermToMyWords(term);return}
  const matches=searchLocalTerms(raw);
  if(matches.length){
    renderCaptureMatches(raw);
    captureStatus('No exact match. Choose the construction term you meant below.','neutral');
    return;
  }
  clearCaptureMatches();
  captureStatus('Not in the current library yet. Use “Explain with ChatGPT” to identify it, then a maintainer can add it to the public library.','error');
}
async function explainWithChat(){
  const input=document.querySelector('#publicCaptureInput');
  const raw=input?.value.trim()||'';
  if(!raw){input?.focus();captureStatus('Type a construction term first.','error');return}
  const prompt=\`Explain the construction term "\${raw}" in plain English. I work in civil construction. Tell me what it means, where I would see it on drawings/site, what an estimator should think about, and what it is commonly confused with.\`;
  try{
    if(navigator.share){
      await navigator.share({title:'Explain construction term',text:prompt});
      captureStatus('Shared. Choose ChatGPT if it is available in the share sheet.','success');
    }else{
      await copyText(prompt);captureStatus('Prompt copied. Paste it into ChatGPT.','success');
    }
  }catch(error){
    if(error?.name!=='AbortError'){await copyText(prompt);captureStatus('Prompt copied. Paste it into ChatGPT.','success')}
  }
}

function bindPublicCapture(){
  document.querySelector('#addExistingTerm')?.addEventListener('click',addExistingTerm);
  document.querySelector('#explainTerm')?.addEventListener('click',explainWithChat);
  const input=document.querySelector('#publicCaptureInput');
  input?.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();addExistingTerm()}
  });
  input?.addEventListener('input',()=>{
    renderCaptureMatches(input.value);
    if(input.value.trim().length>=2)captureStatus('Matching terms appear below as you type.','neutral');
    else captureStatus('','neutral');
  });
}

function bindPublicSmart10(){
  const button=document.querySelector('[data-quick-action="smart10"]');
  button?.addEventListener('click',event=>{
    if(maintainerEnabled())return;
    const pack=byId(profile?.activePackId)||recommendedPack(profile?.role,profile?.focus);
    if(!pack)return;
    event.preventDefault();event.stopImmediatePropagation();
    usePack(pack,{start:true});
  },true);
}

function bindMaintainerToggle(){
  document.querySelector('#changeLearningPathMenu')?.addEventListener('click',()=>openOnboarding(true));
  const button=document.querySelector('#toggleMaintainerMode');
  button?.addEventListener('click',()=>{
    const next=!maintainerEnabled();
    setMaintainerEnabled(next);
    applyMaintainerMode();
    dispatchFocusChanged();
  });
}

function handleDeepLinks(){
  const params=new URLSearchParams(location.search);
  const requestedPack=params.get('pack');
  const learn=params.get('learn');
  if(requestedPack&&byId(requestedPack)){
    usePack(byId(requestedPack),{start:false});
  }
  if(learn&&trainer){
    const term=trainer.findTerm(learn);
    if(term){
      savePersonalFocus(addCapturedFocus(loadPersonalFocus(),term.id));
      dispatchFocusChanged();
      trainer.startPackSession([term.id],`term:${term.id}`);
    }
  }
}

function onTrainerReady(api){
  trainer=api;
  renderPathCard();renderPacks();bindPublicCapture();handleDeepLinks();
  if(!profile)openOnboarding(false);
}

async function initPublicMode(){
  try{
    const response=await fetch('data/learning-packs.json');
    if(!response.ok)throw new Error('Could not load learning packs');
    packs=await response.json();
  }catch(error){
    console.warn('Learning packs unavailable.',error);packs=[];
  }
  applyMaintainerMode();applySupportLanguage();bindMaintainerToggle();bindPublicSmart10();
  window.addEventListener('trainer-ready',event=>onTrainerReady(event.detail));
  window.addEventListener('trainer-progress-changed',()=>{
    renderPathCard();
    renderPacks();
  });
  window.addEventListener('learner-profile-imported',()=>{
    profile=loadProfile();
    applySupportLanguage();
    dispatchFocusChanged();
    renderPathCard();
    renderPacks();
  });
  if(window.ConstructionTrainer)onTrainerReady(window.ConstructionTrainer);
}

initPublicMode();

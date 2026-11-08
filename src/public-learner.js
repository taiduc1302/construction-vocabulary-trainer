import {
  loadLearnerProfile,completeLearnerOnboarding,setLearnerMode,
  activatePack,deactivatePack,setActivePack,toggleManualFocus,
  focusEntriesForProfile,recommendPackId
} from './learner-profile.js';
import {loadLearningState,recordFor} from './learning-state.js';

let profile=loadLearnerProfile();
let packs=[];
let terms=[];
let termMetadata={};

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,function(char){
    return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char];
  });
}

async function fetchJson(path){
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok)throw new Error('Could not load '+path);
  return response.json();
}

function emitProfileChanged(){
  window.dispatchEvent(new CustomEvent('construction:vocab-profile-changed',{detail:{profile:profile}}));
}

function setModeUi(){
  document.body.dataset.userMode=profile.mode;
  const toggle=document.querySelector('#maintainerModeToggle');
  if(toggle)toggle.textContent=profile.mode==='maintainer'?'Switch to learner mode':'Maintainer mode';
  const note=document.querySelector('#modeNote');
  if(note)note.textContent=profile.mode==='maintainer'
    ?'Maintainer mode: owner GitHub Focus and content tools are visible.'
    :'Learner mode: packs, My learning and progress stay local to this device.';
}

function roleLabel(role){
  const labels={
    'estimator':'Estimator',
    'project-coordinator':'Project Coordinator',
    'field':'Field / Superintendent',
    'civil-engineer':'Civil Engineer',
    'student':'Student / New to civil',
    'other':'Other'
  };
  return labels[role]||'Learner';
}

function languageLabel(language){
  const labels={en:'English',ru:'Russian',vi:'Vietnamese',uk:'Ukrainian',es:'Spanish',other:'Other'};
  return labels[language]||'English';
}

function ensureSettingsControls(){
  const popover=document.querySelector('.data-menu-popover');
  if(!popover||document.querySelector('#maintainerModeToggle'))return;
  popover.insertAdjacentHTML('beforeend',
    '<div class="settings-divider"></div>'+
    '<button id="restartOnboarding" class="secondary" type="button">Learner setup</button>'+
    '<button id="maintainerModeToggle" class="secondary" type="button">Maintainer mode</button>'+
    '<p id="modeNote" class="settings-note"></p>'
  );
  document.querySelector('#restartOnboarding')?.addEventListener('click',function(){
    document.querySelector('.data-menu')?.removeAttribute('open');
    showOnboarding();
  });
  document.querySelector('#maintainerModeToggle')?.addEventListener('click',function(){
    profile=setLearnerMode(profile,profile.mode==='maintainer'?'learner':'maintainer');
    setModeUi();
    emitProfileChanged();
    renderLearningPath();
    document.querySelector('.data-menu')?.removeAttribute('open');
  });
}

function ensureOnboarding(){
  if(document.querySelector('#learnerOnboarding'))return;
  document.body.insertAdjacentHTML('afterbegin',
    '<div id="learnerOnboarding" class="learner-onboarding" hidden>'+
      '<section class="learner-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="learnerOnboardingTitle">'+
        '<p class="product-kicker">Construction English for real work</p>'+
        '<h2 id="learnerOnboardingTitle">Build a learning path around your job.</h2>'+
        '<p class="onboarding-lead">Choose what you do and what you work with. Start with a focused pack instead of a 200+ term dictionary.</p>'+
        '<form id="learnerOnboardingForm">'+
          '<label class="onboarding-field"><span>What do you do?</span><select id="learnerRole" required>'+
            '<option value="estimator">Estimator</option>'+
            '<option value="project-coordinator">Project Coordinator</option>'+
            '<option value="field">Field / Superintendent</option>'+
            '<option value="civil-engineer">Civil Engineer</option>'+
            '<option value="student">Student / New to civil</option>'+
            '<option value="other">Other</option>'+
          '</select></label>'+
          '<fieldset class="interest-fieldset"><legend>What do you work with?</legend><div class="interest-grid">'+
            '<label><input type="checkbox" name="learnerInterest" value="general-civil" checked> General civil</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="estimating"> Estimating</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="earthworks"> Earthworks</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="underground-utilities"> Underground utilities</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="duct-bank"> Duct bank</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="deep-excavation"> Deep excavation</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="roadworks"> Roadworks</label>'+
            '<label><input type="checkbox" name="learnerInterest" value="pump-station"> Pump stations</label>'+
          '</div></fieldset>'+
          '<label class="onboarding-field"><span>Your strongest language</span><select id="learnerLanguage">'+
            '<option value="en">English</option><option value="ru">Русский</option><option value="vi">Tiếng Việt</option>'+
            '<option value="uk">Українська</option><option value="es">Español</option><option value="other">Other</option>'+
          '</select></label>'+
          '<div id="recommendedPack" class="recommended-pack"></div>'+
          '<div class="onboarding-actions"><button type="submit">Start my first pack</button>'+
          '<button id="onboardingMaintainer" type="button" class="secondary">I maintain this trainer</button></div>'+
        '</form>'+
      '</section>'+
    '</div>'
  );

  const form=document.querySelector('#learnerOnboardingForm');
  const refreshRecommendation=function(){
    const role=document.querySelector('#learnerRole')?.value||'estimator';
    const interests=[...document.querySelectorAll('input[name="learnerInterest"]:checked')].map(function(input){return input.value;});
    const id=recommendPackId({role:role,interests:interests},packs);
    const pack=packs.find(function(item){return item.id===id;});
    const target=document.querySelector('#recommendedPack');
    if(target&&pack){
      target.innerHTML='<span>Recommended start</span><strong>'+escapeHtml(pack.title)+'</strong><small>'+escapeHtml(pack.tagline)+' · '+pack.term_ids.length+' terms</small>';
      target.dataset.packId=pack.id;
    }
  };
  form?.addEventListener('change',refreshRecommendation);
  form?.addEventListener('submit',function(event){
    event.preventDefault();
    const role=document.querySelector('#learnerRole')?.value||'estimator';
    const language=document.querySelector('#learnerLanguage')?.value||'en';
    const interests=[...document.querySelectorAll('input[name="learnerInterest"]:checked')].map(function(input){return input.value;});
    const packId=document.querySelector('#recommendedPack')?.dataset.packId||recommendPackId({role:role,interests:interests},packs);
    profile=completeLearnerOnboarding(profile,{role:role,language:language,interests:interests,packId:packId});
    hideOnboarding();
    setModeUi();
    emitProfileChanged();
    renderLearningPath();
    startPack(packId);
  });
  document.querySelector('#onboardingMaintainer')?.addEventListener('click',function(){
    profile=setLearnerMode(profile,'maintainer');
    hideOnboarding();
    setModeUi();
    emitProfileChanged();
    renderLearningPath();
  });
}

function showOnboarding(){
  ensureOnboarding();
  const overlay=document.querySelector('#learnerOnboarding');
  if(!overlay)return;
  document.querySelector('#learnerRole').value=profile.role||'estimator';
  document.querySelector('#learnerLanguage').value=profile.language||'en';
  const selected=new Set(profile.interests||[]);
  document.querySelectorAll('input[name="learnerInterest"]').forEach(function(input){
    input.checked=selected.size?selected.has(input.value):input.value==='general-civil';
  });
  overlay.hidden=false;
  document.body.classList.add('onboarding-open');
  document.querySelector('#learnerOnboardingForm')?.dispatchEvent(new Event('change'));
}

function hideOnboarding(){
  const overlay=document.querySelector('#learnerOnboarding');
  if(overlay)overlay.hidden=true;
  document.body.classList.remove('onboarding-open');
}

function ensureLearnerHome(){
  if(document.querySelector('#learningPathSection'))return;
  const stats=document.querySelector('#stats');
  if(!stats)return;
  stats.insertAdjacentHTML('afterend',
    '<section id="learningPathSection" class="learning-path learner-only" aria-labelledby="learningPathTitle">'+
      '<div class="learning-path-head"><div><p class="system-kicker">Your learning path</p>'+
      '<h2 id="learningPathTitle">Start with the work you actually do.</h2><p id="learnerProfileSummary"></p></div>'+
      '<button id="editLearnerSetup" class="secondary" type="button">Edit setup</button></div>'+
      '<div id="activePackSummary" class="active-pack-summary"></div>'+
      '<details class="pack-library"><summary>Browse learning packs</summary><div id="learningPackGrid" class="learning-pack-grid"></div></details>'+
    '</section>'+
    '<section id="workLookupSection" class="work-lookup learner-only" aria-labelledby="workLookupTitle">'+
      '<div class="work-lookup-head"><div><p class="system-kicker">From work → learning</p>'+
      '<h2 id="workLookupTitle">What does this term mean?</h2>'+
      '<p>Paste a word or abbreviation from a drawing, estimate or site conversation. If it is in the trainer, add it to your personal learning list.</p></div></div>'+
      '<form id="workLookupForm" class="work-lookup-form"><input id="workLookupInput" type="search" autocomplete="off" placeholder="e.g. DB2, wet well, INV, bullnose curb" aria-label="Construction term to find"><button type="submit">Find term</button></form>'+
      '<div id="workLookupResult" class="work-lookup-result" aria-live="polite"></div>'+
    '</section>'
  );
  document.querySelector('#editLearnerSetup')?.addEventListener('click',showOnboarding);
  document.querySelector('#workLookupForm')?.addEventListener('submit',function(event){
    event.preventDefault();
    lookupWorkTerm(document.querySelector('#workLookupInput')?.value||'');
  });
}

function packProgress(pack){
  const state=loadLearningState();
  const records=pack.term_ids.map(function(id){return recordFor(state,id);});
  return {
    mastered:records.filter(function(record){return record.status==='mastered';}).length,
    started:records.filter(function(record){return record.status!=='new';}).length,
    total:pack.term_ids.length
  };
}

function renderPackCard(pack){
  const selected=profile.packIds.includes(pack.id);
  const active=profile.activePackId===pack.id;
  const progress=packProgress(pack);
  const pct=progress.total?Math.round(progress.mastered/progress.total*100):0;
  return '<article class="learning-pack-card '+(active?'is-active':'')+'" data-pack-id="'+escapeHtml(pack.id)+'">'+
    '<div class="pack-card-top"><div><span class="pack-count">'+pack.term_ids.length+' terms</span><h3>'+escapeHtml(pack.title)+'</h3></div>'+
    (active?'<span class="pack-active-badge">Active</span>':'')+'</div>'+
    '<p class="pack-tagline">'+escapeHtml(pack.tagline)+'</p>'+
    '<div class="pack-progress" aria-label="'+pct+'% mastered"><span style="width:'+pct+'%"></span></div>'+
    '<p class="pack-progress-copy">'+progress.mastered+' mastered · '+progress.started+' started</p>'+
    '<div class="pack-actions"><button type="button" data-pack-start="'+escapeHtml(pack.id)+'">'+(selected?'Practice pack':'Add & start')+'</button>'+
    (selected?'<button type="button" class="secondary" data-pack-remove="'+escapeHtml(pack.id)+'">Remove</button>':'')+'</div></article>';
}

function renderLearningPath(){
  if(!packs.length)return;
  ensureLearnerHome();
  setModeUi();
  const summary=document.querySelector('#learnerProfileSummary');
  if(summary){
    summary.textContent=profile.onboarded
      ?roleLabel(profile.role)+' · '+languageLabel(profile.language)+' · progress stays on this device'
      :'Choose a role and starter pack to personalize practice.';
  }
  const active=packs.find(function(pack){return pack.id===profile.activePackId;})||
    packs.find(function(pack){return profile.packIds.includes(pack.id);});
  const activeBox=document.querySelector('#activePackSummary');
  if(activeBox){
    activeBox.innerHTML=active
      ?'<div><span>Current pack</span><strong>'+escapeHtml(active.title)+'</strong><small>'+escapeHtml(active.tagline)+'</small></div><button type="button" data-pack-start="'+escapeHtml(active.id)+'">Learn 10</button>'
      :'<div><span>No pack selected</span><strong>Choose a learning pack below.</strong><small>Your personal My learning list is local to this device.</small></div>';
  }
  const grid=document.querySelector('#learningPackGrid');
  if(grid)grid.innerHTML=packs.map(renderPackCard).join('');
  document.querySelectorAll('[data-pack-start]').forEach(function(button){
    button.addEventListener('click',function(){startPack(button.dataset.packStart);});
  });
  document.querySelectorAll('[data-pack-remove]').forEach(function(button){
    button.addEventListener('click',function(){
      profile=deactivatePack(profile,button.dataset.packRemove);
      emitProfileChanged();
      renderLearningPath();
    });
  });
}

function startPack(packId){
  const pack=packs.find(function(item){return item.id===packId;});
  if(!pack)return;
  if(!profile.packIds.includes(packId))profile=activatePack(profile,packId);
  else profile=setActivePack(profile,packId);
  emitProfileChanged();
  renderLearningPath();
  window.dispatchEvent(new CustomEvent('construction:vocab-start-pack',{detail:{packId:packId,termIds:[...pack.term_ids]}}));
}

function normalizedSearch(value){
  return String(value||'').toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}

function mergedAliases(term){
  const meta=(termMetadata?.terms?.[term.id])||(termMetadata?.[term.id])||{};
  return []
    .concat(Array.isArray(term.aliases_en)?term.aliases_en:[])
    .concat(Array.isArray(meta.aliases_en)?meta.aliases_en:[])
    .concat(Array.isArray(meta.drawing_labels)?meta.drawing_labels:[]);
}

function searchTerms(query){
  const q=normalizedSearch(query);
  if(!q)return [];
  return terms.map(function(term){
    const termKey=normalizedSearch(term.term);
    const aliases=mergedAliases(term).map(normalizedSearch);
    const translations=[].concat(term.translation_ru||[],term.translation_vi||[]).map(normalizedSearch);
    const definition=normalizedSearch(term.definition_en);
    let score=0;
    if(termKey===q)score=100;
    else if(aliases.includes(q))score=95;
    else if(termKey.startsWith(q))score=80;
    else if(aliases.some(function(alias){return alias.startsWith(q);}))score=75;
    else if(termKey.includes(q))score=60;
    else if(aliases.some(function(alias){return alias.includes(q);}))score=55;
    else if(translations.some(function(value){return value.includes(q);}))score=40;
    else if(definition.includes(q))score=20;
    return {term:term,score:score};
  }).filter(function(item){return item.score>0;})
    .sort(function(a,b){return b.score-a.score||a.term.term.localeCompare(b.term.term);})
    .slice(0,5);
}

function openTerm(id){
  window.dispatchEvent(new CustomEvent('construction:vocab-open-term',{detail:{id:id}}));
}

function lookupWorkTerm(value){
  const target=document.querySelector('#workLookupResult');
  if(!target)return;
  const results=searchTerms(value);
  if(!results.length){
    target.innerHTML='<div class="lookup-empty"><strong>Not in the trainer yet.</strong><span>Try a shorter spelling or another construction term. Maintainers can add missing vocabulary through the content workflow.</span></div>';
    return;
  }
  const focus=new Set(focusEntriesForProfile(profile,packs).map(function(item){return item.id;}));
  target.innerHTML=results.map(function(item,index){
    const term=item.term;
    return '<article class="lookup-hit '+(index===0?'best-hit':'')+'"><div><span>'+escapeHtml(term.category)+'</span>'+
      '<strong>'+escapeHtml(term.term)+'</strong><p>'+escapeHtml(term.definition_en)+'</p>'+
      '<small>RU: '+escapeHtml((term.translation_ru||[]).join(', '))+' · VI: '+escapeHtml((term.translation_vi||[]).join(', '))+'</small></div>'+
      '<div class="lookup-actions"><button type="button" data-lookup-focus="'+escapeHtml(term.id)+'">'+(focus.has(term.id)?'✓ My learning':'+ My learning')+'</button>'+
      '<button type="button" class="secondary" data-lookup-open="'+escapeHtml(term.id)+'">Open term</button></div></article>';
  }).join('');
  target.querySelectorAll('[data-lookup-focus]').forEach(function(button){
    button.addEventListener('click',function(){
      profile=toggleManualFocus(profile,button.dataset.lookupFocus);
      emitProfileChanged();
      renderLearningPath();
      lookupWorkTerm(value);
    });
  });
  target.querySelectorAll('[data-lookup-open]').forEach(function(button){
    button.addEventListener('click',function(){openTerm(button.dataset.lookupOpen);});
  });
}

async function initPublicLearner(){
  ensureSettingsControls();
  ensureOnboarding();
  ensureLearnerHome();
  try{
    const loaded=await Promise.all([
      fetchJson('data/learning-packs.json'),
      fetchJson('data/terms.json'),
      fetchJson('data/terms-expansion.json'),
      fetchJson('data/term-meta.json')
    ]);
    packs=Array.isArray(loaded[0])?loaded[0]:[];
    terms=[].concat(Array.isArray(loaded[1])?loaded[1]:[],Array.isArray(loaded[2])?loaded[2]:[]);
    termMetadata=loaded[3]||{};
  }catch(error){
    console.warn('Public learner data could not be loaded.',error);
  }
  setModeUi();
  renderLearningPath();
  if(!profile.onboarded)showOnboarding();
  window.addEventListener('construction:vocab-progress-changed',renderLearningPath);
  window.addEventListener('construction:vocab-profile-saved',function(event){
    profile=event.detail?.profile||loadLearnerProfile();
    setModeUi();
    renderLearningPath();
  });
}

initPublicLearner();

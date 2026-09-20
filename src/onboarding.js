export const REPO='taiduc1302/construction-vocabulary-trainer';
const INSTALL_DISMISS_KEY='construction-vocab-install-dismissed-v1';
const INSTALL_RESHOW_MS=7*24*60*60*1000;
const MAX_BATCH_TERMS=25;

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
}

function isIos(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function installDismissedRecently(){
  try{
    const value=Number(localStorage.getItem(INSTALL_DISMISS_KEY));
    return Number.isFinite(value)&&Date.now()-value<INSTALL_RESHOW_MS;
  }catch{
    return false;
  }
}

function bindInstallCard(){
  const card=document.querySelector('#installCard');
  const dismiss=document.querySelector('#dismissInstall');
  if(!card)return;

  const shouldShow=isIos()&&!isStandalone()&&!installDismissedRecently();
  card.hidden=!shouldShow;

  dismiss?.addEventListener('click',()=>{
    card.hidden=true;
    try{localStorage.setItem(INSTALL_DISMISS_KEY,String(Date.now()))}catch{}
  });
}

function cleanRequestedTerm(value){
  return String(value||'').trim().replace(/\s+/g,' ').replace(/[“”]/g,'"');
}

export function normalizeRequestedTerms(value){
  const seen=new Set();
  const out=[];
  String(value||'')
    .split(/[\n,;]+/)
    .map(cleanRequestedTerm)
    .filter(Boolean)
    .forEach(term=>{
      const key=term.toLocaleLowerCase();
      if(seen.has(key))return;
      seen.add(key);
      out.push(term);
    });
  return out;
}

export function buildPrompt(value){
  const terms=normalizeRequestedTerms(value);
  if(!terms.length)return '';
  const requested=terms.map(term=>`"${term.replace(/"/g,'\\\"')}"`).join(', ');
  return `Используй подключенный GitHub. В репозитории ${REPO} следуй AI_INSTRUCTIONS.md. В словарь: ${requested}. Обработай весь запрос как одно атомарное изменение: не публикуй частичное состояние; для существующих терминов обнови My focus list, для новых создай полную карточку и visual. Прогони проверки, дождись зеленого GitHub Actions и только после этого считай изменение завершенным.`;
}

function setStatus(message,type='neutral'){
  const status=document.querySelector('#addWordStatus');
  if(!status)return;
  status.textContent=message;
  status.dataset.state=type;
}

async function copyPrompt(prompt){
  if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(prompt);
    return true;
  }

  const area=document.createElement('textarea');
  area.value=prompt;
  area.setAttribute('readonly','');
  area.style.position='fixed';
  area.style.opacity='0';
  document.body.appendChild(area);
  area.select();
  const copied=document.execCommand('copy');
  area.remove();
  return copied;
}

function currentPrompt(){
  const input=document.querySelector('#addWordInput');
  const terms=normalizeRequestedTerms(input?.value);
  if(!terms.length){
    input?.focus();
    setStatus('Type at least one construction term first.','error');
    return null;
  }
  if(terms.length>MAX_BATCH_TERMS){
    setStatus(`Send ${MAX_BATCH_TERMS} or fewer terms at once.`,'error');
    return null;
  }
  return buildPrompt(terms.join(', '));
}

async function handleCopy(){
  const prompt=currentPrompt();
  if(!prompt)return;
  try{
    const copied=await copyPrompt(prompt);
    setStatus(copied?'Copied. Paste it into ChatGPT.':'Could not copy automatically.','success');
  }catch{
    setStatus('Could not copy automatically. Try Share prompt instead.','error');
  }
}

async function handleShare(){
  const prompt=currentPrompt();
  if(!prompt)return;

  if(!navigator.share){
    await handleCopy();
    return;
  }

  try{
    await navigator.share({title:'Add construction vocabulary',text:prompt});
    setStatus('Prompt shared. Choose ChatGPT in the share sheet when available.','success');
  }catch(error){
    if(error?.name!=='AbortError')setStatus('Share was not available. Use Copy prompt instead.','error');
  }
}

function bindWordBridge(){
  const form=document.querySelector('#addWordForm');
  const input=document.querySelector('#addWordInput');
  const copy=document.querySelector('#copyWordPrompt');
  const share=document.querySelector('#shareWordPrompt');
  if(!form)return;

  if(input){
    input.placeholder='e.g. bedding, duct spacer, valve box';
    input.setAttribute('aria-label','Construction terms to add; separate multiple terms with commas');
  }
  if(!navigator.share&&share)share.hidden=true;

  form.addEventListener('submit',event=>{
    event.preventDefault();
    handleCopy();
  });
  copy?.addEventListener('click',handleCopy);
  share?.addEventListener('click',handleShare);
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));
}

async function fetchJsonFresh(path){
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok)throw new Error(`Could not load ${path}`);
  return response.json();
}

function ensureRecentFocusCard(){
  let card=document.querySelector('#recentFocusCard');
  if(card)return card;
  const bridge=document.querySelector('.chat-bridge');
  if(!bridge)return null;
  bridge.insertAdjacentHTML('afterend',`
    <section id="recentFocusCard" class="recent-focus-card" aria-labelledby="recentFocusTitle">
      <div class="recent-focus-head">
        <div>
          <p class="system-kicker">Sync check</p>
          <h2 id="recentFocusTitle">Recently added</h2>
          <p>Your latest chat-added focus words from GitHub.</p>
        </div>
        <button id="refreshVocabulary" type="button" class="secondary">Refresh vocabulary</button>
      </div>
      <div id="recentFocusList" class="recent-focus-list" aria-live="polite">
        <div class="recent-focus-empty">Checking latest focus words…</div>
      </div>
    </section>`);
  card=document.querySelector('#recentFocusCard');
  document.querySelector('#refreshVocabulary')?.addEventListener('click',()=>{
    const button=document.querySelector('#refreshVocabulary');
    if(button){button.disabled=true;button.textContent='Refreshing…'}
    window.location.reload();
  });
  return card;
}

function dateLabel(value){
  const date=new Date(`${value}T12:00:00`);
  if(Number.isNaN(date.getTime()))return value||'';
  return date.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

export function recentFocusItems(focusData,allTerms,limit=5){
  const byId=new Map(allTerms.map(term=>[term.id,term]));
  return (Array.isArray(focusData?.terms)?focusData.terms:[])
    .map((item,index)=>({...item,_index:index,term:byId.get(item.id)}))
    .filter(item=>item.term)
    .sort((a,b)=>{
      const ad=Date.parse(`${a.last_requested_at||a.added_at||''}T12:00:00`)||0;
      const bd=Date.parse(`${b.last_requested_at||b.added_at||''}T12:00:00`)||0;
      return bd-ad||b._index-a._index;
    })
    .slice(0,limit);
}

async function loadRecentFocus(){
  const list=document.querySelector('#recentFocusList');
  if(!list)return;
  try{
    const [focus,core,expanded]=await Promise.all([
      fetchJsonFresh('data/focus-terms.json'),
      fetchJsonFresh('data/terms.json'),
      fetchJsonFresh('data/terms-expansion.json')
    ]);
    const recent=recentFocusItems(focus,[...core,...expanded],5);
    list.innerHTML=recent.length
      ?recent.map(item=>`<div class="recent-focus-row"><div><strong>${escapeHtml(item.term.term)}</strong><small>${escapeHtml(item.term.category)}</small></div><span>${escapeHtml(dateLabel(item.last_requested_at||item.added_at))}${item.request_count>1?` · ×${item.request_count}`:''}</span></div>`).join('')
      :'<div class="recent-focus-empty">No focus words yet. Add one through ChatGPT.</div>';
  }catch(error){
    console.warn('Could not load recent focus words.',error);
    list.innerHTML='<div class="recent-focus-empty">Could not check the latest focus list. Try Refresh vocabulary when online.</div>';
  }
}

function bindRecentFocus(){
  const card=ensureRecentFocusCard();
  if(card)loadRecentFocus();
}

if(typeof document!=='undefined'){
  bindInstallCard();
  bindWordBridge();
  bindRecentFocus();
}

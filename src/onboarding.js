import {
  VOCAB_INBOX_LIMIT,normalizeRequestedTerms,addInboxTerms,removeInboxTerm,
  inboxTerms,loadInbox,saveInbox,clearInbox as clearStoredInbox
} from './vocab-inbox.js';

export {normalizeRequestedTerms} from './vocab-inbox.js';
export const REPO='taiduc1302/construction-vocabulary-trainer';

const INSTALL_DISMISS_KEY='construction-vocab-install-dismissed-v1';
const INSTALL_RESHOW_MS=7*24*60*60*1000;
const MAX_BATCH_TERMS=25;
let vocabInbox=loadInbox();

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

export function buildPrompt(value){
  const terms=normalizeRequestedTerms(value);
  if(!terms.length)return '';
  const requested=terms.map(term=>`"${term.replace(/"/g,'\\\"')}"`).join(', ');
  return `Используй подключенный GitHub. В репозитории ${REPO} следуй AI_INSTRUCTIONS.md. В словарь: ${requested}. Обработай весь запрос как одно атомарное изменение: не публикуй частичное состояние; для существующих терминов обнови My focus list, для новых создай полную карточку и visual. Прогони проверки, дождись зеленого GitHub Actions и успешного Pages deployment для проверенного commit, и только после этого считай изменение завершенным.`;
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

function inputTerms(){
  const input=document.querySelector('#addWordInput');
  const terms=normalizeRequestedTerms(input?.value);
  if(!terms.length){
    input?.focus();
    setStatus('Type at least one construction term first.','error');
    return null;
  }
  if(terms.length>MAX_BATCH_TERMS){
    setStatus(`Send ${MAX_BATCH_TERMS} or fewer terms to ChatGPT at once.`,'error');
    return null;
  }
  return terms;
}

async function shareBuiltPrompt(prompt,{successMessage='Prompt shared. Choose ChatGPT in the share sheet when available.'}={}){
  if(!prompt)return false;
  if(!navigator.share){
    try{
      const copied=await copyPrompt(prompt);
      setStatus(copied?'Copied. Paste it into ChatGPT.':'Could not copy automatically.','success');
      return copied;
    }catch{
      setStatus('Could not copy automatically.','error');
      return false;
    }
  }

  try{
    await navigator.share({title:'Add construction vocabulary',text:prompt});
    setStatus(successMessage,'success');
    return true;
  }catch(error){
    if(error?.name!=='AbortError')setStatus('Share was not available. Use Copy prompt instead.','error');
    return false;
  }
}

async function handleCopy(){
  const terms=inputTerms();
  if(!terms)return;
  const prompt=buildPrompt(terms.join(', '));
  try{
    const copied=await copyPrompt(prompt);
    setStatus(copied?'Copied. Paste it into ChatGPT.':'Could not copy automatically.','success');
  }catch{
    setStatus('Could not copy automatically. Try Send now instead.','error');
  }
}

async function handleShare(){
  const terms=inputTerms();
  if(!terms)return;
  await shareBuiltPrompt(buildPrompt(terms.join(', ')));
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));
}

function inboxDate(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  return date.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

function renderInbox(){
  const count=document.querySelector('#vocabInboxCount');
  const list=document.querySelector('#vocabInboxList');
  const send=document.querySelector('#shareInbox');
  const copy=document.querySelector('#copyInbox');
  const clear=document.querySelector('#clearInbox');
  const items=vocabInbox;

  if(count)count.textContent=`${items.length} saved`;
  if(send)send.disabled=!items.length;
  if(copy)copy.disabled=!items.length;
  if(clear)clear.disabled=!items.length;
  if(!list)return;

  list.innerHTML=items.length
    ?items.map(item=>`
      <div class="inbox-row">
        <div><strong>${escapeHtml(item.term)}</strong><small>saved ${escapeHtml(inboxDate(item.addedAt))}</small></div>
        <button type="button" class="inbox-remove secondary" data-inbox-remove="${encodeURIComponent(item.term)}" aria-label="Remove ${escapeHtml(item.term)} from vocabulary inbox">Remove</button>
      </div>`).join('')
    :'<div class="inbox-empty">Nothing saved. Capture terms here during the workday and send them together later.</div>';

  list.querySelectorAll('[data-inbox-remove]').forEach(button=>button.addEventListener('click',()=>{
    const term=decodeURIComponent(button.dataset.inboxRemove||'');
    vocabInbox=saveInbox(removeInboxTerm(vocabInbox,term));
    renderInbox();
    setStatus(`Removed "${term}" from your local inbox.`,'neutral');
  }));
}

function saveCurrentToInbox(){
  const terms=inputTerms();
  if(!terms)return;
  const before=vocabInbox.length;
  vocabInbox=saveInbox(addInboxTerms(vocabInbox,terms.join(', ')));
  const added=vocabInbox.length-before;
  document.querySelector('#addWordInput').value='';
  renderInbox();
  const panel=document.querySelector('#vocabInboxPanel');
  if(panel)panel.open=true;
  if(vocabInbox.length>=VOCAB_INBOX_LIMIT&&added<terms.length){
    setStatus(`Inbox is full at ${VOCAB_INBOX_LIMIT} saved terms. Send or clear some before saving more.`,'error');
    return;
  }
  setStatus(added
    ?`Saved ${added} term${added===1?'':'s'} locally. Send the inbox to ChatGPT when convenient.`
    :'Those terms are already in your local inbox.','success');
}

async function shareInbox(){
  const terms=inboxTerms(vocabInbox);
  if(!terms.length){setStatus('Your vocabulary inbox is empty.','error');return}
  if(terms.length>MAX_BATCH_TERMS){
    setStatus(`Your inbox has ${terms.length} terms. Send at most ${MAX_BATCH_TERMS} at a time so AI can review each term carefully.`,'error');
    return;
  }
  await shareBuiltPrompt(buildPrompt(terms.join(', ')),{
    successMessage:'Inbox shared. Keep it until the words appear in Recently added, then clear it.'
  });
}

async function copyInbox(){
  const terms=inboxTerms(vocabInbox);
  if(!terms.length){setStatus('Your vocabulary inbox is empty.','error');return}
  if(terms.length>MAX_BATCH_TERMS){
    setStatus(`Your inbox has ${terms.length} terms. Remove or send some first; the AI batch limit is ${MAX_BATCH_TERMS}.`,'error');
    return;
  }
  try{
    const copied=await copyPrompt(buildPrompt(terms.join(', ')));
    setStatus(copied?'Inbox prompt copied. Paste it into ChatGPT.':'Could not copy automatically.','success');
  }catch{
    setStatus('Could not copy the inbox prompt.','error');
  }
}

function clearInbox(){
  if(!vocabInbox.length)return;
  const ok=typeof window.confirm!=='function'||window.confirm('Clear all saved vocabulary from this device?');
  if(!ok)return;
  vocabInbox=clearStoredInbox();
  renderInbox();
  setStatus('Local vocabulary inbox cleared.','neutral');
}

function bindWordBridge(){
  const form=document.querySelector('#addWordForm');
  const input=document.querySelector('#addWordInput');
  const copy=document.querySelector('#copyWordPrompt');
  const share=document.querySelector('#shareWordPrompt');
  const save=document.querySelector('#saveWordInbox');
  if(!form)return;

  if(input){
    input.placeholder='e.g. bedding, duct spacer, valve box';
    input.setAttribute('aria-label','Construction terms to add; separate multiple terms with commas');
  }
  if(!navigator.share&&share)share.textContent='Copy for ChatGPT';

  form.addEventListener('submit',event=>{
    event.preventDefault();
    saveCurrentToInbox();
  });
  copy?.addEventListener('click',handleCopy);
  share?.addEventListener('click',handleShare);
  save?.addEventListener('click',saveCurrentToInbox);
  document.querySelector('#shareInbox')?.addEventListener('click',shareInbox);
  document.querySelector('#copyInbox')?.addEventListener('click',copyInbox);
  document.querySelector('#clearInbox')?.addEventListener('click',clearInbox);
  renderInbox();
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
          <p>Your latest chat-added focus words from the validated live vocabulary.</p>
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

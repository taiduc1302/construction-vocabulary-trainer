const REPO='taiduc1302/construction-vocabulary-trainer';
const INSTALL_DISMISS_KEY='construction-vocab-install-dismissed-v1';
const INSTALL_RESHOW_MS=7*24*60*60*1000;

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

function normalizeTerm(value){
  return String(value||'').trim().replace(/\s+/g,' ');
}

function buildPrompt(term){
  const safe=normalizeTerm(term).replace(/[“”]/g,'"');
  return `@GitHub В репозитории ${REPO} следуй AI_INSTRUCTIONS.md. Добавь в мой строительный словарь слово "${safe}". Если термин уже существует, не создавай дубликат: обнови My focus list. Если отсутствует — создай полную карточку и visual. Прогони проверки и проверь GitHub Actions.`;
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
  const term=normalizeTerm(input?.value);
  if(!term){
    input?.focus();
    setStatus('Type the construction word first.','error');
    return null;
  }
  return buildPrompt(term);
}

async function handleCopy(){
  const prompt=currentPrompt();
  if(!prompt)return;
  try{
    const copied=await copyPrompt(prompt);
    setStatus(copied?'Copied. Paste it into ChatGPT.':'Could not copy automatically.','success');
  }catch{
    setStatus('Could not copy automatically. Select the word and try Share instead.','error');
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
    await navigator.share({title:'Add construction word',text:prompt});
    setStatus('Prompt shared. Choose ChatGPT in the share sheet when available.','success');
  }catch(error){
    if(error?.name!=='AbortError')setStatus('Share was not available. Use Copy prompt instead.','error');
  }
}

function bindWordBridge(){
  const form=document.querySelector('#addWordForm');
  const copy=document.querySelector('#copyWordPrompt');
  const share=document.querySelector('#shareWordPrompt');
  if(!form)return;

  if(!navigator.share&&share)share.hidden=true;

  form.addEventListener('submit',event=>{
    event.preventDefault();
    handleCopy();
  });
  copy?.addEventListener('click',handleCopy);
  share?.addEventListener('click',handleShare);
}

bindInstallCard();
bindWordBridge();

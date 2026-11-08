import {renderTermVisual} from './visuals-all.js';
import {mergeTermMetadata} from './practice-engine.js';
import {loadPersonalFocus,savePersonalFocus,addCapturedFocus} from './learner-profile.js';

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
async function fetchJson(path){const r=await fetch(path);if(!r.ok)throw new Error(`Could not load ${path}`);return r.json()}
function normalize(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
async function init(){
  const [core,expanded,meta]=await Promise.all([
    fetchJson('data/terms.json'),fetchJson('data/terms-expansion.json'),fetchJson('data/term-meta.json')
  ]);
  const terms=mergeTermMetadata([...core,...expanded],meta);
  const query=new URLSearchParams(location.search).get('term')||'';
  const key=normalize(query);
  const term=terms.find(item=>normalize(item.id)===key||normalize(item.term)===key||(item.aliases_en||[]).some(alias=>normalize(alias)===key));
  const host=document.querySelector('#termPage');
  if(!term){
    document.title='Term not found · Civil Construction English';
    host.innerHTML='<section class="term-not-found"><h1>Term not found</h1><p>Try the main dictionary search.</p><a href="./">Open dictionary</a></section>';
    return;
  }
  document.title=`${term.term} — construction meaning · Civil Construction English`;
  const related=term.related_terms?.map(id=>terms.find(item=>item.id===id)).filter(Boolean).slice(0,8)||[];
  host.innerHTML=`
    <article class="term-public-card">
      <div class="term-public-head">
        <div><p class="term-public-kicker">${escapeHtml(term.category)} · construction English</p><h1>${escapeHtml(term.term)}</h1><p class="term-public-pronunciation">${escapeHtml(term.pronunciation||'')}</p></div>
        <button id="addTermToWords" type="button">+ Add to My Words</button>
      </div>
      <div class="term-public-visual">${renderTermVisual(term)}</div>
      <section><h2>What it means</h2><p>${escapeHtml(term.definition_en)}</p></section>
      <div class="term-language-grid">
        <section><h2>Russian</h2><p><strong>${escapeHtml((term.translation_ru||[]).join(', '))}</strong></p><p>${escapeHtml(term.explanation_ru||'')}</p></section>
        <section><h2>Vietnamese</h2><p><strong>${escapeHtml((term.translation_vi||[]).join(', '))}</strong></p></section>
      </div>
      <section><h2>At work</h2><p>${escapeHtml(term.example_en)}</p></section>
      ${term.common_mistakes?.length?`<section class="term-watch"><h2>Estimator / field check</h2><ul>${term.common_mistakes.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`:''}
      ${related.length?`<section><h2>Related terms</h2><div class="related-term-links">${related.map(item=>`<a href="term.html?term=${encodeURIComponent(item.id)}">${escapeHtml(item.term)}</a>`).join('')}</div></section>`:''}
      <div class="term-public-actions">
        <a href="./?learn=${encodeURIComponent(term.id)}" class="primary-link">Practice this term</a>
        <button id="shareTerm" type="button" class="secondary">Share</button>
      </div>
    </article>`;
  document.querySelector('#addTermToWords').addEventListener('click',event=>{
    savePersonalFocus(addCapturedFocus(loadPersonalFocus(),term.id));
    event.currentTarget.textContent='✓ Added to My Words';event.currentTarget.disabled=true;
  });
  document.querySelector('#shareTerm').addEventListener('click',async()=>{
    const url=location.href;
    const text=`${term.term} — ${term.definition_en}`;
    if(navigator.share){try{await navigator.share({title:term.term,text,url});return}catch(error){if(error?.name==='AbortError')return}}
    await navigator.clipboard?.writeText?.(url);
    document.querySelector('#shareTerm').textContent='Link copied';
  });
}
init().catch(error=>{
  document.querySelector('#termPage').innerHTML=`<div class="term-not-found">Could not load this term: ${escapeHtml(error.message)}</div>`;
});

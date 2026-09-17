const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function wrap(term,body){
  const label=esc(`${term.term}: ${term.visual||term.definition_en}`);
  return `<figure class="technical-visual"><svg viewBox="0 0 320 180" role="img" aria-label="${label}">${body}</svg><figcaption>${esc(term.visual||'Construction schematic')}</figcaption></figure>`;
}

const diagrams={
  'silt-fence':`<path class="tv-ground" d="M0 75l320 62v23H0z"/><path class="tv-line-heavy" d="M34 82l235 46"/><path class="tv-steel-line" d="M205 67v82M242 75v82"/><path class="tv-layer-highlight" d="M205 84l37 7v48l-37-7z"/><path class="tv-water-line" d="M55 72l109 22"/><path class="tv-arrow" d="M151 86l15 8-16 4"/><path class="tv-fill-layer" d="M178 113l27 5v20l-38-7z"/><text class="tv-label" x="188" y="55">SILT FENCE</text><text class="tv-small" x="55" y="58">RUNOFF</text><text class="tv-small" x="133" y="147">SEDIMENT</text>`
};

export function renderChatVisual(term){
  const body=diagrams[term.id];
  return body?wrap(term,body):null;
}

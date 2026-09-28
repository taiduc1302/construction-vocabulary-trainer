const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function wrap(term,body){
  const label=esc(`${term.term}: ${term.visual||term.definition_en}`);
  return `<figure class="technical-visual"><svg viewBox="0 0 320 180" role="img" aria-label="${label}">${body}</svg><figcaption>${esc(term.visual||'Construction schematic')}</figcaption></figure>`;
}

const diagrams={
  'bulk-excavation':`<path class="tv-ground" d="M0 58H320V180H0z"/><path class="tv-line-heavy" d="M28 58l34 66h196l34-66"/><path class="tv-fill-layer" d="M62 124h196v30H62z"/><rect class="tv-layer-highlight" x="110" y="88" width="54" height="27" rx="4"/><path class="tv-steel-line" d="M136 88l-14-20M142 88l22-19"/><path class="tv-arrow" d="M175 97l44 0 13-10"/><text class="tv-label" x="92" y="30">BULK EXCAVATION</text><text class="tv-small" x="86" y="146">FORMATION LEVEL</text><text class="tv-small" x="205" y="78">HAUL</text>`,
  'footing-excavation':`<path class="tv-ground" d="M0 68H320V180H0z"/><path class="tv-line-heavy" d="M86 68v48l24 28h100l24-28V68"/><rect class="tv-layer-highlight" x="118" y="119" width="84" height="25"/><path class="tv-steel-line" d="M128 119h64M135 113v31M185 113v31"/><text class="tv-label" x="82" y="34">FOOTING EXCAVATION</text><text class="tv-small" x="124" y="158">FOOTING ZONE</text><text class="tv-small" x="22" y="62">FORMATION</text>`,
  'below-grade-plumbing':`<path class="tv-ground" d="M0 74H320V180H0z"/><rect class="tv-layer-highlight" x="48" y="111" width="92" height="28"/><rect class="tv-layer-highlight" x="205" y="111" width="67" height="28"/><path class="tv-water-line" d="M18 151h98q20 0 20-20v-6h85v26h81"/><circle class="tv-water-line" cx="136" cy="125" r="6"/><path class="tv-steel-line" d="M140 125h65"/><text class="tv-label" x="80" y="34">BELOW-GRADE PLUMBING</text><text class="tv-small" x="54" y="104">FOOTING</text><text class="tv-small" x="205" y="104">FOOTING</text><text class="tv-small" x="143" y="147">PIPE ROUTE</text>`,
  'hydrant':`<path class="tv-ground" d="M0 126H320V180H0z"/><path class="tv-water-line" d="M28 150H292"/><path class="tv-water-line" d="M160 150V116"/><rect class="tv-layer-highlight" x="145" y="62" width="30" height="58" rx="5"/><rect class="tv-layer-highlight" x="138" y="51" width="44" height="18" rx="7"/><circle class="tv-layer-highlight" cx="139" cy="84" r="7"/><circle class="tv-layer-highlight" cx="181" cy="84" r="7"/><path class="tv-steel-line" d="M160 116V150"/><text class="tv-label" x="123" y="39">HYDRANT</text><text class="tv-small" x="28" y="166">BURIED WATERMAIN</text><text class="tv-small" x="183" y="117">BRANCH</text>`,
  'silt-fence':`<path class="tv-ground" d="M0 75l320 62v23H0z"/><path class="tv-line-heavy" d="M34 82l235 46"/><path class="tv-steel-line" d="M205 67v82M242 75v82"/><path class="tv-layer-highlight" d="M205 84l37 7v48l-37-7z"/><path class="tv-water-line" d="M55 72l109 22"/><path class="tv-arrow" d="M151 86l15 8-16 4"/><path class="tv-fill-layer" d="M178 113l27 5v20l-38-7z"/><text class="tv-label" x="188" y="55">SILT FENCE</text><text class="tv-small" x="55" y="58">RUNOFF</text><text class="tv-small" x="133" y="147">SEDIMENT</text>`
};

export function renderChatVisual(term){
  const body=diagrams[term.id];
  return body?wrap(term,body):null;
}

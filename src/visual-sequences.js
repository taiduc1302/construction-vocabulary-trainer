// Optional, learner-controlled construction process illustrations.
// These are simplified teaching visuals, NOT construction instructions or takeoff drawings.
// Never call this renderer from quiz/answer-safe src/visuals-all.js.

const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svgStart='<rect x="0" y="0" width="320" height="180" rx="12" fill="#eef5f2"/>';
const ground='<path d="M0 46H320V180H0z" fill="#d9d1bd"/>';
const trench='<path d="M88 57V170H232V57" fill="#edf7f5" stroke="#6b7d70" stroke-width="3"/>';
const drawings={
 'duct-bank': `${svgStart}${ground}${trench}
   <g class="sequence-layer seq-at-2"><rect x="107" y="98" width="106" height="60" rx="4" fill="#d5d6d2" stroke="#777c79" stroke-width="2"/></g>
   <g class="sequence-layer seq-at-1" stroke="#4e7567" fill="#f7faf9" stroke-width="3">
      <rect x="110" y="118" width="100" height="7" fill="#a1b4ad" stroke="none"/>
      <circle cx="130" cy="113" r="11"/><circle cx="160" cy="113" r="11"/><circle cx="190" cy="113" r="11"/>
      <circle cx="130" cy="142" r="11"/><circle cx="160" cy="142" r="11"/><circle cx="190" cy="142" r="11"/>
   </g>
   <g class="sequence-layer seq-at-3"><path d="M91 60h138v30H91z" fill="#c7b798" stroke="#99896b" stroke-width="2"/><path d="M88 57h144" stroke="#586e62" stroke-width="3"/></g>`,
 'culvert': `${svgStart}${ground}<path d="M0 44h92l42 28h52l42-28h92v20H0z" fill="#5c6266"/>${trench}
   <g class="sequence-layer seq-at-1"><path d="M107 132h106" stroke="#a28f66" stroke-width="10"/><rect x="115" y="112" width="90" height="26" rx="13" fill="#c7d0cc" stroke="#4e625c" stroke-width="3"/></g>
   <g class="sequence-layer seq-at-2"><path d="M90 74h139v32H90z" fill="#c8bca4"/><path d="M90 73h139" stroke="#6b7d70" stroke-width="2"/><path d="M90 44h139v20H90z" fill="#5c6266"/></g>
   <g class="sequence-layer seq-at-3"><path d="M121 126h75" stroke="#4b96b0" stroke-width="5" stroke-linecap="round"/><path d="M188 119l12 7-12 7" fill="#4b96b0"/></g>`,
 'trench-box': `${svgStart}${ground}${trench}
   <g class="sequence-layer seq-at-1" fill="#bdc9cb" stroke="#50646a" stroke-width="4">
      <rect x="105" y="75" width="10" height="84"/><rect x="205" y="75" width="10" height="84"/>
      <path d="M114 93h92m-92 48h92" fill="none" stroke="#50646a" stroke-width="5"/>
   </g>
   <g class="sequence-layer seq-at-2"><circle cx="160" cy="154" r="17" fill="#c7d0cc" stroke="#4e625c" stroke-width="4"/><circle cx="160" cy="154" r="9" fill="#edf7f5"/></g>
   <g class="sequence-layer seq-at-3"><rect x="119" y="97" width="82" height="38" rx="8" fill="#8bc8b0" opacity=".37"/><path d="M142 116l11 9 22-23" stroke="#28765b" stroke-width="5" fill="none" stroke-linecap="round"/></g>`
};

export const SEQUENCES=Object.freeze({
  'duct-bank':Object.freeze({title:'Duct bank construction',steps:[
    'Prepare the trench to the required alignment and depth.',
    'Install conduit spacers and position the conduits.',
    'Place the specified concrete encasement around the conduits.',
    'Backfill and restore the surface as required.'
  ],caution:'Schematic only. Confirm cover, conduit spacing, concrete and inspections against the project drawings and specifications.'}),
  'culvert':Object.freeze({title:'Culvert crossing and flow',steps:[
    'Prepare the crossing excavation.',
    'Set the culvert on prepared bedding to design line and grade.',
    'Backfill and restore the crossing.',
    'Check that water can flow through the culvert beneath the road.'
  ],caution:'Schematic only. Verify hydraulics, inlet/outlet details, bedding and installation requirements in the project drawings.'}),
  'trench-box':Object.freeze({title:'Trench box protection',steps:[
    'Identify the excavation and approved protection approach.',
    'Position the trench shield according to the engineered work plan.',
    'Carry out the permitted pipe work inside the protected space.',
    'Maintain safe access and the required excavation controls.'
  ],caution:'A trench box shields workers inside it from cave-ins; it does not necessarily shore trench walls. Follow the applicable excavation safety plan.'})
});
export function supportedSequenceIds(){return Object.keys(SEQUENCES)}
export function renderConstructionSequence(id){
  const config=SEQUENCES[id];
  if(!config)return '';
  const titleId=`seq-${id}-title`,descriptionId=`seq-${id}-description`;
  return `<section class="construction-sequence" data-sequence-id="${id}" data-state="idle" data-step="0" aria-label="${esc(config.title)} interactive illustration">
    <div class="sequence-intro"><strong>${esc(config.title)}</strong><span>Four illustrative stages</span></div>
    <svg viewBox="0 0 320 180" role="img" aria-labelledby="${titleId} ${descriptionId}" xmlns="http://www.w3.org/2000/svg">
       <title id="${titleId}">${esc(config.title)}</title><desc id="${descriptionId}">${esc(config.caution)}</desc>${drawings[id]}
    </svg>
    <p class="sequence-status" role="status" aria-live="polite" data-sequence-status>Step 1 of 4: ${esc(config.steps[0])}</p>
    <div class="sequence-controls">
      <button type="button" data-sequence-action="play" aria-label="Play ${esc(config.title)}">Play sequence</button>
      <button type="button" class="secondary" data-sequence-action="pause" disabled>Pause</button>
      <button type="button" class="secondary" data-sequence-action="next">Next step</button>
      <button type="button" class="secondary" data-sequence-action="replay">Replay</button>
    </div>
    <p class="sequence-caution">${esc(config.caution)}</p>
  </section>`;
}

const activeTimers=new WeakMap();
const boundRoots=new WeakSet();
function stopTimer(element){const timer=activeTimers.get(element);if(timer!==undefined)clearInterval(timer);activeTimers.delete(element)}
function updateDisplay(element,step,state){
  const config=SEQUENCES[element.dataset.sequenceId];
  if(!config)return;
  const safe=Math.max(0,Math.min(config.steps.length-1,step));
  element.dataset.step=String(safe);element.dataset.state=state;
  element.querySelector('[data-sequence-status]').textContent=`Step ${safe+1} of ${config.steps.length}: ${config.steps[safe]}`;
  const play=element.querySelector('[data-sequence-action="play"]');
  const pause=element.querySelector('[data-sequence-action="pause"]');
  const next=element.querySelector('[data-sequence-action="next"]');
  play.disabled=state==='playing';
  play.textContent=state==='paused'?'Resume':'Play sequence';
  pause.disabled=state!=='playing';
  next.disabled=safe===config.steps.length-1;
}
function playSequence(element,{restart=false}={}){
  stopTimer(element);
  if(restart)updateDisplay(element,0,'idle');
  const last=SEQUENCES[element.dataset.sequenceId].steps.length-1;
  if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    updateDisplay(element,last,'finished');
    return;
  }
  if(Number(element.dataset.step)>=last)updateDisplay(element,0,'idle');
  updateDisplay(element,Number(element.dataset.step),'playing');
  activeTimers.set(element,setInterval(()=>{
    if(!element.isConnected){stopTimer(element);return}
    const next=Number(element.dataset.step)+1;
    if(next>=last){stopTimer(element);updateDisplay(element,last,'finished')}
    else updateDisplay(element,next,'playing');
  },2000));
}
export function installSequenceControls(root=document){
  if(boundRoots.has(root))return;
  boundRoots.add(root);
  root.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-sequence-action]');
    const element=button?.closest('.construction-sequence');
    if(!element||!SEQUENCES[element.dataset.sequenceId])return;
    const action=button.dataset.sequenceAction;
    if(action==='play')playSequence(element);
    else if(action==='replay')playSequence(element,{restart:true});
    else if(action==='pause'){
      stopTimer(element);
      updateDisplay(element,Number(element.dataset.step),'paused');
    }else if(action==='next'){
      stopTimer(element);
      const step=Math.min(SEQUENCES[element.dataset.sequenceId].steps.length-1,Number(element.dataset.step)+1);
      updateDisplay(element,step,step===3?'finished':'paused');
    }
  });
}

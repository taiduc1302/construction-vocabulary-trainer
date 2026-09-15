const scenes=[
  {
    id:'drainage-plan',
    title:'Road drainage plan',
    description:'A simplified plan view of a road crossing with drainage features.',
    svg:`<svg viewBox="0 0 720 360" role="img" aria-label="Simplified road drainage plan with lettered callouts">
      <rect x="0" y="0" width="720" height="360" class="dc-paper"/>
      <path d="M40 122H680M40 238H680" class="dc-road-edge"/>
      <path d="M40 180H680" class="dc-centerline"/>
      <path d="M92 104C155 80 210 88 270 108" class="dc-ditch"/>
      <path d="M450 250C510 280 570 282 646 252" class="dc-ditch"/>
      <rect x="225" y="111" width="28" height="22" class="dc-structure"/>
      <rect x="490" y="227" width="28" height="22" class="dc-structure"/>
      <path d="M239 133V286H505V249" class="dc-storm"/>
      <circle cx="374" cy="286" r="18" class="dc-manhole"/>
      <path d="M310 102V258" class="dc-culvert"/>
      <path d="M299 110L310 98l11 12M299 250l11 12 11-12" class="dc-flow"/>
      <g class="dc-callout"><circle cx="208" cy="87" r="16"/><text x="208" y="92">A</text></g>
      <g class="dc-callout"><circle cx="344" cy="314" r="16"/><text x="344" y="319">B</text></g>
      <g class="dc-callout"><circle cx="404" cy="286" r="16"/><text x="404" y="291">C</text></g>
      <g class="dc-callout"><circle cx="337" cy="108" r="16"/><text x="337" y="113">D</text></g>
      <g class="dc-callout"><circle cx="595" cy="292" r="16"/><text x="595" y="297">E</text></g>
      <text x="42" y="35" class="dc-title">SIMPLIFIED PLAN VIEW</text>
      <text x="42" y="58" class="dc-note">Roadway / drainage — not to scale</text>
    </svg>`,
    targets:[
      {label:'A',termId:'catch-basin'},
      {label:'B',termId:'storm-sewer'},
      {label:'C',termId:'manhole'},
      {label:'D',termId:'culvert'},
      {label:'E',termId:'ditch'}
    ]
  },
  {
    id:'road-section',
    title:'Road structure section',
    description:'A simplified roadway cross-section showing pavement and granular layers.',
    svg:`<svg viewBox="0 0 720 360" role="img" aria-label="Simplified roadway cross section with lettered callouts">
      <rect x="0" y="0" width="720" height="360" class="dc-paper"/>
      <path d="M70 105H565v30H70z" class="dc-asphalt"/>
      <path d="M70 135H565v48H70z" class="dc-base"/>
      <path d="M70 183H565v62H70z" class="dc-subbase"/>
      <path d="M70 245H565v70H70z" class="dc-subgrade"/>
      <path d="M565 315V116h46v38h76v161z" class="dc-curb"/>
      <path d="M70 95H565v10H70z" class="dc-overlay"/>
      <g class="dc-callout"><circle cx="112" cy="78" r="16"/><text x="112" y="83">A</text></g>
      <g class="dc-callout"><circle cx="142" cy="158" r="16"/><text x="142" y="163">B</text></g>
      <g class="dc-callout"><circle cx="235" cy="215" r="16"/><text x="235" y="220">C</text></g>
      <g class="dc-callout"><circle cx="345" cy="278" r="16"/><text x="345" y="283">D</text></g>
      <g class="dc-callout"><circle cx="628" cy="170" r="16"/><text x="628" y="175">E</text></g>
      <text x="42" y="35" class="dc-title">SIMPLIFIED ROAD SECTION</text>
      <text x="42" y="58" class="dc-note">Layer thicknesses are schematic only</text>
    </svg>`,
    targets:[
      {label:'A',termId:'overlay'},
      {label:'B',termId:'base-course'},
      {label:'C',termId:'subbase'},
      {label:'D',termId:'subgrade'},
      {label:'E',termId:'curb-and-gutter'}
    ]
  },
  {
    id:'utility-trench',
    title:'Utility trench section',
    description:'A simplified trench section with pipe-zone and protection components.',
    svg:`<svg viewBox="0 0 720 360" role="img" aria-label="Simplified utility trench section with lettered callouts">
      <rect x="0" y="0" width="720" height="360" class="dc-paper"/>
      <path d="M82 72H638V324H82z" class="dc-soil"/>
      <path d="M220 72L248 316H472L500 72z" class="dc-trench"/>
      <path d="M262 248H458V294H262z" class="dc-bedding"/>
      <rect x="286" y="142" width="148" height="88" class="dc-ductbank"/>
      <g class="dc-conduits">
        <circle cx="318" cy="174" r="14"/><circle cx="360" cy="174" r="14"/><circle cx="402" cy="174" r="14"/>
        <circle cx="318" cy="208" r="14"/><circle cx="360" cy="208" r="14"/><circle cx="402" cy="208" r="14"/>
      </g>
      <path d="M252 88H468V136H252z" class="dc-backfill"/>
      <path d="M238 92V292M482 92V292M238 132H482M238 238H482" class="dc-shoring"/>
      <g class="dc-callout"><circle cx="196" cy="112" r="16"/><text x="196" y="117">A</text></g>
      <g class="dc-callout"><circle cx="202" cy="272" r="16"/><text x="202" y="277">B</text></g>
      <g class="dc-callout"><circle cx="456" cy="182" r="16"/><text x="456" y="187">C</text></g>
      <g class="dc-callout"><circle cx="522" cy="112" r="16"/><text x="522" y="117">D</text></g>
      <g class="dc-callout"><circle cx="516" cy="254" r="16"/><text x="516" y="259">E</text></g>
      <text x="42" y="35" class="dc-title">SIMPLIFIED UTILITY TRENCH</text>
      <text x="42" y="58" class="dc-note">Generic teaching section — not a construction detail</text>
    </svg>`,
    targets:[
      {label:'A',termId:'backfill'},
      {label:'B',termId:'bedding'},
      {label:'C',termId:'duct-bank'},
      {label:'D',termId:'shoring'},
      {label:'E',termId:'trench'}
    ]
  }
];

export function getDrawingScenes(){return scenes.map(scene=>({...scene,targets:scene.targets.map(t=>({...t}))}))}

export function randomDrawingTarget(scene,previousTermId=null){
  const pool=scene.targets.filter(t=>t.termId!==previousTermId);
  const source=pool.length?pool:scene.targets;
  return source[Math.floor(Math.random()*source.length)];
}

export function renderDrawingScene(scene){
  return `<figure class="drawing-sheet">${scene.svg}<figcaption>${scene.description}</figcaption></figure>`;
}

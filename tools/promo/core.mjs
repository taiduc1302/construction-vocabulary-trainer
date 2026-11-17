// Original, dependency-free build-time SVG artwork for Construction Vocabulary Trainer.
// The shared-config/multi-target approach was inspired by ChanMeng666's app-promo-studio.
export const TARGETS=Object.freeze({
  'readme':{width:1600,height:780,label:'README banner'},
  'og':{width:1200,height:630,label:'Open Graph'},
  'linkedin':{width:1200,height:627,label:'LinkedIn landscape'},
  'instagram-portrait':{width:1080,height:1350,label:'Instagram portrait'}
});

const palette=Object.freeze({
  navy:'#111923',navy2:'#1c2b38',green:'#1c6b52',mint:'#d9efe5',sand:'#d7a553',
  ink:'#18212b',slate:'#667886',paper:'#f3f6f8',white:'#fff',line:'#dfe6eb'
});

export const escapeXml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function checkText(value,label,max=220){
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f]/.test(value))throw new Error(`${label} must be a nonempty single-line string up to ${max} characters`);
  return value.trim();
}
export function validateConfig(cfg){
  if(!cfg||typeof cfg!=='object'||Array.isArray(cfg))throw new Error('Promo config must be an object');
  checkText(cfg.appName,'appName',45);
  checkText(cfg.headline,'headline',75);
  checkText(cfg.subheadline,'subheadline',180);
  if(!Array.isArray(cfg.targets)||!cfg.targets.length||new Set(cfg.targets).size!==cfg.targets.length)throw new Error('targets must be a nonempty list without duplicates');
  for(const id of cfg.targets)if(!Object.hasOwn(TARGETS,id))throw new Error(`Unsupported target: ${id}`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cfg.featuredTermId||''))throw new Error('featuredTermId must be a canonical term ID');
  if(!Array.isArray(cfg.featureLabels)||cfg.featureLabels.length<2||cfg.featureLabels.length>3)throw new Error('featureLabels must contain two or three labels');
  cfg.featureLabels.forEach((x,i)=>checkText(x,`featureLabels[${i}]`,32));
  return cfg;
}
const rect=(x,y,w,h,rx,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const line=(x1,y1,x2,y2,stroke,sw=1,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const text=(x,y,s,size,fill,weight=400,extra='')=>`<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${escapeXml(s)}</text>`;
function wrapLines(str,maxChars,maxLines=3){
  const words=String(str).trim().split(/\s+/);
  const rows=[];let row='';
  for(const word of words){
    if((row?row.length+1:0)+word.length<=maxChars)row+=(row?' ':'')+word;
    else{if(row)rows.push(row);row=word;}
  }
  if(row)rows.push(row);
  const out=rows.slice(0,maxLines);
  if(rows.length>maxLines){out[maxLines-1]=out[maxLines-1].replace(/[.,;:]+$/,'').slice(0,Math.max(1,maxChars-2)).trimEnd()+'…';}
  return out;
}
function textBlock(x,y,contents,fontSize,color,weight,lineGap,maxChars,maxLines){
  return wrapLines(contents,maxChars,maxLines).map((row,i)=>text(x,y+i*lineGap,row,fontSize,color,weight)).join('');
}
function logo(x,y,size){
  const k=size/72;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    ${rect(0,0,72,72,17,palette.navy)}
    <path d="M12 48h48v8H12z" fill="${palette.sand}"/>
    <path d="M18 40h36l-5-18H23z" fill="#eef3f1"/>
    <path d="M26 48V38c0-7 4-11 10-11s10 4 10 11v10h-7V38c0-3-1-4-3-4s-3 1-3 4v10z" fill="${palette.green}"/>
    <path d="M17 17h38" stroke="${palette.sand}" stroke-width="3.5" stroke-linecap="round"/>
  </g>`;
}
function termDiagram(x,y,w,h,svgBody,diagramCss){
  // The geometry is extracted from the real src/visuals-all.js renderer.
  // The layout uses its original 320x180 viewBox, not a hand-drawn replacement.
  if(typeof svgBody!=='string'||!/\S/.test(svgBody)||/<(?:script|foreignObject|image)\b/i.test(svgBody)||/\bon\w+\s*=|(?:xlink:)?href\s*=/i.test(svgBody))throw new Error('Unsafe or missing canonical diagram markup');
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet"><style>${diagramCss}</style>${svgBody}</svg>`;
}
function productWindow(x,y,w,h,{term,svgBody,diagramCss,screenshotDataUri}={}){
  const navH=Math.round(h*.12),inner=26,diagramY=y+navH+85;
  const termText=term.term.toLowerCase();
  let body=`${rect(x,y,w,h,22,palette.white,`stroke="${palette.line}" stroke-width="2"`)}
    <path d="M${x+22} ${y}h${w-44}q22 0 22 22v${navH-22}H${x}V${y+22}q0-22 22-22" fill="#edf3f0"/>
    ${[0,1,2].map(i=>`<circle cx="${x+23+i*20}" cy="${y+Math.round(navH/2)}" r="5" fill="${['#e7b098','#dfc589','#9dcabc'][i]}"/>`).join('')}
    ${text(x+w/2,y+Math.round(navH/2)+6,'Construction English',Math.max(14,Math.round(w*.029)),palette.ink,700,'text-anchor="middle"')}
    ${line(x,y+navH,x+w,y+navH,palette.line,1)}
    ${text(x+inner,y+navH+35,'DICTIONARY  /  VISUAL LEARNING',Math.max(11,Math.round(w*.018)),palette.green,750,'letter-spacing="1.2"')}
    ${text(x+inner,y+navH+69,termText,Math.max(20,Math.round(w*.044)),palette.ink,750)}
    ${rect(x+inner,diagramY,w-inner*2,Math.round(h*.40),16,'#edf5f1')}
    ${termDiagram(x+inner+10,diagramY+10,w-inner*2-20,Math.round(h*.40)-20,svgBody,diagramCss)}
    ${text(x+inner,diagramY+Math.round(h*.40)+31,'WHAT IT MEANS',Math.max(11,Math.round(w*.019)),palette.green,750,'letter-spacing="1"')}
    ${textBlock(x+inner,diagramY+Math.round(h*.40)+60,term.definition_en,Math.max(13,Math.round(w*.027)),palette.ink,400,Math.round(w*.041),Math.max(26,Math.floor(w/14)),3)}
  `;
  if(screenshotDataUri){
    const id=`promo-screen-${Math.round(x)}-${Math.round(y)}`;
    body+=`<defs><clipPath id="${id}">${rect(x+7,y+7,w-14,h-14,17,'white')}</clipPath></defs><image x="${x+7}" y="${y+7}" width="${w-14}" height="${h-14}" href="${screenshotDataUri}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`;
  }
  return body;
}
function commonCss(){return `<style>
  .promo-white{fill:${palette.white}}.promo-muted{fill:#b9c7d1}
  @media (prefers-reduced-motion: reduce) { * {animation:none!important;transition:none!important;} }
</style>`;}
function backplate(w,h,vertical){
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111923"/><stop offset="1" stop-color="#203f3b"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#4b947d" stop-opacity=".22"/><stop offset="1" stop-color="#4b947d" stop-opacity="0"/></radialGradient>
  </defs>${rect(0,0,w,h,0,'url(#bg)')}
  <circle cx="${vertical?w*.7:w*.8}" cy="${vertical?h*.56:h*.52}" r="${vertical?660:560}" fill="url(#glow)"/>
  <g stroke="white" stroke-opacity=".04" stroke-width="2">${Array.from({length:16},(_,i)=>line(0,Math.round(i*h/15),w,Math.round(i*h/15),'white',1,'stroke-opacity=".055"')).join('')}</g>`;
}
function featureChips(cfg,x,y,width,vertical){
  const gap=10;const labels=cfg.featureLabels;
  if(vertical){
    return labels.map((label,i)=>`${rect(x+i*0,y+i*51,Math.min(width,Math.max(200,label.length*12+55)),40,20,'#2b554b')}${text(x+18,y+i*51+27,label,19,'#e7f4ed',600)}`).join('');
  }
  let currentX=x;return labels.map(label=>{const cw=Math.max(150,Math.min(width,label.length*11+54));const markup=`${rect(currentX,y,cw,42,21,'#2b554b')}${text(currentX+18,y+28,label,19,'#e7f4ed',600)}`;currentX+=cw+gap;return markup}).join('');
}
export function renderPromoSvg(cfg,{target,term,svgBody,diagramCss,screenshotDataUri=null}={}){
  validateConfig(cfg);
  const spec=TARGETS[target];if(!spec||!cfg.targets.includes(target))throw new Error(`Target ${target} is not configured`);
  if(!term||term.id!==cfg.featuredTermId||!term.term||!term.definition_en)throw new Error('Featured term must match canonical term data');
  if(typeof diagramCss!=='string'||!diagramCss.includes('.tv-'))throw new Error('Canonical diagram CSS must be provided');
  const {width:w,height:h}=spec,vertical=h>w;
  const main=vertical?`
    ${logo(70,60,74)}${text(163,108,cfg.appName,26,'#f4f7f6',700)}
    ${textBlock(74,245,cfg.headline,74,palette.white,790,82,20,3)}
    ${textBlock(76,430,cfg.subheadline,27,'#b9c7d1',400,39,36,3)}
    ${featureChips(cfg,74,560,380,true)}
    ${productWindow(74,780,932,470,{term,svgBody,diagramCss,screenshotDataUri})}
    ${text(76,1311,'FREE  •  BROWSER-BASED  •  WORKS OFFLINE',19,'#b9c7d1',650,'letter-spacing="1.2"')}
  `:`
    ${logo(64,55,62)}${text(142,99,cfg.appName,24,'#f4f7f6',700)}
    ${textBlock(66,230,cfg.headline,w>=1500?64:51,palette.white,800,w>=1500?77:66,w>=1500?26:24,3)}
    ${textBlock(70,w>=1500?395:345,cfg.subheadline,w>=1500?23:19,'#b9c7d1',400,w>=1500?35:31,w>=1500?38:33,3)}
    ${featureChips(cfg,68,h-120,w*.52,false)}
    ${productWindow(w>=1500?915:685,h>=700?135:145,w>=1500?610:465,h>=700?565:420,{term,svgBody,diagramCss,screenshotDataUri})}
    ${text(68,h-35,'FREE  •  BROWSER-BASED  •  WORKS OFFLINE',w>=1500?18:14,'#b9c7d1',620,'letter-spacing="1.0"')}
  `;
  const description=`An illustrated promotional layout built from actual Construction Vocabulary Trainer labels and its canonical SVG term diagram. Featured entry: ${term.term}. ${term.definition_en} This is not a screen capture.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="promoTitle promoDesc">
  <title id="promoTitle">${escapeXml(cfg.appName)} — ${escapeXml(cfg.headline)}</title><desc id="promoDesc">${escapeXml(description)}</desc>
  ${commonCss()}${backplate(w,h,vertical)}${main}
</svg>\n`;
}

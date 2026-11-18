#!/usr/bin/env node
// Original, dependency-free data-backed README demonstration.
// The CSS-only, self-contained SVG is safe to embed as <img> in GitHub.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'assets/visuals/readme-demo.svg');
const CHECK=process.argv.includes('--check');
const e=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const terms=[...JSON.parse(read('data/terms.json')),...JSON.parse(read('data/terms-expansion.json'))];
const packs=JSON.parse(read('data/learning-packs.json'));
const term=terms.find(x=>x.id==='duct-bank');
const pack=packs.find(x=>x.id==='duct-bank');
if(!term||term.term!=='duct bank'||!pack||!pack.term_ids.includes(term.id))throw Error('Expected canonical duct-bank term in Duct Bank / Electrical pack');
const index=read('index.html');
for(const label of ['Construction English','Start Smart 10','Dictionary','Progress'])if(!index.includes(label))throw Error('README demo label is absent from app: '+label);
// Source geometry is read from the existing diagram entry. No hand-drawn construction geometry is substituted.
const visuals=read('src/visuals.js');
const start=visuals.indexOf("'duct-bank':`");
const end=visuals.indexOf('`,',start+13);
if(start<0||end<0)throw Error('Canonical duct-bank SVG drawing not found');
const diagram=visuals.slice(start+13,end);
if(/<(?:script|foreignObject|image)\b|\bon\w+\s*=|(?:xlink:)?href\s*=|\$\{/i.test(diagram))throw Error('Unsafe or dynamic drawing markup');
const styleSource=read('src/styles.css');
const requiredClasses=new Set([...diagram.matchAll(/class="([^"]+)"/g)].flatMap(x=>x[1].split(/\s+/)).filter(x=>x.startsWith('tv-')));
const diagramStyle=(styleSource.match(/\.tv-[^{}]+\{[^{}]*\}/g)||[]).filter(rule=>[...requiredClasses].some(name=>rule.split('{')[0].includes('.'+name))).join('\n');
if(!diagramStyle.includes('.tv-concrete')||!diagramStyle.includes('.tv-conduit'))throw Error('Missing canonical drawing styles');
const label=(x,y,value,size=18,fill='#d9e4e8',weight=500,attrs='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" ${attrs}>${e(value)}</text>`;
const rect=(x,y,w,h,rx,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
function phaseCard(x,title,subtitle,body,phase){
 return `<g class="phase-card phase-${phase}">
   ${rect(x,115,436,318,24,'#f8faf9',`stroke="#c9d9d3" stroke-width="2"`)}
   ${rect(x+22,136,38,38,12,'#1c6b52')}
   ${label(x+41,162,phase,21,'#ffffff',700,'text-anchor="middle"')}
   ${label(x+77,163,title,25,'#18212b',700)}
   ${label(x+23,194,subtitle,15,'#4b615c',450)}
   ${body}
 </g>`;
}
const x1=36,x2=532,x3=1028;
const leftBody=`
 ${rect(x1+22,220,390,78,14,'#e8f4ee','stroke="#62a48b" stroke-width="2"')}
 ${label(x1+42,254,pack.title,23,'#185c47',700)}
 ${label(x1+42,279,`${pack.term_ids.length} terms · underground utilities`,16,'#34685a',450)}
 ${rect(x1+22,316,390,66,14,'#e6ebef')}
 ${label(x1+42,357,'Civil Starter · Underground Utilities',18,'#3a5257',500)}
 ${label(x1+22,413,'Role-based learning packs',17,'#536961',500)}
`;
const centerBody=`
 ${rect(x2+20,211,396,180,16,'#eaf4f1')}
 <svg x="${x2+52}" y="223" width="331" height="141" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet"><style>${diagramStyle}</style>${diagram}</svg>
 ${label(x2+36,418,term.term,19,'#1b5d4d',700)}
`;
const rightBody=`
 ${rect(x3+20,220,396,69,14,'#edf4f0')}
 ${label(x3+42,265,'Start Smart 10',23,'#1b644e',700)}
 ${label(x3+24,323,'Practice with visual diagrams',19,'#233c3a',500)}
 ${label(x3+24,352,'Review your words over time',19,'#233c3a',500)}
 ${label(x3+24,412,'Practice My Words when ready',16,'#667886',450)}
`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 480" width="1500" height="480" role="img" aria-labelledby="demoTitle demoDesc">
<title id="demoTitle">Construction English: real learning flow</title>
<desc id="demoDesc">A three-step demonstration of the Duct Bank / Electrical vocabulary pack, the actual duct bank technical diagram, and Smart 10 practice and progress. The highlighted step advances every three seconds.</desc>
<defs>
 <linearGradient id="back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111923"/><stop offset="1" stop-color="#173e36"/></linearGradient>
</defs>
<style>
.phase-card{filter:drop-shadow(0 8px 20px rgba(0,0,0,.09))}
.phase-1{animation:p1 9s ease-in-out infinite}
.phase-2{animation:p2 9s ease-in-out infinite}
.phase-3{animation:p3 9s ease-in-out infinite}
@keyframes p1{0%,28%,100%{opacity:1}33%,95%{opacity:.7}}
@keyframes p2{0%,27%,72%,100%{opacity:.7}33%,63%{opacity:1}}
@keyframes p3{0%,61%{opacity:.7}68%,100%{opacity:1}}
@media (prefers-reduced-motion: reduce){.phase-card{animation:none!important;opacity:1!important}}
</style>
${rect(0,0,1500,480,28,'url(#back)')}
${label(36,52,'CONSTRUCTION ENGLISH',31,'#ffffff',750)}
${label(36,83,'Learn terms from real civil drawings, estimates and site work',20,'#c3d8d1',450)}
${phaseCard(x1,'Choose your path','Focus on the work you do',leftBody,1)}
${phaseCard(x2,'See the construction','Diagram from the actual vocabulary',centerBody,2)}
${phaseCard(x3,'Practice and review','Built-in spaced learning',rightBody,3)}
</svg>\n`;
if(Buffer.byteLength(svg)>300*1024)throw Error('README SVG exceeds the 300 KB budget');
if(CHECK){
 if(!fs.existsSync(OUT)||fs.readFileSync(OUT,'utf8')!==svg)throw Error('README SVG is stale. Run node scripts/build-readme-demo.mjs');
 console.log('README SVG verified: 1500x480, canonical term and drawing, 3 CSS phases, reduced-motion fallback');
}else{
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,svg,'utf8');
 console.log(`Generated ${OUT} (${Buffer.byteLength(svg)} bytes)`);
}

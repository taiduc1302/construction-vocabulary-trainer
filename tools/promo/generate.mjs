#!/usr/bin/env node
// Deterministic, offline and data-backed promotional visuals. No app runtime dependencies.
// Optional PNG export requires Sharp, installed only for the build process.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderTermVisual} from '../../src/visuals-all.js';
import {TARGETS,renderPromoSvg,validateConfig} from './core.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../..');
const argumentsMap=new Map();
for(let i=2;i<process.argv.length;i++){
  const arg=process.argv[i];
  if(!arg.startsWith('--'))throw new Error('Unexpected positional argument: '+arg);
  if(['--check','--dry-run','--png'].includes(arg)){argumentsMap.set(arg,true);continue}
  if(!['--config','--out','--screenshot'].includes(arg)||!process.argv[i+1]||process.argv[i+1].startsWith('--'))throw new Error('Unknown or incomplete option: '+arg);
  argumentsMap.set(arg,process.argv[++i]);
}
const confPath=path.resolve(argumentsMap.get('--config')||path.join(HERE,'promo.config.json'));
const outDir=path.resolve(argumentsMap.get('--out')||path.join(ROOT,'assets/promo'));
const check=Boolean(argumentsMap.get('--check'));
const dry=Boolean(argumentsMap.get('--dry-run'));
const png=Boolean(argumentsMap.get('--png'));
if(argumentsMap.has('--screenshot')){
  if(!argumentsMap.has('--out'))throw new Error('Screenshots need an explicit --out directory, never tracked assets/promo.');
  const tracked=path.join(ROOT,'assets')+path.sep;
  const safe=path.join(HERE,'out')+path.sep;
  if(outDir.startsWith(tracked)||(outDir.startsWith(ROOT+path.sep)&&!outDir.startsWith(safe)))throw new Error('Refusing to embed a screenshot into a tracked project directory. Use tools/promo/out.');
}
if(check&&(png||argumentsMap.has('--screenshot')))throw new Error('--check validates only the committed screenshot-free SVG assets.');
if(dry&&(check||png))throw new Error('--dry-run cannot be combined with --check or --png.');
const config=validateConfig(JSON.parse(fs.readFileSync(confPath,'utf8')));
const data=['terms.json','terms-expansion.json'].flatMap(file=>JSON.parse(fs.readFileSync(path.join(ROOT,'data',file),'utf8')));
const term=data.find(t=>t.id===config.featuredTermId);
if(!term)throw new Error('The featured term does not exist in canonical vocabulary: '+config.featuredTermId);
const html=renderTermVisual(term);
const svg=html.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
if(!svg)throw new Error('The canonical visual renderer returned no SVG for '+term.id);
const css=fs.readFileSync(path.join(ROOT,'src/styles.css'),'utf8');
const requiredClasses=new Set([...svg[1].matchAll(/class="([^"]+)"/g)].flatMap(match=>match[1].split(/\s+/)).filter(name=>name.startsWith('tv-')));
const diagramCss=(css.match(/\.tv-[^{}]+\{[^{}]*\}/g)||[]).filter(rule=>[...requiredClasses].some(name=>rule.split('{')[0].includes('.'+name))).join('\n');
if(!diagramCss.includes('.tv-concrete'))throw new Error('Missing technical visual styling from app CSS');
let screenshotDataUri=null;
if(argumentsMap.has('--screenshot')){
  const file=path.resolve(argumentsMap.get('--screenshot'));
  const bytes=fs.readFileSync(file);
  if(bytes.length>8*1024*1024)throw new Error('Screenshot is too large (>8 MB)');
  const jpg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  const pngSig=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';
  if(!jpg&&!pngSig&&!webp)throw new Error('Screenshot must be a real PNG, JPEG or WebP image');
  screenshotDataUri=`data:image/${jpg?'jpeg':pngSig?'png':'webp'};base64,${bytes.toString('base64')}`;
}
const outputs=[];
let sharp=null;
if(png){
  try{sharp=(await import('sharp')).default}catch{throw new Error('Optional PNG export needs sharp. Run `npm install --no-save --prefix tools/promo sharp@0.34.5` (then re-run).')}
}
if(!check&&!dry)fs.mkdirSync(outDir,{recursive:true});
for(const target of config.targets){
  const spec=TARGETS[target];
  const content=renderPromoSvg(config,{target,term,svgBody:svg[1],diagramCss,screenshotDataUri});
  const svgPath=path.join(outDir,`${target}.svg`);
  const entry={target,dimensions:`${spec.width}x${spec.height}`,svg:svgPath,svgBytes:Buffer.byteLength(content)};
  if(!dry){
    if(check){
      if(!fs.existsSync(svgPath)||fs.readFileSync(svgPath,'utf8')!==content)throw new Error('Promo file differs from canonical source: '+svgPath+' (regenerate with node tools/promo/generate.mjs)');
    }else fs.writeFileSync(svgPath,content,'utf8');
  }
  if(png){
    const pngPath=path.join(outDir,`${target}.png`);
    const generated=await sharp(Buffer.from(content)).resize(spec.width,spec.height).flatten({background:'#111923'}).png({palette:true,colours:128,compressionLevel:9}).toBuffer();
    fs.writeFileSync(pngPath,generated);
    const meta=await sharp(generated).metadata();
    if(meta.width!==spec.width||meta.height!==spec.height||meta.hasAlpha)throw new Error(`Invalid PNG output for ${target}`);
    entry.png=pngPath;entry.pngBytes=generated.length;
  }
  outputs.push(entry);
  console.log(`${check?'CHECK':dry?'PLAN':'CREATED'} ${entry.target} ${entry.dimensions} ${entry.svgBytes} SVG bytes${entry.png?' / '+entry.pngBytes+' PNG bytes':''}`);
}
console.log(`Source term: ${term.id} from canonical data; ${outputs.length} targets; ${screenshotDataUri?'private screenshot embedded':'canonical in-app SVG diagram embedded'}; no user profile or account data accessed.`);

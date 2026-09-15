import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const exists=path=>fs.existsSync(new URL(path.replace(/^\.\//,''),root));
const sw=read('sw.js');
const app=read('src/app.js');
const index=read('index.html');
const errors=[];

const assetBlock=sw.match(/const ASSETS=\[([\s\S]*?)\];/);
if(!assetBlock){
  errors.push('sw.js is missing the ASSETS precache list');
}else{
  const assets=new Set([...assetBlock[1].matchAll(/['"](\.\/[^'"]+)['"]/g)].map(m=>m[1]));
  const required=new Set(['./','./index.html']);

  for(const match of app.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g))required.add(`./src/${match[1]}`);
  for(const match of app.matchAll(/fetchJson\(['"]([^'"]+)['"]\)/g))required.add(`./${match[1]}`);
  for(const match of index.matchAll(/(?:href|src)=['"]([^'"#]+)['"]/g)){
    const value=match[1];
    if(!/^(?:https?:|data:|#)/.test(value))required.add(`./${value.replace(/^\.\//,'')}`);
  }

  for(const path of required){
    if(!assets.has(path))errors.push(`sw.js precache is missing runtime asset ${path}`);
  }
  for(const path of assets){
    if(path==='./')continue;
    if(!exists(path))errors.push(`sw.js precache references missing file ${path}`);
  }
}

for(const ext of ['.html','.js','.css','.json','.webmanifest']){
  if(!sw.includes(`'${ext}'`))errors.push(`sw.js network-first policy is missing ${ext}`);
}
if(!sw.includes("request.mode==='navigate'"))errors.push('sw.js should use network-first handling for navigation requests');
if(!sw.includes('skipWaiting()')||!sw.includes('clients.claim()'))errors.push('sw.js should activate updates promptly with skipWaiting and clients.claim');
if(!sw.includes('caches.match(request)'))errors.push('sw.js should retain an offline cache fallback');

if(errors.length){
  console.error(`PWA validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('PWA contract OK: runtime dependencies are precached and mutable app resources use network-first refresh with offline fallback.');

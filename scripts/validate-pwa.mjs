import fs from 'node:fs';
import path from 'node:path';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const exists=file=>fs.existsSync(new URL(file.replace(/^\.\//,''),root));
const sw=read('sw.js');
const index=read('index.html');
const errors=[];

function relativeAsset(file){
  return `./${file.replace(/^\.\//,'').replaceAll('\\\\','/')}`;
}

function resolveModule(fromFile,specifier){
  if(!specifier.startsWith('.'))return null;
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(fromFile),specifier));
  return resolved.replace(/^\.\//,'');
}

function runtimeDependencies(){
  const required=new Set(['./','./index.html']);
  const queue=[];

  for(const match of index.matchAll(/(?:href|src)=['"]([^'"#]+)['"]/g)){
    const value=match[1];
    if(/^(?:https?:|data:|#)/.test(value))continue;
    const asset=relativeAsset(value);
    required.add(asset);
    if(value.endsWith('.js'))queue.push(value.replace(/^\.\//,''));
  }

  const visited=new Set();
  while(queue.length){
    const file=queue.shift();
    if(visited.has(file))continue;
    visited.add(file);
    if(!exists(relativeAsset(file))){
      errors.push(`runtime module ${file} referenced by index/import graph does not exist`);
      continue;
    }

    const source=read(file);
    for(const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)){
      const resolved=resolveModule(file,match[1]);
      if(!resolved)continue;
      required.add(relativeAsset(resolved));
      if(resolved.endsWith('.js'))queue.push(resolved);
    }
    for(const match of source.matchAll(/fetchJson\(['"]([^'"]+)['"]\)/g)){
      required.add(relativeAsset(match[1]));
    }
  }

  return required;
}

const assetBlock=sw.match(/const ASSETS=\[([\s\S]*?)\];/);
if(!assetBlock){
  errors.push('sw.js is missing the ASSETS precache list');
}else{
  const assets=new Set([...assetBlock[1].matchAll(/['"](\.\/[^'"]*)['"]/g)].map(m=>m[1]));
  const required=runtimeDependencies();

  for(const asset of required){
    if(!assets.has(asset))errors.push(`sw.js precache is missing runtime asset ${asset}`);
  }
  for(const asset of assets){
    if(asset==='./')continue;
    if(!exists(asset))errors.push(`sw.js precache references missing file ${asset}`);
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
console.log('PWA contract OK: recursive runtime dependencies are precached and mutable app resources use network-first refresh with offline fallback.');

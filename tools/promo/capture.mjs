#!/usr/bin/env node
// Optional screenshot capture. Uses a NEW browser context; no account or saved progress.
// Install only for manual development: npm install --no-save --prefix tools/promo playwright-core@1.56.1
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const opts=new Map();
for(let i=2;i<process.argv.length;i++){
  if(!['--url','--out'].includes(process.argv[i])||!process.argv[i+1])throw new Error('Usage: node tools/promo/capture.mjs --url http://127.0.0.1:4173/ [--out tools/promo/screenshots/dictionary.png]');
  opts.set(process.argv[i],process.argv[++i]);
}
const url=new URL(opts.get('--url')||'http://127.0.0.1:4173/');
if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||!['http:','https:'].includes(url.protocol))throw new Error('Screenshot capture is local-only; run the app on localhost.');
const out=path.resolve(opts.get('--out')||path.join(HERE,'screenshots/dictionary.png'));
const safeDir=path.join(HERE,'screenshots')+path.sep;
if(!out.startsWith(safeDir)||!out.toLowerCase().endsWith('.png'))throw new Error('Screenshots must remain in the ignored tools/promo/screenshots/ directory.');
const {chromium}=await import('playwright-core').catch(()=>{throw new Error('Install optional playwright-core in tools/promo before capturing screenshots.')});
const candidate=[process.env.CHROME,'/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const browser=await chromium.launch({headless:true,...(candidate?{executablePath:candidate}:{channel:'chrome'}),args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,colorScheme:'light',serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('dialog',dialog=>dialog.dismiss());
  await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#categoryFilter')?.options.length>1,null,{timeout:30000});
  const finish=page.locator('#finishOnboarding');
  if(await finish.count())await finish.click();
  await page.locator('.tab[data-view="dictionary"]').first().click();
  await page.locator('#dictionaryView.active').waitFor();
  await page.locator('#searchInput').fill('duct bank');
  await page.locator('#dictionaryGrid .term-card').first().waitFor();
  // A fresh context guarantees the screenshot contains no personal profile/progress.
  fs.mkdirSync(path.dirname(out),{recursive:true});
  await page.screenshot({path:out,animations:'disabled'});
  console.log('Captured an isolated synthetic-learning-state screenshot: '+out);
  await context.close();
}finally{await browser.close()}

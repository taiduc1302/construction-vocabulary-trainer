// Manual-only Chromium checks against an already running local checkout (no GitHub Actions).
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const origin=process.env.E2E_BASE_URL||'http://127.0.0.1:4173';
const output=process.env.E2E_OUTPUT_DIR||'audit-logs/a11y';
await mkdir(output,{recursive:true});
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox']});
const results=[];
async function snap(page,label){await page.screenshot({path:path.join(output,label+'.png'),fullPage:true,animations:'disabled'});}
async function ready(page,complete=true){
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.ConstructionTrainer),null,{timeout:20000});
  if(complete&&await page.locator('#learnerOnboarding').count()){
    await page.locator('#finishOnboarding').click();
    await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  }
}
async function scenario(name,settings,fn){
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',...settings});
  const page=await context.newPage();
  try{await fn(page);results.push({name,status:'PASS'});console.log('PASS '+name);}
  catch(error){
    results.push({name,status:'FAIL',error:String(error)});
    console.error('FAIL '+name+': '+(error.stack||error));
    try{await snap(page,'failure-'+results.length);}catch{}
  }finally{await context.close();}
}

await scenario('Onboarding keyboard trap, Escape, return focus',{},async page=>{
  await ready(page,false);
  await page.locator('#learnerOnboarding').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'onboardingTitle');
  assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'finishOnboarding');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'closeOnboarding');
  await page.keyboard.press('Escape');
  await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.view),'home');
  await page.locator('#startOnboarding').click();
  await page.locator('#finishOnboarding').click();
  await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'mainContent');
});
await scenario('Settings file picker keyboard access and navigation',{},async page=>{
  await ready(page);
  await page.locator('.data-menu > summary').click();
  await page.locator('#exportProgress').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'importProgress');
  assert.notEqual(await page.locator('#importProgress').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('.tabs .tab[data-view="dictionary"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#dictionaryView.active').waitFor();
  // aria-current is updated in a queued microtask after the view switch.
  await page.waitForFunction(()=>document.querySelector('.tabs .tab[data-view="dictionary"]')?.getAttribute('aria-current')==='page',{},{timeout:5000});
  assert.equal(await page.locator('.tabs .tab[data-view="dictionary"]').getAttribute('aria-current'),'page');
});
await scenario('320px reflow and empty dictionary',{viewport:{width:320,height:700}},async page=>{
  await ready(page);
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,tabs:[...document.querySelectorAll('.tabs .tab')].map(el=>el.getBoundingClientRect().height)}));
  assert.ok(dims.scroll<=dims.width+2,'horizontal overflow: '+JSON.stringify(dims));
  assert.ok(dims.tabs.every(h=>h>=44),'mobile touch targets under 44px');
  await snap(page,'home-320-light');
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#searchInput').fill('unlikely-term-zzzzzz');
  assert.match(await page.locator('#dictionaryGrid .empty').innerText(),/No terms match/);
  await snap(page,'dictionary-empty-320');
});
await scenario('320px dark color scheme',{viewport:{width:320,height:700},colorScheme:'dark'},async page=>{
  await ready(page);
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches),true);
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+2,'dark mobile overflow: '+JSON.stringify(dims));
  await snap(page,'home-320-dark');
});
await scenario('Forced colors and keyboard focus',{forcedColors:'active'},async page=>{
  await ready(page);
  assert.equal(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches),true);
  const active=page.locator('.tabs .tab[data-view="home"]');
  assert.equal(await active.getAttribute('aria-current'),'page');
  await active.focus();
  assert.notEqual(await active.evaluate(el=>getComputedStyle(el).outlineWidth),'0px');
  await snap(page,'home-forced-colors');
});
await scenario('Reduced-motion process illustration',{reducedMotion:'reduce'},async page=>{
  await page.goto(origin+'/term.html?term=duct-bank',{waitUntil:'domcontentloaded'});
  const demo=page.locator('.construction-sequence[data-sequence-id="duct-bank"]');
  await demo.waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  await demo.locator('[data-sequence-action="play"]').click();
  assert.equal(await demo.getAttribute('data-state'),'finished');
  await snap(page,'term-reduced-motion');
});
await scenario('Server fetch error is visible and recoverable',{},async page=>{
  await page.route('**/data/terms.json',route=>route.fulfill({status:503,contentType:'text/plain',body:'Offline QA failure'}));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#appLoadStatus[data-state="error"]').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#appLoadStatus').getAttribute('role'),'alert');
  assert.equal(await page.locator('#retryAppLoad').isVisible(),true);
  await snap(page,'load-error');
});
await browser.close();
await writeFile(path.join(output,'results.json'),JSON.stringify({origin,results},null,2)+'\n');
const failed=results.filter(item=>item.status==='FAIL');
console.log('A11Y BROWSER SUMMARY '+(results.length-failed.length)+' passed, '+failed.length+' failed');
if(failed.length)process.exitCode=1;

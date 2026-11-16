import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';

const origin=process.env.E2E_BASE_URL||'http://127.0.0.1:4173';
const output=process.env.E2E_OUTPUT_DIR||'audit-logs/browser';
await mkdir(output,{recursive:true});
const chromePaths=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/opt/google/chrome/chrome','/usr/bin/chromium'];
const executablePath=chromePaths.find(existsSync);
console.log('Browser executable: '+(executablePath||'Playwright-managed Chromium'));
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox']});
let passed=0;
let failed=0;
const results=[];

function backup(progress,extra={}){
  return {
    backupType:'construction-vocabulary-progress',
    backupVersion:1,version:3,
    progress,daily:{},sessions:[],settings:{dailyGoal:10},
    learnerProfile:{role:'coordinator',focus:'utilities',supportLanguage:'vi',activePackId:'underground-utilities'},
    personalFocus:{version:1,terms:[{id:'duct-bank',source:'capture',added_at:'2026-11-13',last_requested_at:'2026-11-13',request_count:1}]},
    ...extra
  };
}
function termRecord(correct=1){return {status:'review',level:2,correct,wrong:0,lastReviewed:'2026-11-13T12:00:00.000Z',due:'2026-12-13T12:00:00.000Z',recentResults:[true]}}
async function openApp(page,{onboard=true}={}){
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#categoryFilter')?.options.length>1,null,{timeout:20000});
  if(onboard&&await page.locator('#learnerOnboarding').count()){
    await page.locator('#finishOnboarding').click();
    await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  }
}
async function answer(page){
  await page.locator('#quizCard[data-answered="no"]').waitFor({timeout:10000});
  if(await page.locator('#quizCard #typedAnswer').count()){
    await page.locator('#typedAnswer').fill('intentionally-wrong-answer');
    await page.locator('#checkTypedAnswer').click();
  }else{
    await page.locator('#quizCard .quiz-option').first().click();
  }
  await page.locator('#quizCard[data-answered="yes"]').waitFor();
}
async function next(page){
  await page.locator('#quizCard .feedback-next').click();
  await page.locator('#quizCard[data-answered="no"]').waitFor();
}
async function startQuick(page){
  await page.locator('#learnActivePack').click();
  await page.locator('#practiceView.active').waitFor();
  await page.locator('#quizCard[data-answered="no"]').waitFor();
}
async function upload(page,contents,name='progress.json'){
  await page.locator('#importProgress').setInputFiles({
    name,mimeType:'application/json',buffer:Buffer.from(contents,'utf8')
  });
}
async function scenario(name,fn,{mobile=false}={}){
  const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1280,height:800},
    deviceScaleFactor:mobile?3:1,
    isMobile:mobile,hasTouch:mobile,acceptDownloads:true,
    serviceWorkers:'allow'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',async dialog=>{try{await dialog.accept()}catch{}});
  try{
    await fn({page,context});
    assert.deepEqual(errors,[],'browser page errors must be empty');
    passed++;
    results.push({name,status:'PASS'});
    console.log('PASS '+name);
  }catch(e){
    failed++;
    results.push({name,status:'FAIL',message:e.stack||String(e)});
    console.error('FAIL '+name+': '+(e.stack||e));
    try{await page.screenshot({path:output+'/failure-'+failed+'.png',fullPage:true,timeout:4000})}catch{}
  }finally{
    await context.close();
  }
}

await scenario('Fresh onboarding, role selection, navigation and starter pack',async({page})=>{
  await openApp(page,{onboard:false});
  await page.locator('#learnerOnboarding').waitFor();
  await page.locator('[data-choice-type="role"][data-choice-value="estimator"]').click();
  await page.locator('[data-choice-type="focus"][data-choice-value="earthworks"]').click();
  await page.locator('[data-choice-type="supportLanguage"][data-choice-value="ru"]').click();
  await page.locator('#finishOnboarding').click();
  await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  assert.equal(await page.locator('#learnerPathCard').count(),1);
  assert.ok((await page.locator('#learnerPathCard').innerText()).toLowerCase().includes('earthworks'));
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('construction-vocab-learner-profile-v1')));
  assert.equal(profile.role,'estimator');
  assert.equal(profile.supportLanguage,'ru');
  assert.equal(profile.activePackId,'earthworks');
  for(const view of ['dictionary','progress','home']){
    await page.locator('.tabs .tab[data-view="'+view+'"]').click();
    await page.locator('#'+view+'View.active').waitFor();
  }
});

await scenario('Quick 10: frozen pack, four answers, refresh, finish and record history',async({page})=>{
  await openApp(page);
  await startQuick(page);
  for(let i=1;i<=4;i++){
    await answer(page);
    assert.ok((await page.locator('#sessionStatus').innerText()).includes(i+'/10'));
    if(i<4)await next(page);
  }
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('construction-vocab-active-session-v1')));
  assert.equal(before.done,4);
  assert.equal(before.seenIds.length,4);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#practiceView.active').waitFor({timeout:15000});
  await page.locator('#quizCard[data-answered="no"]').waitFor();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('construction-vocab-active-session-v1')));
  assert.equal(restored.done,4);
  assert.equal(restored.correct,before.correct);
  assert.ok((await page.locator('#sessionStatus').innerText()).includes('4/10'));
  for(let i=5;i<=10;i++){
    await answer(page);
    if(i<10)await next(page);
  }
  assert.ok((await page.locator('#sessionStatus').innerText()).includes('Session complete:'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-active-session-v1')),null);
  await page.locator('.tabs .tab[data-view="progress"]').click();
  assert.ok((await page.locator('#sessionHistory').innerText()).includes('Quick 10'));
});

await scenario('Invalid JSON is rejected without altering progress',async({page})=>{
  await openApp(page);
  await startQuick(page);
  await answer(page);
  const before=await page.evaluate(()=>localStorage.getItem('construction-vocab-state-v3'));
  await upload(page,'{"unrelated":true}');
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-state-v3')),before);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-pre-import-snapshot-v1')),null);
});

await scenario('Valid import creates restore point, Undo restores profile and active session',async({page})=>{
  await openApp(page);
  await startQuick(page);
  await answer(page);
  const old=await page.evaluate(()=>({
    progress:localStorage.getItem('construction-vocab-state-v3'),
    profile:localStorage.getItem('construction-vocab-learner-profile-v1'),
    session:localStorage.getItem('construction-vocab-active-session-v1')
  }));
  await upload(page,JSON.stringify(backup({'duct-bank':termRecord(19)})));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('construction-vocab-state-v3')||'{}').progress?.['duct-bank']?.correct===19);
  assert.ok(await page.evaluate(()=>localStorage.getItem('construction-vocab-pre-import-snapshot-v1')));
  const button=page.locator('#undoProgressImport');
  await button.waitFor({state:'attached'});
  assert.equal(await button.getAttribute('hidden'),null);
  await page.locator('summary[aria-label="Learning settings and progress data menu"]').click();
  await button.click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('construction-vocab-state-v3')||'{}').progress?.['duct-bank']?.correct!==19);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-state-v3')),old.progress);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-learner-profile-v1')),old.profile);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-active-session-v1')),old.session);
  assert.equal(await page.evaluate(()=>localStorage.getItem('construction-vocab-pre-import-snapshot-v1')),null);
});

await scenario('Export downloads portable versioned backup',async({page})=>{
  await openApp(page);
  await startQuick(page);
  await answer(page);
  await page.locator('summary[aria-label="Learning settings and progress data menu"]').click();
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#exportProgress').click();
  const download=await downloadEvent;
  const contents=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(contents.backupType,'construction-vocabulary-progress');
  assert.equal(contents.backupVersion,1);
  assert.ok(contents.learnerProfile);
  assert.ok(contents.personalFocus);
  assert.ok(Object.keys(contents.progress).length>=1);
});

await scenario('Work-term lookup, multilingual term page and personal My Words',async({page})=>{
  await openApp(page);
  await page.locator('#publicCaptureInput').fill('DB2');
  await page.locator('#publicCaptureMatches .capture-match').first().waitFor({timeout:8000});
  const suggestions=await page.locator('#publicCaptureMatches').innerText();
  assert.ok(/DB2/i.test(suggestions));
  await page.goto(origin+'/term.html?term=duct-bank',{waitUntil:'domcontentloaded'});
  await page.locator('#termPage h1').waitFor();
  assert.ok(/duct bank/i.test(await page.locator('#termPage h1').innerText()));
  assert.ok(await page.locator('#termPage svg').count()>0);
  await page.locator('#addTermToWords').click();
  const focus=await page.evaluate(()=>JSON.parse(localStorage.getItem('construction-vocab-personal-focus-v1')));
  assert.ok(focus.terms.some(t=>t.id==='duct-bank'));
});

await scenario('Offline PWA reload retains shell and dictionary',async({page,context})=>{
  await openApp(page);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:12000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('#homeView.active #todayTitle').waitFor({timeout:15000});
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#dictionaryView.active .card-grid .term-card').first().waitFor({timeout:15000});
});

await scenario('390px mobile navigation, touch targets and data controls',async({page})=>{
  await openApp(page,{onboard:false});
  await page.locator('#finishOnboarding').click();
  await page.locator('#learnerOnboarding').waitFor({state:'detached'});
  const bounds=await page.evaluate(()=>({
    width:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
    tabs:[...document.querySelectorAll('.tabs .tab')].map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}))
  }));
  assert.ok(bounds.scrollWidth<=bounds.width+2,'horizontal overflow: '+JSON.stringify(bounds));
  assert.equal(bounds.tabs.length,5);
  assert.ok(bounds.tabs.every(tab=>tab.h>=44),'mobile tab touch targets below 44px');
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#dictionaryView.active').waitFor();
  await page.locator('#searchInput').fill('duct bank');
  assert.ok((await page.locator('#dictionaryLoadMore').innerText()).includes('Showing'));
},{mobile:true});

await browser.close();
console.log('BROWSER REGRESSION SUMMARY '+passed+' passed, '+failed+' failed');
await import('node:fs/promises').then(fs=>fs.writeFile(output+'/results.json',JSON.stringify({passed,failed,results},null,2)));
if(failed)process.exitCode=1;

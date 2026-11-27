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
async function scenario(name,fn,{mobile=false,reducedMotion='no-preference'}={}){
  const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1280,height:800},
    deviceScaleFactor:mobile?3:1,
    isMobile:mobile,hasTouch:mobile,acceptDownloads:true,
    reducedMotion,serviceWorkers:'allow'
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
  const importedReload=page.waitForEvent('framenavigated',{predicate:frame=>frame===page.mainFrame()});
  await upload(page,JSON.stringify(backup({'duct-bank':termRecord(19)})));
  await importedReload;
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('construction-vocab-state-v3')||'{}').progress?.['duct-bank']?.correct===19);
  assert.ok(await page.evaluate(()=>localStorage.getItem('construction-vocab-pre-import-snapshot-v1')));
  const button=page.locator('#undoProgressImport');
  await page.waitForFunction(()=>Boolean(window.ConstructionTrainer)&&!document.querySelector('#undoProgressImport')?.hidden,null,{timeout:15000});
  assert.equal(await button.getAttribute('hidden'),null);
  await page.locator('summary[aria-label="Learning settings and progress data menu"]').click();
  const undoReload=page.waitForEvent('framenavigated',{predicate:frame=>frame===page.mainFrame()});
  await button.click();
  await undoReload;
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
  // A term's query-bearing URL must resolve its precached HTML, not the home shell.
  await page.goto(origin+'/term.html?term=duct-bank',{waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('#termPage h1').waitFor({timeout:15000});
  assert.match(await page.locator('#termPage h1').innerText(),/duct bank/i);
  await page.goto(origin+'/?learn=culvert',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>Boolean(window.ConstructionTrainer),null,{timeout:15000});
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


await scenario('Dictionary process sequence: play, pause, manual next and replay',async({page})=>{
  await openApp(page);
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#searchInput').fill('duct bank');
  const demo=page.locator('.construction-sequence[data-sequence-id="duct-bank"]');
  await demo.waitFor();
  assert.equal(await demo.getAttribute('data-step'),'0');
  assert.equal(await demo.getAttribute('data-state'),'idle');
  await demo.locator('[data-sequence-action="play"]').click();
  await page.waitForFunction(()=>document.querySelector('.construction-sequence[data-sequence-id="duct-bank"]')?.dataset.step==='1',null,{timeout:7500});
  await demo.locator('[data-sequence-action="pause"]').click();
  assert.equal(await demo.getAttribute('data-state'),'paused');
  await page.waitForTimeout(2350);
  assert.equal(await demo.getAttribute('data-step'),'1','Pause must freeze the sequence');
  await demo.locator('[data-sequence-action="next"]').click();
  assert.equal(await demo.getAttribute('data-step'),'2');
  await demo.locator('[data-sequence-action="replay"]').click();
  assert.equal(await demo.getAttribute('data-step'),'0');
  assert.equal(await demo.getAttribute('data-state'),'playing');
});

await scenario('Public term pages: all three construction processes and safe quiz separation',async({page})=>{
  for(const id of ['culvert','duct-bank','trench-box']){
    await page.goto(origin+'/term.html?term='+id,{waitUntil:'domcontentloaded'});
    const demo=page.locator('.construction-sequence[data-sequence-id="'+id+'"]');
    await demo.waitFor();
    assert.equal(await demo.locator('.sequence-status').count(),1);
    assert.ok((await demo.locator('.sequence-caution').innerText()).length>50);
    assert.equal(await demo.locator('[data-sequence-action]').count(),4);
    assert.equal(await demo.locator('svg[role="img"]').count(),1);
  }
  await openApp(page);
  await page.locator('.tabs .tab[data-view="practice"]').click();
  await page.locator('.practice-settings summary').click();
  await page.locator('#practiceMode').selectOption('visual');
  await page.locator('#quizCard[data-answered="no"]').waitFor();
  assert.equal(await page.locator('#quizCard .construction-sequence').count(),0,'Quiz must never show the learning sequences');
  assert.equal(await page.locator('#quizCard svg text').count(),0,'Static diagram must not reveal labels');
});

await scenario('Reduced-motion preference: Play produces an immediate complete static illustration',async({page})=>{
  await page.goto(origin+'/term.html?term=duct-bank',{waitUntil:'domcontentloaded'});
  const demo=page.locator('.construction-sequence[data-sequence-id="duct-bank"]');
  await demo.waitFor();
  await demo.locator('[data-sequence-action="play"]').click();
  assert.equal(await demo.getAttribute('data-step'),'3');
  assert.equal(await demo.getAttribute('data-state'),'finished');
  assert.equal(await demo.locator('[data-sequence-action="pause"]').isDisabled(),true);
},{reducedMotion:'reduce'});

await scenario('390px mobile process diagram: no horizontal overflow, buttons remain usable',async({page})=>{
  await page.goto(origin+'/term.html?term=culvert',{waitUntil:'domcontentloaded'});
  const demo=page.locator('.construction-sequence[data-sequence-id="culvert"]');
  await demo.waitFor();
  const bounds=await page.evaluate(()=>({
    width:window.innerWidth,scroll:document.documentElement.scrollWidth,
    buttons:[...document.querySelectorAll('.construction-sequence button')].map(b=>b.getBoundingClientRect().height)
  }));
  assert.ok(bounds.scroll<=bounds.width+2,'Mobile process lesson overflows: '+JSON.stringify(bounds));
  assert.ok(bounds.buttons.every(h=>h>=44),'Sequence button touch targets too small');
  await demo.locator('[data-sequence-action="next"]').click();
  assert.equal(await demo.getAttribute('data-step'),'1');
},{mobile:true});


await scenario('Unicode dictionary search supports Russian, Vietnamese, aliases and punctuation',async({page})=>{
  await openApp(page);
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  const input=page.locator('#searchInput');
  await input.fill('шпунт');
  await page.waitForFunction(()=>document.querySelector('#dictionaryGrid')?.textContent?.toLowerCase().includes('sheet pile'));
  await input.fill('ống nhựa');
  await page.waitForFunction(()=>document.querySelector('#dictionaryGrid')?.textContent?.includes('PVC DB2'));
  await input.fill('DB-2');
  await page.waitForFunction(()=>document.querySelector('#dictionaryGrid')?.textContent?.includes('PVC DB2'));
});
await scenario('Russian feedback appears only after choosing RU learner support',async({page})=>{
  await openApp(page,{onboard:false});
  await page.locator('[data-choice-type="supportLanguage"][data-choice-value="ru"]').click();
  await page.locator('#finishOnboarding').click();
  await page.locator('.tabs .tab[data-view="practice"]').click();
  await page.locator('.practice-settings summary').click();
  await page.locator('#practiceScope').selectOption('all');
  await page.locator('#practiceMode').selectOption('visual');
  await page.locator('#quizCard[data-answered="no"]').waitFor();
  await page.locator('#quizCard .quiz-option').first().click();
  const feedback=await page.locator('#feedback').innerText();
  assert.match(feedback,/RU:/,'RU learners should see Russian supplementary explanation');
  assert.doesNotMatch(feedback,/VI:/,'RU learners should not get duplicate Vietnamese feedback');
});
await scenario('Vietnamese feedback appears only after choosing VI learner support',async({page})=>{
  await openApp(page,{onboard:false});
  await page.locator('[data-choice-type="supportLanguage"][data-choice-value="vi"]').click();
  await page.locator('#finishOnboarding').click();
  await page.locator('.tabs .tab[data-view="practice"]').click();
  await page.locator('.practice-settings summary').click();
  await page.locator('#practiceScope').selectOption('all');
  await page.locator('#practiceMode').selectOption('visual');
  await page.locator('#quizCard[data-answered="no"]').waitFor();
  await page.locator('#quizCard .quiz-option').first().click();
  const feedback=await page.locator('#feedback').innerText();
  assert.match(feedback,/VI:/,'VI learners should see Vietnamese support');
  assert.doesNotMatch(feedback,/RU:/,'VI learners should not see Russian by default');
});
await scenario('English-only learners see no duplicate translation blocks',async({page})=>{
  await openApp(page,{onboard:false});
  await page.locator('[data-choice-type="supportLanguage"][data-choice-value="en"]').click();
  await page.locator('#finishOnboarding').click();
  await page.locator('.tabs .tab[data-view="practice"]').click();
  await page.locator('.practice-settings summary').click();
  await page.locator('#practiceScope').selectOption('all');
  await page.locator('#practiceMode').selectOption('visual');
  await page.locator('#quizCard[data-answered="no"]').waitFor();
  await page.locator('#quizCard .quiz-option').first().click();
  const feedback=await page.locator('#feedback').innerText();
  assert.doesNotMatch(feedback,/\b(?:RU|VI):/,'English-only answers should focus on English');
});


await scenario('Suspended slab is discoverable from Today and Dictionary and shows typed concept trees',async({page})=>{
  await openApp(page);
  const card=page.locator('.term-tree-home a[href="term.html?term=suspended-slab"]');
  await card.waitFor();
  await card.click();
  await page.locator('#termPage h1').waitFor();
  assert.match(await page.locator('#termPage h1').innerText(),/suspended slab/i);
  const tree=page.locator('.term-tree-explorer');
  await tree.waitFor();
  assert.ok(await tree.locator('a[href="term.html?term=one-way-slab"]').count());
  assert.ok(await tree.locator('a[href="term.html?term=two-way-slab"]').count());
  assert.ok(await tree.locator('a[href="term.html?term=slab-formwork"]').count());
  assert.match(await tree.innerText(),/Construction and temporary works/i);
  await tree.locator('a[href="term.html?term=flat-plate"]').click();
  assert.match(await page.locator('#termPage h1').innerText(),/flat plate/i);
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.ConstructionTrainer),null,{timeout:15000});
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#categoryFilter').selectOption('electrical');
  await page.locator('#searchInput').fill('suspended slab');
  assert.equal(await page.locator('#categoryFilter').inputValue(),'all','typing should reset stale category restriction');
  assert.match(await page.locator('#dictionaryGrid .term-title').first().innerText(),/suspended slab/i);
  assert.ok((await page.locator('#dictionaryLoadMore').innerText()).includes('Showing'));
},{mobile:true});


await scenario('Pipe crown / obvert and invert are findable and linked to precast and casting trees',async({page})=>{
  await openApp(page);
  await page.locator('.term-tree-home-links a[href="term.html?term=pipe"]').click();
  await page.locator('#termPage h1').waitFor();
  assert.match(await page.locator('#termPage h1').innerText(),/^pipe$/i);
  assert.ok(await page.locator('.term-tree-explorer').count(),'pipe card should include relationship trees');
  assert.ok(await page.locator('.term-tree-explorer a[href="term.html?term=pipe-crown"]').count());
  await page.locator('.term-tree-explorer a[href="term.html?term=pipe-crown"]').first().click();
  assert.match(await page.locator('#termPage h1').innerText(),/pipe crown/i);
  assert.match(await page.locator('#termPage').innerText(),/obvert/i);
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#categoryFilter')?.options.length>1,null,{timeout:20000});
  await page.locator('.tabs .tab[data-view="dictionary"]').click();
  await page.locator('#categoryFilter').selectOption('concrete');
  await page.locator('#searchInput').fill('obvert');
  assert.equal(await page.locator('#categoryFilter').inputValue(),'all');
  await page.waitForFunction(()=>document.querySelector('#dictionaryGrid')?.textContent?.toLowerCase().includes('pipe crown'));
  assert.match(await page.locator('#dictionaryGrid .term-title').first().innerText(),/pipe crown/i);
  await page.locator('#searchInput').fill('RCP');
  await page.waitForFunction(()=>document.querySelector('#dictionaryGrid')?.textContent?.toLowerCase().includes('reinforced concrete pipe'));
},{mobile:true});

await browser.close();
console.log('BROWSER REGRESSION SUMMARY '+passed+' passed, '+failed+' failed');
await import('node:fs/promises').then(fs=>fs.writeFile(output+'/results.json',JSON.stringify({passed,failed,results},null,2)));
if(failed)process.exitCode=1;

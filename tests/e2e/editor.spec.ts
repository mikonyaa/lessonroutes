import {test,expect,type Page} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {Project,ScreenNode} from '../../src/model/types';
const examplePath='examples/workspace.lessonroutes.project.json';
const ready=async(page:Page)=>{await page.goto('/');await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();};
const example=async(page:Page)=>{await page.getByRole('button',{name:'Open example',exact:true}).first().click();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');};
const input=async(page:Page,project:Project)=>{await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'lessonroutes.project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});};
async function projectDownload(page:Page,file:string) {const promised=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).first().click();const downloaded=await promised;await downloaded.saveAs(file);return JSON.parse(await readFile(file,'utf8')) as Project;}
async function lessonDownload(page:Page,file:string) {await page.getByRole('button',{name:'Export lesson',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('reachable steps');const promised=page.waitForEvent('download');await page.getByRole('button',{name:'Download lesson HTML',exact:true}).click();await (await promised).saveAs(file);}
test.beforeEach(async({page})=>{page.on('dialog',dialog=>dialog.accept());});

test('empty state, batch of 20 same-name/Unicode images, order, dedup and atomic errors',async({page},info)=>{
  await ready(page);await page.screenshot({path:`output/playwright/empty-${info.project.name}.png`,fullPage:true});
  const files=[];for(let i=1;i<=20;i++)files.push({name:i%2===0?'Экран.png':'same.png',mimeType:'image/png',buffer:await readFile(`fixtures/batch/${String(i).padStart(2,'0')}.png`)});
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles(files);await expect(page.getByRole('status').filter({hasText:'Imported 20'})).toBeVisible();
  const p=await projectDownload(page,info.outputPath('batch.project.json'));expect(p.nodes).toHaveLength(20);expect(p.assets).toHaveLength(20);
  for(let i=0;i<20;i++){const n=p.nodes.find(n=>n.id===p.orderedNodeIds[i]) as ScreenNode,asset=p.assets.find(a=>a.id===n.assetId)!;expect(Buffer.from(asset.base64,'base64')).toEqual(files[i]!.buffer);}
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles(files[0]!);await expect(page.getByRole('status').filter({hasText:'Imported 1 screenshot'})).toBeVisible();const dedup=await projectDownload(page,info.outputPath('dedup.project.json'));expect(dedup.assets).toHaveLength(20);expect(dedup.nodes).toHaveLength(21);
  for(const fixture of ['animated.png','animated.webp']) {await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles(`fixtures/${fixture}`);await expect(page.getByRole('alert')).toContainText('Animated');expect((await projectDownload(page,info.outputPath('unchanged.json'))).nodes).toHaveLength(21);}
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg><script>alert(1)</script></svg>')});await expect(page.getByRole('alert')).toContainText('static PNG');await page.screenshot({path:`output/playwright/import-error-${info.project.name}.png`,fullPage:true});
});
test('save, close, import preserves graph and IDs; deletion and move undo in one action',async({page,context,browser},info)=>{
  await ready(page);await example(page);await expect(page.getByTestId('save-status')).toContainText('Saved in this browser');const before=await projectDownload(page,info.outputPath('before.project.json'));
  await page.getByRole('button',{name:'Delete Invite intentionally',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('1 incoming');await page.getByRole('dialog').getByRole('button',{name:'Delete step',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();const restored=await projectDownload(page,info.outputPath('restored.project.json'));expect({...restored,revision:0}).toEqual({...before,revision:0});
  const region=page.getByRole('button',{name:'Region 1: Choose Public',exact:true});await region.scrollIntoViewIfNeeded();const box=await region.boundingBox();expect(box).not.toBeNull();await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();await page.mouse.move(box!.x+box!.width/2+10,box!.y+box!.height/2+5,{steps:5});await page.mouse.up();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Undo',exact:true}).click();const movedBack=await projectDownload(page,info.outputPath('moved-back.json'));expect({...movedBack,revision:0}).toEqual({...before,revision:0});
  await context.close();const fresh=await browser.newContext({baseURL:process.env.LESSONROUTES_BASE_URL!}),newPage=await fresh.newPage();await ready(newPage);await newPage.getByLabel('Import project file',{exact:true}).setInputFiles(info.outputPath('before.project.json'));await expect(newPage.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');const imported=await projectDownload(newPage,info.outputPath('imported.json'));expect({...imported,revision:0}).toEqual({...before,revision:0});await fresh.close();
});
test('numeric region editing, keyboard arrows and real contain geometry at 1440/1024/390 with zoom',async({page},info)=>{
  await ready(page);await example(page);
  for(const width of [1440,1024,390]) {
    await page.setViewportSize({width,height:1000});if(width<850)await page.getByRole('button',{name:'Canvas',exact:true}).click();
    const region=page.getByRole('button',{name:'Region 1: Choose Public',exact:true});await region.focus();await region.press('Enter');
    if(width<850)await page.getByRole('button',{name:'Actions',exact:true}).click();await page.getByLabel('Left (%)',{exact:true}).fill('20');await page.getByLabel('Top (%)',{exact:true}).fill('45');
    if(width<850)await page.getByRole('button',{name:'Canvas',exact:true}).click();
    const image=page.locator('.canvas-image img'),r=await region.boundingBox(),img=await image.boundingBox();expect(Math.abs(r!.x-img!.x-.2*img!.width)).toBeLessThan(1);expect(Math.abs(r!.y-img!.y-.45*img!.height)).toBeLessThan(1);
    await region.focus();await region.press('ArrowRight');const shifted=await region.boundingBox();expect(shifted!.x-r!.x).toBeCloseTo(.002*img!.width,0);
    await page.screenshot({path:`output/playwright/editor-${info.project.name}-${width}.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.documentElement.style.zoom='1.25';});
  await expect.poll(()=>page.evaluate(()=>{const img=document.querySelector('.canvas-image img')!.getBoundingClientRect(),r=document.querySelector('.canvas-image .region')!.getBoundingClientRect();return Math.abs(r.x-img.x-.202*img.width);})).toBeLessThan(1);
  await page.evaluate(()=>{document.documentElement.style.zoom='';});
});
test('preview and independent file HTML share exact transitions, two errors, retry and finish',async({page,context,browser},info)=>{
  await ready(page);await example(page);await page.getByRole('button',{name:'Preview',exact:true}).click();const frame=page.frameLocator('iframe[title="Lesson preview"]');await expect(frame.getByRole('heading',{level:1})).toHaveText('Keep your classroom private');
  const sequence=['public','shared','private','code','essential','backup','apply'];
  for(const id of sequence){await frame.locator(`[data-action-id="${id}"]`).click();if(id==='public')await expect(frame.locator('.lr-feedback')).toContainText('outside your class');if(id==='shared')await expect(frame.locator('.lr-feedback')).toContainText('forwarded');await frame.getByRole('button',{name:'Continue',exact:true}).click();}
  await expect(frame.locator('#lesson-root')).toHaveAttribute('data-phase','finished');const previewLog=await frame.locator('#lesson-root').getAttribute('data-transitions');await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  const folder=info.outputPath('Урок с пробелами');await mkdir(folder,{recursive:true});const lesson=path.join(folder,'lesson.html');await lessonDownload(page,lesson);await context.close();
  for(const width of [1440,390]) for(const mode of ['mouse','keyboard']) {
    const ctx=await browser.newContext({viewport:{width,height:900}});let outgoing=0;await ctx.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});await ctx.setOffline(true);await ctx.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('disabled');}});Object.defineProperty(window,'indexedDB',{get(){throw Error('disabled');}});});const learner=await ctx.newPage(),errors:string[]=[];learner.on('pageerror',e=>errors.push(e.message));await learner.goto(pathToFileURL(path.resolve(lesson)).href);
    for(const id of sequence){if(mode==='keyboard'){await learner.locator(`[data-action-id="${id}"]`).focus();await learner.keyboard.press('Enter');await learner.keyboard.press('Enter');}else{await learner.locator(`[data-action-id="${id}"]`).click();await learner.getByRole('button',{name:'Continue',exact:true}).click();}}
    await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');expect(await learner.locator('#lesson-root').getAttribute('data-transitions')).toBe(previewLog);expect(outgoing).toBe(0);expect(errors).toEqual([]);await learner.screenshot({path:`output/playwright/finish-${info.project.name}-${width}-${mode}.png`,fullPage:true});await ctx.close();
  }
});
test('safe strings, canary exclusion, restrictive CSP and double click',async({page,browser},info)=>{
  await ready(page);const p=JSON.parse(await readFile(examplePath,'utf8')) as Project;
  const attack='</script><img src="https://invalid.example/x" onerror="window.attack=1"> " & &#60; \u2028 \u2029';p.metadata.title=attack;(p.nodes[0] as ScreenNode).actions[0]!.feedback=attack;
  const bytes=await readFile('fixtures/batch/01.png');const {createHash}=await import('node:crypto');p.assets.push({id:'canary-image',displayName:'private-draft.png',mime:'image/png',pixelWidth:120,pixelHeight:80,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});p.nodes.push({id:'canary',kind:'screen',assetId:'canary-image',title:'SYNTHETIC_CANARY_DO_NOT_EXPORT',instruction:'Private draft canary',imageDescription:'CANARY',actions:[]});p.orderedNodeIds.push('canary');await input(page,p);await expect(page.getByLabel('Lesson title')).toHaveValue(attack);
  const file=info.outputPath('safe.html');await lessonDownload(page,file);const html=await readFile(file,'utf8');expect(html).not.toContain('SYNTHETIC_CANARY');expect(html).not.toContain(bytes.toString('base64'));expect(html).not.toContain('private-draft.png');expect(html).toContain('\\u003c/script>');
  const ctx=await browser.newContext();let outgoing=0;await ctx.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});await ctx.setOffline(true);const learner=await ctx.newPage();await learner.goto(pathToFileURL(file).href);
  await learner.locator('[data-action-id="public"]').dblclick();await expect(learner.locator('.lr-feedback')).toContainText(attack);await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','showingFeedback');const log=JSON.parse((await learner.locator('#lesson-root').getAttribute('data-transitions'))!);expect(log).toHaveLength(1);expect(await learner.evaluate(()=>('attack' in window))).toBe(false);expect(await learner.locator('.lr-feedback img').count()).toBe(0);
  const violation=await learner.evaluate(async()=>{let violated=false;document.addEventListener('securitypolicyviolation',()=>{violated=true;},{once:true});const script=document.createElement('script');script.textContent='window.cspInjected=true';document.body.append(script);await new Promise(r=>setTimeout(r,80));return {violated,executed:'cspInjected' in window};});expect(violation).toEqual({violated:true,executed:false});expect(outgoing).toBe(0);await learner.screenshot({path:`output/playwright/feedback-${info.project.name}.png`,fullPage:true});await ctx.close();
});
test('autosave restores on reload, second tab conflicts and manual backup stays available',async({page,context},info)=>{
  await ready(page);await example(page);await expect(page.getByTestId('save-status')).toContainText('Saved in this browser');await page.reload();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');
  const second=await context.newPage();await ready(second);await expect(second.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');await expect(second.getByTestId('save-status')).toContainText('Saved in this browser');
  const beforeRevision=Number(await second.getByTestId('save-status').getAttribute('data-revision'));await second.getByLabel('Step title',{exact:true}).fill('Newer tab changes');await expect(second.getByTestId('save-status')).toHaveAttribute('data-revision',String(beforeRevision+1));await expect(second.getByTestId('save-status')).toContainText('Saved in this browser');
  // A genuine edit in the second tab advances the revision. The older tab detects it.
  await page.getByLabel('Step title',{exact:true}).fill('Older tab changes');await expect(page.getByTestId('save-status')).toContainText('Revision conflict');const copy=await projectDownload(page,info.outputPath('conflict-copy.json'));expect(copy.nodes[0]!.title).toBe('Older tab changes');await page.getByRole('button',{name:'Save a new copy',exact:true}).click();await expect(page.getByTestId('save-status')).toContainText('Saved in this browser');
});
test('unavailable/quota storage stays visibly unsaved with working download',async({page},info)=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Synthetic quota / storage unavailable','QuotaExceededError');}});});await ready(page);await example(page);await expect(page.getByTestId('save-status')).toContainText('Not saved');const p=await projectDownload(page,info.outputPath('memory-backup.json'));expect(p.nodes).toHaveLength(6);await page.screenshot({path:`output/playwright/storage-error-${info.project.name}.png`,fullPage:true});
});
test('EXIF-oriented JPEG displays identically in editor and exported player',async({page,browser},info)=>{
  await ready(page);await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles('fixtures/oriented-6.jpg');await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('oriented-6');await page.getByLabel('Instruction',{exact:true}).fill('Choose continue.');await page.getByLabel('Image description',{exact:true}).fill('A green rotated example with the word Orientation.');await page.getByRole('button',{name:'Add finish',exact:false}).click();await page.getByRole('button',{name:'oriented-6',exact:false}).first().click();await page.getByRole('button',{name:'Add action',exact:true}).click();await page.getByLabel('Destination',{exact:true}).selectOption({label:'✓ Lesson complete'});
  const image=page.locator('.canvas-image img');expect(await image.evaluate((el:HTMLImageElement)=>[el.naturalWidth,el.naturalHeight])).toEqual([80,160]);const file=info.outputPath('oriented.html');await lessonDownload(page,file);const ctx=await browser.newContext(),learner=await ctx.newPage();await learner.goto(pathToFileURL(file).href);expect(await learner.locator('.lr-image-wrap img').evaluate((el:HTMLImageElement)=>[el.naturalWidth,el.naturalHeight])).toEqual([80,160]);await learner.locator('[data-action-id]').click();await learner.getByRole('button',{name:'Continue',exact:true}).click();await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');await ctx.close();
});
test('standalone image region clicks align at 1440, 1024 and 390 including letterboxing',async({page,context,browser},info)=>{
  await ready(page);await example(page);const file=info.outputPath('regions.html');await lessonDownload(page,file);await context.close();
  const p=JSON.parse(await readFile(examplePath,'utf8')) as Project;const learnerContext=await browser.newContext();await learnerContext.setOffline(true);await learnerContext.route(/^https?:\/\//,r=>r.abort());const learner=await learnerContext.newPage();
  for(const width of [1440,1024,390]) {
    await learner.setViewportSize({width,height:900});await learner.goto(pathToFileURL(file).href);
    for(const id of ['public','shared','private','code','essential','backup','apply']) {
      const action=p.nodes.flatMap(n=>n.kind==='screen'?n.actions:[]).find(a=>a.id===id)!;await learner.locator('.lr-image-wrap img').scrollIntoViewIfNeeded();const box=await learner.locator('.lr-image-wrap img').boundingBox();await learner.mouse.click(box!.x+(action.rect.x+action.rect.width/2)*box!.width,box!.y+(action.rect.y+action.rect.height/2)*box!.height);await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','showingFeedback');const log=JSON.parse((await learner.locator('#lesson-root').getAttribute('data-transitions'))!);expect(log[log.length-1].actionId).toBe(id);await learner.getByRole('button',{name:'Continue',exact:true}).click();
    }
    await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');
  }await learnerContext.close();
});

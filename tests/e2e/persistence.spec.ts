import {test,expect,type Page} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fixturePNG,fixtureProject} from '../fixtures/lesson';
import type {Project,ScreenNode} from '../../src/model/types';
import {durableCurrent,installIDBGate} from './idb-gate';

const ready=async(page:Page)=>{await page.goto('/');await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();};
const saved=async(page:Page)=>{await expect(page.getByTestId('save-status')).toHaveText('Saved in this browser');};
const input=async(page:Page,p:Project)=>{await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'independent.project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.getByLabel('Lesson title')).toHaveValue(p.metadata.title);};
const observations=new WeakMap<Page,{errors:string[];requests:string[]}>();
test.beforeEach(async({page})=>{page.on('dialog',d=>d.accept());const log={errors:[] as string[],requests:[] as string[]};observations.set(page,log);page.on('pageerror',e=>log.errors.push(e.message));page.on('request',r=>log.requests.push(r.url()));});
test.afterEach(async({page},info)=>{const log=observations.get(page)!;await writeFile(info.outputPath('browser-log.json'),JSON.stringify(log,null,2));expect(log.errors).toEqual([]);});

test('LR-1: delayed A open cannot replace B Saved or durable recovery',async({page},info)=>{
  await ready(page);await input(page,fixtureProject('A'));await saved(page);
  await page.evaluate(installIDBGate,null);await page.evaluate(()=>window.idbGate.arm('open'));
  await page.getByLabel('Lesson title').fill('A pending');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
  await page.getByRole('button',{name:'New lesson',exact:true}).click();await page.getByLabel('Lesson title').fill('B saved');await saved(page);
  await page.screenshot({path:info.outputPath('B-saved.png'),fullPage:true});
  await page.evaluate(()=>window.idbGate.release());await expect.poll(()=>page.evaluate(()=>window.idbGate.released)).toBe(1);
  expect((await durableCurrent(page))?.metadata.title).toBe('B saved');await saved(page);
  await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('B saved');await page.screenshot({path:info.outputPath('reload-B.png'),fullPage:true});
});
test('LR-2: pending restore rejects early title, chooser, keyboard and drop mutations',async({page})=>{
  await ready(page);await input(page,fixtureProject('Recovered project'));await saved(page);
  await page.addInitScript(installIDBGate,'open' as const);await page.reload();await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
  const early=await page.getByLabel('Lesson title').isEnabled();
  if(early)await page.getByLabel('Lesson title').fill('typed before restore');
  for(const name of ['Import project file','Import screenshot files'])await expect(page.getByLabel(name,{exact:true})).toBeDisabled();
  for(const name of ['New lesson','Open project','Undo','Redo'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();
  await expect(page.locator('#workspace')).toHaveAttribute('inert','');
  // Even programmatic file delivery cannot enter a mutating handler before ready.
  await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'early.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixtureProject('Early import')))});
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles({name:'early.png',mimeType:'image/png',buffer:fixturePNG()});
  await page.locator('body').press('Control+z');await page.locator('body').press('Control+Shift+z');
  await page.evaluate(()=>{const transfer=new DataTransfer();transfer.items.add(new File(['bad bytes'],'early.png',{type:'image/png'}));document.querySelector('.canvas-panel')!.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));});
  await page.evaluate(()=>window.idbGate.release());await saved(page);
  await expect(page.getByLabel('Lesson title')).toHaveValue(early?'typed before restore':'Recovered project');
  expect(early).toBe(false);await expect(page.getByRole('alert')).toHaveCount(0);
});

for(const phase of ['open','transaction','commit'] as const)for(const replacement of ['new','project','example'] as const){
  test(`LR-1: ${replacement} owns recovery after stale ${phase}`,async({page})=>{
    await ready(page);await input(page,fixtureProject('A'));await saved(page);const before=await durableCurrent(page);
    await page.evaluate(installIDBGate,null);await page.evaluate(phase=>window.idbGate.arm(phase),phase);
    await page.getByLabel('Lesson title').fill('A pending');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
    if(replacement==='new')await page.getByRole('button',{name:'New lesson',exact:true}).click();
    if(replacement==='project')await input(page,fixtureProject('B imported'));
    if(replacement==='example'){await page.getByRole('button',{name:'Open example',exact:true}).first().click();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');}
    await page.getByLabel('Lesson title').fill('B latest');await saved(page);const b=await durableCurrent(page);
    expect(b?.projectId).not.toBe(before?.projectId);expect(b?.metadata.title).toBe('B latest');
    await page.evaluate(()=>window.idbGate.release());await expect.poll(()=>page.evaluate(()=>window.idbGate.released)).toBe(1);
    expect(await durableCurrent(page)).toEqual(b);await saved(page);await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('B latest');
  });
}
for(const order of ['A first','B first']){
  test(`LR-1: A to B to C with ${order} late open delivery`,async({page})=>{
    await ready(page);await input(page,fixtureProject('A'));await saved(page);await page.evaluate(installIDBGate,null);
    await page.evaluate(()=>window.idbGate.arm('open'));await page.getByLabel('Lesson title').fill('A pending');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
    await input(page,fixtureProject('B'));await page.evaluate(()=>window.idbGate.arm('open'));await page.getByLabel('Lesson title').fill('B pending');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(2);
    await input(page,fixtureProject('C latest'));await saved(page);const c=await durableCurrent(page);
    await page.evaluate(index=>window.idbGate.release(index),order==='A first'?0:1);await page.evaluate(()=>window.idbGate.release());
    expect(await durableCurrent(page)).toEqual(c);await saved(page);await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('C latest');
  });
}
for(const phase of ['open','transaction','commit'] as const){
  test(`LR-1: same session retains edits made during in-flight ${phase}`,async({page})=>{
    await ready(page);await input(page,fixtureProject('Initial'));await saved(page);const revision=Number(await page.getByTestId('save-status').getAttribute('data-revision'));
    await page.evaluate(installIDBGate,null);await page.evaluate(phase=>window.idbGate.arm(phase),phase);await page.getByLabel('Lesson title').fill('First snapshot');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
    await page.getByLabel('Lesson title').fill('Latest while saving');await expect(page.getByTestId('save-status')).not.toHaveText('Saved in this browser');
    await page.evaluate(()=>window.idbGate.release());await saved(page);await expect(page.getByTestId('save-status')).toHaveAttribute('data-revision',String(revision+2));
    expect((await durableCurrent(page))?.metadata.title).toBe('Latest while saving');await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('Latest while saving');
  });
}
test('LR-1: Save a new copy owns recovery, stale error cannot affect it',async({page,context},info)=>{
  await ready(page);await input(page,fixtureProject('A'));await saved(page);await page.evaluate(installIDBGate,null);await page.evaluate(()=>window.idbGate.arm('open'));await page.getByLabel('Lesson title').fill('A late');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
  const b=fixtureProject('B');await input(page,b);await saved(page);
  const second=await context.newPage();await ready(second);await second.getByLabel('Lesson title').fill('Newer B');await saved(second);
  await page.getByLabel('Lesson title').fill('My B changes');await expect(page.getByTestId('save-status')).toContainText('Revision conflict');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).first().click();const backup=info.outputPath('conflict.json');await (await download).saveAs(backup);expect(JSON.parse(await readFile(backup,'utf8')).metadata.title).toBe('My B changes');
  await page.getByRole('button',{name:'Save a new copy',exact:true}).click();await saved(page);const copy=await durableCurrent(page);expect(copy?.projectId).not.toBe(b.projectId);
  // Close a retired open's connection: delivering its success would fail a stale write.
  await page.evaluate(()=>{window.idbGate.closeHeldOpen();window.idbGate.release();});expect(await durableCurrent(page)).toEqual(copy);await saved(page);await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('My B changes');
});
test('LR-1: undo to saved snapshot while a transaction is in flight remains pending until re-committed',async({page})=>{
  await ready(page);await input(page,fixtureProject('Initial'));await saved(page);const before=await durableCurrent(page);
  await page.evaluate(installIDBGate,null);await page.evaluate(()=>window.idbGate.arm('commit'));await page.getByLabel('Lesson title').fill('In-flight edit');await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByLabel('Lesson title')).toHaveValue('Initial');await expect(page.getByTestId('save-status')).not.toHaveText('Saved in this browser');
  expect((await durableCurrent(page))?.metadata.title).toBe('In-flight edit');await page.evaluate(()=>window.idbGate.release());await saved(page);
  const after=await durableCurrent(page);expect(after?.metadata.title).toBe('Initial');expect(after?.revision).toBe(before!.revision+2);await page.reload();await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('Initial');
});
test('LR-2: pending native restore commit times out, enables editing, and cannot overwrite memory work',async({page},info)=>{
  await ready(page);await input(page,fixtureProject('Stored lesson'));await saved(page);await page.addInitScript(installIDBGate,'restore' as const);await page.reload();await expect.poll(()=>page.evaluate(()=>window.idbGate.held)).toBe(1);
  await expect(page.getByLabel('Lesson title')).toBeDisabled();await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled({timeout:10000});await expect(page.getByRole('alert').first()).toContainText('Browser recovery did not complete');
  await page.getByLabel('Lesson title').fill('Memory after restore timeout');await page.evaluate(()=>window.idbGate.release());await saved(page);await expect(page.getByLabel('Lesson title')).toHaveValue('Memory after restore timeout');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).click();const file=info.outputPath('restore-timeout.json');await (await download).saveAs(file);expect(JSON.parse(await readFile(file,'utf8')).metadata.title).toBe('Memory after restore timeout');
});
test('LR-2: startup open timeout permits memory work and backup; late restore is ignored',async({page},info)=>{
  await ready(page);await input(page,fixtureProject('Stored lesson'));await saved(page);await page.addInitScript(installIDBGate,'open' as const);await page.reload();
  await expect(page.getByLabel('Lesson title')).toBeDisabled();await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled({timeout:10000});await expect(page.getByRole('alert').first()).toContainText('work in memory');
  await page.getByLabel('Lesson title').fill('Memory work after timeout');await page.evaluate(()=>window.idbGate.release());await expect(page.getByLabel('Lesson title')).toHaveValue('Memory work after timeout');
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).first().click();const file=info.outputPath('after-timeout.json');await (await download).saveAs(file);expect(JSON.parse(await readFile(file,'utf8')).metadata.title).toBe('Memory work after timeout');
});
test('LR-3: shuffled valid actions keep logical order through delete, undo, backup and player',async({page,browser},info)=>{
  await ready(page);const original=fixtureProject();await input(page,original);
  const ids=async()=>page.locator('.action-tabs button').allTextContents();
  expect(await ids()).toEqual(['1public','2private','3shared']);
  expect(await page.locator('.canvas-image .region').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')))).toEqual(['Region 1: public','Region 2: private','Region 3: shared']);
  await page.locator('.canvas-image .region').first().focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Region 2: private',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Region 3: shared',exact:true})).toBeFocused();
  await page.locator('.action-tabs button').first().click();await page.getByRole('button',{name:'Delete action',exact:true}).click();expect(await ids()).toEqual(['1private','2shared']);
  await page.getByRole('button',{name:'Undo',exact:true}).click();expect(await ids()).toEqual(['1public','2private','3shared']);await page.getByRole('button',{name:'Redo',exact:true}).click();expect(await ids()).toEqual(['1private','2shared']);
  const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).click();const backup=info.outputPath('ordered.project.json');await (await backupPromise).saveAs(backup);
  const project=JSON.parse(await readFile(backup,'utf8')) as Project,actions=(project.nodes[0] as ScreenNode).actions;
  expect([...actions].sort((a,b)=>a.order-b.order).map(a=>a.id)).toEqual(['private','shared']);
  for(const a of actions){const before=(original.nodes[0] as ScreenNode).actions.find(b=>b.id===a.id)!;expect({...a,order:before.order}).toEqual(before);}
  await page.getByLabel('Import project file',{exact:true}).setInputFiles(backup);await saved(page);
  expect(await page.locator('.canvas-image .region').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')))).toEqual(['Region 1: private','Region 2: shared']);
  expect(await page.locator('.transitions button span:first-child').allTextContents()).toEqual(['1. private','2. shared']);
  await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(page.frameLocator('iframe').locator('[data-action-id]')).toHaveCount(2);expect(await page.frameLocator('iframe').locator('[data-action-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-action-id')))).toEqual(['private','shared']);await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await page.getByRole('button',{name:'Export lesson',exact:true}).click();const exported=page.waitForEvent('download');await page.getByRole('button',{name:'Download lesson HTML',exact:true}).click();const file=info.outputPath('ordered.html');await (await exported).saveAs(file);
  const ctx=await browser.newContext({viewport:{width:390,height:900}});await ctx.setOffline(true);const learner=await ctx.newPage();await learner.goto(pathToFileURL(file).href);expect(await learner.locator('[data-action-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-action-id')))).toEqual(['private','shared']);await learner.locator('[data-action-id="private"]').focus();await learner.keyboard.press('Tab');await expect(learner.locator('[data-action-id="shared"]')).toBeFocused();await learner.keyboard.press('Shift+Tab');await expect(learner.locator('[data-action-id="private"]')).toBeFocused();await learner.keyboard.press('Enter');await learner.keyboard.press('Enter');await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');await ctx.close();
});

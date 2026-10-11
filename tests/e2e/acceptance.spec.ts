import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import axe from 'axe-core';
import type {Project,ScreenNode} from '../../src/model/types';
declare global { interface Window { axe:typeof axe } }
test.beforeEach(async({page})=>{page.on('dialog',d=>d.accept());await page.goto('/');await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();});
test('graph problems block ready export while a draft backup remains available',async({page})=>{
  const original=JSON.parse(await readFile('examples/workspace.lessonroutes.project.json','utf8')) as Project;
  for(const problem of ['missing-target','closed-loop','missing-finish','overlap']) {
    const p=structuredClone(original),first=p.nodes[0] as ScreenNode;
    if(problem==='missing-target')first.actions[1]!.targetNodeId=null;
    if(problem==='closed-loop')first.actions.forEach(a=>a.targetNodeId=first.id);
    if(problem==='missing-finish'){p.nodes=p.nodes.filter(n=>n.kind!=='finish');p.orderedNodeIds=p.orderedNodeIds.filter(id=>id!=='complete');}
    if(problem==='overlap')first.actions[1]!.rect={...first.actions[0]!.rect};
    await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'draft.project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.getByLabel('Step title',{exact:true})).toHaveValue(first.title);
    await page.getByRole('button',{name:'Export lesson',exact:true}).click();await expect(page.getByRole('dialog')).toHaveAttribute('aria-label','Validate lesson route');await expect(page.getByRole('dialog')).toContainText('Resolve these issues');await page.getByRole('button',{name:'Close dialog',exact:true}).click();
    if(problem==='overlap')expect(await page.locator('.region.blocked').count()).toBe(2);
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).click();expect((await download).suggestedFilename()).toBe('lessonroutes.project.json');
  }
  const bad=structuredClone(original);bad.assets[0]!.sha256='0'.repeat(64);await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'corrupt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await expect(page.getByRole('alert')).toContainText('SHA-256');expect(await page.locator('.region.blocked').count()).toBe(2);
});
test('quota after a write request and a stalled commit cannot show saved; download still works',async({page},info)=>{
  for(const failure of ['quota','abort','stalled']) {
    await page.reload();await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();
    await page.evaluate(failure=>{
      const native=IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction=function(...args){const tx=native.apply(this,args);if(args[1]!=='readwrite')return tx;
        const store=tx.objectStore('projects'),put=store.put.bind(store);
        if(failure==='quota')store.put=()=>{throw new DOMException('Synthetic quota exceeded','QuotaExceededError');};
        if(failure==='abort')store.put=(...values)=>{const r=put(...values);r.addEventListener('success',()=>tx.abort());return r;};
        if(failure==='stalled')return new Proxy(tx,{set(t,k,v){if(k==='oncomplete')return true;Reflect.set(t,k,v);return true;},get(t,k){const v=Reflect.get(t,k);return typeof v==='function'?v.bind(t):v;}});
        return tx;
      };
    },failure);
    await page.getByRole('button',{name:'Open example',exact:true}).first().click();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');await expect(page.getByTestId('save-status')).toContainText('Not saved',{timeout:10000});expect(await page.getByTestId('save-status').getAttribute('data-revision')).toBe('0');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).first().click();await (await download).saveAs(info.outputPath(`${failure}.project.json`));expect(JSON.parse(await readFile(info.outputPath(`${failure}.project.json`),'utf8')).nodes).toHaveLength(6);
  }
});
test('keyboard draw alternative, finish linking, live feedback, focus and outside click',async({page})=>{
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles('fixtures/batch/01.png');await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('01');await page.getByLabel('Instruction',{exact:true}).fill('Choose the continue action.');await page.getByLabel('Image description',{exact:true}).fill('An original sample screen numbered 1.');await page.getByRole('button',{name:'Add finish',exact:false}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:/01 01/}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Add action',exact:true}).focus();await page.keyboard.press('Enter');await page.getByLabel('Action label',{exact:true}).fill('Continue to finish');await page.getByLabel('Destination',{exact:true}).selectOption({label:'✓ Lesson complete'});await page.getByRole('button',{name:'Preview',exact:true}).click();const f=page.frameLocator('iframe');await expect(f.getByRole('heading',{level:1})).toBeFocused();const img=await f.locator('img').boundingBox();await page.mouse.click(img!.x+img!.width*.95,img!.y+img!.height*.95);await expect(f.locator('[role="status"]')).toContainText('list below');await expect(f.getByRole('button',{name:'Continue',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(f.getByRole('heading',{level:1})).toBeFocused();await f.locator('[data-action-id]').focus();await page.keyboard.press('Space');await page.keyboard.press('Enter');await expect(f.getByRole('heading',{name:'Lesson complete',exact:true})).toBeFocused();
});
test('long labels and accessible controls remain usable on desktop and mobile',async({page},info)=>{
  const p=JSON.parse(await readFile('examples/workspace.lessonroutes.project.json','utf8')) as Project;(p.nodes[0] as ScreenNode).actions[0]!.label='A very long choice label with a clear text equivalent '.repeat(3);p.nodes[0]!.title='A long classroom visibility instruction that wraps safely at narrow widths';await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'long.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.getByLabel('Step title',{exact:true})).toHaveValue(p.nodes[0]!.title);
  await page.addScriptTag({content:axe.source});
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});if(width===390)await page.getByRole('button',{name:'Actions',exact:true}).click();
    const violations=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));expect(violations.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`output/playwright/long-label-${info.project.name}-${width}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(page.frameLocator('iframe').getByRole('heading',{level:1})).toBeVisible();const frame=await (await page.locator('iframe').elementHandle())!.contentFrame();expect(frame).toBeDefined();await frame!.evaluate(axe.source);const audit=await frame!.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));expect(audit.violations.map(v=>v.id)).toEqual([]);
});

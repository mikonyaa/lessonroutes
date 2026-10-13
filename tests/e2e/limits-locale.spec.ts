import {test,expect} from '@playwright/test';
import {open,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fixturePNG,fixtureProject} from '../fixtures/lesson';
import type {ScreenNode} from '../../src/model/types';

test.beforeEach(async({page})=>{page.on('dialog',d=>d.accept());await page.goto('/');await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();});
test('normative byte limits reject whole inputs and leave the current project intact',async({page},info)=>{
  const p=fixtureProject('Byte limit sentinel');await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'sentinel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.getByLabel('Lesson title')).toHaveValue(p.metadata.title);
  const json=info.outputPath('too-large.json'),handle=await open(json,'w');await handle.truncate(80*1024*1024+1);await handle.close();
  await page.getByLabel('Import project file',{exact:true}).setInputFiles(json);await expect(page.getByRole('alert')).toContainText('80 MiB');await expect(page.getByLabel('Lesson title')).toHaveValue(p.metadata.title);
  const image=Buffer.alloc(10*1024*1024+1);fixturePNG().copy(image);
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles({name:'too-large.png',mimeType:'image/png',buffer:image});await expect(page.getByRole('alert')).toContainText('10 MiB');
  const total=info.outputPath('total.png'),totalFile=await open(total,'w');await totalFile.truncate(9*1024*1024);await totalFile.close();
  // Six individually bounded native Files fail the aggregate check before decoding.
  await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles(Array(6).fill(total));await expect(page.getByRole('alert')).toContainText('50 MiB');
  const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).first().click();const backup=info.outputPath('sentinel-backup.json');await (await promise).saveAs(backup);const actual=JSON.parse(await readFile(backup,'utf8'));expect({...actual,revision:p.revision}).toEqual(p);
});
test('long RTL text, locale, mobile panels and dialogs keep order, focus and bounded width',async({page,browser},info)=>{
  const p=fixtureProject('درس عربي مستقل');p.metadata.locale='ar';const screen=p.nodes[0] as ScreenNode;screen.title='اختر طريقًا لإكمال الدرس';screen.actions.forEach(a=>a.label=`${a.order+1} اختيار طويل بالعربية `.repeat(7).slice(0,200));
  await page.getByLabel('Import project file',{exact:true}).setInputFiles({name:'rtl.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await expect(page.getByLabel('Lesson title')).toHaveValue(p.metadata.title);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    for(const panel of ['Screens','Canvas','Actions']){if(width===390)await page.getByRole('button',{name:panel,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
    await page.getByRole('button',{name:'Export lesson',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Export lesson',exact:true})).toBeFocused();
    await page.screenshot({path:info.outputPath(`rtl-${width}.png`),fullPage:true});
  }
  await page.getByRole('button',{name:'Export lesson',exact:true}).click();const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Download lesson HTML',exact:true}).click();const file=info.outputPath('rtl.html');await (await promise).saveAs(file);
  const ctx=await browser.newContext({viewport:{width:390,height:900}});await ctx.setOffline(true);const learner=await ctx.newPage();const errors:string[]=[];learner.on('pageerror',e=>errors.push(e.message));await learner.goto(pathToFileURL(file).href);expect(await learner.locator('html').getAttribute('lang')).toBe('ar');expect(await learner.locator('[data-action-id]').allTextContents()).toEqual([...screen.actions].sort((a,b)=>a.order-b.order).map(a=>`${a.order+1}. ${a.label}`));expect(await learner.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await learner.locator('[data-action-id="private"]').focus();await learner.keyboard.press('Enter');await learner.keyboard.press('Enter');await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');expect(errors).toEqual([]);await ctx.close();
});

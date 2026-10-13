import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import path from 'node:path';

const file=path.resolve(process.argv[2]??'output/performance/near-limit-3.html'),html=await readFile(file,'utf8');
const payload=JSON.parse(html.match(/<script type="application\/json" id="lesson-data">([\s\S]*?)<\/script>/)[1]);
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:900}}),errors=[],requests=[];let outgoing=0;
await context.setOffline(true);await context.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});
await context.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){throw Error('disabled');}});Object.defineProperty(window,'localStorage',{get(){throw Error('disabled');}});});
await mkdir('output/performance',{recursive:true});
try{
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));const start=performance.now();
  await page.goto(pathToFileURL(file).href,{timeout:60000});await expect(page.locator('[data-action-id]')).toHaveCount(30);const loadMs=performance.now()-start;
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'output/performance/large-learner-390.png',fullPage:true});
  await page.locator('[data-action-id="action-0-0"]').focus();await page.keyboard.press('Tab');await expect(page.locator('[data-action-id="action-0-1"]')).toBeFocused();
  await page.locator('[data-action-id="action-0-4"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.lr-feedback')).toContainText('Feedback 0/4');await page.keyboard.press('Enter');await expect(page.locator('#lesson-root')).toHaveAttribute('data-node-id','screen-0');
  const keyboard=[];
  for(let i=0;i<50;i++){
    const t=performance.now();await page.locator(`[data-action-id="action-${i}-0"]`).focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');
    await expect(page.locator('#lesson-root')).toHaveAttribute('data-node-id',i<49?`screen-${i+1}`:'finish-0');keyboard.push(performance.now()-t);
  }
  await expect(page.locator('#lesson-root')).toHaveAttribute('data-phase','finished');await expect(page.getByRole('heading',{level:1})).toBeFocused();await page.screenshot({path:'output/performance/large-finish-390.png',fullPage:true});await page.getByRole('button',{name:'Restart lesson',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#lesson-root')).toHaveAttribute('data-node-id','screen-0');
  expect(outgoing).toBe(0);expect(errors).toEqual([]);const result={file,bytes:Buffer.byteLength(html),browser:browser.version(),node:process.version,nodes:payload.nodes.length,images:payload.assets.length,loadMs,keyboardStepMs:keyboard,offline:true,storageDisabled:true,outgoing,pageErrors:errors,requests,completedScreens:50,incorrectRetry:true,restart:true,viewport:{width:390,height:900}};
  await writeFile('output/performance/large-learner-results.json',JSON.stringify(result,null,2));console.log({loadMs,completedScreens:50,outgoing,errors});
}finally{await context.close();await browser.close();}

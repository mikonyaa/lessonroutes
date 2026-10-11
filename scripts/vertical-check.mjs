import { chromium, firefox, webkit } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
await mkdir('output/playwright',{recursive:true});
await build({entryPoints:['src/export/html.ts'],bundle:true,format:'iife',globalName:'LessonExporter',loader:{'.txt':'text'},outfile:'output/exporter.js'});
// ?raw is a Vite suffix, strip it for this independent script bundle.
const engines=[['Chromium',chromium,{}],['Firefox',firefox,{}],['Playwright WebKit',webkit,{}]];
if(process.platform==='darwin')engines.push(['Installed Google Chrome',chromium,{channel:'chrome'}]);
const results=[];
const htmlProject=await readFile('fixtures/vertical.project.json','utf8');
for(const [name,engine,options] of engines) {
  const browser=await engine.launch(options);
  const author=await browser.newContext(); const editor=await author.newPage();
  await editor.goto(pathToFileURL(path.resolve('examples/source/workspace.html')).href);
  await editor.addScriptTag({path:'output/exporter.js'});
  const html=await editor.evaluate(async json=>await LessonExporter.createLessonHTML(JSON.parse(json)),htmlProject);
  const file=path.resolve('output/playwright/Проверка с пробелами/lesson.html'); await mkdir(path.dirname(file),{recursive:true}); await writeFile(file,html);
  await author.close(); // No editor context / origin remains.
  for(const width of [1440,390]) for(const mode of ['mouse','keyboard']) {
    const context=await browser.newContext({viewport:{width,height:900}});let outgoing=0;const errors=[];
    await context.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});
    await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled for test');}});Object.defineProperty(window,'indexedDB',{get(){throw new Error('Storage disabled for test');}});});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);
    await page.goto(pathToFileURL(file).href);
    const choose=async id=>{if(mode==='keyboard'){const b=page.locator(`[data-action-id="${id}"]`);await b.focus();await page.keyboard.press('Enter');}else{const a=JSON.parse(htmlProject).nodes.flatMap(n=>n.actions||[]).find(a=>a.id===id),box=await page.locator('.lr-image-wrap img').boundingBox();await page.mouse.click(box.x+(a.rect.x+a.rect.width/2)*box.width,box.y+(a.rect.y+a.rect.height/2)*box.height);}};
    const cont=async()=>{if(mode==='keyboard')await page.keyboard.press('Enter');else await page.getByRole('button',{name:'Continue',exact:true}).click();};
    await choose('public');if(!(await page.locator('.lr-feedback').textContent()).includes('outside your class'))throw new Error('Wrong feedback');await cont();
    for(const id of ['private','code','essential']){await choose(id);await cont();}
    if(await page.locator('#lesson-root').getAttribute('data-phase')!=='finished'||outgoing||errors.length)throw new Error(JSON.stringify({name,width,mode,outgoing,errors}));
    results.push({browser:name,version:browser.version(),width,mode,phase:'finished',outgoingRequests:outgoing,storage:'disabled',filePath:'Unicode and spaces'});
    if(mode==='keyboard')await page.screenshot({path:`output/playwright/vertical-${name.replaceAll(' ','-')}-${width}.png`});
    await context.close();
  }
  await browser.close();
}
await writeFile('output/playwright/vertical-results.json',JSON.stringify(results,null,2));console.log(results);

import {chromium,expect} from '@playwright/test';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'vite';
if(process.platform!=='darwin')throw new Error('This local check requires installed Google Chrome on macOS.');
const profile=await mkdtemp(path.join(tmpdir(),'lessonroutes-chrome-zoom-'));await mkdir(path.join(profile,'Default'));
// Chromium's default partition is key x. This is a new temporary profile only;
// no installed user profile, browser settings or existing sessions are accessed.
await writeFile(path.join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(1.25)/Math.log(1.2)}}}));
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
const context=await chromium.launchPersistentContext(profile,{channel:'chrome',viewport:null,args:['--window-size=1440,1000','--force-device-scale-factor=1']});
try {
  const page=await context.newPage();await page.goto(server.resolvedUrls.local[0]);await expect(page.getByRole('button',{name:'Open example',exact:true}).first()).toBeEnabled();await page.getByRole('button',{name:'Open example',exact:true}).first().click();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');
  const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,outerWidth:window.outerWidth,devicePixelRatio:window.devicePixelRatio,cssZoom:window.getComputedStyle(document.documentElement).zoom,visualScale:window.visualViewport.scale,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,toolsRight:document.querySelector('.main-tools').getBoundingClientRect().right}));
  if(Math.abs(metrics.devicePixelRatio-1.25)>.01||metrics.cssZoom!=='1'||metrics.scrollWidth>metrics.innerWidth)throw new Error(`Browser zoom was not applied: ${JSON.stringify(metrics)}`);
  const region=page.getByRole('button',{name:'Region 2: Choose Private',exact:true});await region.scrollIntoViewIfNeeded();const box=await region.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await expect(page.getByLabel('Action label',{exact:true})).toHaveValue('Choose Private');await expect(page.getByLabel('Destination',{exact:true})).toHaveValue('invitations');await page.screenshot({path:'output/playwright/native-chrome-125-percent.png',fullPage:true});
  await page.goto(pathToFileURL(path.resolve('examples/lesson.html')).href);await context.setOffline(true);let outgoing=0;await context.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});
  for(const id of ['public','private','code','essential','backup','apply']){
    const input=await page.locator(`[data-action-id="${id}"]`).evaluate(el=>el.dataset.actionId);const rect=await page.evaluate(id=>JSON.parse(document.getElementById('lesson-data').textContent).nodes.flatMap(n=>n.actions||[]).find(a=>a.id===id).rect,input);await page.locator('.lr-image-wrap img').scrollIntoViewIfNeeded();const image=await page.locator('.lr-image-wrap img').boundingBox();await page.mouse.click(image.x+(rect.x+rect.width/2)*image.width,image.y+(rect.y+rect.height/2)*image.height);await expect(page.locator('#lesson-root')).toHaveAttribute('data-phase','showingFeedback');await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  await expect(page.locator('#lesson-root')).toHaveAttribute('data-phase','finished');if(outgoing)throw new Error('Player attempted network traffic.');await writeFile('output/playwright/native-zoom-results.json',JSON.stringify({browser:context.browser().version(),zoom:'125% native browser default zoom',metrics,editorRegionClick:'correct inspector selection',filePlayerMousePath:'wrong feedback, retry, correct path to finish',outgoingRequests:outgoing,profile:'new isolated temporary profile'},null,2));console.log(metrics);
}finally {await context.close();await server.close();}

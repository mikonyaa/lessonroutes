import {chromium,expect} from '@playwright/test';
import {mkdtemp,readFile,mkdir,cp,writeFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const version=JSON.parse(await readFile('package.json','utf8')).version;
const argument=process.argv.indexOf('--zip'),zip=path.resolve(argument>=0?process.argv[argument+1]:`artifacts/lessonroutes-${version}-web.zip`);
const consumer=await mkdtemp(path.join(tmpdir(),'lessonroutes-consumer-'));
const unpack=spawnSync('unzip',['-q',zip,'-d',consumer],{encoding:'utf8'});if(unpack.status!==0)throw new Error(unpack.stderr);
const root=path.join(consumer,`lessonroutes-${version}-web`);let hasModules=false;try{await access(path.join(root,'node_modules'));hasModules=true;}catch{/* Expected: consumer does not need dependencies. */}if(hasModules)throw new Error('Consumer package contains node_modules.');
const child=spawn(process.execPath,[path.join(root,'serve.mjs'),'--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
let stderr='';child.stderr.on('data',s=>stderr+=s);
const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`Consumer server timeout ${stderr}`)),10000);child.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('exit',code=>{clearTimeout(timer);reject(new Error(`Server stopped: ${code} ${stderr}`));});});
const browser=await chromium.launch();const outcomes=[];
try {
  // The supplied server serves only app, including a nested copied app tree.
  for(const pathname of ['/%2e%2e/LICENSE','/..%2fREADME-OFFLINE.md','/%2e%2e%5cLICENSE','/assets/','/serve.mjs']) {
    const response=await new Promise((resolve,reject)=>{http.get(url.slice(0,-1)+pathname,r=>{let body='';r.on('data',c=>body+=c);r.on('end',()=>resolve({status:r.statusCode,body}));}).on('error',reject);});
    if(response.status===200)throw new Error(`Unexpected served path ${pathname}`);
  }outcomes.push('Path traversal, directory listing and out-of-app files rejected.');
  const occupied=spawn(process.execPath,[path.join(root,'serve.mjs'),'--port',new URL(url).port],{cwd:root,stdio:['ignore','ignore','pipe']});const code=await new Promise(resolve=>occupied.on('exit',resolve));if(code!==1||(await fetch(url)).status!==200)throw new Error('Occupied-port behavior failed.');outcomes.push('Occupied port exits cleanly without affecting the existing server.');
  for(const subpath of ['', 'courses/lessonroutes arbitrary/']) {
    if(subpath){const staging=path.join(consumer,'subpath-copy');await cp(path.join(root,'app'),staging,{recursive:true});await cp(staging,path.join(root,'app',subpath),{recursive:true});}
    const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('dialog',d=>d.accept());
    await page.goto(url+subpath);await expect(page.getByRole('button',{name:'Open example',exact:true}).first()).toBeEnabled();await page.getByRole('button',{name:'Open example',exact:true}).first().click();await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Keep your classroom private');
    await page.getByLabel('Step title',{exact:true}).fill('Consumer-authored visibility');await page.getByRole('button',{name:'Region 1: Choose Public',exact:true}).focus();await page.keyboard.press('Enter');await page.getByLabel('Action label',{exact:true}).fill('Consumer wrong choice');await page.getByLabel('Feedback',{exact:false}).fill('Keep access within your class. Retry with Private.');await page.getByLabel('Destination',{exact:true}).selectOption('visibility');
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).click();const backup=path.join(consumer,subpath?'nested.project.json':'consumer.project.json');await (await downloadPromise).saveAs(backup);const saved=JSON.parse(await readFile(backup,'utf8'));if(saved.nodes[0].title!=='Consumer-authored visibility')throw new Error('Consumer backup lost edits.');
    await page.getByLabel('Import project file',{exact:true}).setInputFiles(backup);await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Consumer-authored visibility');await page.reload();await expect(page.getByRole('button',{name:'Open example',exact:true}).first()).toBeEnabled();
    // Reload may restore the previous committed revision. Reimport the manual backup.
    await page.getByLabel('Import project file',{exact:true}).setInputFiles(backup);await expect(page.getByLabel('Step title',{exact:true})).toHaveValue('Consumer-authored visibility');
    await page.getByRole('button',{name:'Export lesson',exact:true}).click();const exportedPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download lesson HTML',exact:true}).click();const folder=path.join(consumer,'Отдельный урок с пробелами');await mkdir(folder,{recursive:true});const file=path.join(folder,subpath?'nested.html':'lesson.html');await (await exportedPromise).saveAs(file);
    await page.screenshot({path:`output/playwright/production-${subpath?'subpath':'root'}.png`,fullPage:true});await context.close();
    const offline=await browser.newContext({viewport:{width:390,height:900}});let outgoing=0;await offline.route(/^https?:\/\//,route=>{outgoing++;return route.abort();});await offline.setOffline(true);const learner=await offline.newPage();await learner.goto(pathToFileURL(file).href);await learner.locator('[data-action-id="public"]').focus();await learner.keyboard.press('Enter');await expect(learner.locator('.lr-feedback')).toContainText('Retry with Private');await learner.keyboard.press('Enter');for(const id of ['private','code','essential','backup','apply']){await learner.locator(`[data-action-id="${id}"]`).focus();await learner.keyboard.press('Enter');await learner.keyboard.press('Enter');}await expect(learner.locator('#lesson-root')).toHaveAttribute('data-phase','finished');if(outgoing)throw new Error('Offline player requested the network.');await offline.close();outcomes.push(`Consumer ${subpath?'arbitrary subpath':'root'}: author, backup/import, hard refresh, export, isolated offline keyboard completion at 390px.`);
  }
  await writeFile('output/playwright/production-results.json',JSON.stringify({zip:path.basename(zip),sha256:createHash('sha256').update(await readFile(zip)).digest('hex'),node:process.version,browser:browser.version(),outsideSourceWorkspace:true,nodeModulesRequired:false,outcomes},null,2));console.log(outcomes);
} finally {await browser.close();child.kill('SIGTERM');}

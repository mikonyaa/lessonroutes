import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {performance} from 'node:perf_hooks';

const stage=path.resolve(process.argv[2]??'artifacts/lessonroutes-0.1.0-web'),inputs=path.resolve(process.argv[3]??'output/stress');
const output=path.resolve('output/performance');await mkdir(output,{recursive:true});
const build=JSON.parse(await readFile(path.join(stage,'BUILD.json'),'utf8')),fixtures=JSON.parse(await readFile(path.join(inputs,'inputs.json'),'utf8'));
const child=spawn(process.execPath,[path.join(stage,'serve.mjs'),'--port','0'],{cwd:stage,stdio:['ignore','pipe','pipe']});
const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Owned performance server did not start')),10000);child.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('exit',code=>{clearTimeout(timer);reject(Error(`Owned server exited ${code}`));});});
function rss(rootPID){
  const rows=execFileSync('ps',['-axo','pid=,ppid=,rss='],{encoding:'utf8'}).trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number));
  const owned=new Set([rootPID]);let changed=true;
  while(changed){changed=false;for(const [pid,ppid] of rows)if(owned.has(ppid)&&!owned.has(pid)){owned.add(pid);changed=true;}}
  return rows.filter(([pid])=>owned.has(pid)).reduce((n,[_pid,_ppid,kb])=>n+kb*1024,0);
}
const results=[];
try{
  for(const fixture of fixtures)for(let repeat=1;repeat<=3;repeat++){
    const server=await chromium.launchServer(),browser=await chromium.connect(server.wsEndpoint()),browserVersion=browser.version();
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
    page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
    const record={fixture:fixture.config.name,repeat,samples:[],keyboard:[],input:fixture};let sampling=null;
    const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
    const started=performance.now();
    const sample=async()=>{const values=(await cdp.send('Performance.getMetrics')).metrics;record.samples.push({elapsedMs:performance.now()-started,rssBytes:rss(server.process().pid),jsHeapBytes:values.find(m=>m.name==='JSHeapUsedSize')?.value??null});};
    const timer=globalThis.setInterval(()=>{if(!sampling)sampling=sample().finally(()=>{sampling=null;});},200);
    const timed=async(fn)=>{const start=performance.now();await fn();return performance.now()-start;};
    const keyboard=async(phase)=>{const working=await page.locator('.busy-indicator').count(),ms=await timed(()=>page.keyboard.press('Tab'));record.keyboard.push({phase,working:!!working,ms});};
    try{
      await page.goto(url);await expect(page.getByRole('button',{name:'New lesson',exact:true})).toBeEnabled();await expect(page.getByTestId('save-status')).toHaveText('Saved in this browser');
      const files=(await readdir(path.join(inputs,fixture.config.name,'images'))).sort().map(f=>path.join(inputs,fixture.config.name,'images',f));
      record.imageImportMs=await timed(async()=>{await page.getByLabel('Import screenshot files',{exact:true}).setInputFiles(files);await keyboard('image import');await expect(page.getByRole('status').filter({hasText:`Imported ${fixture.images} screenshot`})).toBeVisible({timeout:60000});});
      record.imageAutosaveAfterImportMs=await timed(()=>expect(page.getByTestId('save-status')).toHaveText('Saved in this browser',{timeout:60000}));
      record.projectImportMs=await timed(async()=>{await page.getByLabel('Import project file',{exact:true}).setInputFiles(fixture.project);await keyboard('project import');await expect(page.getByLabel('Lesson title')).toHaveValue(`Synthetic ${fixture.config.name} lesson`,{timeout:60000});});
      record.projectAutosaveAfterImportMs=await timed(()=>expect(page.getByTestId('save-status')).toHaveText('Saved in this browser',{timeout:60000}));
      await expect(page.locator('.screen-list li')).toHaveCount(fixture.nodes);
      const backupFile=path.join(output,`${fixture.config.name}-${repeat}.project.json`);
      record.backupMs=await timed(async()=>{const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Download project',exact:true}).click();await (await promise).saveAs(backupFile);});
      const backup=JSON.parse(await readFile(backupFile,'utf8')),source=JSON.parse(await readFile(fixture.project,'utf8'));expect(backup.assets).toEqual(source.assets);expect(backup.nodes).toEqual(source.nodes);
      await page.getByRole('button',{name:'Export lesson',exact:true}).click();record.dialogEscapeMs=await timed(()=>page.keyboard.press('Escape'));await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.getByRole('button',{name:'Export lesson',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Original image bytes may include metadata');
      const exported=path.join(output,`${fixture.config.name}-${repeat}.html`);
      record.exportMs=await timed(async()=>{const promise=page.waitForEvent('download',{timeout:60000});await page.getByRole('button',{name:'Download lesson HTML',exact:true}).click();await keyboard('HTML export');await (await promise).saveAs(exported);});
      const html=await readFile(exported,'utf8');record.exportBytes=Buffer.byteLength(html);record.exportSHA256=createHash('sha256').update(html).digest('hex');
      const match=html.match(/<script type="application\/json" id="lesson-data">([\s\S]*?)<\/script>/);const payload=JSON.parse(match[1]);expect(payload.nodes).toHaveLength(fixture.nodes);expect(payload.assets.map(a=>a.base64)).toEqual(source.assets.map(a=>a.base64));
      record.reloadMs=await timed(async()=>{await page.reload();await expect(page.getByTestId('save-status')).toHaveText('Saved in this browser',{timeout:60000});await expect(page.getByLabel('Lesson title')).toHaveValue(source.metadata.title);});
      await sample();record.peakBrowserTreeRSSBytes=Math.max(...record.samples.map(s=>s.rssBytes));record.peakJSHeapBytes=Math.max(...record.samples.map(s=>s.jsHeapBytes??0));record.errors=errors;expect(errors).toEqual([]);
      results.push(record);await writeFile(path.join(output,'raw-results.json'),JSON.stringify({build,node:process.version,browser:browserVersion,os:{platform:os.platform(),release:os.release(),arch:os.arch(),totalMemory:os.totalmem()},rssMethod:'200 ms samples of the owned browser process tree; sum RSS includes shared pages, excludes Node/server; observed peak, not an allocation maximum',cancel:'Escape closes the export dialog before preparation. Image/project import and active export have no Cancel control in v1.',results},null,2));
      console.log(JSON.stringify({fixture:record.fixture,repeat,imageImportMs:record.imageImportMs,projectImportMs:record.projectImportMs,autosaveMs:record.projectAutosaveAfterImportMs,exportMs:record.exportMs,peakRSSMiB:record.peakBrowserTreeRSSBytes/1048576}));
    }finally{globalThis.clearInterval(timer);await sampling;await context.close();await browser.close();await server.close();}
  }
}finally{child.kill('SIGTERM');}

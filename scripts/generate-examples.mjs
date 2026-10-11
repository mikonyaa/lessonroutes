import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
await mkdir('examples/screens',{recursive:true}); await mkdir('fixtures',{recursive:true});
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:1200,height:720},deviceScaleFactor:1}); const screenRects=[];
for(let i=0;i<5;i++) {
  await page.goto(pathToFileURL(path.resolve('examples/source/workspace.html')).href+'?step='+i);
  await page.screenshot({path:`examples/screens/0${i+1}.png`});
  screenRects.push(await page.locator('.choice').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x/1200,y:r.y/720,width:r.width/1200,height:r.height/720};})));
}
await browser.close();
const assets=[];
for(let i=0;i<5;i++) {const bytes=await readFile(`examples/screens/0${i+1}.png`);assets.push({id:`asset-${i+1}`,displayName:`0${i+1}-workspace.png`,mime:'image/png',pixelWidth:1200,pixelHeight:720,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});}
const rects=screenRects[0];
const action=(id,label,index,target,outcome,feedback)=>({id,label,rect:rects[index],targetNodeId:target,outcome,feedback,order:0});
const nodes=[
 {id:'visibility',kind:'screen',assetId:'asset-1',title:'Keep your classroom private',instruction:'Set visibility so only invited learners can enter. Choose a region or the equivalent text action.',imageDescription:'The visibility page offers Public, Private, and Shared link. Public is open to everyone; Private admits invited learners; a shared link admits anyone who has it.',actions:[action('public','Choose Public',0,'visibility','incorrect','Public access lets people outside your class discover the workspace. Choose Private to keep practice within the invited group.'),action('private','Choose Private',1,'invitations','correct','Private access keeps this exercise within your invited group.'),action('shared','Choose Shared link',2,'visibility','incorrect','Links can be forwarded beyond the classroom. Private invitations give you clearer control over who can enter. Try again.')]},
 {id:'invitations',kind:'screen',assetId:'asset-2',title:'Invite intentionally',instruction:'Choose the invitation for your classroom group.',imageDescription:'The invitations page offers Invite with class code and Invite everyone.',actions:[action('code','Invite with class code',0,'notifications','correct','A class code keeps the invitation focused on your intended group.'),action('everyone','Invite everyone',1,'invitations','incorrect','Inviting everyone expands access beyond your practice group. Use your class code instead.')]},
 {id:'notifications',kind:'screen',assetId:'asset-3',title:'Make room for focus',instruction:'Keep essential notifications without an alert for every activity.',imageDescription:'The preferences page offers Essential only and Every activity.',actions:[action('essential','Essential only',0,'recovery','correct','Essential notifications keep important task updates visible.'),action('all','Every activity',1,'notifications','incorrect','An alert for every click can interrupt practice. Keep essential updates and try again.')]},
 {id:'recovery',kind:'screen',assetId:'asset-4',title:'Keep a recovery copy',instruction:'Prepare a copy that survives clearing browser storage.',imageDescription:'The recovery page offers Download a backup and Skip backup.',actions:[action('backup','Download a backup',0,'review','correct','A separate copy can be reopened if browser storage is cleared.'),action('skip','Skip backup',1,'recovery','incorrect','Browser storage can be cleared or evicted. Download a backup to keep a separate recovery copy.')]},
 {id:'review',kind:'screen',assetId:'asset-5',title:'Apply your settings',instruction:'Review the choices and apply the settings.',imageDescription:'The review page confirms private access, class invitations, essential updates and a recovery copy. Apply settings is the available action.',actions:[action('apply','Apply settings',0,'complete','correct','Your practice workspace is ready.')]},
 {id:'complete',kind:'finish',title:'Ready for practice',completionText:'You chose private access, invited a focused group, kept essential notifications and prepared a recovery copy. These small choices make a calmer practice space.'}
]; for(const n of nodes)if(n.actions)n.actions.forEach((a,i)=>a.order=i);
const project={kind:'lessonroutes-project',schemaVersion:1,projectId:'practice-workspace-example',revision:0,metadata:{title:'A safer practice workspace',description:'Five fictional screens. Practise visibility, invitations, notifications and recovery with explanations and retries.',locale:'en',credits:'Original artwork and teaching text by Meiram Bakhytzhan. MIT licensed.'},startNodeId:'visibility',orderedNodeIds:nodes.map(n=>n.id),assets,nodes};
await writeFile('examples/workspace.lessonroutes.project.json',JSON.stringify(project,null,2));
const vertical=structuredClone(project);vertical.projectId='vertical-feasibility';vertical.nodes=vertical.nodes.filter(n=>['visibility','invitations','notifications','complete'].includes(n.id));vertical.assets=vertical.assets.slice(0,3);vertical.nodes[0].actions=vertical.nodes[0].actions.slice(0,2);vertical.nodes[1].actions=vertical.nodes[1].actions.slice(0,1);vertical.nodes[2].actions=vertical.nodes[2].actions.slice(0,1);vertical.nodes[2].actions[0].targetNodeId='complete';vertical.orderedNodeIds=vertical.nodes.map(n=>n.id);await writeFile('fixtures/vertical.project.json',JSON.stringify(vertical,null,2));
console.log('Generated 5 real browser-rendered original screens and editable projects.');

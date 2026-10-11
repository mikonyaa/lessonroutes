import { chromium } from '@playwright/test';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('fixtures/batch',{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage();
for(let i=0;i<20;i++) {
  const width=i%3===0?120:i%3===1?80:200,height=i%3===0?80:i%3===1?160:100;
  await page.setViewportSize({width,height});await page.setContent(`<body style="margin:0;background:hsl(${i*17} 25% 85%);font:16px sans-serif"><p>Screen ${i+1} · экран</p></body>`);
  await page.screenshot({path:`fixtures/batch/${String(i+1).padStart(2,'0')}.png`});
}
await page.setViewportSize({width:160,height:80});await page.setContent('<body style="margin:0;background:#8ec197"><b>Orientation →</b></body>');await page.screenshot({path:'fixtures/plain.jpg',type:'jpeg'});
const jpeg=await readFile('fixtures/plain.jpg');
const exif=Buffer.from([0xff,0xe1,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
await writeFile('fixtures/oriented-6.jpg',Buffer.concat([jpeg.subarray(0,2),exif,jpeg.subarray(2)]));
const frames=[];
for(const color of ['#12b034','#d42618']) {const data=await page.evaluate(color=>{const c=document.createElement('canvas');c.width=160;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,160,80);return c.toDataURL('image/webp').split(',')[1];},color);frames.push(Buffer.from(data,'base64'));}
await writeFile('fixtures/static.webp',frames[0]);
const chunk=(name,data)=>{const header=Buffer.alloc(8);header.write(name);header.writeUInt32LE(data.length,4);return Buffer.concat([header,data,...(data.length%2?[Buffer.alloc(1)]:[])]);};
const extended=Buffer.alloc(10);extended[0]=2;extended.writeUIntLE(159,4,3);extended.writeUIntLE(79,7,3);
const chunks=[chunk('VP8X',extended),chunk('ANIM',Buffer.alloc(6))];
for(const frame of frames){const h=Buffer.alloc(16);h.writeUIntLE(159,6,3);h.writeUIntLE(79,9,3);h.writeUIntLE(500,12,3);h[15]=2;chunks.push(chunk('ANMF',Buffer.concat([h,frame.subarray(12)])));}
const data=Buffer.concat([Buffer.from('WEBP'),...chunks]),header=Buffer.alloc(8);header.write('RIFF');header.writeUInt32LE(data.length,4);await writeFile('fixtures/animated.webp',Buffer.concat([header,data]));await browser.close();
const run=spawnSync('ffmpeg',['-loglevel','error','-y','-framerate','2','-start_number','1','-i','examples/screens/%02d.png','-frames:v','2','-plays','0','-f','apng','fixtures/animated.png'],{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr);
console.log('Created 20 ordered raster fixtures, real APNG/WebP animations and EXIF-oriented JPEG.');

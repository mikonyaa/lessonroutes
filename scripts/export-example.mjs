import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';

// Rebuild only the learner HTML from the retained project and original image bytes.
const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false}});await server.listen();
const browser=await chromium.launch();
try{
  const page=await browser.newPage();await page.goto(server.resolvedUrls.local[0]);
  const project=await readFile('examples/workspace.lessonroutes.project.json','utf8');
  const html=await page.evaluate(async text=>{
    const {loadProject}=await import('/src/model/load.ts');
    const {createLessonHTML}=await import('/src/export/html.ts');
    return createLessonHTML(await loadProject(text));
  },project);
  await writeFile('examples/lesson.html',html);console.log('Rebuilt example learner HTML; editable project and original raster bytes retained.');
}finally{await browser.close();await server.close();}

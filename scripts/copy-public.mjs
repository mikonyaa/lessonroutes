import { mkdir, copyFile, access } from 'node:fs/promises';
await mkdir('dist/examples',{recursive:true});
for(const file of ['workspace.lessonroutes.project.json','lesson.html','LICENSE','demo.mp4','demo-poster.png']) {
  try {await access(`examples/${file}`);await copyFile(`examples/${file}`,`dist/examples/${file}`);}catch {if(file==='workspace.lessonroutes.project.json')throw new Error('Generate examples first.');}
}

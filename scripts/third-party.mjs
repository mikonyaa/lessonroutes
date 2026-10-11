import {readFile,writeFile} from 'node:fs/promises';
let notices='LessonRoutes runtime dependencies — license texts\n\n';
for(const name of ['react','react-dom','scheduler']){const p=JSON.parse(await readFile(`node_modules/${name}/package.json`,'utf8'));notices+=`\n${name} ${p.version} (${p.license})\n${await readFile(`node_modules/${name}/LICENSE`,'utf8')}\n`;}
await writeFile('THIRD-PARTY-NOTICES.txt',notices.trimEnd()+'\n');
const lock=JSON.parse(await readFile('package-lock.json','utf8'));const inventory=Object.entries(lock.packages).filter(([name])=>name).map(([name,p])=>({package:name.replace(/^node_modules\//,''),version:p.version,license:p.license||'CHECK_PACKAGE'}));
if(inventory.some(p=>p.license==='CHECK_PACKAGE'))throw new Error('Unresolved dependency license.');await writeFile('docs/dependency-licenses.json',JSON.stringify(inventory,null,2));

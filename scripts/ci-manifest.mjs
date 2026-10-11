import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const p=JSON.parse(await readFile('package.json','utf8')),name=`lessonroutes-${p.version}-web.zip`,bytes=await readFile(`artifacts/${name}`);
await writeFile('artifacts/ci-build.json',JSON.stringify({version:p.version,sourceCommit:process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),origin:'GitHub Actions',runId:process.env.GITHUB_RUN_ID,node:process.version,npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),playwright:p.devDependencies['@playwright/test'],zip:{name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}},null,2));

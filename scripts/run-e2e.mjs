import { createServer } from 'vite';
import { spawn } from 'node:child_process';
const server=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false}});await server.listen();
const url=server.resolvedUrls.local[0];console.log(`Isolated E2E server: ${url}`);
try {
  const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,LESSONROUTES_BASE_URL:url}});
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});process.exitCode=code??1;
} finally {await server.close();}

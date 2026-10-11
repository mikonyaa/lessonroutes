import http from 'node:http';
import {realpath,stat,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);let port=0;
if(args.length){if(args.length!==2||args[0]!=='--port'||!/^\d+$/.test(args[1])){console.error('Usage: node serve.mjs --port 0');process.exit(1);}port=Number(args[1]);if(port>65535){console.error('Port must be between 0 and 65535.');process.exit(1);}}
const root=await realpath(fileURLToPath(new URL('./app/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  const fail=(status,text)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(text);};
  if(!['GET','HEAD'].includes(req.method)){fail(405,'Method not allowed');return;}
  try {
    const raw=(req.url||'/').split('?')[0];const pathname=decodeURIComponent(raw);
    if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').includes('..')){fail(403,'Forbidden');return;}
    const requested=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!requested.startsWith(root+path.sep)){fail(403,'Forbidden');return;}
    const file=await realpath(requested);if(!file.startsWith(root+path.sep)){fail(403,'Forbidden');return;}
    const info=await stat(file);if(!info.isFile()){fail(404,'Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain; charset=utf-8','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else res.end(await readFile(file));
  }catch(e){fail(e instanceof URIError?400:404,'Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port is occupied. Use --port 0 to choose a free port.':`Server failed: ${error.message}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{console.log(`LessonRoutes editor: http://127.0.0.1:${server.address().port}/`);});
process.on('SIGINT',()=>server.close());process.on('SIGTERM',()=>server.close());

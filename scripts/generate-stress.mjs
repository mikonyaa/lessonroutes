import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {crc32,deflateSync} from 'node:zlib';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'output/stress');await mkdir(root,{recursive:true});
function png(side,seed){
  const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([length,type,data,crc]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(side);header.writeUInt32BE(side,4);header[8]=8;header[9]=2;
  const pixels=Buffer.alloc(side*(side*3+1));let state=seed+1;
  for(let y=0;y<side;y++)for(let x=0;x<side*3;x++){state^=state<<13;state^=state>>>17;state^=state<<5;pixels[y*(side*3+1)+1+x]=state&255;}
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels,{level:1})),chunk('IEND',Buffer.alloc(0))]);
}
const summaries=[];
for(const config of [{name:'representative',images:8,finishes:8,actions:4,side:384,feedback:80},{name:'near-limit',images:50,finishes:150,actions:30,side:532,feedback:4000}]){
  const folder=path.join(root,config.name),imagesFolder=path.join(folder,'images');await mkdir(imagesFolder,{recursive:true});
  const assets=[],nodes=[],imageSizes=[];
  for(let i=0;i<config.images;i++){
    const side=config.name==='near-limit'&&i===0?1860:config.side,bytes=png(side,i),id=`asset-${i}`,displayName=`${String(i).padStart(2,'0')}.png`;
    await writeFile(path.join(imagesFolder,displayName),bytes);imageSizes.push(bytes.length);
    assets.push({id,displayName,mime:'image/png',pixelWidth:side,pixelHeight:side,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')});
    const actions=[];
    for(let j=0;j<config.actions;j++){
      const finish=i*(config.finishes/config.images)+(j-1)%(config.finishes/config.images);
      const targetNodeId=j===0?(i+1<config.images?`screen-${i+1}`:'finish-0'):j<=config.finishes/config.images?`finish-${finish}`:`screen-${i}`;
      actions.push({id:`action-${i}-${j}`,label:`Choice ${j+1} from screen ${i+1} `.padEnd(config.name==='near-limit'?200:50,'x'),rect:{x:(j%6)/6+.01,y:Math.floor(j/6)/5+.01,width:.14,height:.16},targetNodeId,outcome:j===0?'correct':j<=config.finishes/config.images?'neutral':'incorrect',feedback:`Feedback ${i}/${j}: continue or retry. `.padEnd(config.feedback,'f'),order:j});
    }
    nodes.push({id:`screen-${i}`,kind:'screen',assetId:id,title:`Synthetic screen ${i+1}`,instruction:'Choose the first action for the next screen, an alternative finish, or retry.',imageDescription:'Synthetic deterministic noise raster; choose the equivalent labelled actions.',actions:actions.reverse()});
  }
  for(let i=0;i<config.finishes;i++)nodes.push({id:`finish-${i}`,kind:'finish',title:`Synthetic finish ${i+1}`,completionText:`Completed path ${i+1}.`});
  const project={kind:'lessonroutes-project',schemaVersion:1,projectId:`stress-${config.name}`,revision:0,metadata:{title:`Synthetic ${config.name} lesson`,description:'Deterministic independently generated performance input',locale:'en',credits:'Generated locally for verification'},startNodeId:'screen-0',orderedNodeIds:nodes.map(n=>n.id),assets,nodes};
  const text=JSON.stringify(project),file=path.join(folder,'project.json');await writeFile(file,text);
  summaries.push({config,project:file,projectBytes:Buffer.byteLength(text),projectSHA256:createHash('sha256').update(text).digest('hex'),nodes:nodes.length,images:assets.length,actionsPerScreen:config.actions,imageBytes:imageSizes.reduce((n,v)=>n+v,0),largestImageBytes:Math.max(...imageSizes),imageSizes});
}
await writeFile(path.join(root,'inputs.json'),JSON.stringify(summaries,null,2));console.log(summaries.map(({imageSizes:_imageSizes,...s})=>s));

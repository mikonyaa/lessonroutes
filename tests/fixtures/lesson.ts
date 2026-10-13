import { createHash, randomUUID } from 'node:crypto';
import { crc32, deflateSync } from 'node:zlib';
import type { Project, ScreenNode } from '../../src/model/types';

// Independent static raster and lesson; no account screenshots or example bytes.
export function fixturePNG(width=320,height=200):Buffer {
  const chunk=(name:string,data:Buffer)=>{
    const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);
    length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
    return Buffer.concat([length,type,data,crc]);
  };
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const pixels=Buffer.alloc(height*(1+width*3));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*(1+width*3)+1+x*3;pixels[i]=x%256;pixels[i+1]=y%256;pixels[i+2]=110;
  }
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
export function fixtureProject(title='Independent branching lesson'):Project {
  const bytes=fixturePNG();
  const actions=['public','private','shared'].map((id,order)=>({id,label:id,order,
    rect:{x:.05+order*.3,y:.2,width:.2,height:.4},targetNodeId:id==='private'?'finish':'screen',
    outcome:id==='private'?'correct' as const:'incorrect' as const,feedback:id==='private'?'Ready to finish.':`${id}: retry with private.`}));
  const screen:ScreenNode={id:'screen',kind:'screen',assetId:'image',title:'Choose a route',instruction:'Choose private to finish. Other choices retry.',imageDescription:'Three distinct colored regions with equivalent text actions.',actions:[actions[2]!,actions[0]!,actions[1]!]};
  return {kind:'lessonroutes-project',schemaVersion:1,projectId:randomUUID(),revision:0,metadata:{title,description:'Independent regression fixture',locale:'en',credits:'Original synthetic fixture'},startNodeId:'screen',orderedNodeIds:['screen','finish'],assets:[{id:'image',displayName:'independent.png',mime:'image/png',pixelWidth:320,pixelHeight:200,sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')}],nodes:[screen,{id:'finish',kind:'finish',title:'Finished',completionText:'Practice complete.'}]};
}

import { orderedActions } from '../model/actions';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Asset, Rect, ScreenNode } from '../model/types';
import { containRect, hitTest, moveRect, normalizePoint } from '../graph/geometry';
type Props={node:ScreenNode;asset:Asset;selected:string|null;select:(id:string)=>void;add:(r:Rect)=>void;move:(id:string,r:Rect)=>void;blocked:Set<string>};
export function Canvas({node,asset,selected,select,add,move,blocked}:Props) {
  const stage=useRef<HTMLDivElement>(null),imageWrap=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:0,height:0}),[drawMode,setDrawMode]=useState(false),[draft,setDraft]=useState<Rect|null>(null);
  const drag=useRef<{mode:'draw'|'move';id:string|null;start:{x:number;y:number};original:Rect|null;current:Rect|null}|null>(null);
  useEffect(()=>{const el=stage.current;if(!el)return;const resize=()=>{const box=containRect({width:el.clientWidth-32,height:el.clientHeight-32},{width:asset.pixelWidth,height:asset.pixelHeight});setSize({width:box.width,height:box.height});};const observer=new ResizeObserver(resize);observer.observe(el);resize();return ()=>observer.disconnect();},[asset]);
  useEffect(()=>{setDraft(null);setDrawMode(false);drag.current=null;},[node.id]);
  const point=(e:PointerEvent)=>{const box=imageWrap.current!.getBoundingClientRect();const p=normalizePoint(e.clientX,e.clientY,box);return {x:Math.min(1,Math.max(0,p.x)),y:Math.min(1,Math.max(0,p.y))};};
  function down(e:PointerEvent<HTMLDivElement>) {
    if(e.button!==0)return;const p=point(e),a=hitTest(node.actions,p.x,p.y);
    if(!drawMode&&!a)return;
    e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();
    if(drawMode)drag.current={mode:'draw',id:null,start:p,original:null,current:null};
    else if(a){select(a.id);drag.current={mode:'move',id:a.id,start:p,original:a.rect,current:a.rect};}
  }
  function motion(e:PointerEvent<HTMLDivElement>) {
    const d=drag.current;if(!d)return;const p=point(e);
    d.current=d.mode==='draw'?{x:Math.min(p.x,d.start.x),y:Math.min(p.y,d.start.y),width:Math.abs(p.x-d.start.x),height:Math.abs(p.y-d.start.y)}:moveRect(d.original!,p.x-d.start.x,p.y-d.start.y);
    setDraft(d.current);
  }
  function up(e:PointerEvent<HTMLDivElement>) {
    const d=drag.current;drag.current=null;
    if(d?.current&&d.current.width>.002&&d.current.height>.002){if(d.mode==='draw'){add(d.current);setDrawMode(false);}else if(d.id)move(d.id,d.current);}
    setDraft(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function key(e:KeyboardEvent<HTMLButtonElement>,id:string,r:Rect) {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const delta=e.shiftKey?.01:.002;
    if(e.altKey) {
      const width=Math.min(1-r.x,Math.max(.002,r.width+(['ArrowLeft','ArrowRight'].includes(e.key)?(e.key==='ArrowLeft'?-delta:delta):0)));
      const height=Math.min(1-r.y,Math.max(.002,r.height+(['ArrowUp','ArrowDown'].includes(e.key)?(e.key==='ArrowUp'?-delta:delta):0)));
      move(id,{...r,width,height});
    } else move(id,moveRect(r,e.key==='ArrowLeft'?-delta:e.key==='ArrowRight'?delta:0,e.key==='ArrowUp'?-delta:e.key==='ArrowDown'?delta:0));
  }
  return <>
    <div className="canvas-toolbar"><span>SCREEN / {asset.pixelWidth} × {asset.pixelHeight}</span><div><button aria-pressed={drawMode} onClick={()=>setDrawMode(!drawMode)} disabled={node.actions.length>=30}>Draw region</button><button onClick={()=>add({x:.1,y:.1,width:.2,height:.15})} disabled={node.actions.length>=30}>Add action</button></div></div>
    <p className="canvas-help">{drawMode?'Drag a rectangle on the image. Keyboard: use Add action, then edit the four numeric fields.':'Select a region to edit. Drag to move; arrow keys move, Alt + arrows resize, Shift makes larger steps.'}</p>
    <div className="canvas-stage" ref={stage}>
      <div className={`canvas-image ${drawMode?'drawing':''}`} ref={imageWrap} style={{width:size.width,height:size.height}} onPointerDown={down} onPointerMove={motion} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setDraft(null);}}>
        <img src={`data:${asset.mime};base64,${asset.base64}`} alt={node.imageDescription||'Screenshot to annotate'} draggable={false}/>
        {orderedActions(node.actions).map(a=>{const r=drag.current?.id===a.id&&draft?draft:a.rect;return <button key={a.id} type="button" tabIndex={0} className={`region ${a.id===selected?'selected':''} ${blocked.has(a.id)?'blocked':''}`} aria-label={`Region ${a.order+1}: ${a.label}`} aria-pressed={a.id===selected} onClick={e=>{if(e.detail===0)select(a.id);}} onKeyDown={e=>key(e,a.id,a.rect)} style={{left:`${r.x*100}%`,top:`${r.y*100}%`,width:`${r.width*100}%`,height:`${r.height*100}%`}}><span>{a.order+1}</span></button>;})}
        {draft&&drag.current?.mode==='draw'&&<div className="region draft" style={{left:`${draft.x*100}%`,top:`${draft.y*100}%`,width:`${draft.width*100}%`,height:`${draft.height*100}%`}}/>}
      </div>
    </div>
  </>;
}

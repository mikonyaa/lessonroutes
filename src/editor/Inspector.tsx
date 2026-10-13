import { orderedActions } from '../model/actions';
import { useEffect, useState } from 'react';
import { LIMITS, type Action, type Project, type ScreenNode, type Rect } from '../model/types';
import { validRect } from '../graph/geometry';
type Props={node:ScreenNode;action:Action|null;project:Project;edit:(fn:(a:Action)=>Action)=>void;select:(id:string)=>void;remove:()=>void;reorder:(delta:number)=>void};
function GeometryField({name,value,onChange}:{name:string;value:number;onChange:(text:string)=>boolean}) {
  const [text,setText]=useState(String(Number((value*100).toFixed(4)))),[focused,setFocused]=useState(false);
  useEffect(()=>{if(!focused)setText(String(Number((value*100).toFixed(4))));},[value,focused]);
  return <label>{name} (%)<input aria-label={`${name} (%)`} type="number" inputMode="decimal" min={name==='Left'||name==='Top'?0:.01} max={100} step="0.1" value={text} onFocus={()=>setFocused(true)} onChange={e=>{setText(e.target.value);onChange(e.target.value);}} onBlur={()=>{setFocused(false);setText(String(Number((value*100).toFixed(4))));}}/></label>;
}
export function Inspector({node,action,project,edit,select,remove,reorder}:Props) {
  const [geometryError,setGeometryError]=useState('');
  const geometry=(key:keyof Rect,value:string)=>{
    if(!action)return false;const number=Number(value)/100;const rect={...action.rect,[key]:number};
    if(!value||!validRect(rect)){setGeometryError('Use positive sizes inside the image. Position + size must stay at or below 100%. Invalid values revert on leaving the field.');return false;}
    setGeometryError('');edit(a=>({...a,rect}));return true;
  };
  return <aside className="inspector" aria-label="Action inspector"><div className="panel-heading"><h2>Actions</h2><span>{node.actions.length} / 30</span></div>
    <div className="action-tabs">{orderedActions(node.actions).map(a=><button key={a.id} tabIndex={0} aria-pressed={action?.id===a.id} onClick={()=>{select(a.id);setGeometryError('');}}><span className="step-number">{a.order+1}</span><span>{a.label}</span></button>)}</div>
    {!action?<div className="inspector-empty"><p>Add an action to describe a choice on this screenshot.</p><p className="muted">Each action has a region, a text equivalent, feedback and a destination.</p></div>:<div className="inspector-fields" key={action.id}>
      <label>Action label<input value={action.label} maxLength={LIMITS.title} onChange={e=>edit(a=>({...a,label:e.target.value}))}/></label>
      <label>Outcome<select aria-label="Outcome" value={action.outcome} onChange={e=>edit(a=>({...a,outcome:e.target.value as Action['outcome']}))}><option value="neutral">Neutral</option><option value="correct">Correct choice</option><option value="incorrect">Incorrect choice</option></select></label>
      <label>Destination<select aria-label="Destination" value={action.targetNodeId??''} onChange={e=>edit(a=>({...a,targetNodeId:e.target.value||null}))}><option value="">Choose a step…</option>{project.orderedNodeIds.map(id=>{const n=project.nodes.find(n=>n.id===id)!;return <option key={id} value={id}>{n.id===node.id?'↺ Retry this screen':`${n.kind==='finish'?'✓ ':''}${n.title||'Untitled step'}`}</option>;})}</select></label>
      <label>Feedback {action.outcome==='incorrect'&&<span className="required">required for an incorrect choice</span>}<textarea rows={4} maxLength={LIMITS.text} value={action.feedback} onChange={e=>edit(a=>({...a,feedback:e.target.value}))}/></label>
      <fieldset className="geometry"><legend>Region · percent of the image</legend>{(['x','y','width','height'] as const).map(key=><GeometryField key={`${action.id}-${key}`} name={key==='x'?'Left':key==='y'?'Top':key==='width'?'Width':'Height'} value={action.rect[key]} onChange={text=>geometry(key,text)}/>)}</fieldset>
      {geometryError&&<p className="field-error" role="alert">{geometryError}</p>}
      <div className="inline-buttons"><button onClick={()=>reorder(-1)} disabled={action.order===0}>Earlier</button><button onClick={()=>reorder(1)} disabled={action.order===node.actions.length-1}>Later</button><button className="danger" onClick={remove}>Delete action</button></div>
    </div>}
  </aside>;
}

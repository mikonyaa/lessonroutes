import { LIMITS, newId, type Project, type Action, type LessonNode, type Rect } from '../model/types';
export function updateNode(p:Project,id:string,edit:(node:LessonNode)=>LessonNode):Project {
  return {...p,nodes:p.nodes.map(n=>n.id===id?edit(n):n)};
}
export function updateAction(p:Project,nodeId:string,actionId:string,edit:(a:Action)=>Action):Project {
  return updateNode(p,nodeId,n=>n.kind==='screen'?{...n,actions:n.actions.map(a=>a.id===actionId?edit(a):a)}:n);
}
export function addAction(p:Project,nodeId:string,rect:Rect): { project:Project; actionId:string } {
  const actionId=newId();
  const project=updateNode(p,nodeId,n=>{
    if(n.kind!=='screen'||n.actions.length>=LIMITS.actions)throw new Error('At most 30 actions on a screen.');
    return {...n,actions:[...n.actions,{id:actionId,label:`Action ${n.actions.length+1}`,rect,targetNodeId:null,outcome:'neutral',feedback:'',order:n.actions.length}]};
  });
  return {project,actionId};
}
export function reorder(p:Project,id:string,delta:number):Project {
  const ordered=[...p.orderedNodeIds],i=ordered.indexOf(id),j=i+delta;
  if(i<0||j<0||j>=ordered.length)return p;
  [ordered[i],ordered[j]]=[ordered[j]!,ordered[i]!]; return {...p,orderedNodeIds:ordered};
}
export function incoming(p:Project,id:string) {
  return p.nodes.flatMap(n=>n.kind==='screen'&&n.id!==id?n.actions.filter(a=>a.targetNodeId===id).map(a=>({nodeId:n.id,nodeTitle:n.title,label:a.label})):[]);
}
export function deleteNode(p:Project,id:string,replacement:string|null,removeUnusedImage:boolean):Project {
  if(replacement===id||replacement&&!p.nodes.some(n=>n.id===replacement))throw new Error('Choose a different replacement node.');
  const nodes=p.nodes.filter(n=>n.id!==id).map(n=>n.kind==='screen'?{...n,actions:n.actions.map(a=>a.targetNodeId===id?{...a,targetNodeId:replacement}:a)}:n);
  const used=new Set(nodes.flatMap(n=>n.kind==='screen'?[n.assetId]:[]));
  return {...p,nodes,orderedNodeIds:p.orderedNodeIds.filter(n=>n!==id),startNodeId:p.startNodeId===id?replacement:p.startNodeId,
    assets:removeUnusedImage?p.assets.filter(a=>used.has(a.id)):p.assets};
}

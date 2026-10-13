import type { Action, Project } from './types';

/** order defines meaning; the physical JSON array may be any valid permutation. */
export function orderedActions(actions:readonly Action[]):Action[] {
  return [...actions].sort((a,b)=>a.order-b.order);
}
function editActions(p:Project,nodeId:string,edit:(actions:Action[])=>Action[]):Project {
  const node=p.nodes.find(n=>n.id===nodeId);
  if(node?.kind!=='screen')return p;
  const before=orderedActions(node.actions),actions=edit([...before]);
  if(actions.length===before.length&&actions.every((a,i)=>a.id===before[i]?.id))return p;
  const next={...node,actions:actions.map((a,order)=>({...a,order}))};
  return {...p,nodes:p.nodes.map(n=>n.id===nodeId?next:n)};
}
export function removeAction(p:Project,nodeId:string,actionId:string):Project {
  return editActions(p,nodeId,actions=>actions.filter(a=>a.id!==actionId));
}
export function reorderAction(p:Project,nodeId:string,actionId:string,delta:number):Project {
  return editActions(p,nodeId,actions=>{
    const i=actions.findIndex(a=>a.id===actionId),j=i+delta;
    if(i<0||j<0||j>=actions.length)return actions;
    [actions[i],actions[j]]=[actions[j]!,actions[i]!];return actions;
  });
}

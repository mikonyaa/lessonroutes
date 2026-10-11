import type { Payload } from '../model/types';
export type State = { phase:'showingNode'|'showingFeedback'|'finished'; nodeId:string; actionId:string|null; feedback:string; nextNodeId:string|null };
export type Input = { type:'choose';actionId:string } | { type:'outside' } | { type:'continue' } | { type:'restart' };
export type Transition = { input: string; nodeId: string; actionId: string | null; phase: State['phase'] };
export function initialState(p: Payload): State {
  return { phase:p.nodes.find(n=>n.id===p.startNodeId)?.kind === 'finish'?'finished':'showingNode', nodeId:p.startNodeId,actionId:null,feedback:'',nextNodeId:null };
}
export function transition(p: Payload, state: State, input: Input): State {
  if (input.type === 'restart') return initialState(p);
  if (input.type === 'continue' && state.phase === 'showingFeedback' && state.nextNodeId) {
    const node = p.nodes.find(n=>n.id===state.nextNodeId);
    if (!node) return state;
    return { phase:node.kind === 'finish'?'finished':'showingNode',nodeId:node.id,actionId:null,feedback:'',nextNodeId:null };
  }
  if (state.phase !== 'showingNode') return state;
  if (input.type === 'outside') return { ...state,phase:'showingFeedback',feedback:'Try one of the marked regions, or choose an action from the list below.',nextNodeId:state.nodeId };
  if (input.type === 'choose') {
    const node = p.nodes.find(n=>n.id===state.nodeId);
    if (node?.kind !== 'screen') return state;
    const a = node.actions.find(a=>a.id===input.actionId); if (!a?.targetNodeId) return state;
    // Every choice goes through feedback. A second click cannot apply it again.
    return { ...state,phase:'showingFeedback',actionId:a.id,feedback:a.feedback || (a.outcome==='correct'?'Good choice. Continue to the next step.':'Continue when you are ready.'),nextNodeId:a.targetNodeId };
  }
  return state;
}

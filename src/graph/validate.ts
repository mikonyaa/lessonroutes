import type { Project, Payload } from '../model/types';
import { validRect, overlap } from './geometry';
export type Issue = { level: 'error' | 'warning'; code: string; message: string; nodeId?: string; actionIds?: string[] };
export type GraphReport = { issues: Issue[]; reachable: Set<string>; exportable: boolean };
export function validateGraph(p: Project): GraphReport {
  const issues: Issue[] = [], reachable = new Set<string>(), nodes = new Map(p.nodes.map(n => [n.id,n]));
  const add = (code: string, message: string, nodeId?: string, actionIds?: string[]) => issues.push({
    level: nodeId && !reachable.has(nodeId) ? 'warning' : 'error', code, message,
    ...(nodeId ? { nodeId } : {}), ...(actionIds ? { actionIds } : {}),
  });
  if (p.startNodeId && nodes.has(p.startNodeId)) {
    const stack = [p.startNodeId];
    while (stack.length) {
      const id = stack.pop()!; if (reachable.has(id)) continue;
      const n = nodes.get(id); if (!n) continue; reachable.add(id);
      if (n.kind === 'screen') for (const a of n.actions) if (a.targetNodeId) stack.push(a.targetNodeId);
    }
  } else add('start', 'Choose an existing start screen or finish.');
  if (!p.metadata.title.trim()) add('title', 'Give the lesson a title.');
  const ids = new Set<string>(), assetIds = new Set(p.assets.map(a => a.id));
  for (const n of p.nodes) {
    if (ids.has(n.id)) add('duplicate', 'Node IDs must be unique.'); ids.add(n.id);
    if (!reachable.has(n.id)) issues.push({ level: 'warning', code: 'unreachable', nodeId: n.id, message: `${n.title || 'Untitled node'} is unreachable and will be excluded from the lesson.` });
    if (!n.title.trim()) add('node-title', 'Name this step.', n.id);
    if (n.kind === 'finish') { if (!n.completionText.trim()) add('completion', 'Add completion text.', n.id); continue; }
    if (!assetIds.has(n.assetId)) add('asset', 'This screen has no valid image asset.', n.id);
    if (!n.instruction.trim()) add('instruction', 'Add a readable instruction.', n.id);
    if (!n.imageDescription.trim()) add('description', 'Describe the image context for learners.', n.id);
    if (!n.actions.length) add('actions', 'Add at least one action to this screen.', n.id);
    for (const a of n.actions) {
      if (ids.has(a.id)) add('duplicate', 'Action IDs must be unique.'); ids.add(a.id);
      if (!a.label.trim()) add('label', 'Every action needs a text label.', n.id, [a.id]);
      if (!a.targetNodeId || !nodes.has(a.targetNodeId)) add('target', `${a.label || 'Action'} needs an existing destination.`, n.id, [a.id]);
      if (a.outcome === 'incorrect' && !a.feedback.trim()) add('feedback', 'Explain this incorrect choice.', n.id, [a.id]);
      if (!validRect(a.rect)) add('geometry', 'Action geometry must fit within the image.', n.id, [a.id]);
    }
    for (let i = 0; i < n.actions.length; i++) for (let j = i + 1; j < n.actions.length; j++) {
      const a = n.actions[i]!, b = n.actions[j]!;
      if (overlap(a.rect,b.rect)) add('overlap', `${a.label || 'Action'} overlaps ${b.label || 'another action'}. Resize or move both highlighted regions.`, n.id, [a.id,b.id]);
    }
  }
  const canFinish = new Set(p.nodes.filter(n => n.kind === 'finish').map(n => n.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of p.nodes) if (n.kind === 'screen' && !canFinish.has(n.id) && n.actions.some(a => a.targetNodeId && canFinish.has(a.targetNodeId))) { canFinish.add(n.id); changed = true; }
  }
  for (const id of reachable) if (!canFinish.has(id)) add('no-finish', 'There is no path from this step to a finish. Retry cycles need an exit.', id);
  return { issues, reachable, exportable: !issues.some(i => i.level === 'error') };
}
export function buildPayload(p: Project): { payload: Payload; report: GraphReport } {
  const report = validateGraph(p);
  if (!report.exportable || !p.startNodeId) throw new Error('Lesson is not ready. Resolve the blocking graph issues before preview or export.');
  const nodes = p.orderedNodeIds.filter(id => report.reachable.has(id)).map(id => p.nodes.find(n => n.id === id)!).map(n => n.kind === 'finish'
    ? { id:n.id,kind:n.kind,title:n.title,completionText:n.completionText }
    : { id:n.id,kind:n.kind,assetId:n.assetId,title:n.title,instruction:n.instruction,imageDescription:n.imageDescription,
        actions:[...n.actions].sort((a,b)=>a.order-b.order).map(a=>({ id:a.id,label:a.label,rect:{...a.rect},targetNodeId:a.targetNodeId,outcome:a.outcome,feedback:a.feedback,order:a.order })) });
  const needed = new Set(nodes.flatMap(n => n.kind === 'screen' ? [n.assetId] : []));
  return { report, payload: { kind:'lessonroutes-lesson',schemaVersion:1,metadata:{...p.metadata},startNodeId:p.startNodeId,nodes,
    assets:p.assets.filter(a=>needed.has(a.id)).map(a=>({id:a.id,mime:a.mime,base64:a.base64,pixelWidth:a.pixelWidth,pixelHeight:a.pixelHeight})) } };
}

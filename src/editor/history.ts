import { LIMITS, type Project } from '../model/types';
export type HistoryState = { current: Project; past: Project[]; future: Project[]; label: string };
export const historyOf = (current: Project): HistoryState => ({ current, past:[], future:[], label:'' });
export function commit(h: HistoryState, next: Project, label: string): HistoryState {
  if (next === h.current) return h;
  return { current:next, past:[...h.past,h.current].slice(-LIMITS.history), future:[], label };
}
export function undo(h: HistoryState): HistoryState {
  const previous = h.past[h.past.length-1];
  return previous ? { current:previous,past:h.past.slice(0,-1),future:[h.current,...h.future],label:'Undo' } : h;
}
export function redo(h: HistoryState): HistoryState {
  const next = h.future[0];
  return next ? { current:next,past:[...h.past,h.current].slice(-LIMITS.history),future:h.future.slice(1),label:'Redo' } : h;
}

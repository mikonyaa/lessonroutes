import type { Action, Rect } from '../model/types';
export function validRect(r: Rect): boolean {
  return Object.values(r).every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1 && r.y + r.height <= 1;
}
export function overlap(a: Rect, b: Rect): boolean {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0 &&
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0;
}
// Half-open rectangles: a shared right/bottom edge belongs to the action that
// starts on that edge. The outer image edge at 1 is included. Never DOM order.
export function hitTest(actions: readonly Action[], x: number, y: number): Action | undefined {
  return [...actions].sort((a,b) => a.order - b.order || a.id.localeCompare(b.id)).find(a => {
    const r = a.rect, right = r.x + r.width, bottom = r.y + r.height;
    return x >= r.x && y >= r.y && (x < right || (right === 1 && x === 1)) && (y < bottom || (bottom === 1 && y === 1));
  });
}
export function containRect(container: { width: number; height: number }, image: { width: number; height: number }) {
  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale, height = image.height * scale;
  return { x: (container.width - width) / 2, y: (container.height - height) / 2, width, height };
}
export function normalizePoint(clientX: number, clientY: number, box: { x: number; y: number; width: number; height: number }) {
  return { x: (clientX - box.x) / box.width, y: (clientY - box.y) / box.height };
}
export function moveRect(r: Rect, dx: number, dy: number): Rect {
  return { ...r, x: Math.min(1 - r.width, Math.max(0, r.x + dx)), y: Math.min(1 - r.height, Math.max(0, r.y + dy)) };
}

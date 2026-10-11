import { LIMITS, type Project } from './types';
import { base64ToBytes, decodeRaster, inspectRaster, sha256 } from '../assets/raster';

export class ProjectInputError extends Error {
  constructor(message: string, readonly code: 'invalid' | 'unsupported' = 'invalid') { super(message); this.name = 'ProjectInputError'; }
}
function invalid(message: string): never { throw new ProjectInputError(message); }
function object(value: unknown, fields: string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${path}: expected an object.`);
  const o = value as Record<string, unknown>;
  for (const key of Object.keys(o)) if (!fields.includes(key)) invalid(`${path}: unsupported field "${key}". Nothing was discarded.`);
  return o;
}
function string(v: unknown, max: number, path: string): asserts v is string {
  if (typeof v !== 'string' || v.length > max) invalid(`${path}: expected text up to ${max} characters.`);
}
function id(v: unknown, path: string): asserts v is string {
  if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(v)) invalid(`${path}: invalid ID.`);
}
function integer(v: unknown, max: number, path: string): asserts v is number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0 || v > max) invalid(`${path}: invalid integer.`);
}
function array(v: unknown, max: number, path: string): asserts v is unknown[] {
  if (!Array.isArray(v) || v.length > max) invalid(`${path}: expected a list of at most ${max}.`);
}
export function validateStructure(input: unknown): Project {
  const p = object(input, ['kind','schemaVersion','projectId','revision','metadata','startNodeId','orderedNodeIds','assets','nodes'], 'Project');
  if (p.kind !== 'lessonroutes-project') invalid('This is not a LessonRoutes editable project. Open the .project.json file, not the exported lesson HTML.');
  if (p.schemaVersion !== 1) throw new ProjectInputError(`Unsupported schemaVersion ${String(p.schemaVersion)}. This editor supports version 1.`, 'unsupported');
  id(p.projectId, 'projectId'); integer(p.revision, Number.MAX_SAFE_INTEGER - 1, 'revision');
  const m = object(p.metadata, ['title','description','locale','credits'], 'metadata');
  string(m.title, LIMITS.title, 'title'); string(m.description, LIMITS.text, 'description'); string(m.locale, 64, 'locale');
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(m.locale)) invalid('Invalid locale. Use a language tag such as en or en-GB.');
  if (m.credits !== undefined) string(m.credits, LIMITS.text, 'credits');
  if (p.startNodeId !== null) id(p.startNodeId, 'startNodeId');
  array(p.assets, LIMITS.images, 'assets'); array(p.nodes, LIMITS.nodes, 'nodes'); array(p.orderedNodeIds, LIMITS.nodes, 'orderedNodeIds');
  const ids = new Set<string>();
  const unique = (v: unknown, path: string) => { id(v, path); if (ids.has(v)) invalid(`${path}: duplicate ID ${v}.`); ids.add(v); };
  for (const a of p.assets) {
    const o = object(a, ['id','displayName','mime','pixelWidth','pixelHeight','sha256','base64'], 'asset');
    unique(o.id, 'asset.id'); string(o.displayName, LIMITS.filename, 'displayName');
    if (!['image/png','image/jpeg','image/webp'].includes(String(o.mime))) invalid('Unsupported asset MIME.');
    integer(o.pixelWidth, LIMITS.side, 'pixelWidth'); integer(o.pixelHeight, LIMITS.side, 'pixelHeight');
    if (!o.pixelWidth || !o.pixelHeight || o.pixelWidth * o.pixelHeight > LIMITS.pixels) invalid('Asset dimensions exceed image limits.');
    if (typeof o.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(o.sha256)) invalid('Invalid SHA-256.');
    string(o.base64, Math.ceil(LIMITS.imageBytes / 3) * 4, 'base64');
  }
  const nodeIds = new Set<string>();
  for (const n of p.nodes) {
    const common = object(n, ['id','kind','title','assetId','instruction','imageDescription','actions','completionText'], 'node');
    const screen = common.kind === 'screen';
    if (!screen && common.kind !== 'finish') invalid('Unknown node kind.');
    const o = object(n, screen ? ['id','kind','title','assetId','instruction','imageDescription','actions'] : ['id','kind','title','completionText'], 'node');
    unique(o.id, 'node.id'); nodeIds.add(o.id as string); string(o.title, LIMITS.title, 'node.title');
    if (screen) {
      id(o.assetId, 'assetId'); string(o.instruction, LIMITS.text, 'instruction'); string(o.imageDescription, LIMITS.text, 'imageDescription');
      array(o.actions, LIMITS.actions, 'actions'); const orders = new Set<number>();
      for (const a of o.actions) {
        const action = object(a, ['id','label','rect','targetNodeId','outcome','feedback','order'], 'action');
        unique(action.id, 'action.id'); string(action.label, LIMITS.title, 'label'); string(action.feedback, LIMITS.text, 'feedback');
        if (action.targetNodeId !== null) id(action.targetNodeId, 'targetNodeId');
        if (!['correct','incorrect','neutral'].includes(String(action.outcome))) invalid('Invalid action outcome.');
        integer(action.order, Math.max(o.actions.length - 1, 0), 'action.order');
        if (orders.has(action.order)) invalid('Duplicate action order.'); orders.add(action.order);
        const r = object(action.rect, ['x','y','width','height'], 'rect');
        for (const key of ['x','y','width','height']) if (typeof r[key] !== 'number' || !Number.isFinite(r[key])) invalid('Rect coordinates must be finite numbers.');
        const { x,y,width,height } = r as Record<string, number>;
        if (x! < 0 || y! < 0 || width! <= 0 || height! <= 0 || x! + width! > 1 || y! + height! > 1) invalid('Rect must have positive area inside the image.');
      }
    } else string(o.completionText, LIMITS.text, 'completionText');
  }
  const ordered = new Set<string>();
  for (const n of p.orderedNodeIds) { id(n, 'orderedNodeIds'); if (ordered.has(n) || !nodeIds.has(n)) invalid('orderedNodeIds must contain every node exactly once.'); ordered.add(n); }
  if (ordered.size !== nodeIds.size) invalid('orderedNodeIds must contain every node exactly once.');
  const project = input as Project;
  const assetIds = new Set(project.assets.map(a => a.id));
  for (const n of project.nodes) if (n.kind === 'screen' && !assetIds.has(n.assetId)) invalid(`Missing image asset for ${n.title || n.id}.`);
  // Missing action targets / start IDs are diagnosed by the graph validator.
  // They stay editable rather than being misreported as damaged JSON.
  return project;
}
export async function loadProject(text: string, decode = true): Promise<Project> {
  if (text.length > LIMITS.projectBytes || new TextEncoder().encode(text).byteLength > LIMITS.projectBytes) invalid('Project JSON exceeds 80 MiB.');
  let input: unknown;
  try { input = JSON.parse(text); } catch { invalid('Invalid JSON. The current project has not changed.'); }
  const project = validateStructure(input);
  let total = 0;
  for (const a of project.assets) {
    const bytes = base64ToBytes(a.base64), info = inspectRaster(bytes); total += bytes.length;
    if (total > LIMITS.totalBytes) invalid('Total images exceed 50 MiB.');
    if (info.mime !== a.mime || info.width !== a.pixelWidth || info.height !== a.pixelHeight) invalid('Asset MIME or dimensions do not match its bytes.');
    if (await sha256(bytes) !== a.sha256) invalid('Image SHA-256 does not match its bytes.');
    if (decode) await decodeRaster(bytes, info);
  }
  return project;
}
export function serializeProject(project: Project): string {
  validateStructure(project);
  return JSON.stringify(project, null, 2);
}

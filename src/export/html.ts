import runtime from '../player/runtime.generated.txt?raw';
import { playerCSS } from '../player/style';
import { buildPayload } from '../graph/validate';
import { loadProject, serializeProject } from '../model/load';
import type { Project } from '../model/types';
import { bytesToBase64 } from '../assets/raster';
const escapeText = (s: string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function safeJSON(value: unknown): string {
  return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
}
export async function createLessonHTML(project: Project): Promise<string> {
  await loadProject(serializeProject(project));
  const { payload }=buildPayload(project);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(runtime));
  const hash=bytesToBase64(new Uint8Array(digest));
  const policy=`default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'`;
  return `<!doctype html>\n<html lang="${escapeText(payload.metadata.locale)}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapeText(policy)}"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeText(payload.metadata.title)} · LessonRoutes</title><style>${playerCSS}</style></head><body><div id="lesson-root"></div><noscript>This practice lesson needs JavaScript enabled. It does not need a network connection.</noscript><script type="application/json" id="lesson-data">${safeJSON(payload)}</script><script>${runtime}</script></body></html>`;
}

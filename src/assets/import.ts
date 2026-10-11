import { LIMITS, newId, type Asset, type Project, type ScreenNode } from '../model/types';
import { bytesToBase64, decodeRaster, inspectRaster, sha256 } from './raster';

export async function importImages(files: readonly File[], project: Project): Promise<Project> {
  if (!files.length) return project;
  if (files.length + project.nodes.filter(n => n.kind === 'screen').length > LIMITS.images || files.length + project.nodes.length > LIMITS.nodes) throw new Error('At most 50 images and 200 nodes.');
  if (files.some(f => f.size > LIMITS.imageBytes || f.name.length > LIMITS.filename)) throw new Error('Each image must be at most 10 MiB; names at most 240 characters.');
  const currentBytes = project.assets.reduce((n, a) => n + a.base64.length * 3 / 4 - (a.base64.endsWith('==')?2:a.base64.endsWith('=')?1:0), 0);
  if (files.reduce((n, f) => n + f.size, currentBytes) > LIMITS.totalBytes) throw new Error('Total images must be at most 50 MiB.');
  const assets: Asset[] = [...project.assets], nodes = [...project.nodes], order = [...project.orderedNodeIds];
  // Sequential decode preserves the selected file order and bounds decoded memory.
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer()), info = inspectRaster(bytes);
    await decodeRaster(bytes, info);
    const hash = await sha256(bytes);
    let asset = assets.find(a => a.sha256 === hash);
    if (!asset) {
      if (assets.length >= LIMITS.images) throw new Error('At most 50 unique image assets. Remove unused images with their steps before adding more.');
      asset = { id: newId(), displayName: file.name, mime: info.mime, pixelWidth: info.width,
        pixelHeight: info.height, sha256: hash, base64: bytesToBase64(bytes) };
      assets.push(asset);
    }
    const node: ScreenNode = { id: newId(), kind: 'screen', assetId: asset.id,
      title: file.name.replace(/\.[^.]+$/, '').slice(0, LIMITS.title), instruction: '', imageDescription: '', actions: [] };
    nodes.push(node); order.push(node.id);
  }
  return { ...project, assets, nodes, orderedNodeIds: order, startNodeId: project.startNodeId ?? order[0] ?? null };
}

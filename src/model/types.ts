export const LIMITS = {
  images: 50, imageBytes: 10 * 1024 * 1024, totalBytes: 50 * 1024 * 1024,
  pixels: 24_000_000, side: 12_000, projectBytes: 80 * 1024 * 1024,
  nodes: 200, actions: 30, title: 200, text: 4000, filename: 240, history: 60,
} as const;
export type RasterMime = 'image/png' | 'image/jpeg' | 'image/webp';
export type Rect = { x: number; y: number; width: number; height: number };
export type Asset = {
  id: string; displayName: string; mime: RasterMime; pixelWidth: number;
  pixelHeight: number; sha256: string; base64: string;
};
export type Action = {
  id: string; label: string; rect: Rect; targetNodeId: string | null;
  outcome: 'correct' | 'incorrect' | 'neutral'; feedback: string; order: number;
};
export type ScreenNode = {
  id: string; kind: 'screen'; assetId: string; title: string;
  instruction: string; imageDescription: string; actions: Action[];
};
export type FinishNode = { id: string; kind: 'finish'; title: string; completionText: string };
export type LessonNode = ScreenNode | FinishNode;
export type Project = {
  kind: 'lessonroutes-project'; schemaVersion: 1; projectId: string; revision: number;
  metadata: { title: string; description: string; locale: string; credits?: string };
  startNodeId: string | null; orderedNodeIds: string[]; assets: Asset[]; nodes: LessonNode[];
};
export type Payload = {
  kind: 'lessonroutes-lesson'; schemaVersion: 1;
  metadata: Project['metadata']; startNodeId: string; nodes: LessonNode[];
  assets: Pick<Asset, 'id' | 'mime' | 'base64' | 'pixelWidth' | 'pixelHeight'>[];
};
export const newId = () => crypto.randomUUID();
export function newProject(): Project {
  return { kind: 'lessonroutes-project', schemaVersion: 1, projectId: newId(), revision: 0,
    metadata: { title: 'Untitled lesson', description: '', locale: 'en' },
    startNodeId: null, orderedNodeIds: [], assets: [], nodes: [] };
}

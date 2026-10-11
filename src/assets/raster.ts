import { LIMITS, type RasterMime } from '../model/types';

export type RasterInfo = { mime: RasterMime; width: number; height: number; orientation: number };
const bad = (message: string): never => { throw new Error(message); };
const ascii = (b: Uint8Array, offset: number, length: number) => String.fromCharCode(...b.slice(offset, offset + length));

// This bounded header reader accepts three raster containers only. Browser decoding
// is a second check; it never happens before dimensions and animation are checked.
export function inspectRaster(b: Uint8Array): RasterInfo {
  if (!b.length || b.length > LIMITS.imageBytes) bad('Image must be at most 10 MiB.');
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let info: RasterInfo | undefined;
  if (b.length >= 33 && ascii(b, 1, 3) === 'PNG' && b[0] === 137 && b[4] === 13 && b[5] === 10 && b[6] === 26 && b[7] === 10) {
    if (v.getUint32(8) !== 13 || ascii(b, 12, 4) !== 'IHDR') bad('Invalid PNG header.');
    let pos = 8, chunks = 0, ended = false;
    while (pos + 12 <= b.length && ++chunks <= 100_000) {
      const len = v.getUint32(pos), type = ascii(b, pos + 4, 4);
      if (len > b.length - pos - 12) bad('Truncated PNG chunk.');
      if (['acTL', 'fcTL', 'fdAT'].includes(type)) bad('Animated PNG is not supported. Use a static screenshot.');
      pos += len + 12;
      if (type === 'IEND') { ended = len === 0 && pos === b.length; break; }
    }
    if (!ended) bad('Invalid PNG container.');
    info = { mime: 'image/png', width: v.getUint32(16), height: v.getUint32(20), orientation: 1 };
  } else if (b.length >= 20 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
    if (v.getUint32(4, true) + 8 !== b.length) bad('Invalid WebP container length.');
    let pos = 12, chunks = 0, width = 0, height = 0, frame = false;
    while (pos + 8 <= b.length && ++chunks <= 100_000) {
      const type = ascii(b, pos, 4), len = v.getUint32(pos + 4, true), d = pos + 8;
      if (len > b.length - d) bad('Truncated WebP chunk.');
      if (type === 'ANIM' || type === 'ANMF') bad('Animated WebP is not supported.');
      if (type === 'VP8X') {
        if (len !== 10) bad('Invalid WebP extended header.');
        if ((b[d]! & 2) !== 0) bad('Animated WebP is not supported.');
        width = 1 + b[d + 4]! + (b[d + 5]! << 8) + (b[d + 6]! << 16);
        height = 1 + b[d + 7]! + (b[d + 8]! << 8) + (b[d + 9]! << 16);
      } else if (type === 'VP8 ') {
        if (len < 10 || ascii(b, d + 3, 3) !== '\x9d\x01\x2a') bad('Invalid WebP frame.');
        if (!width) { width = v.getUint16(d + 6, true) & 0x3fff; height = v.getUint16(d + 8, true) & 0x3fff; }
        frame = true;
      } else if (type === 'VP8L') {
        if (len < 5 || b[d] !== 0x2f) bad('Invalid lossless WebP frame.');
        const bits = v.getUint32(d + 1, true);
        if (!width) { width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
        frame = true;
      }
      pos = d + len + (len % 2);
    }
    if (!frame || pos !== b.length) bad('Invalid WebP container.');
    info = { mime: 'image/webp', width, height, orientation: 1 };
  } else if (b[0] === 0xff && b[1] === 0xd8) {
    let pos = 2, width = 0, height = 0, orientation = 1, segments = 0;
    while (pos + 4 <= b.length && ++segments <= 65536) {
      if (b[pos++] !== 0xff) bad('Invalid JPEG marker.');
      while (b[pos] === 0xff) pos++;
      const marker = b[pos++]!;
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (pos + 2 > b.length) bad('Truncated JPEG.');
      const len = v.getUint16(pos), end = pos + len;
      if (len < 2 || end > b.length) bad('Truncated JPEG segment.');
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (len < 8) bad('Invalid JPEG dimensions.');
        height = v.getUint16(pos + 3); width = v.getUint16(pos + 5);
      }
      if (marker === 0xe1 && len >= 16 && ascii(b, pos + 2, 6) === 'Exif\0\0') {
        const t = pos + 8, little = ascii(b, t, 2) === 'II';
        if ((!little && ascii(b, t, 2) !== 'MM') || v.getUint16(t + 2, little) !== 42) bad('Invalid EXIF header.');
        const offset = v.getUint32(t + 4, little);
        const dir = t + offset;
        if (offset < 8 || dir + 2 > end) bad('Invalid EXIF directory.');
        const count = v.getUint16(dir, little);
        if (count > 1024 || dir + 2 + count * 12 > end) bad('Invalid EXIF entries.');
        for (let i = 0; i < count; i++) {
          const e = dir + 2 + i * 12;
          if (v.getUint16(e, little) === 0x112) {
            if (v.getUint16(e + 2, little) !== 3 || v.getUint32(e + 4, little) !== 1) bad('Invalid EXIF orientation.');
            orientation = v.getUint16(e + 8, little);
            if (orientation < 1 || orientation > 8) bad('Invalid EXIF orientation.');
          }
        }
      }
      pos = end;
    }
    if (orientation >= 5) [width, height] = [height, width];
    info = { mime: 'image/jpeg', width, height, orientation };
  }
  if (!info) return bad('Only static PNG, JPEG and WebP bytes are supported. File extension and declared MIME are not trusted.');
  const { width, height } = info;
  if (!width || !height || width > LIMITS.side || height > LIMITS.side || width * height > LIMITS.pixels) bad('Image exceeds 24 megapixels or 12,000 pixels per side.');
  return info;
}
export function bytesToBase64(b: Uint8Array): string {
  let str = '';
  for (let i = 0; i < b.length; i += 16384) str += String.fromCharCode(...b.subarray(i, i + 16384));
  return btoa(str);
}
export function base64ToBytes(s: string): Uint8Array {
  const padding=s.endsWith('==')?2:s.endsWith('=')?1:0;
  if (!s.length || s.length > Math.ceil(LIMITS.imageBytes / 3) * 4 || s.length % 4 !== 0 || /[^A-Za-z0-9+/]/.test(s.slice(0,s.length-padding))) bad('Invalid or oversized base64 image.');
  const raw = atob(s), bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  if (bytesToBase64(bytes) !== s) bad('Non-canonical base64 image.');
  return bytes;
}
export async function sha256(b: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', b.slice().buffer);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function decodeRaster(bytes: Uint8Array, info: RasterInfo): Promise<void> {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: info.mime }));
  const image = new Image();
  try {
    image.src = url; await image.decode();
    if (image.naturalWidth !== info.width || image.naturalHeight !== info.height) bad('Decoded dimensions differ from the image header.');
  } catch { bad('Image could not be decoded safely. Use a valid static screenshot.'); }
  finally { image.removeAttribute('src'); URL.revokeObjectURL(url); }
}

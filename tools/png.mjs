// 아주 작은 PNG 읽기·쓰기 (의존성 없음). 8비트 이하·비인터레이스만. 읽으면 RGBA 픽셀 배열.
import zlib from 'node:zlib';

export function decodePng(b) {
  let p = 8, w, h, depth, type, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), t = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; interlace = d[12]; }
    else if (t === 'PLTE') plte = d;
    else if (t === 'tRNS') trns = d;
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    p += 12 + len;
  }
  if (interlace) throw new Error('인터레이스 PNG는 못 읽어요. 일반 PNG로 다시 저장하세요.');
  if (depth > 8) throw new Error('16비트 PNG는 못 읽어요. 8비트로 다시 저장하세요.');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const bpp = Math.max(1, (ch * depth) >> 3), stride = (w * ch * depth + 7) >> 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(w * h * 4);
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[i] = v;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const sample = (k) => depth === 8 ? cur[x * ch + k] : (cur[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
      if (type === 3) {
        const i = sample(0);
        out[o] = plte[i * 3]; out[o + 1] = plte[i * 3 + 1]; out[o + 2] = plte[i * 3 + 2]; out[o + 3] = trns && i < trns.length ? trns[i] : 255;
      } else if (type === 0 || type === 4) {
        const g = depth === 8 ? sample(0) : Math.round(sample(0) * 255 / ((1 << depth) - 1));
        out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = type === 4 ? sample(1) : 255;
      } else {
        out[o] = sample(0); out[o + 1] = sample(1); out[o + 2] = sample(2); out[o + 3] = type === 6 ? sample(3) : 255;
      }
    }
    [prev, cur] = [cur, prev];
  }
  return { w, h, data: out };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
// RGBA로 쓴다. 256색 이하면 팔레트 PNG(작게).
export function encodePng(w, h, data) {
  const pal = new Map();
  for (let i = 0; i < w * h && pal.size <= 256; i++) { const key = ((data[i * 4] << 24) | (data[i * 4 + 1] << 16) | (data[i * 4 + 2] << 8) | data[i * 4 + 3]) >>> 0; if (!pal.has(key)) pal.set(key, pal.size); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])];
  let raw;
  if (pal.size <= 256) {
    ihdr[9] = 3;
    const keys = [...pal.keys()];
    const plte = Buffer.alloc(keys.length * 3), trns = Buffer.alloc(keys.length);
    keys.forEach((k, i) => { plte[i * 3] = k >>> 24; plte[i * 3 + 1] = (k >>> 16) & 255; plte[i * 3 + 2] = (k >>> 8) & 255; trns[i] = k & 255; });
    raw = Buffer.alloc((w + 1) * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; raw[y * (w + 1) + 1 + x] = pal.get(((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0); }
    parts.push(chunk('IHDR', ihdr), chunk('PLTE', plte));
    if (keys.some((k) => (k & 255) !== 255)) parts.push(chunk('tRNS', trns));
  } else {
    ihdr[9] = 6;
    raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
    parts.push(chunk('IHDR', ihdr));
  }
  parts.push(chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

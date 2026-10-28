// 앱 아이콘(PWA·홈 화면) icons/icon-192.png · icon-512.png 를 만든다.
// assets/app/icon.png (GPT 그림, js/asset_prompts.js 「app」 묶음, 1024×1024 = 64×64 도트 16배)가 있으면 그걸 64×64로 줄여 정수배로 키우고,
// 없으면 코드로 그린 32×32 임시 도트(밤바다의 탑과 달)를 쓴다.
// 사용: node tools/make-icons.mjs   (--check: 지금 파일과 같은지만 본다)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

// ---------- 임시 도트 32×32 ----------
function drawTemp() {
  const N = 32, px = new Uint8Array(N * N * 4);
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= N || y >= N) return; px.set(c, (y * N + x) * 4); };
  const sky = ['#07081a', '#0c0d26', '#141634', '#1c1f4a'].map(hex);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // 위는 어둡고 아래로 갈수록 밝은 밤하늘, 경계는 바둑판 디더
    const t = y / N * 3.2, i = Math.floor(t), f = t - i;
    set(x, y, sky[Math.min(3, i + (f > .5 && (x + y) % 2 ? 1 : 0))]);
  }
  const star = hex('#c9d2f0');
  for (const [x, y] of [[4, 4], [9, 2], [14, 6], [3, 11], [25, 15], [20, 3], [28, 21]]) set(x, y, star);
  // 달 (초승달, 금색)
  const gold = hex('#e0b84a'), goldD = hex('#a8822c');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = (x - 24) ** 2 + (y - 8) ** 2, b = (x - 21.5) ** 2 + (y - 6.5) ** 2;
    if (a <= 25 && b > 16) set(x, y, a > 18 ? goldD : gold);
  }
  // 탑
  const wall = hex('#2b2d55'), wallL = hex('#3c3f73'), lamp = hex('#ffcf6a'), out = hex('#000000');
  const half = y => (y < 9 ? 1 : y < 12 ? 2 : y < 20 ? 3 : 4);   // 높이에 따른 반폭
  for (let y = 7; y < 28; y++) {
    const w = half(y);
    for (let x = 16 - w - 1; x <= 15 + w + 1; x++) set(x, y, out);
    for (let x = 16 - w; x <= 15 + w; x++) set(x, y, x < 16 ? wallL : wall);
  }
  for (let y = 5; y < 9; y++) { set(15, y, lamp); set(16, y, lamp); }   // 꼭대기 등불
  set(15, 4, out); set(16, 4, out);
  for (const y of [13, 17, 21, 24]) set(15, y, lamp);
  // 바다
  const sea = hex('#0b1a3a'), seaL = hex('#2a4c8a'), glow = hex('#e0b84a');
  for (let y = 27; y < N; y++) for (let x = 0; x < N; x++) set(x, y, (x + y * 3) % 7 === 0 ? seaL : sea);
  for (let y = 28; y < N; y += 2) set(15 + (y % 4 === 0 ? 1 : 0), y, glow);   // 물에 비친 등불
  return { w: N, h: N, px };
}

// ---------- PNG 읽기 (8비트, 인터레이스 없음, RGB/RGBA) ----------
function decodePng(buf) {
  let p = 8, w, h, depth, type; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; if (d[12]) throw new Error('인터레이스 PNG는 못 읽음'); }
    else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6)) throw new Error('8비트 RGB/RGBA PNG만 읽음');
  const ch = type === 6 ? 4 : 3, stride = w * ch, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(w * h * 4); let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, up = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; px[o] = cur[x * ch]; px[o + 1] = cur[x * ch + 1]; px[o + 2] = cur[x * ch + 2]; px[o + 3] = ch === 4 ? cur[x * ch + 3] : 255; }
    prev = cur;
  }
  return { w, h, px };
}
// 가운데 표본으로 줄이기 (도트 한 칸 = 원본 k×k 칸의 가운데 색)
function shrink(img, n) {
  const k = img.w / n, px = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const sx = Math.min(img.w - 1, Math.floor((x + .5) * k)), sy = Math.min(img.h - 1, Math.floor((y + .5) * k));
    px.set(img.px.subarray((sy * img.w + sx) * 4, (sy * img.w + sx) * 4 + 4), (y * n + x) * 4);
  }
  return { w: n, h: n, px };
}
// ---------- PNG 쓰기 (정수배 nearest-neighbor 확대, RGBA) ----------
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodeScaled(img, size) {
  const k = size / img.w, row = size * 4 + 1, raw = Buffer.alloc(row * size);
  for (let y = 0; y < size; y++) {
    const sy = Math.floor(y / k);
    for (let x = 0; x < size; x++) {
      const o = (sy * img.w + Math.floor(x / k)) * 4;
      for (let i = 0; i < 4; i++) raw[y * row + 1 + x * 4 + i] = img.px[o + i];
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const gpt = join(ROOT, 'assets/app/icon.png');
const src = existsSync(gpt) ? shrink(decodePng(readFileSync(gpt)), 64) : drawTemp();
const outs = { 'icons/icon-192.png': 192, 'icons/icon-512.png': 512 };
const check = process.argv.includes('--check');
mkdirSync(join(ROOT, 'icons'), { recursive: true });
let bad = 0;
for (const [f, size] of Object.entries(outs)) {
  const png = encodeScaled(src, size), path = join(ROOT, f);
  if (check) { if (!existsSync(path) || !readFileSync(path).equals(png)) { console.error(`${f}가 다르다. node tools/make-icons.mjs로 다시 만들 것.`); bad++; } }
  else writeFileSync(path, png);
}
if (bad) process.exit(1);
console.log(`앱 아이콘 ${check ? 'OK' : '만듦'} (${existsSync(gpt) ? 'assets/app/icon.png' : '임시 도트'} → 192·512)`);

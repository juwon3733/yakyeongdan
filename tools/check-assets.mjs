// assets/ 폴더의 그림이 js/asset_prompts.js 목록과 맞는지 검사한다(파일명·PNG 형식·크기·색 수·투명 배경).
// 사용: node tools/check-assets.mjs
// 빠진 그림은 오류가 아니다(게임이 임시 도트를 쓴다). 이름이 틀렸거나 규칙을 어긴 파일만 실패로 처리한다.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = await import(pathToFileURL(path.join(root, 'js/asset_prompts.js')).href);
const { items } = P.assetList();
const byPath = new Map(items.map((i) => [i.file, i]));
const folders = [...new Set(Object.values(P.SPEC).map((s) => s.folder))];

const MAX_BYTES = 3 * 1024 * 1024;
const errors = [];
const warnings = [];
const present = [];

function imageType(b) {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return 'webp';
  return 'unknown';
}

// PNG를 풀어 색 수(limit+1에서 멈춤)와 투명 픽셀이 있는지 본다.
function scanPng(b, limit) {
  let p = 8, w, h, depth, type, trns = null, interlace = 0;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), t = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; interlace = d[12]; }
    else if (t === 'tRNS') trns = d;
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    p += 12 + len;
  }
  const result = { w, h, colors: null, alpha: type === 4 || type === 6 || !!trns, transparentPixels: null };
  if (interlace || (depth !== 8 && type !== 3)) return result;
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const bpp = Math.max(1, (ch * depth) >> 3), stride = (w * ch * depth + 7) >> 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  const seen = new Set();
  let clear = 0;
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
      if (type === 3) {
        const idx = depth === 8 ? cur[x] : (cur[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1);
        seen.add(idx);
        if (trns && idx < trns.length && trns[idx] === 0) clear++;
      } else {
        const o = x * ch;
        const transparent = (ch === 4 && cur[o + 3] === 0) || (ch === 2 && cur[o + 1] === 0);
        if (transparent) clear++;
        seen.add(transparent ? -1 : cur.readUIntBE(o, ch));
      }
    }
    if (limit !== Infinity && seen.size > limit) { result.colors = seen.size; return result; }
    [prev, cur] = [cur, prev];
  }
  result.colors = seen.size;
  result.transparentPixels = clear;
  return result;
}

const norm = (s) => s.toLowerCase().replace(/\s*\(\d+\)/g, '').replace(/[\s-]+/g, '_').replace(/\.(png|jpe?g|webp)$/, '');

for (const folder of folders) {
  const dir = path.join(root, 'assets', folder);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith('.')) : [];
  for (const f of files) {
    const rel = `${folder}/${f}`;
    const a = byPath.get(rel);
    if (!a) {
      const guess = items.find((i) => i.file.startsWith(folder + '/') && norm(i.file.split('/')[1]) === norm(f));
      errors.push({ file: rel, msg: guess ? `모르는 파일명이에요. \`${guess.file.split('/')[1]}\`(으)로 바꾸세요.` : '모르는 파일명이에요. docs/PROMPTS.md의 파일명을 확인하세요.' });
      continue;
    }
    const b = fs.readFileSync(path.join(dir, f));
    const type = imageType(b);
    if (type !== 'png') { errors.push({ file: rel, msg: `확장자는 .png인데 실제 형식은 ${type}이에요. PNG로 다시 저장하세요.` }); continue; }
    const limit = a.max_colors ?? Infinity;
    const info = scanPng(b, limit);
    if (info.w !== a.width || info.h !== a.height) {
      errors.push({ file: rel, msg: `크기 ${info.w}×${info.h} — ${a.width}×${a.height}이어야 해요. nearest-neighbor로 맞추세요(비율이 다르면 잘라서).` });
      continue;
    }
    if (info.colors !== null && info.colors > limit) {
      errors.push({ file: rel, msg: `색이 ${limit}개보다 많아요(${info.colors}+). 저해상도 도트가 아니라 일반 일러스트로 나온 것 같아요. 원본 도트 크기(${a.native})로 줄여 팔레트로 색을 줄인 뒤 다시 키우세요.` });
      continue;
    }
    if (a.transparent && (!info.alpha || info.transparentPixels === 0)) {
      warnings.push({ file: rel, msg: '투명 배경이어야 하는데 투명한 픽셀이 없어요.' });
    }
    if (b.length > MAX_BYTES) warnings.push({ file: rel, msg: `용량 ${(b.length / 1048576).toFixed(1)}MB — 3MB 이하로 줄이면 로딩이 빨라져요.` });
    present.push(rel);
  }
}

const kinds = [...new Set(items.map((i) => i.kind))];
const out = ['## 그림 검사', '', '| 종류 | 들어감 |', '|---|---|'];
for (const k of kinds) out.push(`| ${k} | ${items.filter((i) => i.kind === k && present.includes(i.file)).length}/${items.filter((i) => i.kind === k).length} |`);
out.push(`| **합계** | **${present.length}/${items.length}** |`, '');
if (errors.length) { out.push('### ❌ 고쳐야 할 것'); errors.forEach((e) => out.push(`- \`assets/${e.file}\` — ${e.msg}`)); out.push(''); }
if (warnings.length) { out.push('### ⚠️ 확인하면 좋은 것'); warnings.forEach((w) => out.push(`- \`assets/${w.file}\` — ${w.msg}`)); out.push(''); }
if (!errors.length && !warnings.length) out.push('✅ 들어간 그림은 모두 문제없어요.', '');

const md = out.join('\n');
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
if (process.env.GITHUB_ACTIONS) {
  errors.forEach((e) => console.log(`::error file=assets/${e.file}::${e.msg}`));
  warnings.forEach((w) => console.log(`::warning file=assets/${w.file}::${w.msg}`));
}
process.exit(errors.length ? 1 : 0);

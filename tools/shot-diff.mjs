// 화면 사진 비교: npm run shots로 찍은 shots/*.png를 기준(shots/base/*.png)과 픽셀 비교한다.
// 화면마다 바뀐 비율(%)을 표로 출력하고, 바뀐 곳을 빨갛게 칠한 사진을 shots/diff/에 저장한다.
// 기준이 없는 화면은 지금 사진을 기준으로 저장한다. 애니메이션 때문에 조금씩 다르니 2% 미만은 「같음」.
// 실행: node tools/shot-diff.mjs            (npm run shotdiff)
//       node tools/shot-diff.mjs --update   기준을 지금 사진으로 모두 바꾼다
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'shots'), BASE = join(SHOTS, 'base'), DIFF = join(SHOTS, 'diff');
const SAME_PCT = 2;   // 이 비율 미만이면 같음
const PIX_TOL = 24;   // 채널 차이가 이보다 작으면 같은 픽셀(압축·보간 잡음)
const update = process.argv.includes('--update');

const pngs = (dir) => existsSync(dir) ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort() : [];
const cur = pngs(SHOTS);
if (!cur.length) { console.log('shots/에 사진이 없어요. 먼저 npm run shots 를 돌리세요.'); process.exit(1); }
mkdirSync(BASE, { recursive: true });

if (update) {
  for (const f of pngs(BASE)) if (!cur.includes(f)) rmSync(join(BASE, f));
  for (const f of cur) copyFileSync(join(SHOTS, f), join(BASE, f));
  console.log(`기준을 지금 사진 ${cur.length}장으로 바꿨어요 (shots/base/).`);
  process.exit(0);
}

mkdirSync(DIFF, { recursive: true });
for (const f of pngs(DIFF)) rmSync(join(DIFF, f));

function compare(a, b) {
  const n = a.w * a.h, out = new Uint8Array(n * 4);
  let changed = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const d = Math.max(Math.abs(a.data[o] - b.data[o]), Math.abs(a.data[o + 1] - b.data[o + 1]),
      Math.abs(a.data[o + 2] - b.data[o + 2]), Math.abs(a.data[o + 3] - b.data[o + 3]));
    if (d >= PIX_TOL) { changed++; out[o] = 255; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; }
    else { // 바뀌지 않은 곳은 흐린 회색으로
      const g = Math.round((b.data[o] * 0.3 + b.data[o + 1] * 0.59 + b.data[o + 2] * 0.11) * 0.35 + 40);
      out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255;
    }
  }
  return { pct: changed / n * 100, img: out };
}

const rows = [];
for (const f of cur) {
  const name = f.replace(/\.png$/i, '');
  const bp = join(BASE, f);
  if (!existsSync(bp)) { copyFileSync(join(SHOTS, f), bp); rows.push([name, '-', '새 기준']); continue; }
  let a, b;
  try { a = decodePng(readFileSync(bp)); b = decodePng(readFileSync(join(SHOTS, f))); }
  catch (e) { rows.push([name, '-', `읽기 실패: ${e.message}`]); continue; }
  if (a.w !== b.w || a.h !== b.h) { rows.push([name, '100.00', `크기 다름 ${a.w}×${a.h} → ${b.w}×${b.h}`]); continue; }
  const { pct, img } = compare(a, b);
  const same = pct < SAME_PCT;
  if (!same) writeFileSync(join(DIFF, f), encodePng(b.w, b.h, img));
  rows.push([name, pct.toFixed(2), same ? '같음' : '바뀜']);
}
for (const f of pngs(BASE)) if (!cur.includes(f)) rows.push([f.replace(/\.png$/i, ''), '-', '없어짐(기준에만 있음)']);

const head = ['화면', '바뀐 %', '결과'];
const wid = (s) => [...String(s)].reduce((n, c) => n + (c.charCodeAt(0) > 0x1100 ? 2 : 1), 0);
const W = head.map((h, i) => Math.max(wid(h), ...rows.map((r) => wid(r[i]))));
const pad = (s, w) => String(s) + ' '.repeat(w - wid(s));
console.log('| ' + head.map((h, i) => pad(h, W[i])).join(' | ') + ' |');
console.log('|' + W.map((w) => '-'.repeat(w + 2)).join('|') + '|');
for (const r of rows) console.log('| ' + r.map((c, i) => pad(c, W[i])).join(' | ') + ' |');
const changed = rows.filter((r) => r[2] !== '같음' && r[2] !== '새 기준').length;
console.log(`\n${rows.length}개 화면 중 바뀜·문제 ${changed}개. 빨간 표시 사진: shots/diff/  (기준 바꾸기: npm run shotdiff -- --update)`);

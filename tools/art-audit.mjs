// 숫자 검사(크기·색 수)로는 못 잡는, 사람이 보면 틀린 그림을 대략 찾아 의심 목록만 보여 준다. 경고만(종료 코드 0).
//  ① 적 시트(assets/sheets/*_foes_*·*_foepose_*): 칸(512×512)마다 그림이 칸 경계 30px 안에 닿으면 「경계 침범」
//  ② 보스 단계(assets/enemies/boss_<id>_1 vs _2·_3): 색상 히스토그램이 크게 다르면 「단계 인물 바뀜 의심」
//  ③ 배경(assets/bg/*.png): 가운데 아래 1/3에 살색 덩어리가 크면 「사람 의심」
//  ④ 적(assets/enemies/*.png, 보스·_hurt 제외): 무게중심·머리 쪽이 오른쪽이면 「오른쪽 봄 의심」
// 사용: node tools/art-audit.mjs   (check-assets.mjs 끝에서도 같이 돈다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = path.join(ROOT, 'assets');

const CELL = 512, EDGE = 30, ALPHA = 64;
const HUE_BINS = 12;

const list = (dir, re) => {
  const d = path.join(A, dir);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.endsWith('.png') && re.test(f)).sort().map((f) => path.join(d, f));
};
const load = (file) => { try { return decodePng(fs.readFileSync(file)); } catch { return null; } };
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx / 255];
}

// ① 시트 칸 경계 침범
function auditSheet(img) {
  const cols = Math.round(img.w / CELL), rows = Math.round(img.h / CELL);
  const bad = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const x0 = cx * CELL, y0 = cy * CELL;
    let hits = 0, cross = 0; const sides = new Set();
    for (let y = y0; y < Math.min(y0 + CELL, img.h); y++) for (let x = x0; x < Math.min(x0 + CELL, img.w); x++) {
      const lx = x - x0, ly = y - y0;
      if (lx >= EDGE && lx < CELL - EDGE && ly >= EDGE && ly < CELL - EDGE) { x = x0 + CELL - EDGE - 1; continue; }
      if (img.data[(y * img.w + x) * 4 + 3] < ALPHA) continue;
      hits++; if (lx < 2 || lx >= CELL - 2 || ly < 2 || ly >= CELL - 2) cross++;
      if (lx < EDGE) sides.add('왼'); if (lx >= CELL - EDGE) sides.add('오');
      if (ly < EDGE) sides.add('위'); if (ly >= CELL - EDGE) sides.add('아래');
    }
    if (hits >= 20) bad.push({ n: cy * cols + cx + 1, cross: cross >= 4, txt: `${cy * cols + cx + 1}(${[...sides].join('')})` });
  }
  if (!bad.length) return null;
  const over = bad.filter((b) => b.cross), near = bad.filter((b) => !b.cross);
  const parts = [];
  if (over.length) parts.push(`칸 끝에서 잘림 ${over.map((b) => b.txt).join(' ')}`);
  if (near.length) parts.push(`30px 안 ${near.map((b) => b.txt).join(' ')}`);
  return `경계 침범: ${parts.join(' / ')}번 칸`;
}

// ② 색상 히스토그램(채도·밝기가 있는 불투명 픽셀만, 합 1로 정규화)
function hueHist(img) {
  const hist = new Array(HUE_BINS).fill(0); let n = 0;
  for (let i = 0; i < img.w * img.h; i++) {
    const o = i * 4;
    if (img.data[o + 3] < ALPHA) continue;
    const [h, s, v] = hsv(img.data[o], img.data[o + 1], img.data[o + 2]);
    if (s < 0.15 || v < 0.15) continue;
    hist[Math.floor(h / (360 / HUE_BINS)) % HUE_BINS]++; n++;
  }
  return n ? hist.map((c) => c / n) : hist;
}
const top3 = (h) => h.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).filter(([v]) => v > 0.03).map(([, i]) => i);
function compareStage(a, b) {
  const ta = top3(a), tb = top3(b);
  const overlap = ta.filter((i) => tb.includes(i)).length;
  const l1 = a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
  if ((ta.length && tb.length && overlap === 0) || l1 > 1.2) return { overlap, l1 };
  return null;
}

// ③ 배경 가운데 아래 1/3의 살색 덩어리
function auditBg(img) {
  const x0 = Math.floor(img.w / 3), x1 = Math.floor(img.w * 2 / 3), y0 = Math.floor(img.h * 2 / 3), y1 = img.h;
  const W = x1 - x0, H = y1 - y0;
  const skin = new Uint8Array(W * H);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * img.w + x) * 4;
    if (img.data[o + 3] < ALPHA) continue;
    const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2];
    const [h, s, v] = hsv(r, g, b);
    if (h >= 5 && h <= 40 && s >= 0.18 && s <= 0.6 && v >= 0.45 && r > g && g > b) skin[(y - y0) * W + (x - x0)] = 1;
  }
  // 가장 큰 연결 덩어리
  let best = 0; const stack = [];
  for (let i = 0; i < skin.length; i++) {
    if (skin[i] !== 1) continue;
    let size = 0; skin[i] = 2; stack.push(i);
    while (stack.length) {
      const j = stack.pop(); size++;
      const x = j % W, y = (j - x) / W;
      if (x > 0 && skin[j - 1] === 1) { skin[j - 1] = 2; stack.push(j - 1); }
      if (x < W - 1 && skin[j + 1] === 1) { skin[j + 1] = 2; stack.push(j + 1); }
      if (y > 0 && skin[j - W] === 1) { skin[j - W] = 2; stack.push(j - W); }
      if (y < H - 1 && skin[j + W] === 1) { skin[j + W] = 2; stack.push(j + W); }
    }
    if (size > best) best = size;
  }
  const ratio = best / (W * H);
  return ratio > 0.01 ? `사람 의심: 가운데 아래에 살색 덩어리 ${best}px(${(ratio * 100).toFixed(1)}%)` : null;
}

// ④ 적 방향: 몸 무게중심이 그림 가운데보다 오른쪽 + 머리(위 1/3) 무게중심이 몸보다 오른쪽이면 의심
function auditFacing(img) {
  let n = 0, sx = 0, minY = img.h, maxY = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.data[(y * img.w + x) * 4 + 3] < ALPHA) continue;
    n++; sx += x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  if (!n) return null;
  const cx = sx / n, headY = minY + (maxY - minY + 1) / 3;
  let hn = 0, hx = 0;
  for (let y = minY; y < headY; y++) for (let x = 0; x < img.w; x++) {
    if (img.data[(y * img.w + x) * 4 + 3] < ALPHA) continue;
    hn++; hx += x;
  }
  const body = (cx - img.w / 2) / img.w, head = hn ? (hx / hn - cx) / img.w : 0;
  const score = body + head;
  return score > 0.06 && head > 0 ? `오른쪽 봄 의심(몸 ${(body * 100).toFixed(0)}%·머리 ${(head * 100).toFixed(0)}% 오른쪽)` : null;
}

export function runAudit() {
  const rows = []; let checked = 0;
  const add = (file, msg) => { if (msg) rows.push([rel(file), msg]); };

  for (const f of list('sheets', /_(foes|foepose)_/)) { const img = load(f); if (!img) continue; checked++; add(f, auditSheet(img)); }

  const enemies = list('enemies', /./);
  for (const f of enemies) {
    const m = path.basename(f).match(/^boss_(.+)_1\.png$/);
    if (!m) continue;
    const base = load(f); if (!base) continue;
    const hb = hueHist(base);
    for (const k of [2, 3]) {
      const g = path.join(path.dirname(f), `boss_${m[1]}_${k}.png`);
      if (!fs.existsSync(g)) continue;
      const img = load(g); if (!img) continue; checked++;
      const d = compareStage(hb, hueHist(img));
      if (d) add(g, `단계 인물 바뀜 의심: 1단계와 주요 색 겹침 ${d.overlap}/3, 색 차이 ${d.l1.toFixed(2)}`);
    }
  }

  for (const f of list('bg', /./)) { const img = load(f); if (!img) continue; checked++; add(f, auditBg(img)); }

  for (const f of enemies) {
    // 보스·피격 자세(뒤로 젖혀 오른쪽으로 쏠리는 게 정상)는 뺀다
    if (/^boss_|_hurt.png$/.test(path.basename(f))) continue;
    const img = load(f); if (!img) continue; checked++;
    add(f, auditFacing(img));
  }

  const out = ['## 그림 눈검사(의심만, 경고)', ''];
  if (!rows.length) out.push(`✅ ${checked}개 살펴봄, 의심 없음.`);
  else {
    out.push(`${checked}개 살펴봄, 의심 ${rows.length}개. 사람이 직접 보고 판단하세요.`, '', '| 파일 | 의심 |', '|---|---|');
    rows.forEach(([f, m]) => out.push(`| \`${f}\` | ${m} |`));
  }
  out.push('');
  return { rows, md: out.join('\n') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { md, rows } = runAudit();
  console.log(md);
  if (process.env.GITHUB_ACTIONS) rows.forEach(([f, m]) => console.log(`::warning file=${f}::${m}`));
  process.exit(0);
}

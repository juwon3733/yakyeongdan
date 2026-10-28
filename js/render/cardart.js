// 카드 위쪽 일러스트. 그림 파일(assets/cards/…)이 있으면 그것, 없으면 임시 일러스트를 캔버스로 그린다:
// 그 동료의 임시 도트를 크게 + 카드 종류에 맞는 이펙트(베기 궤적, 포격, 방패, 독 안개, 정령, 시계 바늘 …).
// 원본 96×72(4:3) — 받을 카드 그림과 같은 크기. 카드 id(+ 동료 색)마다 한 번만 그린다.
import { artURL, cardArtFile } from '../art.js';
import { drawSprite } from './sprites.js';

const W = 96, H = 72;
const cache = new Map();
let seed = 1;
const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

// d: cardData, pals: 동료 id → 팔레트(의상 반영), longs: id → 장발
export function cardArtSrc(d, pals, longs) {
  const file = cardArtFile(d);
  const real = file && artURL(file);
  if (real) return real;
  const ids = d.ch === 'duo' ? [d.a, d.b] : d.ch === 'curse' ? [] : [d.ch];
  const key = `${String(d.id).replace(/\+$/, '')}|${ids.map(i => pals[i]?.h + pals[i]?.o).join(',')}`;
  if (cache.has(key)) return cache.get(key);
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  seed = hash(key) || 1;
  if (d.ch === 'curse') drawCurse(g, d);
  else draw(g, d, ids.map(i => ({ id: i, pal: pals[i], long: longs[i] })));
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

const px = (g, x, y, w = 1, h = 1, col) => { if (col) g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
function line(g, x0, y0, x1, y1, col, w = 1) {
  g.fillStyle = col;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w, w);
}
function disk(g, cx, cy, r, col, dither = false) {
  g.fillStyle = col;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r && (!dither || (x + y) & 1)) g.fillRect(cx + x, cy + y, 1, 1);
}
function ring(g, cx, cy, r, col) { g.fillStyle = col; for (let a = 0; a < 6.283; a += 1 / r) g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
function spark(g, x, y, col, s = 2) { px(g, x - s, y, s * 2 + 1, 1, col); px(g, x, y - s, 1, s * 2 + 1); px(g, x, y, 1, 1, '#ffffff'); }

// 밤 배경: 위는 남색, 아래는 동료 색이 섞인 어둠. 2×2 순서 디더로 띠를 섞는다.
function sky(g, tint) {
  const top = '#0b0b20', bot = mix('#14142e', tint, .38);
  const B = [[0, 2], [3, 1]];
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1) * 4, k = Math.floor(t), f = (t - k) * 4;
    const a = mix(top, bot, k / 4), b = mix(top, bot, Math.min(1, (k + 1) / 4));
    for (let x = 0; x < W; x++) px(g, x, y, 1, 1, B[y & 1][x & 1] < f ? b : a);
  }
  for (let i = 0; i < 14; i++) px(g, rnd() * W, rnd() * 34, 1, 1, rnd() < .3 ? '#ffffff' : '#7a80c8');
  px(g, 0, 62, W, 10, mix('#0a0a18', tint, .18));
  for (let x = 0; x < W; x += 2) px(g, x, 62, 1, 1, mix('#20203e', tint, .3));
}
function foeShadow(g, x, y, s = 1) {
  g.fillStyle = '#05050c';
  disk(g, x, y - 12 * s, 6 * s, '#05050c');
  px(g, x - 7 * s, y - 8 * s, 14 * s, 16 * s);
  px(g, x - 4 * s, y - 15 * s, 2, 2, '#ff4a6a'); px(g, x + 1 * s, y - 15 * s, 2, 2, '#ff4a6a');
}

function kinds(d) {
  const t = String(d.text || ''), n = String(d.name || ''), out = new Set();
  if (d.time) out.add('time');
  if (/달을|달이|달빛|보름|그믐|초승|반달|월하|월광|월식|만월/.test(t + n)) out.add('moon');
  if (/공중|날아|급강하|활공|비상/.test(t + n)) out.add('air');
  if (d.slash || /베기|일섬|칼|검/.test(n)) out.add('slash');
  if (/장전|발사|포|사격|쏘|탄/.test(t + n)) out.add('shot');
  if (/정령|별자리|별똥|은하|북극성|큰곰/.test(t + n)) out.add('spirit');
  if (/독/.test(t)) out.add('poison');
  if (/화상|불꽃|업화|홍련|염/.test(t + n)) out.add('burn');
  if (/잠|꿈|마력|하품|자장가/.test(t + n)) out.add('sleep');
  if (/회복/.test(t)) out.add('heal');
  if (/별빛|금화|약탈|현상금/.test(t + n)) out.add('gold');
  if (/카드 \d장|뽑기|뽑/.test(t)) out.add('draw');
  if (/방어/.test(t) && !d.atk) out.add('block');
  if (d.atk) out.add(d.target === 'all' ? 'all' : 'hit');
  if (!out.size) out.add('aura');
  return out;
}

function draw(g, d, who) {
  const main = who[0], tint = main.pal?.a || '#6a6ae0';
  sky(g, tint);
  const K = kinds(d);
  const accent = main.pal?.a || '#e0b84a', bright = mix(accent, '#ffffff', .45);
  // 뒤쪽 큰 이펙트
  if (K.has('moon')) { disk(g, 74, 18, 11, '#e8ecff'); disk(g, 78, 15, 9, mix('#0b0b20', tint, .2)); }
  if (K.has('time')) {
    disk(g, 62, 30, 17, '#1c2048', true); ring(g, 62, 30, 17, '#c8d0ff'); ring(g, 62, 30, 15, '#5a6098');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; px(g, 62 + Math.cos(a) * 13, 30 + Math.sin(a) * 13, 1, 1, '#c8d0ff'); }
    line(g, 62, 30, 62, 18, '#ffe9a0', 1); line(g, 62, 30, 72, 34, '#ffe9a0', 1); px(g, 61, 29, 3, 3, '#ffffff');
  }
  if (d.rarity === 'r' || d.exhaust) for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + .2; line(g, 24, 38, 24 + Math.cos(a) * 30, 38 + Math.sin(a) * 30, mix('#0b0b20', bright, .35)); }
  // 인물
  const air = K.has('air') ? -8 : 0;
  if (K.has('air')) for (let i = 0; i < 4; i++) disk(g, 10 + i * 9, 62, 5, '#c8d0f0', true);
  if (who.length === 2) {
    drawSprite(g, who[0].pal, who[0].long, 4, 16 + air, 3);
    drawSprite(g, who[1].pal, who[1].long, 30, 16 + air, 3);
  } else if (d.sub === 'both') {
    drawSprite(g, { ...main.pal, h: '#ffb0c8', H: '#e07a9a' }, false, 4, 16, 3);
    drawSprite(g, { ...main.pal, h: '#9ad0f0', H: '#5a90c0' }, false, 30, 16, 3);
  } else {
    const p = d.sub === 'mimi' ? { ...main.pal, h: '#ffb0c8', H: '#e07a9a' } : d.sub === 'momo' ? { ...main.pal, h: '#9ad0f0', H: '#5a90c0' } : main.pal;
    const cx = K.has('block') && !K.has('hit') ? 22 : 10;
    drawSprite(g, p, main.long, cx, 14 + air, 3);
  }
  const fx = who.length === 2 ? 66 : 62;
  // 앞쪽 이펙트
  if (K.has('hit')) { foeShadow(g, 86, 60); spark(g, 76, 38, bright, 4); spark(g, 80, 30, '#ffffff', 2); }
  if (K.has('all')) { foeShadow(g, 72, 62, .7); foeShadow(g, 82, 58, .7); foeShadow(g, 92, 62, .7);
    for (let x = 52; x < 96; x++) px(g, x, 40 + Math.round(Math.sin(x / 4) * 3), 1, 2, bright); }
  if (K.has('slash')) for (let i = 0; i < 3; i++) { const r = 24 + i * 3; for (let a = -1.1; a < .9; a += .03) px(g, 54 + Math.cos(a) * r, 40 + Math.sin(a) * r, 1, 1, i === 1 ? '#ffffff' : bright); }
  if (K.has('shot')) { line(g, 40, 38, 74, 30, '#ffd27a', 2); disk(g, 78, 30, 6, '#ff8a3a'); disk(g, 78, 30, 3, '#fff2b0'); for (let i = 0; i < 6; i++) px(g, 70 + rnd() * 18, 22 + rnd() * 16, 1, 1, '#ffd27a'); }
  if (K.has('block')) { const x = K.has('hit') ? 46 : 58; px(g, x, 22, 16, 22, '#05050c'); px(g, x + 1, 23, 14, 20, accent); px(g, x + 3, 25, 10, 16, bright); px(g, x + 7, 25, 2, 16, '#ffffff'); px(g, x + 3, 32, 10, 2, '#ffffff'); }
  if (K.has('poison')) for (let i = 0; i < 40; i++) px(g, fx - 8 + rnd() * 34, 22 + rnd() * 36, rnd() < .5 ? 2 : 1, 1, rnd() < .5 ? '#5ad07a' : '#2a7a4a');
  if (K.has('burn')) for (let i = 0; i < 7; i++) { const x = 58 + i * 5, h = 8 + rnd() * 12; for (let y = 0; y < h; y++) px(g, x + Math.round(Math.sin(y / 2 + i) * 1.5), 62 - y, 2, 1, y > h * .6 ? '#ffe08a' : y > h * .3 ? '#ff9a3a' : '#e0402a'); }
  if (K.has('spirit')) for (let i = 0; i < 5; i++) { const x = 52 + rnd() * 38, y = 12 + rnd() * 36; line(g, x - 6, y + 3, x, y, '#5a78a8'); spark(g, x, y, '#e8f0ff', 2); }
  if (K.has('sleep')) { const z = (x, y, s) => { px(g, x, y, s * 3, 1, '#c8d0ff'); line(g, x + s * 3 - 1, y, x, y + s * 3 - 1, '#c8d0ff'); px(g, x, y + s * 3 - 1, s * 3, 1); };
    z(44, 14, 2); z(54, 8, 3); z(66, 4, 2); for (let i = 0; i < 6; i++) spark(g, 60 + rnd() * 30, 24 + rnd() * 30, '#f0a8e0', 1); }
  if (K.has('heal')) for (let i = 0; i < 6; i++) { const x = 50 + rnd() * 40, y = 16 + rnd() * 38; px(g, x - 2, y, 5, 1, '#9af0b0'); px(g, x, y - 2, 1, 5); }
  if (K.has('gold')) for (let i = 0; i < 7; i++) { const x = 54 + rnd() * 36, y = 20 + rnd() * 38; disk(g, x | 0, y | 0, 2, '#e0b84a'); px(g, x, y - 1, 1, 1, '#fff2b0'); }
  if (K.has('draw')) for (let i = 0; i < 4; i++) { const x = 58 + i * 7, y = 22 + Math.abs(i - 1.5) * 3; px(g, x, y, 9, 13, '#05050c'); px(g, x + 1, y + 1, 7, 11, '#efeadf'); px(g, x + 1, y + 1, 7, 3, accent); }
  if (K.has('aura') || who.length === 2) for (let i = 0; i < 10; i++) spark(g, 46 + rnd() * 46, 10 + rnd() * 48, i & 1 ? bright : '#ffffff', 1 + (rnd() * 2 | 0));
  if (who.length === 2) { disk(g, 52, 34, 5, '#fff2b0', true); spark(g, 52, 34, '#ffffff', 5); }
  // 테두리 안쪽 어둡게(일러스트가 카드 틀에 붙어 보이게)
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, 1); g.fillRect(0, H - 1, W, 1); g.fillRect(0, 0, 1, H); g.fillRect(W - 1, 0, 1, H);
}

function drawCurse(g) {
  const B = [[0, 2], [3, 1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(g, x, y, 1, 1, B[y & 1][x & 1] < (y / H) * 4 ? '#3a0a18' : '#160810');
  // 금 간 자국
  let x = 10, y = 0; g.fillStyle = '#7a1a2a';
  while (y < H) { const nx = x + (rnd() * 10 - 5), ny = y + 6 + rnd() * 6; line(g, x, y, nx, ny, '#7a1a2a'); x = nx; y = ny; }
  x = 70; y = 0; while (y < H) { const nx = x + (rnd() * 10 - 5), ny = y + 6 + rnd() * 6; line(g, x, y, nx, ny, '#5a1222'); x = nx; y = ny; }
  // 흐릿한 눈
  disk(g, 48, 34, 10, '#2a0a14'); disk(g, 48, 34, 7, '#8a2a4a', true); disk(g, 48, 34, 3, '#e05a7a'); px(g, 47, 33, 1, 1, '#ffffff');
}

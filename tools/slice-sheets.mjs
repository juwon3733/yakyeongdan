// 시트 자르기: assets/sheets/의 시트(GPT가 한 장에 여러 개 그린 것)를 칸마다 잘라 게임이 쓰는 파일로 만든다.
// 칸 → 원본 도트 크기로 줄이고(블록 가운데 색) → 정수배로 키운다(nearest). 목록과 칸 위치는 js/asset_prompts.js의 sheet().
// 사용: node tools/slice-sheets.mjs   (npm run art가 같이 돌린다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodePng, encodePng } from './png.mjs';
import { spriteBox } from './sprite-box.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = await import(pathToFileURL(path.join(root, 'js/asset_prompts.js')).href);
const { items } = P.assetList();
let made = 0;
const scale = {};
for (const s of items.filter((i) => i.cells)) {
  const src = path.join(root, 'assets', s.file);
  if (!fs.existsSync(src)) continue;
  let img = decodePng(fs.readFileSync(src));
  if (img.w !== s.width || img.h !== s.height) { console.error(`${s.file}: 크기 ${img.w}×${img.h} — ${s.width}×${s.height}이어야 해요. 건너뜀.`); process.exitCode = 1; continue; }
  // 1) 칸마다 원본 도트 크기로 줄인다 — 블록 평균(불투명 칸이 절반 이상이면 불투명, 색은 불투명 픽셀 평균).
  //    가운데 점 하나만 뽑으면 GPT 그림(정확한 도트 격자가 아님)의 선이 끊기고 얼굴이 뭉개진다
  const nat = s.cells.map((c) => {
    const [nw, nh] = c.native, px = new Uint8Array(nw * nh * 4);
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      const sx0 = Math.floor(c.x + x * c.w / nw), sx1 = Math.max(sx0 + 1, Math.floor(c.x + (x + 1) * c.w / nw));
      const sy0 = Math.floor(c.y + y * c.h / nh), sy1 = Math.max(sy0 + 1, Math.floor(c.y + (y + 1) * c.h / nh));
      let n = 0, op = 0, r = 0, g = 0, b = 0;
      for (let sy = sy0; sy < Math.min(sy1, img.h); sy++) for (let sx = sx0; sx < Math.min(sx1, img.w); sx++) {
        const si = (sy * img.w + sx) * 4; n++;
        if (img.data[si + 3] >= 128) { op++; r += img.data[si]; g += img.data[si + 1]; b += img.data[si + 2]; }
      }
      const o = (y * nw + x) * 4;
      if (op * 2 >= n && op) { px[o] = Math.round(r / op); px[o + 1] = Math.round(g / op); px[o + 2] = Math.round(b / op); px[o + 3] = 255; }
    }
    return { c, nw, nh, px };
  });
  // 2) fit: 'union' (전투 스프라이트): 8칸 그림을 합친 테두리로 잘라, 정수배로 키워 칸 아래 가운데에 놓는다
  //    — GPT가 칸 안에 작게 그린 동료도 다른 동료와 같은 크기가 되고, 칸끼리 상대 위치(발 위치)는 그대로
  if (s.fit === 'union') {
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (const { nw, nh, px } of nat) for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) if (px[(y * nw + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 >= 0) for (const n of nat) {
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, f = Math.max(1, Math.floor(Math.min((n.nw - 2) / bw, (n.nh - 1) / bh)));
      const ox = Math.floor((n.nw - bw * f) / 2), oy = n.nh - 1 - bh * f, px = new Uint8Array(n.nw * n.nh * 4);
      for (let y = 0; y < bh * f; y++) for (let x = 0; x < bw * f; x++) {
        const si = ((y0 + Math.floor(y / f)) * n.nw + x0 + Math.floor(x / f)) * 4, di = ((oy + y) * n.nw + ox + x) * 4;
        if (oy + y >= 0 && n.px[si + 3]) px.set(n.px.subarray(si, si + 4), di);
      }
      n.px = px;
    }
  }
  // 몸 크기 재기(전투 스프라이트): 서 있는 칸의 그림 높이 → 게임이 동료마다 같은 키로 보이게 키운다(assets/sprite_scale.json)
  if (s.fit === 'union') {
    const idle = nat[0]; let top = idle.nh, bot = -1;
    for (let y = 0; y < idle.nh; y++) for (let x = 0; x < idle.nw; x++) if (idle.px[(y * idle.nw + x) * 4 + 3]) { top = Math.min(top, y); bot = Math.max(bot, y); }
    if (bot >= 0) scale[s.id.replace(/_battle$/, '')] = +Math.min(2.4, Math.max(1, 112 * idle.nh / 128 / (bot - top + 1))).toFixed(2);   // 원본 128 높이 기준 112
  }
  // 3) 정수배로 키워 저장(빈 칸은 만들지 않음)
  for (const { c, nw, nh, px } of nat) {
    if (!px.some((v, i) => i % 4 === 3 && v)) continue;
    const [ow, oh] = c.out, out = new Uint8Array(ow * oh * 4);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const si = (Math.floor(y * nh / oh) * nw + Math.floor(x * nw / ow)) * 4;
      out.set(px.subarray(si, si + 4), (y * ow + x) * 4);
    }
    const dst = path.join(root, 'assets', c.file);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, encodePng(ow, oh, out));
    made++;
  }
}
fs.writeFileSync(path.join(root, 'assets/sprite_scale.json'), JSON.stringify(Object.fromEntries(Object.entries(scale).sort()), null, 1) + '\n');
console.log(`시트 자르기: ${made}장`);
// 그림마다 투명하지 않은 부분의 상자(원본 도트 기준) → assets/sprite_box.json (적 assets/enemies도 같이)
await spriteBox();

// 시트 자르기: assets/sheets/의 시트(GPT가 한 장에 여러 개 그린 것)를 칸마다 잘라 게임이 쓰는 파일로 만든다.
// 칸 → 원본 도트 크기로 줄이고(블록 가운데 색) → 정수배로 키운다(nearest). 목록과 칸 위치는 js/asset_prompts.js의 sheet().
// 사용: node tools/slice-sheets.mjs   (npm run art가 같이 돌린다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodePng, encodePng } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = await import(pathToFileURL(path.join(root, 'js/asset_prompts.js')).href);
const { items } = P.assetList();
let made = 0;
for (const s of items.filter((i) => i.cells)) {
  const src = path.join(root, 'assets', s.file);
  if (!fs.existsSync(src)) continue;
  let img = decodePng(fs.readFileSync(src));
  if (img.w !== s.width || img.h !== s.height) { console.error(`${s.file}: 크기 ${img.w}×${img.h} — ${s.width}×${s.height}이어야 해요. 건너뜀.`); process.exitCode = 1; continue; }
  for (const c of s.cells) {
    const [nw, nh] = c.native, [ow, oh] = c.out;
    const out = new Uint8Array(ow * oh * 4);
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      // 출력 픽셀 → 원본 도트 칸 → 시트 안 그 도트 블록의 가운데
      const nx = Math.floor(x * nw / ow), ny = Math.floor(y * nh / oh);
      const sx = Math.min(img.w - 1, Math.floor(c.x + (nx + .5) * c.w / nw)), sy = Math.min(img.h - 1, Math.floor(c.y + (ny + .5) * c.h / nh));
      const si = (sy * img.w + sx) * 4, oi = (y * ow + x) * 4;
      out[oi] = img.data[si]; out[oi + 1] = img.data[si + 1]; out[oi + 2] = img.data[si + 2]; out[oi + 3] = img.data[si + 3] < 128 ? 0 : 255;
      if (!out[oi + 3]) out[oi] = out[oi + 1] = out[oi + 2] = 0;
    }
    // 빈 칸(전부 투명)이면 만들지 않는다
    if (!out.some((v, i) => i % 4 === 3 && v)) continue;
    const dst = path.join(root, 'assets', c.file);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, encodePng(ow, oh, out));
    made++;
  }
}
console.log(`시트 자르기: ${made}장`);

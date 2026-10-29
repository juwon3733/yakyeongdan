// 그림 상자: 전투 스프라이트(assets/sprites/<id>_<동작>.png)와 적(assets/enemies/*.png)마다
// 투명하지 않은 부분의 상자 [x0, y0, x1, y1](원본 도트 픽셀 기준, 끝 포함)를 assets/sprite_box.json에 적는다.
// 키: 스프라이트는 "<id>_<동작>", 적은 "foe_<파일이름>".
// 원본 크기는 js/asset_prompts.js의 native(시트 칸이면 칸의 native), 모르면 폴더 기본 폭(스프라이트 96, 적 128)으로 배율을 잡는다.
// 사용: node tools/sprite-box.mjs [--check]   (npm run art = slice-sheets가 같이 만든다, art-index --check가 같이 본다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decodePng } from './png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'assets/sprite_box.json');
const SETS = [
  { dir: 'sprites', prefix: '', baseW: 96 },
  { dir: 'enemies', prefix: 'foe_', baseW: 128 },
];

async function nativeSizes() {
  const P = await import(pathToFileURL(path.join(root, 'js/asset_prompts.js')).href);
  const m = new Map();
  for (const it of P.assetList().items) {
    const n = String(it.native || '').match(/^(\d+)×(\d+)$/);
    if (it.file && n) m.set(it.file, [+n[1], +n[2]]);
    for (const c of it.cells || []) m.set(c.file, c.native);
  }
  return m;
}

export async function spriteBoxText() {
  const nat = await nativeSizes();
  const box = {};
  for (const { dir, prefix, baseW } of SETS) {
    let names = [];
    try { names = fs.readdirSync(path.join(root, 'assets', dir)); } catch { continue; }
    for (const name of names.filter((n) => /\.png$/i.test(n)).sort()) {
      const img = decodePng(fs.readFileSync(path.join(root, 'assets', dir, name)));
      const nw = nat.get(`${dir}/${name}`)?.[0] || baseW;
      const f = Math.max(1, Math.round(img.w / nw));
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 < 0) continue; // 완전히 투명한 그림은 상자 없음
      box[prefix + name.replace(/\.png$/i, '')] = [Math.floor(x0 / f), Math.floor(y0 / f), Math.floor(x1 / f), Math.floor(y1 / f)];
    }
  }
  const keys = Object.keys(box).sort();
  return keys.length ? '{\n' + keys.map((k) => ` ${JSON.stringify(k)}: ${JSON.stringify(box[k])}`).join(',\n') + '\n}\n' : '{}\n';
}

// 만들기(check=false) 또는 맞는지 보기(check=true). 어긋나면 false.
export async function spriteBox(check = false) {
  const text = await spriteBoxText();
  const n = (text.match(/\n "/g) || []).length;
  if (check) {
    let cur = '';
    try { cur = fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n'); } catch {} // Windows autocrlf 체크아웃도 통과
    if (cur !== text) { console.error('assets/sprite_box.json이 실제 그림과 다르다. npm run art(또는 node tools/sprite-box.mjs)를 돌려 다시 만들 것.'); return false; }
    console.log(`sprite_box.json OK (상자 ${n}개)`);
    return true;
  }
  fs.writeFileSync(OUT, text);
  console.log(`assets/sprite_box.json: 상자 ${n}개`);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!(await spriteBox(process.argv.includes('--check')))) process.exit(1);
}

// assets/ 안에 실제로 있는 그림 파일 목록을 assets/art.json에 적는다.
// 게임(js/art.js)은 이 목록에 있는 그림만 불러 보고, 없으면 임시 도트를 쓴다(없는 파일을 요청해 404가 쌓이지 않게).
// 그림을 넣거나 뺐으면: node tools/art-index.mjs   (CI는 --check로 목록이 맞는지 본다)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spriteBox } from './sprite-box.mjs';

const ROOT = fileURLToPath(new URL('../assets/', import.meta.url));
const DIRS = ['chars', 'sprites', 'fx', 'cards', 'cutins', 'cg', 'enemies', 'bg', 'title', 'summon', 'icons', 'ui'];
const files = [];
for (const d of DIRS) {
  let names = [];
  try { names = await readdir(join(ROOT, d), { recursive: true }); } catch { continue; }
  for (const n of names) if (/\.png$/i.test(n)) files.push(relative(ROOT, join(ROOT, d, n)).split('\\').join('/'));
}
files.sort();
const text = (files.length ? '[\n' + files.map(f => JSON.stringify(f)).join(',\n') + '\n]' : '[]') + '\n';
const out = join(ROOT, 'art.json');
if (process.argv.includes('--check')) {
  let cur = '';
  try { cur = await readFile(out, 'utf8'); } catch {}
  if (cur !== text) { console.error('assets/art.json이 실제 그림 파일과 다르다. node tools/art-index.mjs를 돌려 다시 만들 것.'); process.exit(1); }
  console.log(`art.json OK (그림 ${files.length}개)`);
  // 그림 상자(assets/sprite_box.json, slice-sheets가 만든다)도 실제 그림과 맞는지 본다
  if (!(await spriteBox(true))) process.exit(1);
} else {
  await writeFile(out, text);
  console.log(`assets/art.json: 그림 ${files.length}개`);
}

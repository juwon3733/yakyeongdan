// shots/index.html: 화면 사진을 한 화면에 격자로 모아 브라우저로 한눈에 보게 한다.
// 낱장은 격자에, 연속 사진(이름_1, 이름_2 …)은 한 줄로. 누르면 크게(←→로 넘김, Esc로 닫기).
// tools/screens.mjs(npm run shots)가 끝날 때 이번에 찍은 목록으로 부른다.
// 따로 실행: node tools/shots-index.mjs   — shots/의 PNG를 찍은 시각 순으로 모은다.
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// shots/ 폴더를 읽어 [{ name, files, note }] 목록으로 (연속 사진은 묶음 하나)
export async function scanShots(dir) {
  const pngs = (await readdir(dir)).filter(f => f.endsWith('.png'));
  const groups = new Map();
  for (const f of pngs) {
    const m = f.match(/^(.+)_(\d+)\.png$/);
    const name = m ? m[1] : f.slice(0, -4);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ f, i: m ? +m[2] : 0, t: (await stat(join(dir, f))).mtimeMs });
  }
  return [...groups].map(([name, l]) => {
    l.sort((a, b) => a.i - b.i);
    // 숫자가 붙어도 한 장뿐이면 낱장
    return { name, files: l.map(x => x.f), t: Math.min(...l.map(x => x.t)) };
  }).sort((a, b) => a.t - b.t || a.name.localeCompare(b.name));
}

export async function writeShotsIndex(dir, items) {
  items ||= await scanShots(dir);
  const v = Date.now(); // 같은 이름으로 다시 찍어도 브라우저가 옛 사진을 보이지 않게
  const img = (f, cap) => `<figure><img src="${esc(f)}?v=${v}" alt="${esc(f)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`;
  const singles = items.filter(x => x.files.length === 1);
  const seqs = items.filter(x => x.files.length > 1);
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>야경단 화면 사진</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 16px; background: #14121c; color: #e8e2f0; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 18px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 20px 0 6px; }
  .meta { color: #9a93a8; font-size: 12px; margin: 0 0 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 10px; }
  .row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(180px, 1fr); gap: 4px; overflow-x: auto; }
  .seq { margin-bottom: 14px; } .seq h2 small { color: #9a93a8; font-weight: normal; }
  figure { margin: 0; background: #000; border: 2px solid #3a3450; box-shadow: 3px 3px 0 #000; cursor: zoom-in; }
  figure:hover { border-color: #e8c25a; }
  img { display: block; width: 100%; aspect-ratio: 16/9; object-fit: contain; image-rendering: pixelated; }
  figcaption { padding: 2px 6px; font-size: 12px; background: #221e2e; }
  #big { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; flex-direction: column; align-items: center; justify-content: center; cursor: zoom-out; }
  #big.on { display: flex; } #big img { width: auto; max-width: 96vw; max-height: 90vh; aspect-ratio: auto; }
  #big p { margin: 6px 0 0; }
</style></head><body>
<h1>야경단 화면 사진</h1>
<p class="meta">${esc(new Date(v).toLocaleString('ko-KR'))} · ${items.reduce((n, x) => n + x.files.length, 0)}장 · 누르면 크게, ←→ 넘김, Esc 닫기</p>
${singles.length ? `<h2>화면</h2>\n<div class="grid">\n${singles.map(x => img(x.files[0], x.name + (x.note && x.note !== x.name ? ' — ' + x.note : ''))).join('\n')}\n</div>` : ''}
${seqs.map(x => `<section class="seq"><h2>${esc(x.name)} <small>${x.files.length}장${x.note ? ' · ' + esc(x.note) : ''}</small></h2>
<div class="row">\n${x.files.map((f, i) => img(f, `${i + 1}`)).join('\n')}\n</div></section>`).join('\n')}
${items.length ? '' : '<p>사진이 없습니다. npm run shots로 찍으세요.</p>'}
<div id="big"><img alt=""><p></p></div>
<script>
  const figs = [...document.querySelectorAll('figure')], big = document.getElementById('big');
  let cur = -1;
  const show = i => { cur = (i + figs.length) % figs.length; const f = figs[cur]; big.querySelector('img').src = f.querySelector('img').src; big.querySelector('p').textContent = f.querySelector('img').alt; big.classList.add('on'); };
  figs.forEach((f, i) => f.onclick = () => show(i));
  big.onclick = () => { big.classList.remove('on'); cur = -1; };
  addEventListener('keydown', e => {
    if (cur < 0) return;
    if (e.key === 'Escape') big.onclick();
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'ArrowLeft') show(cur - 1);
  });
</script>
</body></html>
`;
  const out = join(dir, 'index.html');
  await writeFile(out, html);
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const dir = fileURLToPath(new URL('../shots', import.meta.url));
  console.log('shots index →', await writeShotsIndex(dir));
}

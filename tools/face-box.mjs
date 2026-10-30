// 상반신 그림(assets/chars/<id>_normal.png)에서 얼굴 자리를 재서 assets/face_box.json에 적는다.
// [가로 가운데, 머리 꼭대기, 얼굴 가운데 높이] (0~1). 얼굴 칸(js/render/common.js faceCrop)이 이 자리를 가운데에 둔다.
import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from './png.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'assets/chars'), out = {};
// 머리 위로 든 무기·소품·모자 때문에 자동으로는 틀리는 그림: [가로 가운데, 얼굴 가운데 높이]를 손으로 (그림을 다시 받으면 확인)
const FIX = { akane: [.54, .18], brick: [.6, .25], fukuro: [.5, .34], mariana: [.54, .42], mimimomo: [.58, .62], nerea: [.6, .32],
  sigrun: [.53, .28], zeno: [.55, .25], tomori: [.53, .38], dora: [.5, .33], eleonore: [.54, .29], noel: [.6, .4] };
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('_normal.png')).sort()) {
  const { w: W, h: H, data } = decodePng(fs.readFileSync(path.join(dir, f)));
  const step = Math.max(1, Math.floor(W / 128)), op = (x, y) => data[(y * W + x) * 4 + 3] > 60;
  let top = 0;
  find: for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (op(x, y)) { top = y; break find; }
  // 머리 둘레: 꼭대기 아래 4~20% 구간의 불투명 픽셀 가로 가운데
  let sx = 0, n = 0;
  for (let y = top + Math.round(H * .04); y < Math.min(H, top + Math.round(H * .2)); y += step) for (let x = 0; x < W; x += step) if (op(x, y)) { sx += x; n++; }
  const cx = n ? sx / n / W : .5, t = top / H;
  const id = f.replace('_normal.png', ''), fix = FIX[id];
  out[id] = fix ? [fix[0], +t.toFixed(3), fix[1]] : [+cx.toFixed(3), +t.toFixed(3), +Math.min(.6, t + .13).toFixed(3)];
}
fs.writeFileSync(path.join(root, 'assets/face_box.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`assets/face_box.json: 얼굴 ${Object.keys(out).length}개`);

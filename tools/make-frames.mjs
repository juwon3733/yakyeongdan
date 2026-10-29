// 도트 테두리(9칸 자르기) 만들기: 글자 그림 → SVG data URI → css/frame.css 의 변수.
// 화면마다 「남색 네모 + 2px 테두리」 하나로 찍어 내던 상자를 이 게임만의 틀(쇠판 + 놋쇠 리벳, 쇠·놋쇠 단추)로 바꾸려고 둔다.
// 실행: node tools/make-frames.mjs  (css/frame.css의 변수 줄만 다시 쓴다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const svg = (rows, pal) => {
  const h = rows.length, w = rows[0].length;
  let body = '';
  for (const [ch, col] of Object.entries(pal)) {
    let d = '';
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) d += `M${x} ${y}h1v1h-1z`; }));
    if (d) body += `<path fill='${col}' d='${d}'/>`;
  }
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' shape-rendering='crispEdges'>${body}</svg>`;
  return `url("data:image/svg+xml,${s.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
};

// 판(24×24, 8칸 자르기): 검은 바깥선 · 어두운 쇠 띠 · 네 귀 놋쇠 꺾쇠(L자) + 리벳 · 안쪽 가는 놋쇠 선 · 속
const PANEL = [
  '..KKKKKKKKKKKKKKKKKKKK..',
  '.KBBBBBBKMMMMMMKBBBBBBK.',
  'KBHHHHHBKMMMMMMKBHHHHHBK',
  'KBHrrBBKMMMMMMMMKBBrrHBK',
  'KBHrrBKMMMMMMMMMMKBrrHBK',
  'KBHBBKMMMMMMMMMMMMKBBHBK',
  'KBHBKMMMMMMMMMMMMMMKBHBK',
  'KBBKMMggggggggggggMMKBBK',
  'KKMMMgKKKKKKKKKKKKgMMMKK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KMMMMgKFFFFFFFFFFKgMMMMK',
  'KKMMMgKKKKKKKKKKKKgMMMKK',
  'KBBKMMggggggggggggMMKBBK',
  'KBDBKMMMMMMMMMMMMMMKBDBK',
  'KBDBBKMMMMMMMMMMMMKBBDBK',
  'KBDrrBKMMMMMMMMMMKBrrDBK',
  'KBDrrBBKMMMMMMMMKBBrrDBK',
  'KBDDDDDBKMMMMMMKBDDDDDBK',
  '.KBBBBBBKMMMMMMKBBBBBBK.',
  '..KKKKKKKKKKKKKKKKKKKK..',
];
// 단추(12×12, 4칸 자르기): 눌리는 열쇠판 — 위 밝은 선, 아래 두꺼운 어두운 턱(2px), 양끝 작은 놋쇠 못
const BTN = [
  '.KKKKKKKKKK.',
  'KHHHHHHHHHHK',
  'KHFFFFFFFFHK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KFFFFFFFFFFK',
  'KDDDDDDDDDDK',
  'KDDDDDDDDDDK',
  '.KKKKKKKKKK.',
];
const K = '#0a0810';
const v = {
  'fr-panel': svg(PANEL, { K, B: '#8a5a1c', H: '#ffd880', r: '#fff4c8', D: '#5a3a10', M: '#2a2636', g: '#6a4a1c', F: '#0e0c18' }),
  'fr-panel-gold': svg(PANEL, { K, B: '#b07a24', H: '#fff0b0', r: '#ffffff', D: '#6a4612', M: '#3a2a14', g: '#c8902c', F: '#120e14' }),
  'fr-btn': svg(BTN, { K, H: '#6e6a8e', D: '#14121e', F: '#2a2740', r: '#a8782c' }),
  'fr-btn-hi': svg(BTN, { K, H: '#a8a4c8', D: '#1c1a2a', F: '#38345a', r: '#e0b84a' }),
  'fr-btn-gold': svg(BTN, { K, H: '#fff0b0', D: '#5a3a10', F: '#a8782c', r: '#fff4c8' }),
  'fr-btn-gold-hi': svg(BTN, { K, H: '#ffffff', D: '#6a4612', F: '#c8902c', r: '#ffffff' }),
  'fr-btn-down': svg(BTN.slice(0, 1).concat(['KDDDDDDDDDDK'], BTN.slice(1, 10), ['.KKKKKKKKKK.']), { K, H: '#3a3650', D: '#14121e', F: '#221f34', r: '#6a4a1c' }),
};
const f = path.join(root, 'css/frame.css');
const css = fs.readFileSync(f, 'utf8');
const vars = `:root{\n${Object.entries(v).map(([k, u]) => `  --${k}:${u};`).join('\n')}\n}`;
const out = css.replace(/\/\* frames:begin \*\/[\s\S]*?\/\* frames:end \*\//, `/* frames:begin */\n${vars}\n/* frames:end */`);
fs.writeFileSync(f, out);
console.log('css/frame.css 테두리', Object.keys(v).length, '개');

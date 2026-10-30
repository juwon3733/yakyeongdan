// 전투 UI 도트: 글꼴 숫자 대신 직접 찍은 숫자(4×6 + 검은 테두리), 에너지 등불, 모래시계.
// 웹 글꼴 숫자·CSS 동그라미·네모 단추가 「아무 게임에나 있는 틀」로 보여서, 이 게임 도트로 그린다. 모두 인라인 SVG(crispEdges).
const D = {
  0: ['.##.', '#..#', '#..#', '#..#', '#..#', '.##.'], 1: ['.#..', '##..', '.#..', '.#..', '.#..', '###.'],
  2: ['.##.', '#..#', '...#', '..#.', '.#..', '####'], 3: ['###.', '...#', '.##.', '...#', '...#', '###.'],
  4: ['#..#', '#..#', '#..#', '####', '...#', '...#'], 5: ['####', '#...', '###.', '...#', '...#', '###.'],
  6: ['.##.', '#...', '###.', '#..#', '#..#', '.##.'], 7: ['####', '...#', '..#.', '..#.', '.#..', '.#..'],
  8: ['.##.', '#..#', '.##.', '#..#', '#..#', '.##.'], 9: ['.##.', '#..#', '#..#', '.###', '...#', '.##.'],
  '/': ['...#', '..#.', '..#.', '.#..', '.#..', '#...'], '+': ['....', '.#..', '###.', '.#..', '....', '....'],
  '-': ['....', '....', '###.', '....', '....', '....'],
  ':': ['.', '#', '.', '.', '#', '.'], '×': ['...', '#.#', '.#.', '#.#', '...', '...'],
};
// 숫자 글자들 → 도트 점 목록(글자 사이 1칸)
function cells(str) {
  const out = []; let x = 1;
  for (const ch of String(str)) {
    const g = D[ch]; if (!g) { x += 3; continue; }
    g.forEach((row, y) => [...row].forEach((c, i) => { if (c === '#') out.push([x + i, y + 1]); }));
    x += (ch === '1' ? 4 : g[0].length) + 1;
  }
  return { out, w: x, h: 8 };
}
const path = pts => pts.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('');
// 도트 숫자: 테두리(어두운 색) 위에 글자색, 한 칸 = s px. 아래쪽 반은 조금 어둡게(두 단 칠)
export function pxNum(str, { s = 2, col = '#fff4d0', low = null, edge = '#120a04', cls = '' } = {}) {
  const { out, w, h } = cells(str), set = new Set(out.map(p => p.join(',')));
  const rim = [];
  for (const [x, y] of out) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = `${x + dx},${y + dy}`; if (!set.has(k)) { set.add(k); rim.push([x + dx, y + dy]); } }
  const top = out.filter(([, y]) => y <= 3), bot = out.filter(([, y]) => y > 3);
  return `<svg class="pxn ${cls}" width="${w * s}" height="${h * s}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-label="${str}"><path fill="${edge}" d="${path(rim)}"/><path fill="${col}" d="${path(top)}"/><path fill="${low || col}" d="${path(bot)}"/></svg>`;
}
// 그림(글자 → 색) 하나를 SVG로
export function pxArt(rows, pal, s = 2, cls = '') {
  const h = rows.length, w = rows[0].length;
  const body = Object.entries(pal).map(([ch, c]) => { const pts = []; rows.forEach((r, y) => [...r].forEach((v, x) => { if (v === ch) pts.push([x, y]); })); return pts.length ? `<path fill="${c}" d="${path(pts)}"/>` : ''; }).join('');
  return `<svg class="${cls}" width="${w * s}" height="${h * s}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}
// 에너지 등불(22×30): 쇠 갓·고리, 유리 안 불꽃. 불이 꺼지면 유리가 어둡다
const LANTERN = [
  '.........KK.........', '........K..K........', '........K..K........', '......KKKKKKKK......',
  '.....KMMMMMMMMK.....', '....KMHHHHHHHHMK....', '...KKKKKKKKKKKKKK...', '...KMGGGGGGGGGGMK...',
  '...KMGGGGGGGGGGMK...', '...KMGGGGggGGGGMK...', '...KMGGGgffgGGGMK...', '...KMGGgffffgGGMK...',
  '...KMGGgfyyfgGGMK...', '...KMGgffyyffgGMK...', '...KMGgfyWWyfgGMK...', '...KMGgfyWWyfgGMK...',
  '...KMGGgfyyfgGGMK...', '...KMGGGggggGGGMK...', '...KMGGGGGGGGGGMK...', '...KKKKKKKKKKKKKK...',
  '....KMMMMMMMMMMK....', '.....KHHHHHHHHK.....', '......KKKKKKKK......',
];
export function lantern(on) {
  const pal = on ? { K: '#0a0810', M: '#4a4866', H: '#8886a8', G: '#3a2a18', g: '#c86a20', f: '#ff9a3a', y: '#ffe08a', W: '#ffffff' }
    : { K: '#0a0810', M: '#3a3850', H: '#5a5878', G: '#141220', g: '#241a24', f: '#2a1e28', y: '#2a1e28', W: '#2a1e28' };
  return pxArt(LANTERN, pal, 3, 'lant');
}
// 작은 불꽃 칸(에너지 한 칸)
const FLAME = ['..#..', '.#y#.', '#yWy#', '#yyy#', '.###.'];
export const flame = on => pxArt(FLAME, on ? { '#': '#ff9a3a', y: '#ffe08a', W: '#ffffff' } : { '#': '#3a2e3a', y: '#2a2230', W: '#2a2230' }, 2, `fl ${on ? 'on' : ''}`);
// 모래시계(턴 끝)
const GLASS = ['KKKKKKKKK', 'KBBBBBBBK', '.KsssssK.', '..KsssK..', '...KsK...', '....K....', '...K.K...', '..K.s.K..', '.K.sss.K.', 'KBBBBBBBK', 'KKKKKKKKK'];
export const hourglass = () => pxArt(GLASS, { K: '#1a0e04', B: '#c8902c', s: '#ffe08a' }, 2, 'hg');

import { S, isDawn } from '../run.js';
import { reachable, nodeTime } from '../map.js';
import { hasRelic } from '../relics.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RULES, NODE, ACT_NAME, ROW_NAME } from '../data/rules.js';
import { FOE } from '../data/enemies.js';
import { fmt, face, paceOf } from './common.js';
import { endlessHead } from './endless.js';
import { segStart } from '../endless.js';

// 가로 지도: 왼쪽(1층) → 오른쪽(꼭대기). 층 사이 선은 갈렸다 합쳐진다. 아래에 대열 고치기.
// 칸 폭 108: 아이콘(32) 옆에 이름(12px)과 「+12분 → 00:12」(9px)가 갈무리 글꼴로 잘리지 않게
const MW = 624, MH = 232, NW = 108, NH = 36;

// 칸 종류 도트 아이콘(16×16, 2배로 그림). 글자 하나 = 한 픽셀, '.'는 비움.
const ICON = {
  fight: { px: [
    '................', '.s............s.', '.ss..........ss.', '..sss......sss..', '...sss....sss...',
    '....sss..sss....', '.....ssssss.....', '......ssss......', '......ssss......', '.....ssssss.....',
    '...gg.ss.ss.gg..', '....gg....gg....', '...ggg....ggg...', '..bb........bb..', '.bb..........bb.', '................'],
    col: { s: '#dfe6f6', g: '#e0b84a', b: '#8a5a3a' } },
  elite: { px: [
    '................', '.p............p.', '.pp..........pp.', '..pp.wwwwww.pp..', '...pwwwwwwwwp...',
    '...wwwwwwwwwww..', '..wwwwwwwwwwwww.', '..ww...ww...ww..', '..ww.r.ww.r.ww..', '..wwwwwwwwwwww..',
    '...wwwww.wwwww..', '....wwwwwwwww...', '....w.w.w.w.w...', '....wwwwwwwww...', '................', '................'],
    col: { p: '#b06ae0', w: '#ece4f4', r: '#e04a6a' } },
  boss: { px: [
    '................', '................', '..g.....g.....g.', '..gg...ggg...gg.', '..ggg.ggggg.ggg.',
    '..ggggggggggggg.', '..ggggggggggggg.', '..gggrgggjgggrg.', '..ggggggggggggg.', '..ggggggggggggg.',
    '...ggggggggggg..', '................', '..rrrrrrrrrrrrr.', '..rrrrrrrrrrrrr.', '................', '................'],
    col: { g: '#e0b84a', r: '#e04a6a', j: '#7ab0d8' } },
  rest: { px: [
    '.......f........', '.......ff.......', '......fff.......', '......ffff......', '.....fffff......',
    '....fffyfff.....', '....ffyyyff.f...', '...fffyyyfff....', '...ffyyyyyff....', '....fyyyyyf.....',
    '.....fffff......', '..ll.......ll...', '...lll...lll....', '.....lllll......', '...lll...lll....', '..ll.......ll...'],
    col: { f: '#ff8a3a', y: '#ffe08a', l: '#8a5a3a' } },
  event: { px: [
    '................', '.....mmmmmm.....', '....mmmmmmmm....', '...mmm....mmm...', '...mm......mm...',
    '...........mm...', '..........mmm...', '.........mmm....', '........mmm.....', '.......mmm......',
    '.......mm.......', '.......mm.......', '................', '.......mm.......', '.......mm.......', '................'],
    col: { m: '#c9d2f0' } },
  shop: { px: [
    '................', '.....d....d.....', '......dddd......', '.......dd.......', '......oooo......',
    '....oooooooo....', '...oooooooooo...', '..oooooggooooo..', '..ooooggggoooo..', '..oooogddgoooo..',
    '..ooooggggoooo..', '..oooooggooooo..', '...oooooooooo...', '....oooooooo....', '................', '................'],
    col: { o: '#e0a050', d: '#7a4a1a', g: '#ffe08a' } },
};
const ICON_SVG = Object.fromEntries(Object.entries(ICON).map(([k, { px, col }]) => {
  const paths = Object.keys(col).map(ch => {
    let d = '';
    px.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) d += `M${x} ${y}h1v1h-1z`; }));
    return d ? `<path fill="${col[ch]}" d="${d}"/>` : '';
  }).join('');
  return [k, `<svg class="ic" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`];
}));

const LAYER = { dim: 0, open: 1, trail: 2, on: 3 };
const pos = (r, j, n, cols) => ({ x: 4 + r * ((MW - NW - 8) / (cols - 1)), y: Math.round((j + 1) * MH / (n + 1) - NH / 2) });

export function mapView() {
  const G = S.G, M = G.map, cols = M.rows.length, can = reachable(G.row);
  const P = M.rows.map((row, r) => row.map((_, j) => pos(r, j, row.length, cols)));
  // 지금 자리에서 앞으로 닿을 수 있는 칸(층마다 번호 모음)
  const reach = M.rows.map(() => new Set());
  if (G.row < cols) can.forEach(j => reach[G.row].add(j));
  for (let r = G.row; r < cols - 1; r++) reach[r].forEach(i => (M.edges[r][i] || []).forEach(j => reach[r + 1].add(j)));
  const lines = M.edges.slice(0, -1).flatMap((ed, r) => ed.flatMap((to, i) => to.map(j => {
    const a = P[r][i], b = P[r + 1][j];
    // trail = 지나온 길(금색), on = 바로 갈 수 있는 길, open = 그 너머로 이어지는 길, dim = 못 가는 길
    const trail = r + 1 < G.row && G.took[r] === i && G.took[r + 1] === j;
    const on = r + 1 === G.row && G.took[r] === i && can.includes(j);
    const open = r >= G.row && reach[r].has(i);
    const cls = trail ? 'trail' : on ? 'on' : open ? 'open' : 'dim';
    return { cls, svg: `<line x1="${a.x + NW + 2}" y1="${a.y + NH / 2}" x2="${b.x - 2}" y2="${b.y + NH / 2}" class="${cls}"/>` };
  }))).sort((x, y) => LAYER[x.cls] - LAYER[y.cls]).map(l => l.svg).join('');   // 밝은 길이 흐린 길 위에
  const nodes = M.rows.map((row, r) => row.map((t, j) => {
    const p = P[r][j], ok = r === G.row && can.includes(j), cls = r < G.row ? 'past' : ok ? 'now' : 'future';
    const name = t === 'boss' && M.boss && !G.tutorial && !G.endless ? FOE[M.boss].name : NODE[t].name;
    return `<button type="button" class="node k-${t} ${cls} ${G.took[r] === j ? 'took' : ''}" style="left:${p.x}px;top:${p.y}px;width:${NW}px;height:${NH}px" ${ok ? `data-node="${r},${j}"` : 'disabled'}>
      ${ICON_SVG[t] || ''}<span class="tx"><span class="t ${name.length > 5 ? 'long' : ''}">${name}</span><span class="m">+${nodeTime(t)}분${ok ? ` → <b class="pace ${G.tutorial ? '' : G.endless ? '' : paceOf(G, G.clock + nodeTime(t), 1)}">${fmt(G.clock + nodeTime(t))}</b>` : ''}</span></span></button>`;
  }).join('')).join('');
  const labels = M.rows.map((row, r) => `<span class="rowlabel" style="left:${P[r][0].x}px">${r === cols - 1 ? (G.endless ? '관문' : '꼭대기') : `${G.endless ? segStart() + r : r + 1}층`}</span>`).join('');
  // 대열 칸: 왼쪽→오른쪽 = 뒤·가운데·앞
  const slots = [2, 1, 0].map(fi => {
    const p = G.formation[fi], c = CHARACTERS[p], Mb = G.members[p];
    return `<button type="button" class="slot ${G.fsel === fi ? 'sel' : ''}" style="--c:${c.col}" data-slot="${fi}">
      <span class="row">${ROW_NAME[fi]}</span>${face(p)}<span class="nm">${c.name}</span><span class="hp">${Mb.hp}/${Mb.max}</span></button>`;
  }).join('');
  const peek = hasRelic('star_map') && G.nextMap
    ? `<span class="note peek">별 지도 · 다음 막: ${G.nextMap.rows.slice(0, -1).map(row => row.map(t => NODE[t].name).join('·')).join(' / ')}${G.nextMap.boss ? ` / 보스 <b>${FOE[G.nextMap.boss].name}</b>` : ''}</span>` : '';
  const head = G.note ? `<span class="banner ok">${G.note}</span>`
    : G.endless ? `<span class="note">탑은 무너지지 않는다 · 대신 층마다 적이 강해지고, 밤 시계가 흐를수록 여명이 짙어진다</span>`
    : isDawn() ? `<span class="banner">해가 떴다 · 적이 힘 +${RULES.dawnStartStr}으로 시작, 매 턴 +${RULES.dawnStrPerTurn} · ${fmt(RULES.collapse)}에 탑이 무너진다</span>`
    : `<span class="note">달: <b>${MOONS[G.moon].name}</b> · ${MOONS[G.moon].text}</span>`;
  return `<div class="mapwrap">
      <div class="maphead"><h2>${G.endless ? endlessHead(G) : ACT_NAME[G.act]}</h2>${head}${peek}</div>
      <div class="mapgrid" style="width:${MW}px;height:${MH}px">
        <svg class="edges" width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}" shape-rendering="crispEdges" aria-hidden="true">${lines}</svg>${labels}${nodes}</div>
      <div class="mapfoot">
        <div class="formation"><span class="lbl">대열<br><small>두 칸을 눌러 자리 바꾸기</small></span>${slots}<span class="enemy-side" data-tip="오른쪽이 적 쪽. 앞줄이 먼저 맞는다(적마다 노림이 다르다).">적은 이쪽 ›</span></div>
      </div>
    </div>`;
}

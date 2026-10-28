import { S, isDawn } from '../run.js';
import { reachable, nodeTime } from '../map.js';
import { hasRelic } from '../relics.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RULES, NODE, ACT_NAME, ROW_NAME } from '../data/rules.js';
import { fmt, face, paceOf } from './common.js';

// 가로 지도: 왼쪽(1층) → 오른쪽(꼭대기). 층 사이 선은 갈렸다 합쳐진다. 아래에 대열 고치기.
const MW = 624, MH = 232, NW = 100, NH = 36;
const pos = (r, j, n, cols) => ({ x: 4 + r * ((MW - NW - 8) / (cols - 1)), y: Math.round((j + 1) * MH / (n + 1) - NH / 2) });

export function mapView() {
  const G = S.G, M = G.map, cols = M.rows.length, can = reachable(G.row);
  const P = M.rows.map((row, r) => row.map((_, j) => pos(r, j, row.length, cols)));
  const lines = M.edges.slice(0, -1).flatMap((ed, r) => ed.flatMap((to, i) => to.map(j => {
    const a = P[r][i], b = P[r + 1][j];
    const on = G.took[r] === i && (G.took[r + 1] === j || (r + 1 === G.row && can.includes(j)));
    return `<line x1="${a.x + NW}" y1="${a.y + NH / 2}" x2="${b.x}" y2="${b.y + NH / 2}" class="${on ? 'on' : r < G.row - 1 ? 'past' : ''}"/>`;
  }))).join('');
  const nodes = M.rows.map((row, r) => row.map((t, j) => {
    const p = P[r][j], ok = r === G.row && can.includes(j), cls = r < G.row ? 'past' : ok ? 'now' : 'future';
    return `<button type="button" class="node k-${t} ${cls} ${G.took[r] === j ? 'took' : ''}" style="left:${p.x}px;top:${p.y}px" ${ok ? `data-node="${r},${j}"` : 'disabled'}>
      <span class="t">${NODE[t].name}</span><span class="m">+${nodeTime(t)}분${ok ? ` → <b class="pace ${G.tutorial ? '' : paceOf(G, G.clock + nodeTime(t), 1)}">${fmt(G.clock + nodeTime(t))}</b>` : ''}</span></button>`;
  }).join('')).join('');
  const labels = M.rows.map((row, r) => `<span class="rowlabel" style="left:${P[r][0].x}px">${r === cols - 1 ? '꼭대기' : `${r + 1}층`}</span>`).join('');
  // 대열 칸: 왼쪽→오른쪽 = 뒤·가운데·앞
  const slots = [2, 1, 0].map(fi => {
    const p = G.formation[fi], c = CHARACTERS[p], Mb = G.members[p];
    return `<button type="button" class="slot ${G.fsel === fi ? 'sel' : ''}" style="--c:${c.col}" data-slot="${fi}">
      <span class="row">${ROW_NAME[fi]}</span>${face(p)}<span class="nm">${c.name}</span><span class="hp">${Mb.hp}/${Mb.max}</span></button>`;
  }).join('');
  const peek = hasRelic('star_map') && G.nextMap
    ? `<span class="note peek">별 지도 · 다음 막: ${G.nextMap.rows.slice(0, -1).map(row => row.map(t => NODE[t].name).join('·')).join(' / ')}</span>` : '';
  const head = G.note ? `<span class="banner ok">${G.note}</span>`
    : isDawn() ? `<span class="banner">해가 떴다 · 적이 힘 +${RULES.dawnStartStr}으로 시작, 매 턴 +${RULES.dawnStrPerTurn} · ${fmt(RULES.collapse)}에 탑이 무너진다</span>`
    : `<span class="note">달: <b>${MOONS[G.moon].name}</b> · ${MOONS[G.moon].text}</span>`;
  return `<div class="mapwrap">
      <div class="maphead"><h2>${ACT_NAME[G.act]}</h2>${head}${peek}</div>
      <div class="mapgrid" style="width:${MW}px;height:${MH}px">
        <svg class="edges" width="${MW}" height="${MH}" aria-hidden="true">${lines}</svg>${labels}${nodes}</div>
      <div class="mapfoot">
        <div class="formation"><span class="lbl">대열<br><small>두 칸을 눌러 자리 바꾸기</small></span>${slots}<span class="enemy-side" data-tip="오른쪽이 적 쪽. 앞줄이 먼저 맞는다(적마다 노림이 다르다).">적은 이쪽 ›</span></div>
      </div>
    </div>`;
}

import { S } from '../run.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RULES, NODE, ACT_NAME, ROW_NAME } from '../data/rules.js';
import { fmt, face } from './common.js';

// 가로 지도: 왼쪽(1층) → 오른쪽(꼭대기). 아래에 대열 고치기.
export function mapView() {
  const G = S.G;
  const cols = G.map.map((row, r) => {
    const cls = r < G.row ? 'past' : r > G.row ? 'future' : 'now';
    const nodes = row.map((t, i) => `<button type="button" class="node k-${t} ${G.took[r] === i ? 'took' : ''}" ${cls === 'now' ? `data-node="${r},${i}"` : 'disabled'}>
      <span class="t">${NODE[t].name}</span><span class="m">+${NODE[t].min}분${cls === 'now' ? ` → ${fmt(G.clock + NODE[t].min)}` : ''}</span></button>`).join('');
    return `<div class="col ${cls}"><div class="rowlabel">${r === G.map.length - 1 ? '꼭대기' : `${r + 1}층`}</div>${nodes}</div>`;
  }).join('<span class="arrow" aria-hidden="true">›</span>');
  // 대열 칸: 왼쪽→오른쪽 = 뒤·가운데·앞
  const slots = [2, 1, 0].map(fi => {
    const p = G.formation[fi], c = CHARACTERS[p], M = G.members[p];
    return `<button type="button" class="slot ${G.fsel === fi ? 'sel' : ''}" style="--c:${c.col}" data-slot="${fi}">
      <span class="row">${ROW_NAME[fi]}</span>${face(p)}<span class="nm">${c.name}</span><span class="hp">${M.hp}/${M.max}</span></button>`;
  }).join('');
  return `<div class="mapwrap">
      <div class="maphead"><h2>${ACT_NAME[G.act]}</h2>
        ${G.clock >= RULES.dawn ? `<span class="banner">해가 떴다 · 적이 매 턴 힘 +${RULES.dawnStrPerTurn}</span>` : `<span class="note">달: <b>${MOONS[G.moon].name}</b> · ${MOONS[G.moon].text}</span>`}</div>
      <div class="map">${cols}</div>
      <div class="mapfoot">
        <div class="formation"><span class="lbl">대열<br><small>두 칸을 눌러 자리 바꾸기</small></span>${slots}<span class="enemy-side">적 ›</span></div>
      </div>
    </div>`;
}

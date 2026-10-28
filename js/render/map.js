import { S } from '../run.js';
import { MOONS } from '../data/moons.js';
import { RULES, NODE, ACT_NAME } from '../data/rules.js';
import { fmt } from './common.js';

export function mapView() {
  const G = S.G;
  const rows = G.map.map((row, r) => {
    const cls = r < G.row ? 'past' : r > G.row ? 'future' : 'now';
    const nodes = row.map((t, i) => `<button type="button" class="node k-${t} ${G.took[r] === i ? 'took' : ''}" ${cls === 'now' ? `data-node="${r},${i}"` : 'disabled'}>
      <span class="t">${NODE[t].name}</span><span class="m">+${NODE[t].min}분${cls === 'now' ? ` → ${fmt(G.clock + NODE[t].min)}` : ''}</span></button>`).join('');
    return `<div class="rowlabel">${r === G.map.length - 1 ? '꼭대기' : `${r + 1}층`}</div><div class="row ${cls}">${nodes}</div>`;
  }).reverse().join('');
  return `<h2>${ACT_NAME[G.act]}</h2>
    ${G.clock >= RULES.dawn ? `<div class="banner">해가 떴다. 적이 매 턴 힘 +${RULES.dawnStrPerTurn}.</div>` : ''}
    <p class="note">아래에서 위로 오릅니다. 지금 층에서 칸 하나를 고르세요. 달: <b>${MOONS[G.moon].name}</b> · ${MOONS[G.moon].text}</p>
    <div class="map">${rows}</div>
    <div class="acts"><button type="button" data-deck>덱 보기 (${G.deck.length}장)</button></div>`;
}

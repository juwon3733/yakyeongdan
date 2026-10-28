// 지도 생성·이동·시간 계산, 사건·휴식 처리.
import { S, addTime, rewind, healAll, member, swapFormation } from './run.js';
import { startCombat, rewardCards } from './combat.js';
import { FOES } from './data/enemies.js';
import { EVENTS } from './data/events.js';
import { RULES, NODE } from './data/rules.js';

export function makeMap(rng) {
  const rows = [['fight', 'fight']];
  for (let r = 1; r < RULES.mapRows; r++) {
    const n = 2 + rng.int(2), row = [];
    for (let i = 0; i < n; i++) {
      let x = rng.next(), t = RULES.mapWeights[RULES.mapWeights.length - 1][0];
      for (const [k, w] of RULES.mapWeights) { if (x < w) { t = k; break; } x -= w; }
      row.push(t);
    }
    rows.push(row);
  }
  rows.push(['boss']);
  return rows;
}

export function goNode(r, i) {
  const G = S.G, t = G.map[r][i];
  if (r !== G.row) return;
  G.took[r] = i;
  addTime(NODE[t].min);
  const pool = FOES[G.act];
  if (t === 'fight') startCombat(G.rng.pick(pool.fight), 'fight');
  else if (t === 'elite') startCombat(pool.elite, 'elite');
  else if (t === 'boss') startCombat(pool.boss, 'boss');
  else if (t === 'rest') G.screen = 'rest';
  else { G.event = G.rng.pick(EVENTS); G.screen = 'event'; }
}

export function nextRow() { S.G.row++; S.G.screen = 'map'; }
export function nextAct() { const G = S.G; G.act++; G.row = 0; G.took = []; G.map = makeMap(G.rng); G.screen = 'map'; }

export function takeReward(id) {
  const G = S.G;
  if (id) G.deck.push(id);
  G.reward.next === 'act' ? nextAct() : nextRow();
}

// 휴식: 쉬기 = 각자 최대 체력의 일정 비율(쓰러졌던 동료는 더), 낮잠 = 시간 되찾기
export function rest(kind) {
  const R = RULES.rest, G = S.G;
  if (kind === 'heal') for (const p of G.party) {
    const m = member(p);
    m.hp = Math.min(m.max, m.hp + Math.ceil(m.max * (m.wasDown ? R.downHealPct : R.healPct)));
    m.wasDown = false;
  }
  else rewind(R.napTime);
  nextRow();
}

// 지도에서 대열 바꾸기: 한 칸 누르고 다른 칸 누르면 자리를 맞바꾼다 (자유)
export function pickSlot(i) {
  const G = S.G;
  if (G.fsel === null || G.fsel === undefined) G.fsel = i;
  else { if (G.fsel !== i) swapFormation(G.fsel, i); G.fsel = null; }
}

const eventApi = {
  heal: n => healAll(n), addTime: m => addTime(m), rewind: m => rewind(m),
  loseHp: n => { for (const p of S.G.party) { const m = member(p); if (!m.down) m.hp = Math.max(1, m.hp - n); } },
  maxHp: n => { for (const p of S.G.party) { const m = member(p); m.max += n; if (!m.down) m.hp += n; } },
  addRandomCard: () => { S.G.deck.push(rewardCards()[0]); },
  removeCard: () => { S.G.screen = 'remove'; return true; },
};
export function chooseOpt(i) {
  const stay = S.G.event.opts[i].f(eventApi);
  if (!stay) nextRow();
}
export function removeCard(i) { S.G.deck.splice(i, 1); nextRow(); }

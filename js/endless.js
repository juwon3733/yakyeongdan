// 끝없는 탑 (docs/05_meta.md §12, 수치 js/data/endless.js).
// 「새벽」을 깬 판에서 [더 오르기]로 이어 오르거나, 본부에서 새로 시작한다. 판 상태는 S.G.endless.
// 엔진에 붙는 곳: map.js goNode(층 세기·무리·관문)·nextRow·nextAct(다음 층 묶음), combat.js startCombat(체력)·makeFoe(힘),
// run.js checkCollapse(7시 붕괴 없음). 화면은 render/endless.js.
import { S, gainRelic, gainGold } from './run.js';
import { makeMap } from './map.js';
import { pickElite } from './run.js';
import { RULES } from './data/rules.js';
import { CARDS } from './data/cards.js';
import { ENDLESS, isBossGate, mergeMods } from './data/endless.js';
import { rollRelic } from './relics.js';

// 이어 오르기(fresh = false: 「새벽」을 깬 판 그대로) 또는 새로 시작(fresh = true: 방금 만든 판에 덤을 얹어)
export function enterEndless(fresh = false) {
  const G = S.G; if (!G || G.endless) return;
  G.endless = { floor: 0, seg: 0, rules: [], startClock: G.clock, fresh, dawnWon: !!G.won, bosses: 0, granted: null, baseMods: G.mods || null };
  G.won = false; G.why = null; G.act = 4; G.nextMap = null;
  // 탑 위로 오르기 전 숨 돌리기: 쓰러진 동료는 일어나고, 모두 최대 체력의 entryHeal만큼 회복
  for (const p of G.party) { const m = G.members[p]; if (m.down) { m.down = false; m.hp = 1; } m.hp = Math.min(m.max, m.hp + Math.ceil(m.max * ENDLESS.entryHeal)); }
  if (fresh) {
    for (const p of G.party) {
      // 희귀 카드(아직 안 열린 카드 묶음이면 보통 카드로)
      const mine = Object.keys(CARDS).filter(id => CARDS[id].ch === p && !G.locked?.has(id));
      const pool = mine.filter(id => CARDS[id].rarity === 'r'), alt = mine.filter(id => CARDS[id].rarity === 'u');
      const L = pool.length ? pool : alt; if (L.length) G.deck.push(G.rng.pick(L));
    }
    for (let k = 0; k < ENDLESS.freshRelics; k++) { const r = rollRelic(G.rng, ['c', 'u']); if (r) gainRelic(r); }
    gainGold(ENDLESS.freshGold);
  }
  nextSegment();
}

// 다음 층 묶음: 규칙 하나 쌓고, 지도 4층 + 관문(강적, 10층마다 보스)
export function nextSegment() {
  const G = S.G, E = G.endless;
  E.seg++;
  if (E.seg > 1) for (const p of G.party) { const m = G.members[p]; if (!m.down) m.hp = Math.min(m.max, m.hp + Math.ceil(m.max * ENDLESS.segHeal)); }
  const used = new Set(E.rules), left = ENDLESS.rules.filter(r => !used.has(r.id));
  const rule = G.rng.pick(left.length ? left : ENDLESS.rules);
  E.rules.push(rule.id);
  G.mods = mergeMods([E.baseMods, ...E.rules.map(id => ENDLESS.rules.find(r => r.id === id).mods)]);
  const map = makeMap(G.rng, G.moon), gate = E.seg * ENDLESS.seg;
  map.rows[map.rows.length - 1] = [isBossGate(gate) ? 'boss' : 'elite'];
  G.map = map; G.row = 0; G.took = []; G.nextElite = pickElite();
  G.screen = 'map'; G.note = `${gate - ENDLESS.seg + 1}~${gate}층 · 새 규칙: ${rule.name}`;
}

// 지금 층 수 (지도에서 고른 칸마다 +1, map.js goNode)
export const endlessFloor = () => S.G?.endless?.floor || 0;
// 이 층 묶음의 첫 층 번호
export const segStart = () => (S.G.endless.seg - 1) * ENDLESS.seg + 1;
// 여명 게이지: 들어선 뒤 흐른 밤 시계 / dawnMin
export const dawnStacks = () => { const E = S.G?.endless; return E ? Math.max(0, Math.floor((S.G.clock - E.startClock) / ENDLESS.dawnMin)) : 0; };
// 적 강화 (combat.js가 부른다)
export const endlessHp = kind => (ENDLESS.baseHp[kind] || RULES.foeHpMul?.[3]?.[kind] || 1) * (1 + endlessFloor() * ENDLESS.hpPerFloor);
export const endlessStr = () => Math.floor(endlessFloor() * ENDLESS.strPerFloor) + dawnStacks();
export const endlessRules = () => (S.G?.endless?.rules || []).map(id => ENDLESS.rules.find(r => r.id === id)).filter(Boolean);

// 전투 엔진: 턴, 손패, 적 의도·노림, 동료별 체력·방어, 대열, 쓰러짐, 연계·듀오, 패시브.
import { S, addTime, timeCost, logMsg, isDawn, member, alive, living, swapFormation } from './run.js';
import { effects as E, draw } from './effects.js';
import { CARDS, DUOS, duoKey } from './data/cards.js';
import { CHARACTERS } from './data/characters.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';

let uid = 1;

// 쓰러진 동료의 패시브는 꺼진다. 훅 안의 효과는 그 동료 자신에게.
function passives(hook, ...args) {
  const C = S.C;
  for (const p of S.G.party) {
    const h = CHARACTERS[p].passive?.[hook];
    if (!h || !alive(p)) continue;
    const prev = C.actor; C.actor = p;
    h(C, ...args, E);
    C.actor = prev;
  }
}

export function startCombat(def, kind) {
  const G = S.G;
  const C = S.C = {
    kind, def,
    foe: { ...def, hp: def.hp, max: def.hp, pi: 0, block: 0, str: 0, poison: 0, weak: 0 },
    draw: G.rng.shuffle(G.deck.map(id => ({ uid: uid++, id }))), hand: [], disc: [],
    energy: RULES.energy, blocks: Object.fromEntries(G.party.map(p => [p, 0])),
    actor: null, target: null, lastHitter: null, pending: null, swaps: 0,
    chain: 0, last: null, bonus: 0,
    loaded: 0, mana: 0, asleep: false, counter: 0, slashes: 0, duoUsed: new Set(),
    turn: 0, log: [],
  };
  // 데이터의 c.block = 지금 효과를 내는 동료의 방어
  Object.defineProperty(C, 'block', {
    get() { return C.actor ? C.blocks[C.actor] : 0; },
    set(v) { if (C.actor) C.blocks[C.actor] = v; },
  });
  G.screen = 'combat';
  startTurn();
}

function startTurn() {
  const C = S.C;
  C.turn++;
  for (const p in C.blocks) C.blocks[p] = 0;
  C.energy = RULES.energy; C.chain = 0; C.last = null; C.slashes = 0; C.counter = 0; C.swaps = 0; C.pending = null;
  C.duoUsed.clear();
  if (C.asleep && alive('noel')) C.mana += 3 + E.dark();
  if (isDawn()) { C.foe.str += RULES.dawnStrPerTurn; logMsg(`<b>새벽</b>: 적의 힘 +${RULES.dawnStrPerTurn}`); }
  if (C.turn === 1) passives('onCombatStart');
  passives('onTurnStart');
  draw(RULES.handSize);
}

export const intentOf = f => f.pat[f.pi % f.pat.length];
const intentHits = it => it.t === 'atk' || it.t === 'mix';
export function intentText(f) {
  const it = intentOf(f), v = Math.floor((it.v + f.str) * (f.weak ? .75 : 1));
  if (it.t === 'atk') return `공격 ${v}${it.n > 1 ? '×' + it.n : ''}`;
  if (it.t === 'blk') return `방어 ${it.v}`;
  if (it.t === 'buf') return `힘 +${it.v}`;
  return `공격 ${v} · 방어 ${it.b}`;
}

// 적의 단일 공격이 노리는 동료 (살아 있는 동료 중)
export function aimTarget(f = S.C.foe) {
  const L = living(); if (!L.length) return null;
  const a = f.aim || RULES.defaultAim;
  if (a === 'back') return L[L.length - 1];
  if (a === 'weakest') return L.reduce((x, y) => member(y).hp < member(x).hp ? y : x);
  if (a === 'last' && S.C.lastHitter && alive(S.C.lastHitter)) return S.C.lastHitter;
  return L[0];
}
// 지금 의도가 공격이면 노리는 동료, 아니면 null (화면 표시용)
export const aimShown = () => intentHits(intentOf(S.C.foe)) ? aimTarget() : null;

function enemyHit(v) {
  const C = S.C, f = C.foe, id = aimTarget(f);
  if (!id) return;
  const m = member(id), nm = CHARACTERS[id].name;
  let d = Math.floor((v + f.str) * (f.weak ? .75 : 1));
  const b = Math.min(C.blocks[id], d); C.blocks[id] -= b; d -= b; m.hp = Math.max(0, m.hp - d);
  logMsg(`${f.name} → ${nm}: 피해 <b>${d}</b>${b ? ` (방어 ${b} 막음)` : ''}`);
  if (id === 'marta' && C.counter > 0) { f.hp = Math.max(0, f.hp - C.counter); logMsg(`마르타의 반격 <b>${C.counter}</b>`); }
  if (m.hp <= 0) { m.down = true; m.wasDown = true; logMsg(`<b>${nm} 쓰러짐</b> · 카드를 쓸 수 없다`); }
}

export function cardDef(inst) {
  if (inst.duo) {
    const [a, b] = inst.duo.split('+'), D = DUOS[inst.duo];
    return { ch: 'duo', a, b, name: D.name, cost: 0, atk: 1, text: D.text, play: D.play, target: D.target };
  }
  return CARDS[inst.id];
}

// 카드를 내는 동료: 보통 카드는 주인, 듀오는 둘 중 살아 있고 앞에 선 사람
export function actorOf(d) {
  if (d.ch !== 'duo') return alive(d.ch) ? d.ch : null;
  return living().find(p => p === d.a || p === d.b) || null;
}
export const usable = inst => { const d = cardDef(inst); return !!actorOf(d) && S.C.energy >= d.cost; };
export const needsAlly = inst => cardDef(inst).target === 'ally';

// 카드를 쓴다. ally = 'ally' 카드에서 고른 동료. 돌려주는 값: { duo } (새로 생긴 듀오 키) — 컷인은 화면 쪽에서.
export function playCard(id, ally) {
  const C = S.C, G = S.G;
  const i = C.hand.findIndex(h => h.uid === id); if (i < 0) return {};
  const inst = C.hand[i], d = cardDef(inst), who = actorOf(d);
  if (!who) { logMsg('쓰러진 동료의 카드는 쓸 수 없다.'); return {}; }
  if (C.energy < d.cost) { logMsg('에너지가 모자라.'); return {}; }
  if (d.target === 'ally' && !(ally && alive(ally))) return { needAlly: true };
  C.energy -= d.cost;
  C.hand.splice(i, 1);
  C.pending = null;
  if (d.time) { const t = timeCost(); addTime(t); logMsg(`시간을 썼다: <b>+${t}분</b>`); }
  let duo = null;
  if (!inst.duo) {
    if (C.last && C.last !== d.ch) {
      C.chain = Math.min(RULES.chainMax, C.chain + 1);
      const k = duoKey(C.last, d.ch), need = MOONS[G.moon].duoNeed ?? RULES.duoNeed;
      if (C.chain >= need && DUOS[k] && !C.duoUsed.has(k)) { C.duoUsed.add(k); duo = k; }
    } else if (C.last === d.ch) C.chain = 0;
    C.last = d.ch;
  }
  C.actor = who; C.target = d.target === 'ally' ? ally : who;
  C.bonus = d.atk ? C.chain : 0;
  passives('beforeCard', d);
  d.play(C, E);
  C.bonus = 0; C.actor = null; C.target = null;
  if (!inst.duo) C.disc.push(inst);
  if (duo) { C.hand.push({ uid: uid++, duo, id: 'duo:' + duo }); G.duos++; }
  if (C.foe.hp <= 0) winCombat();
  return { duo };
}

// 전투 중 대열 바꾸기: formation[i] ↔ [i+1], 턴마다 RULES.swapsPerTurn번, 바꾼 둘 방어 감소
export function swapInCombat(i) {
  const C = S.C, F = S.G.formation;
  if (C.swaps >= RULES.swapsPerTurn || i < 0 || i + 1 >= F.length) return false;
  swapFormation(i, i + 1); C.swaps++;
  for (const p of [F[i], F[i + 1]]) C.blocks[p] = Math.max(0, C.blocks[p] - RULES.swapBlockCost);
  logMsg(`대열을 바꿨다: ${CHARACTERS[F[i]].name} ↔ ${CHARACTERS[F[i + 1]].name}`);
  return true;
}

export function endTurn() {
  const C = S.C, f = C.foe;
  for (const h of C.hand) if (!h.duo) C.disc.push(h);
  C.hand = []; C.pending = null;
  if (f.poison > 0) { f.hp = Math.max(0, f.hp - f.poison); logMsg(`독 피해 <b>${f.poison}</b>`); f.poison--; if (f.hp <= 0) return winCombat(); }
  f.block = 0;
  const it = intentOf(f);
  if (it.t === 'atk') for (let k = 0; k < it.n; k++) enemyHit(it.v);
  else if (it.t === 'blk') { f.block += it.v; logMsg(`${f.name}이(가) 방어 ${it.v}`); }
  else if (it.t === 'buf') { f.str += it.v; logMsg(`${f.name}의 힘 +${it.v}`); }
  else { enemyHit(it.v); f.block += it.b; }
  f.pi++; if (f.weak > 0) f.weak--;
  if (f.hp <= 0) return winCombat();
  if (!living().length) return endRun(false);
  startTurn();
}

export function rewardCards() {
  const G = S.G, pool = Object.keys(CARDS).filter(id => G.party.includes(CARDS[id].ch));
  const rw = pool.filter(id => CARDS[id].reward);
  return G.rng.pickN(rw.concat(G.rng.pickN(pool.filter(id => !CARDS[id].reward), 2)), 3);
}

function winCombat() {
  const G = S.G, k = S.C.kind;
  G.fights++; S.C = null;
  // 쓰러진 동료는 전투가 끝나면 체력 1로 일어난다
  for (const p of G.party) { const m = member(p); if (m.down) { m.down = false; m.hp = RULES.reviveHp; } }
  if (k === 'boss') {
    if (G.act === 3) return endRun(true);
    G.reward = { cards: rewardCards(), next: 'act' };
  } else G.reward = { cards: rewardCards(), next: 'map', bonus: k === 'elite' ? RULES.eliteHeal : 0 };
  if (G.reward.bonus) for (const p of G.party) { const m = member(p); m.hp = Math.min(m.max, m.hp + G.reward.bonus); }
  G.screen = 'reward';
}

export function endRun(won) { S.C = null; S.G.won = won; S.G.screen = 'result'; }

// 전투 엔진: 턴, 손패, 적 의도, 상태, 연계·듀오, 패시브.
import { S, addTime, timeCost, logMsg, isDawn } from './run.js';
import { effects as E, draw } from './effects.js';
import { CARDS, DUOS, duoKey } from './data/cards.js';
import { CHARACTERS } from './data/characters.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';

let uid = 1;

function passives(hook, ...args) {
  for (const p of S.G.party) CHARACTERS[p].passive?.[hook]?.(S.C, ...args, E);
}

export function startCombat(def, kind) {
  const G = S.G;
  S.C = {
    kind, def,
    foe: { ...def, hp: def.hp, max: def.hp, pi: 0, block: 0, str: 0, poison: 0, weak: 0 },
    draw: G.rng.shuffle(G.deck.map(id => ({ uid: uid++, id }))), hand: [], disc: [],
    energy: RULES.energy, block: 0, chain: 0, last: null, bonus: 0,
    loaded: 0, mana: 0, asleep: false, counter: 0, slashes: 0, duoUsed: new Set(),
    turn: 0, log: [],
  };
  G.screen = 'combat';
  startTurn();
}

function startTurn() {
  const C = S.C;
  C.turn++;
  C.block = 0; C.energy = RULES.energy; C.chain = 0; C.last = null; C.slashes = 0; C.counter = 0; C.duoUsed.clear();
  if (C.asleep) C.mana += 3 + E.dark();
  if (isDawn()) { C.foe.str += RULES.dawnStrPerTurn; logMsg(`<b>새벽</b>: 적의 힘 +${RULES.dawnStrPerTurn}`); }
  if (C.turn === 1) passives('onCombatStart');
  passives('onTurnStart');
  draw(RULES.handSize);
}

export const intentOf = f => f.pat[f.pi % f.pat.length];
export function intentText(f) {
  const it = intentOf(f), v = Math.floor((it.v + f.str) * (f.weak ? .75 : 1));
  if (it.t === 'atk') return `공격 ${v}${it.n > 1 ? '×' + it.n : ''}`;
  if (it.t === 'blk') return `방어 ${it.v}`;
  if (it.t === 'buf') return `힘 +${it.v}`;
  return `공격 ${v} · 방어 ${it.b}`;
}

function hurtParty(v) {
  const C = S.C, G = S.G, f = C.foe;
  let d = Math.floor((v + f.str) * (f.weak ? .75 : 1));
  const b = Math.min(C.block, d); C.block -= b; d -= b; G.hp = Math.max(0, G.hp - d);
  logMsg(`${f.name}의 공격: 피해 <b>${d}</b>${b ? ` (방어 ${b} 막음)` : ''}`);
  if (C.counter > 0) { f.hp = Math.max(0, f.hp - C.counter); logMsg(`마르타의 반격 <b>${C.counter}</b>`); }
}

export function cardDef(inst) {
  if (inst.duo) {
    const [a, b] = inst.duo.split('+'), D = DUOS[inst.duo];
    return { ch: 'duo', a, b, name: D.name, cost: 0, atk: 1, text: D.text, play: D.play };
  }
  return CARDS[inst.id];
}

// 카드를 쓴다. 돌려주는 값: { duo } (새로 생긴 듀오 키) — 컷인은 화면 쪽에서.
export function playCard(id) {
  const C = S.C, G = S.G;
  const i = C.hand.findIndex(h => h.uid === id); if (i < 0) return {};
  const inst = C.hand[i], d = cardDef(inst);
  if (C.energy < d.cost) { logMsg('에너지가 모자라.'); return {}; }
  C.energy -= d.cost;
  C.hand.splice(i, 1);
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
  C.bonus = d.atk ? C.chain : 0;
  passives('beforeCard', d);
  d.play(C, E);
  C.bonus = 0;
  if (!inst.duo) C.disc.push(inst);
  if (duo) { C.hand.push({ uid: uid++, duo, id: 'duo:' + duo }); G.duos++; }
  if (C.foe.hp <= 0) winCombat();
  return { duo };
}

export function endTurn() {
  const C = S.C, G = S.G, f = C.foe;
  for (const h of C.hand) if (!h.duo) C.disc.push(h);
  C.hand = [];
  if (f.poison > 0) { f.hp = Math.max(0, f.hp - f.poison); logMsg(`독 피해 <b>${f.poison}</b>`); f.poison--; if (f.hp <= 0) return winCombat(); }
  f.block = 0;
  const it = intentOf(f);
  if (it.t === 'atk') for (let k = 0; k < it.n; k++) hurtParty(it.v);
  else if (it.t === 'blk') { f.block += it.v; logMsg(`${f.name}이(가) 방어 ${it.v}`); }
  else if (it.t === 'buf') { f.str += it.v; logMsg(`${f.name}의 힘 +${it.v}`); }
  else { hurtParty(it.v); f.block += it.b; }
  f.pi++; if (f.weak > 0) f.weak--;
  if (f.hp <= 0) return winCombat();
  if (G.hp <= 0) return endRun(false);
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
  if (k === 'boss') {
    if (G.act === 3) return endRun(true);
    G.reward = { cards: rewardCards(), next: 'act' };
  } else G.reward = { cards: rewardCards(), next: 'map', bonus: k === 'elite' ? RULES.eliteHeal : 0 };
  if (G.reward.bonus) G.hp = Math.min(G.maxHp, G.hp + G.reward.bonus);
  G.screen = 'reward';
}

export function endRun(won) { S.C = null; S.G.won = won; S.G.screen = 'result'; }

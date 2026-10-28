// 카드·패시브가 쓰는 효과 도우미. 데이터는 이 함수들만 부른다.
// C.actor = 지금 효과를 내는 동료(카드 주인, 패시브 주인), C.target = 'ally' 카드에서 고른 동료,
// C.tf = 고른 적의 번호. 피해 계산은 combat.js의 dmgToFoe가 한다.
import { S, healMember, member, alive, living, logMsg, addTime as runAddTime, rewind as runRewind, gainGold } from './run.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { CHARACTERS } from './data/characters.js';
import { canUpgrade } from './data/cards.js';
import { dmgToFoe, foeTarget, livingFoes, killCheck, intentOf, newInst, cardDef } from './combat.js';

// 달 보너스(보름달: 아이리스·마르타 피해·방어 +2)는 효과를 내는 동료 기준으로 자동으로 붙는다.
const boost = () => MOONS[S.G.moon].boost?.[S.C.actor] || 0;
const passiveSum = k => S.G.party.reduce((t, p) => t + (alive(p) ? CHARACTERS[p].passive?.[k] || 0 : 0), 0);

// 피해를 주고, 실제로 들어간 피해를 돌려준다. pierce = 적의 방어 무시
export function hit(n, f = foeTarget(), pierceBlock = false) {
  const C = S.C; if (!f || f.dead) return 0;
  const d = dmgToFoe(f, n + C.bonus + boost(), C.actor, pierceBlock); C.bonus = 0;
  if (C.actor) { f.lastHitter = C.actor; stat(C.actor, 'dmg', d.dealt); }
  logMsg(`${f.name}에게 피해 <b>${d.dealt}</b>${d.blocked ? ` (방어 ${d.blocked} 막힘)` : ''}${d.bleed ? ` · 출혈 ${d.bleed}` : ''}`);
  if (C.burnAll > 0 && C.atkCard) f.burn += C.burnAll;
  killCheck(f);
  return d.dealt;
}
// 결과 화면 MVP용: 동료마다 준 피해·쌓은 방어
function stat(id, k, n) { const st = S.G.stats[id]; if (st && n > 0) st[k] += n; }
export function hitAll(n) {
  const C = S.C, b = C.bonus;
  for (const f of livingFoes()) { C.bonus = b; hit(n, f); }
  C.bonus = 0;
}
export function hitRandom(n) { const L = livingFoes(); if (L.length) hit(n, S.G.rng.pick(L)); }
// 방어 무시 피해 (독 터뜨리기 등)
export function pierce(f, n) {
  if (!f || f.dead || n <= 0) return;
  f.hp = Math.max(0, f.hp - n); logMsg(`${f.name}에게 피해 <b>${n}</b>`); if (S.C.actor) stat(S.C.actor, 'dmg', n); killCheck(f);
}
export function guard(n, who = S.C.actor) {
  const C = S.C; if (!who || !alive(who)) return;
  const v = Math.max(0, n + (who === C.actor ? boost() : 0));
  C.blocks[who] += v; stat(C.actor || who, 'block', v);
}
// 'ally' 카드면 고른 동료에게, 아니면 카드 주인에게
export function guardTarget(n) { guard(n, S.C.target || S.C.actor); }
export function guardAll(n) { for (const p of living()) guard(n, p); }
export function heal(n) { const C = S.C, id = C.target || C.actor; if (id) healMember(id, n); }
export function healSelf(n) { if (S.C.actor) healMember(S.C.actor, n); }
export function healAll(n) { for (const p of living()) healMember(p, n); }
// 카드 주인이 체력을 잃는다 (1 아래로는 안 내려감). 제노가 잃은 체력은 판 내내 센다.
export function loseHp(n) {
  const C = S.C, m = C.actor && member(C.actor); if (!m) return;
  const before = m.hp; m.hp = Math.max(1, m.hp - n);
  const d = before - m.hp; m.lost = (m.lost || 0) + d; C.lostTurn[C.actor] = (C.lostTurn[C.actor] || 0) + d;
}
export const lost = id => member(id)?.lost || 0;
export const missing = id => { const m = member(id); return m ? m.max - m.hp : 0; };
export const low = id => { const m = member(id); return !!m && alive(id) && m.hp <= m.max / 2; };
// 쓰러진 동료 하나를 일으킨다 (비상식량)
export function revive(n) {
  const p = S.G.formation.find(x => member(x).down); if (!p) return;
  const m = member(p); m.down = false; m.hp = Math.min(m.max, n);
  logMsg(`<b>${CHARACTERS[p].name}</b>이(가) 일어났다`);
}
export function keepBlock() { const C = S.C; if (C.actor) C.keep[C.actor] = true; }
export function nextBlock(n) { const C = S.C; if (C.actor) C.nextBlock[C.actor] = (C.nextBlock[C.actor] || 0) + n; }
export function foeStatus(k, n, f = foeTarget()) { if (f && !f.dead) f[k] += n; }
export function foeStatusAll(k, n) { for (const f of livingFoes()) f[k] += n; }
// 베기 횟수 (거울 자세: 베기마다 아이리스 방어)
export function slash(n) {
  const C = S.C; C.slashes += n; C.totalSlashes += n;
  if (C.mirror) guard(C.mirror * n, 'iris');
}
// 칼집 치기로 쌓인 「다음 베기 +」를 꺼내 쓴다
export function sheath() { const C = S.C, v = C.sheath; C.sheath = 0; return v; }
// 아카네 패시브: 베기 카드의 대상에게 화상
export function burnTargets(card, pick, n) {
  const C = S.C;
  const fs = card.target === 'all' ? livingFoes() : [C.all[pick?.foe] || foeTarget()].filter(f => f && !f.dead);
  for (const f of fs) f.burn += n;
}
export function chain(n) { const C = S.C; C.chain = Math.min(RULES.chainMax, C.chain + n); }

export function draw(n) {
  const C = S.C;
  for (let i = 0; i < n; i++) {
    if (!C.draw.length) { if (!C.disc.length) return; C.draw = S.G.rng.shuffle(C.disc); C.disc = []; }
    if (C.hand.length >= RULES.maxHand) return;
    C.hand.push(C.draw.pop());
  }
}
// 카드 하나의 쓸모 (자동 고르기용: 남기기·버리기·담금질·되돌리기)
const worth = d => d.ch === 'curse' ? -10 : (d.cost || 0) * 2 + ({ c: 1, u: 2, r: 3 }[d.rarity] || 0) + (d.time ? 1 : 0);
const realCard = h => !/^(duo|bond):/.test(h.id) && cardDef(h).ch !== 'curse';
export function discardWorst(n) {
  const C = S.C;
  for (let k = 0; k < n && C.hand.length; k++) {
    let bi = 0; C.hand.forEach((h, i) => { if (worth(cardDef(h)) < worth(cardDef(C.hand[bi]))) bi = i; });
    C.disc.push(C.hand.splice(bi, 1)[0]);
  }
}
export function discardHand() { const C = S.C; for (const h of C.hand) if (!/^(duo|bond):/.test(h.id)) C.disc.push(h); C.hand = C.hand.filter(h => /^(duo|bond):/.test(h.id)); }
// 버린 더미에서 가장 비싼 카드 n장(조건 f)을 손으로
export function fromDiscard(n, f = () => true) {
  const C = S.C;
  for (let k = 0; k < n; k++) {
    const L = C.disc.filter(h => realCard(h) && f(cardDef(h))); if (!L.length || C.hand.length >= RULES.maxHand) return;
    const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
    C.disc.splice(C.disc.indexOf(best), 1); C.hand.push(best);
  }
}
// 이번 전투에 쓴 카드(버린·소멸 더미) 중 가장 비싼 것을 복사해 손으로 (소멸)
export function copyPlayed(disc = 0) {
  const C = S.C, L = [...C.disc, ...C.exh].filter(h => realCard(h) && !cardDef(h).id.startsWith('eleo.echo'));
  if (!L.length || C.hand.length >= RULES.maxHand) return;
  const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
  C.hand.push({ ...newInst(best.id), ghost: true, disc });
}
export function give(id) { const C = S.C; if (C.hand.length < RULES.maxHand) C.hand.push(newInst(id)); }
// 담금질: 손패 n장(가장 좋은 카드)을 이번 전투 동안 강화
export function temper(n) {
  const C = S.C;
  for (let k = 0; k < n; k++) {
    const L = C.hand.filter(h => realCard(h) && canUpgrade(h.id)); if (!L.length) return;
    const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
    best.id += '+'; C.tempered++;
  }
}
// 손패의 다른 동료 카드 1장(가장 비싼) 이번 턴 비용 −n
export function cheapen(n, self) {
  const C = S.C, L = C.hand.filter(h => realCard(h) && cardDef(h).ch !== self && cardDef(h).cost > 0); if (!L.length) return;
  const best = L.reduce((a, b) => cardDef(b).cost > cardDef(a).cost ? b : a);
  best.disc = (best.disc || 0) + n;
}
// 정령 (시온): 최대 4 + 패시브. 피해 = 부를 때 값 + 패시브 + 보름달
export function spirit(dmg, n = 1) {
  const C = S.C, max = 4 + passiveSum('spiritMax');
  for (let k = 0; k < n && C.spirits.length < max; k++) C.spirits.push(dmg);
}
export function dropSpirit() { const C = S.C; if (!C.spirits.length) return false; C.spirits.sort((a, b) => a - b).shift(); return true; }
export const spiritDmg = s => s + passiveSum('spiritPlus') + (MOONS[S.G.moon].spiritBonus || 0);
export function spiritsAct(times = 1) {
  const C = S.C; if (!C.spirits.length) return;
  const prev = C.actor; C.actor = 'sion';
  for (let t = 0; t < times; t++) for (const s of C.spirits) { if (!livingFoes().length) break; C.bonus = 0; hitRandom(spiritDmg(s)); }
  C.actor = prev;
}
// 달 (루나리아): 이번 전투의 달을 바꾼다. 바뀌면 루나리아 패시브(카드 1장, 방어 4)
export function setMoon(k) {
  const G = S.G, C = S.C; if (!MOONS[k] || G.moon === k) return;
  G.moon = k; C.moonChanged = true;
  logMsg(`달이 <b>${MOONS[k].name}</b>로 바뀌었다`);
  if (alive('lunaria') && G.party.includes('lunaria')) { draw(1); guard(3, 'lunaria'); }
}
export function nextMoon() { const ks = Object.keys(MOONS); setMoon(ks[(ks.indexOf(S.G.moon) + 1) % ks.length]); }
// 밤 시계: 되돌리기(초승달이면 세바스 +5분) · 더하기
export function rewind(m) {
  const bonus = S.C?.actor === 'sebas' ? MOONS[S.G.moon].rewindBonus || 0 : 0;
  runRewind(m + bonus); logMsg(`밤 시계 <b>−${m + bonus}분</b>`);
}
export function addTime(m) { runAddTime(m); logMsg(`밤 시계 <b>+${m}분</b>`); }
// 공중 (시그룬): 받는 피해 절반, 「뒤를 노림」에서 빠짐. 두 번의 적 차례가 지나거나 급강하하면 착지.
export function fly() { if (alive('sigrun')) S.C.air = 2; }
export function land() { S.C.air = 0; }
// 별빛 (마리아나·후쿠로)
export function spend(n) { const G = S.G; if (G.gold < n) return false; G.gold -= n; return true; }
export const gold = n => gainGold(n);
export function haggle(p) { const G = S.G; G.haggle = Math.min(.4, (G.haggle || 0) + p); }
// 빛 (토모리): 적의 이번 공격을 줄인다
export function dim(r, f = foeTarget()) { if (f && !f.dead) f.dim = Math.min(.9, (f.dim || 0) + r); }
export function dimAll(r) { for (const f of livingFoes()) dim(r, f); }
export function dimStrongest(r) {
  const L = livingFoes().filter(attacking); if (!L.length) return;
  dim(r, L.reduce((a, b) => intentOf(b).v * (intentOf(b).n || 1) > intentOf(a).v * (intentOf(a).n || 1) ? b : a));
}
export const attacking = f => { const t = intentOf(f).t; return t === 'atk' || t === 'mix'; };
export function nextFight(e, d) { const G = S.G; G.nextFight = { energy: (G.nextFight?.energy || 0) + e, draw: (G.nextFight?.draw || 0) + d }; }
// 적 하나의 다음 행동을 무작위로 (가면 속)
export function shuffleIntent(f = foeTarget()) { if (f && !f.dead) f.pi = S.G.rng.int(f.pat.length); }
export const roll = n => S.G.rng.int(n);
// 직전에 쓴 카드를 한 번 더 (거울 춤)
export function replayLast(ok) {
  const C = S.C, L = C.lastPlay; if (!L || !ok(L.d) || L.d.id.startsWith('mm.mirror')) return;
  const keep = { tf: C.tf, target: C.target, actor: C.actor, pair: C.pair };
  C.tf = L.tf; C.target = L.target; C.actor = L.actor; C.pair = L.pair;
  L.d.play?.(C, effects, L.d.v, L.d.up);
  Object.assign(C, keep);
}

export const effects = {
  hit, hitAll, hitRandom, pierce, guard, guardTarget, guardAll, draw, heal, healSelf, healAll, loseHp, lost, missing, low, revive,
  keepBlock, nextBlock, foeStatus, foeStatusAll, slash, sheath, burnTargets, chain, discardWorst, discardHand, fromDiscard, copyPlayed, give,
  temper, cheapen, spirit, dropSpirit, spiritsAct, setMoon, nextMoon, rewind, addTime, fly, land, spend, gold, haggle,
  dim, dimAll, dimStrongest, attacking, nextFight, shuffleIntent, roll, replayLast,
  get moon() { return S.G.moon; },
  full: ch => MOONS[S.G.moon].boost?.[ch] || 0,
  dark: () => MOONS[S.G.moon].darkBonus || 0,
};

// 카드·패시브가 쓰는 효과 도우미. 데이터는 이 함수들만 부른다.
// C.actor = 지금 효과를 내는 동료(카드 주인, 패시브 주인), C.target = 'ally' 카드에서 고른 동료,
// C.tf = 고른 적의 번호. 피해 계산은 combat.js의 dmgToFoe가 한다.
import { S, healMember, member, alive, living, logMsg, addTime as runAddTime, rewind as runRewind, gainGold, moonFx, pushFx } from './run.js';
import { MOONS } from './data/moons.js';
import { RELICS } from './data/relics.js';
import { RULES } from './data/rules.js';
import { CHARACTERS } from './data/characters.js';
import { canTemper, DUOS, duoKey } from './data/cards.js';
import { dmgToFoe, foeTarget, livingFoes, targetableFoes, killCheck, intentOf, newInst, cardDef } from './combat.js';

// 달 보너스(보름달: 아이리스·마르타 피해·방어 +2)는 효과를 내는 동료 기준으로 자동으로 붙는다.
const boost = () => moonFx('boost')[S.C.actor] || 0;
const passiveSum = k => S.G.party.reduce((t, p) => t + (alive(p) ? CHARACTERS[p].passive?.[k] || 0 : 0), 0);

// 피해를 주고, 실제로 들어간 피해를 돌려준다. pierce = 적의 방어 무시
export function hit(n, f = foeTarget(), pierceBlock = false) {
  const C = S.C; if (!f || f.dead) return 0;
  // 카드 배수(아이리스 「무한일섬」·시그룬 「발키리」), 토모리 「등대 불빛」③: 노림을 바꾼 적에게 2배
  let x = (n + C.bonus + boost()) * (C.cardMul || 1);
  if (C.tomoriLit && f.aimedTurn) x *= 2;
  const burn0 = f.burn;
  const d = dmgToFoe(f, Math.floor(x), C.actor, pierceBlock); C.bonus = 0;
  if (C.actor) { f.lastHitter = C.actor; stat(C.actor, 'dmg', d.dealt); }
  countDmg(d.dealt + d.bleed);
  logMsg(`${f.name}에게 피해 <b>${d.dealt}</b>${d.blocked ? ` (방어 ${d.blocked} 막힘)` : ''}${d.bleed ? ` · 출혈 ${d.bleed}` : ''}`);
  if (C.burnAll > 0 && C.atkCard) f.burn += C.burnAll;
  // 아카네 「홍련 개화」③: 대상 화상이 8 이상이면 베기가 맞을 때마다 화상만큼 바로 피해(화상은 남음)
  if (C.curSlash && burn0 >= 8 && f.hp > 0 && alive('akane') && S.G.party.includes('akane')) {
    burst('akane', '홍련 개화');
    const prev = C.actor; C.actor = 'akane'; pierce(f, burn0); C.actor = prev;
  }
  killCheck(f);
  return d.dealt;
}
// 이번 턴 준 피해 (「터지는 턴」·등대 불빛이 볼 동료별 피해)
function countDmg(n) {
  const C = S.C; if (!C || n <= 0) return;
  C.dmgTurn += n; if (C.actor) C.dmgBy[C.actor] = (C.dmgBy[C.actor] || 0) + n;
}
// 결과 화면 MVP용: 동료마다 준 피해·쌓은 방어
function stat(id, k, n) { const st = S.G.stats[id]; if (st && n > 0) st[k] += n; }
export function hitAll(n) {
  const C = S.C, b = C.bonus;
  for (const f of livingFoes()) { C.bonus = b; hit(n, f); }
  C.bonus = 0;
}
export function hitRandom(n) { const L = targetableFoes(); if (L.length) hit(n, S.G.rng.pick(L)); }
// 방어 무시 피해 (독 터뜨리기 등)
export function pierce(f, n) {
  if (!f || f.dead || n <= 0) return;
  const real = Math.min(f.hp, n); f.hp -= real; pushFx({ kind: 'hitFoe', i: f.i, dmg: n, blocked: 0, bleed: 0, actor: S.C.actor, pierce: true }); logMsg(`${f.name}에게 피해 <b>${n}</b>`); if (S.C.actor) stat(S.C.actor, 'dmg', real); countDmg(real); killCheck(f);
}
export function guard(n, who = S.C.actor) {
  const C = S.C; if (!who || !alive(who)) return;
  const v = Math.max(0, n + (who === C.actor ? boost() : 0));
  C.blocks[who] += v; stat(C.actor || who, 'block', v);
  if (v > 0) pushFx({ kind: 'block', id: who, n: v });
}
// 'ally' 카드면 고른 동료에게, 아니면 카드 주인에게
export function guardTarget(n) { guard(n, S.C.target || S.C.actor); }
export function guardAll(n) { for (const p of living()) guard(n, p); }
export function heal(n) { const C = S.C, id = C.target || C.actor; if (id) healOne(id, n); }
export function healSelf(n) { if (S.C.actor) healOne(S.C.actor, n); }
export function healAll(n) { for (const p of living()) healOne(p, n); }
// 전투 중 회복. 고든 「만찬」③: 넘친 회복은 방어로, 한 턴 회복이 15 이상이면 이번 전투 모든 동료 공격 +1
function healOne(id, n) {
  const C = S.C, got = healMember(id, n);
  const gordon = C && alive('gordon') && S.G.party.includes('gordon');
  if (!gordon) return got;
  if (n > got && alive(id)) guard(n - got, id);
  C.healTurn += got;
  if (C.healTurn >= 15 && !C.feastTurn) { C.feastTurn = true; C.partyStr += 1; burst('gordon', '만찬'); }
  return got;
}
// 카드 주인이 체력을 잃는다 (1 아래로는 안 내려감). 제노가 잃은 체력은 판 내내 센다.
export function loseHp(n) {
  const C = S.C, m = C.actor && member(C.actor); if (!m) return;
  const before = m.hp; m.hp = Math.max(1, m.hp - n);
  const d = before - m.hp; m.lost = (m.lost || 0) + d; C.lostTurn[C.actor] = (C.lostTurn[C.actor] || 0) + d;
  C.lostCombat[C.actor] = (C.lostCombat[C.actor] || 0) + d;
}
export const lostCombat = id => S.C?.lostCombat[id] || 0;
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
// 레이븐 「독 묻은 깃」②: 레이븐 카드로 거는 독 +1
const ravenPlus = (k, n) => k === 'poison' && n > 0 && S.C?.actor === 'raven' ? n + 1 : n;
export function foeStatus(k, n, f = foeTarget()) { if (f && !f.dead) f[k] += ravenPlus(k, n); }
export function foeStatusAll(k, n) { const v = ravenPlus(k, n); for (const f of livingFoes()) f[k] += v; }
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
  const C = S.C, got = [];
  for (let k = 0; k < n; k++) {
    const L = C.disc.filter(h => realCard(h) && f(cardDef(h))); if (!L.length || C.hand.length >= RULES.maxHand) return got;
    const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
    C.disc.splice(C.disc.indexOf(best), 1); C.hand.push(best); got.push(best);
  }
  return got;
}
// 이번 전투에 쓴 카드(버린·소멸 더미) 중 가장 비싼 것을 복사해 손으로 (소멸)
export function copyPlayed(disc = 0) {
  const C = S.C, L = [...C.disc, ...C.exh].filter(h => realCard(h) && !cardDef(h).id.startsWith('eleo.echo'));
  if (!L.length || C.hand.length >= RULES.maxHand) return;
  const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
  C.hand.push({ ...newInst(best.id), ghost: true, disc });
}
export function give(id) { const C = S.C; if (C.hand.length < RULES.maxHand) C.hand.push(newInst(id)); }
// 담금질: 손패 n장을 이번 전투 동안 강화. 화면에서 하면(S.ui) 고를 카드가 n장보다 많을 때 직접 고르고(C.choose),
// 시뮬레이션·자동이면 가장 좋은 카드.
// 도라 「명장」③: 한 전투 담금질 3번째부터는 「++」(강화판 수치 +50%), 이미 강화된 카드도 ++로
const masterTemper = () => alive('dora') && S.G.party.includes('dora') && S.C.tempered >= 2;
export const temperable = h => realCard(h) && canTemper(h.id, masterTemper());
function temperOne(h) {
  const C = S.C;
  if (masterTemper()) { if (C.tempered === 2) burst('dora', '명장'); h.id = h.id.replace(/\++$/, '') + '++'; C.tempered2++; }
  else h.id += '+';
  C.tempered++;
}
export function temper(n, auto = false) {
  const C = S.C;
  if (S.ui && !auto && C.hand.filter(temperable).length > n) { C.choose = { kind: 'temper', left: n }; return; }
  for (let k = 0; k < n; k++) {
    const L = C.hand.filter(temperable); if (!L.length) return;
    const best = L.reduce((a, b) => worth(cardDef(b)) > worth(cardDef(a)) ? b : a);
    temperOne(best);
  }
}
// 담금질 고르기: 손패의 카드 하나 (uid). 다 고르면 끝. uid가 없으면 나머지는 자동으로.
export function temperPick(uid) {
  const C = S.C, ch = C?.choose; if (!ch || ch.kind !== 'temper') return;
  const h = uid == null ? null : C.hand.find(x => x.uid === uid && temperable(x));
  if (uid == null) { C.choose = null; temper(ch.left, true); return; }
  if (!h) return;
  temperOne(h); ch.left--;
  if (ch.left <= 0 || !C.hand.some(temperable)) C.choose = null;
}
// 손패의 다른 동료 카드 1장(가장 비싼) 이번 턴 비용 −n
export function cheapen(n, self) {
  const C = S.C, L = C.hand.filter(h => realCard(h) && cardDef(h).ch !== self && cardDef(h).cost > 0); if (!L.length) return;
  const best = L.reduce((a, b) => cardDef(b).cost > cardDef(a).cost ? b : a);
  best.disc = (best.disc || 0) + n;
}
// 정령 (시온): 최대 4 + 패시브. 피해 = 부를 때 값 + 패시브 + 보름달
// 시온 「별의 길」②: 정령을 부를 때마다 이번 전투 모든 정령 피해 +1 (최대 +2)
export function spirit(dmg, n = 1) {
  const C = S.C, max = 4 + passiveSum('spiritMax');
  for (let k = 0; k < n && C.spirits.length < max; k++) {
    C.spirits.push(dmg);
    if (alive('sion') && S.G.party.includes('sion')) C.spiritBuff = Math.min(2, C.spiritBuff + 1);
  }
}
export function dropSpirit() { const C = S.C; if (!C.spirits.length) return false; C.spirits.sort((a, b) => a - b).shift(); return true; }
export const spiritDmg = s => s + passiveSum('spiritPlus') + (moonFx('spiritBonus') || 0) + (S.C?.spiritBuff || 0) + (S.C?.spiritTurnBuff || 0);
export function spiritsAct(times = 1) {
  const C = S.C; if (!C.spirits.length) return;
  const prev = C.actor; C.actor = 'sion'; C.spiritHit = true;   // 정령은 가시에 안 다친다
  for (let t = 0; t < times; t++) for (const s of C.spirits) { if (!livingFoes().length) break; C.bonus = 0; hitRandom(spiritDmg(s)); }
  C.actor = prev; C.spiritHit = false;
}
// 달 (루나리아): 이번 전투의 달을 바꾼다. 바뀌면 루나리아 패시브(카드 1장, 방어 4)
// 루나리아 「월광」②: 달이 바뀔 때마다 카드 1장, 방어 3, 무작위 적 피해 7. 「만월야」③: 한 턴에 3번 바꾸면 그 턴 끝까지 네 달 효과가 한꺼번에,
// 그 뒤 달을 바꿀 때마다 모든 적 피해 12
export function setMoon(k) {
  const G = S.G, C = S.C; if (!MOONS[k] || G.moon === k) return;
  G.moon = k; C.moonChanged = true; C.moonTurn++;
  logMsg(`달이 <b>${MOONS[k].name}</b>로 바뀌었다`);
  const me = (G.relics || []).reduce((t, id) => t + (RELICS[id].moonEnergy || 0), 0); if (me) C.energy += me;   // 달 나침반
  if (!(alive('lunaria') && G.party.includes('lunaria'))) return;
  draw(1); guard(3, 'lunaria');
  { const prev = C.actor, b = C.bonus, m = C.cardMul; C.actor = 'lunaria'; C.bonus = 0; C.cardMul = 1; hitRandom(7); C.actor = prev; C.bonus = b; C.cardMul = m; }
  if (C.allMoons) {
    const prev = C.actor, b = C.bonus, m = C.cardMul; C.actor = 'lunaria'; C.cardMul = 1;
    for (const f of livingFoes()) { C.bonus = 0; hit(12, f); }
    C.actor = prev; C.bonus = b; C.cardMul = m;
  } else if (C.moonTurn >= 3) { C.allMoons = true; burst('lunaria', '만월야'); }
}
const OPP = { full: 'new', new: 'full', crescent: 'half', half: 'crescent' };
export function flipMoon() { setMoon(OPP[S.G.moon]); }
export function nextMoon() { const ks = Object.keys(MOONS); setMoon(ks[(ks.indexOf(S.G.moon) + 1) % ks.length]); }
// 밤 시계: 되돌리기(초승달이면 세바스 +5분) · 더하기
export function rewind(m) {
  const bonus = S.C?.actor === 'eleonore' ? moonFx('rewindBonus') || 0 : 0;
  runRewind(m + bonus); logMsg(`밤 시계 <b>−${m + bonus}분</b>`);
}
export function addTime(m) { runAddTime(m); logMsg(`밤 시계 <b>+${m}분</b>`); }
// 공중 (시그룬): 받는 피해 절반, 「뒤를 노림」에서 빠짐. 두 번의 적 차례가 지나거나 급강하하면 착지.
// 급강하 계열은 쓰는 즉시가 아니라 내 턴이 끝날 때 착지한다(같은 턴 연속 급강하가 되게). 「발키리」③면 착지 안 함.
export function fly() { if (alive('sigrun')) { S.C.air = 2; S.C.landPending = false; } }
export function land() { S.C.landPending = true; }
// 별빛 (마리아나·후쿠로)
// 마리아나 「약탈의 밤」③: 별빛이 30 이상이면 별빛 쓰는 카드가 별빛을 쓰지 않고 최대 효과
const lootNight = () => S.C?.actor === 'mariana' && S.G.gold >= 30 && alive('mariana');
export function spend(n) {
  const G = S.G;
  if (lootNight()) { burst('mariana', '약탈의 밤'); return true; }
  if (G.gold < n) return false; G.gold -= n; return true;
}
// 별빛을 step씩 최대 max번 써서 쓴 횟수를 돌려준다 (금화 던지기)
export function spendSteps(max, step) {
  const G = S.G;
  if (lootNight()) { burst('mariana', '약탈의 밤'); return max; }
  const k = Math.min(max, Math.floor(G.gold / step)); G.gold -= k * step; return k;
}
export const gold = n => gainGold(n);
export function haggle(p) { const G = S.G; G.haggle = Math.min(.4, (G.haggle || 0) + p); }
// 빛 (토모리): 적의 이번 공격을 줄인다
export function dim(r, f = foeTarget()) { if (f && !f.dead) f.dim = Math.min(.9, (f.dim || 0) + r); }
// 토모리 ①: 적의 노림을 바꾼다. 「등대 불빛」③: 한 턴에 2번 바꾸면 그 적들 이번 공격 −50%, 이번 턴 그 적들에게 주는 피해 2배
export function setAim(f = foeTarget(), aim = 'front') {
  const C = S.C; if (!f || f.dead) return;
  if (aim) f.aimOverride = aim;
  f.aimedTurn = true; C.aimTurn++;
  if (C.aimTurn >= 2 && !C.tomoriLit && alive('tomori') && S.G.party.includes('tomori')) {
    C.tomoriLit = true; burst('tomori', '등대 불빛');
    for (const g of livingFoes()) if (g.aimedTurn) dim(.5, g);
  } else if (C.tomoriLit) dim(.5, f);
}
export function dimAll(r) { for (const f of livingFoes()) dim(r, f); }
export function dimStrongest(r) {
  const L = livingFoes().filter(attacking); if (!L.length) return;
  dim(r, L.reduce((a, b) => intentOf(b).v * (intentOf(b).n || 1) > intentOf(a).v * (intentOf(a).n || 1) ? b : a));
}
export const attacking = f => { const t = intentOf(f).t; return t === 'atk' || t === 'mix'; };
export function nextFight(e, d) { const G = S.G; G.nextFight = { energy: (G.nextFight?.energy || 0) + e, draw: (G.nextFight?.draw || 0) + d }; }
// 적 하나의 다음 행동을 무작위로 (가면 속)
export function shuffleIntent(f = foeTarget()) { if (f && !f.dead) f.pi = S.G.rng.int(f.pat.length); }
// 무작위 (후쿠로 「대박」③ 중이면 최대값)
export const roll = n => S.C?.jackpot ? n - 1 : S.G.rng.int(n);
// 직전에 쓴 카드를 한 번 더 (거울 춤)
export function replayLast(ok) {
  const C = S.C, L = C.lastPlay; if (!L || !ok(L.d) || L.d.id.startsWith('mm.mirror')) return;
  const keep = { tf: C.tf, target: C.target, actor: C.actor, pair: C.pair };
  C.tf = L.tf; C.target = L.target; C.actor = L.actor; C.pair = L.pair;
  L.d.play?.(C, effects, L.d.v, L.d.up);
  Object.assign(C, keep);
}

// ---- 패시브 ③ 폭발 (docs/12_signature.md) ----
// 이름 띠 연출(main.js가 fxq에서 꺼냄). 인연 짝 둘의 ③이 같은 턴에 터지면 그 짝의 듀오 한 장 더 (전투당 짝마다 1번).
export function burst(id, name) {
  const C = S.C; if (!C) return;
  C.bursts[id] = (C.bursts[id] || 0) + 1;
  if (C.burstTurn.has(id)) return;
  C.burstTurn.add(id);
  logMsg(`<b>${CHARACTERS[id].name} 「${name}」</b>`);
  pushFx({ kind: 'burst', who: id, name });
  const G = S.G; G.burstLog = G.burstLog || {}; G.burstLog[id] = (G.burstLog[id] || 0) + 1;
  for (const p of C.burstTurn) {
    if (p === id) continue;
    const k = duoKey(p, id);
    if (DUOS[k] && !C.burstBond.has(k) && C.hand.length < RULES.maxHand) {
      C.burstBond.add(k); C.hand.push(newInst('duo:' + k)); G.duos++; C.burstDuo = k;
      logMsg(`인연 공명: <b>${DUOS[k].name}</b> 한 장 더`);
    }
  }
}
// 노엘 「몽중 무쌍」③: 마력 20 이상이면 별똥 마법·꿈 폭발이 깨우지 않고 마력을 절반만 쓴다
export function dream() { const C = S.C; const on = C.mana >= 20 && alive('noel'); if (on) burst('noel', '몽중 무쌍'); return on; }
export function spendMana(keep) { const C = S.C; if (keep) C.mana = Math.floor(C.mana / 2); else { C.mana = 0; C.asleep = false; } }
// 브릭 「전탄」③: 장전 6 이상에서 발사하면 모든 적에게 (브릭 패시브 beforeCard가 c.fullLoad를 정한다)
export function fullLoad() { return !!S.C.fullLoad && alive('brick'); }
// 베기로 치는지 (대장간의 불이면 모든 공격이 베기)
export const isSlash = card => !!card.slash || /slash/.test(card.tags || '') || (S.C.allSlash && !!card.atk);

export const effects = {
  hit, hitAll, hitRandom, pierce, guard, guardTarget, guardAll, draw, heal, healSelf, healAll, loseHp, lost, lostCombat, missing, low, revive,
  keepBlock, nextBlock, foeStatus, foeStatusAll, slash, sheath, burnTargets, chain, discardWorst, discardHand, fromDiscard, copyPlayed, give,
  temper, cheapen, spirit, dropSpirit, spiritsAct, setMoon, nextMoon, flipMoon, rewind, addTime, fly, land, spend, spendSteps, gold, haggle,
  dim, dimAll, dimStrongest, setAim, attacking, nextFight, shuffleIntent, roll, replayLast,
  burst, dream, spendMana, fullLoad, isSlash,
  get moon() { return S.G.moon; },
  full: ch => moonFx('boost')[ch] || 0,
  dark: () => moonFx('darkBonus') || 0,
};

// 전투 엔진: 턴, 손패, 적 1~3마리(의도·노림·상태), 동료별 체력·방어·상태, 대열, 쓰러짐, 연계·듀오, 패시브, 저주.
import { S, addTime, rewind, timeCost, logMsg, isDawn, depthRule, member, alive, living, swapFormation, endRun, pushFx, gainRelic, gainGold, healMember, healAll } from './run.js';
import { hasRelic, relicSum, relicFlag, rollRelic } from './relics.js';
import { RELICS } from './data/relics.js';
import { effects as E, draw } from './effects.js';
import { cardData, duoKey, DUOS, CARDS } from './data/cards.js';
import { CHARACTERS } from './data/characters.js';
import { FOE } from './data/enemies.js';
import { MOONS } from './data/moons.js';
import { RULES, REWARD, AIM_NAME } from './data/rules.js';

let uid = 1;
export const newInst = id => ({ uid: uid++, id });

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

export const livingFoes = () => S.C.all.filter(f => !f.dead);
// 지금 효과가 향하는 적: 고른 적(C.tf), 없으면 살아 있는 첫 적
export function foeTarget() {
  const C = S.C, f = C.all[C.tf];
  return f && !f.dead ? f : livingFoes()[0] || null;
}

export function startCombat(ids, kind) {
  const G = S.G;
  // 밤의 깊이: 강적·보스·일반 적 체력 +%
  const hpMul = 1 + (depthRule(kind === 'elite' ? 'eliteHp' : kind === 'boss' ? 'bossHp' : 'fightHp') || 0);
  const foes = ids.map((k, i) => makeFoe(k, i, hpMul));
  const C = S.C = {
    kind, all: foes, tf: null, hover: null,
    draw: G.rng.shuffle(G.deck.map(id => ({ uid: uid++, id }))), hand: [], disc: [], exh: [],
    energy: RULES.energy, blocks: Object.fromEntries(G.party.map(p => [p, 0])),
    ms: Object.fromEntries(G.party.map(p => [p, { weak: 0, vuln: 0 }])),   // 동료 상태 (적의 약화·취약)
    keep: {}, actor: null, target: null, pending: null, swaps: 0,
    chain: 0, last: null, bonus: 0, duoUsed: new Set(),
    loaded: 0, mana: 0, asleep: false, late: false, counter: 0, taunt: null,
    slashes: 0, totalSlashes: 0, sheath: 0, mirror: 0,
    nextEnergy: 0, retain: false, discount: 0, garden: 0, payEnergy: false,
    light: foes.some(f => f.light) ? 0 : null,
    turn: 0, log: [],
    // 동료 20명의 고유 상태 (docs/03_characters.md)
    spirits: [], spiritExtra: 0, lastKey: null, lastSub: null, pair: false, pairMul: 1, lastPlay: null,
    turnAtk: 0, nextAtk: 0, zeroBonus: 0, zenoStr: 0, zenoAwake: 0, air: 0, noDmg: false, nextBlock: {}, nextDraw: 0,
    double: false, freeNext: 0, atkFree: false, playedTurn: 0, turnChars: new Set(), tempered: 0, playedUp: false,
    timeUsedTurn: 0, rewardExtra: 0, winGold: 0, swapsBonus: 0, moonBase: G.moon, moonChanged: false, moonPick: false,
    lostTurn: {}, flameGuard: 0, sigCounter: 0, burnAll: 0, reserve: 0, keepCards: [], atkCard: false,
  };
  Object.defineProperty(C, 'block', {
    get() { return C.actor ? C.blocks[C.actor] : 0; },
    set(v) { if (C.actor) C.blocks[C.actor] = v; },
  });
  // 데이터에서 c.foe = 고른 적, c.foes = 살아 있는 적 (C.all = 처음 나온 적 전부)
  Object.defineProperty(C, 'foe', { get: foeTarget });
  Object.defineProperty(C, 'foes', { get: livingFoes });
  Object.defineProperty(C, 'anyDown', { get: () => G.party.some(p => member(p).down) });
  // 보름달: 정령 피해 +1 등은 moons.js. 토모리 「등대 신호」: 다음 전투 시작 에너지·카드
  if (G.nextFight) { C.nextEnergy += G.nextFight.energy; C.nextDraw += G.nextFight.draw; G.nextFight = null; }
  G.screen = 'combat';
  // 강적·보스 앞 한 줄 (lines면 그중 하나)
  const sp = foes.find(f => f.line || f.lines);
  const line = sp ? (sp.lines ? G.rng.pick(sp.lines) : sp.line) : '';
  if (sp) logMsg(`<b>${sp.name}</b> ${line}`);
  S.fxq.length = 0;   // 지난 화면의 남은 연출은 버린다
  pushFx({ kind: 'combat', type: kind, boss: kind === 'boss' ? foes[0].name : null, line });
  startTurn();
}

// 적 하나 만들기 (전투 시작·부하 부르기). 6시 이후 들어간 전투: 적이 힘 +3으로 시작
function makeFoe(k, i, hpMul = 1) {
  const d = FOE[k], hp = Math.round(d.hp * hpMul);
  S.G.foesMet?.add(k);
  return { key: k, i, ...d, pat: d.pat.slice(), hp, max: hp, pi: 0, block: 0, str: isDawn() ? RULES.dawnStartStr : 0, poison: 0, weak: 0, vuln: 0, bleed: 0, burn: 0,
    armor: d.armor || 0, acts: d.acts || 1, p2: false, cyc: 0, dead: false, lastHitter: null, skip: 0, dim: 0, bounty: 0, aimOverride: null, stolen: [] };
}

// 등대 불빛: 대열 자리 번호. 체력이 절반 아래면 불빛 둘.
export function litMembers() {
  const C = S.C; if (C.light == null) return [];
  const src = livingFoes().find(f => f.light); if (!src) return [];
  const n = src.light.double && src.hp <= src.max * src.light.double ? 2 : 1, F = S.G.formation;
  return Array.from({ length: n }, (_, k) => F[(C.light + k) % F.length]);
}

// 전투 첫 턴의 도구: 등불(앞줄 방어), 우산(뒷줄 방어), 권총(무작위 적 피해)
function relicsAtStart() {
  const C = S.C, L = living();
  if (L.length && relicSum('blockFront')) C.blocks[L[0]] += relicSum('blockFront');
  if (L.length && relicSum('blockBackFirst')) C.blocks[L[L.length - 1]] += relicSum('blockBackFirst');
  // 전용 도구: 주인 방어 · 모든 적 독/화상
  for (const id of S.G.relics) {
    const d = RELICS[id];
    if (d.ownerBlock && alive(d.owner)) C.blocks[d.owner] += d.ownerBlock;
    if (d.poisonAll) for (const f of livingFoes()) f.poison += d.poisonAll;
    if (d.burnAll) for (const f of livingFoes()) f.burn += d.burnAll;
  }
  // 달 도구: 그 달일 때만 (js/data/relics.js moonStart)
  for (const id of S.G.relics) {
    const m = RELICS[id].moonStart; if (!m || S.G.moon !== m.moon) continue;
    if (m.energy) C.energy += m.energy;
    if (m.chain) C.chain = Math.max(C.chain, m.chain);
    if (m.blockAll) for (const p of L) C.blocks[p] += m.blockAll;
    if (m.poisonAll) for (const f of livingFoes()) f.poison += m.poisonAll;
  }
  // 첫 턴 연계: 별자리 띠(3칸) · 붉은 실 매듭(인연 짝이 있으면)
  if (relicSum('chainStart')) C.chain = Math.max(C.chain, Math.min(RULES.chainMax, relicSum('chainStart')));
  if (relicSum('bondStart') && Object.keys(DUOS).some(k => k.split('+').every(p => S.G.party.includes(p))))
    C.chain = Math.max(C.chain, relicSum('bondStart'));
  const gun = relicSum('pistol');
  if (gun) { const f = S.G.rng.pick(livingFoes()); if (f) { f.hp = Math.max(0, f.hp - gun); pushFx({ kind: 'hitFoe', i: f.i, dmg: gun, blocked: 0, bleed: 0, actor: null, gun: true }); logMsg(`권총: ${f.name}에게 피해 <b>${gun}</b>`); killCheck(f); } }
}

function startTurn() {
  const C = S.C;
  C.turn++;
  pushFx({ kind: 'turn', n: C.turn });
  for (const p in C.blocks) {
    if (C.keep[p]) { delete C.keep[p]; continue; }
    C.blocks[p] = C.retain ? Math.floor(C.blocks[p] / 2) : 0;
  }
  const first = C.turn === 1;
  C.energy = RULES.energy + C.nextEnergy + relicSum('energy') + (first ? relicSum('firstEnergy') : 0); C.nextEnergy = 0;
  C.chain = 0; C.last = null; C.lastKey = null; C.lastSub = null; C.slashes = 0; C.counter = 0; C.mirror = 0; C.taunt = null; C.swaps = 0; C.pending = null;
  C.turnAtk = C.nextAtk; C.nextAtk = 0; C.zeroBonus = 0; C.playedTurn = 0; C.turnChars = new Set(); C.playedUp = false; C.timeUsedTurn = 0;
  C.moonChanged = false; C.flameGuard = 0; C.sigCounter = 0; C.burnAll = 0; C.swapsBonus = 0; C.atkFree = false; C.freeNext = 0; C.noDmg = false;
  C.lostTurn = {}; C.reserve = 0; C.double = false; C.lastPlay = null;
  if (!first) C.moonPick = false;
  for (const p in C.nextBlock) if (alive(p)) C.blocks[p] += C.nextBlock[p];
  if (relicSum('frontBlockTurn')) { const f0 = living()[0]; if (f0) C.blocks[f0] += relicSum('frontBlockTurn'); }   // 밀물 종
  C.nextBlock = {};
  if (C.asleep && alive('noel')) C.mana += RULES.sleepMana + E.dark();
  if (C.late) { C.mana *= 2; C.late = false; }
  if (C.garden) for (const f of livingFoes()) f.poison += C.garden;
  if (isDawn()) { for (const f of livingFoes()) f.str += RULES.dawnStrPerTurn; logMsg(`<b>새벽</b>: 적의 힘 +${RULES.dawnStrPerTurn}`); }
  // 「새벽」: 내 턴 시작마다 밤 시계가 돈다
  for (const f of livingFoes()) if (f.turnClock) { const t = f.turnClock + (depthRule('dawnClock') || 0); addTime(t); logMsg(`${f.name}: 밤 시계 <b>+${t}분</b>`); }
  if (C.light != null && C.turn > 1) C.light = (C.light + 1) % S.G.formation.length;
  if (first) { passives('onCombatStart'); relicsAtStart(); }
  passives('onTurnStart');
  // 녹슨 열쇠: 손패에 있는 동안 1장 덜 뽑는다. 별의 왕관 -1, 야경단 완장 첫 턴 +1
  // 남긴 카드(세바스·예약)는 손으로 먼저, 뽑는 수와 따로
  const kept = C.keepCards.length; C.hand.push(...C.keepCards); C.keepCards = [];
  const size = RULES.handSize + relicSum('handSize') + (first ? relicSum('firstDraw') : 0) + C.nextDraw + kept; C.nextDraw = 0;
  const want = () => size - C.hand.filter(h => cardDef(h).drawLess).length;
  for (let k = 0; k < size + 3 && C.hand.length < want(); k++) {
    const before = C.hand.length; draw(1); if (C.hand.length === before) break;
  }
}

export const intentOf = f => f.pat[f.pi % f.pat.length];
const intentHits = it => it.t === 'atk' || it.t === 'mix';
const ST_NAME = { weak: '약화', vuln: '취약' };
export function foeDmg(f, v, id) {
  const ms = id && S.C.ms[id];
  return Math.max(0, Math.floor((v + f.str) * (f.weak ? RULES.weakMul : 1) * (ms?.vuln ? RULES.vulnMul : 1) * (1 - (f.dim || 0))));
}
export function intentText(f) {
  const it = intentOf(f), id = intentHits(it) ? aimTarget(f) : null, v = foeDmg(f, it.v || 0, id);
  const two = f.acts > 1 ? ` <span class="two">행동 ×${f.acts}</span>` : '';
  return one(it, v) + two;
}
function one(it, v) {
  if (it.t === 'atk') return `공격 ${v}${it.n > 1 ? '×' + it.n : ''}`;
  if (it.t === 'blk') return `방어 ${it.v}`;
  if (it.t === 'buf') return `힘 +${it.v}`;
  if (it.t === 'deb') return `${ST_NAME[it.s]} ${it.v}`;
  if (it.t === 'curse') return `저주 「${CARDS[it.card].name}」 ${it.n}장`;
  if (it.t === 'time') return `밤 시계 +${it.v}분`;
  if (it.t === 'aoe') return `모두 공격 ${v}`;
  if (it.t === 'boom') return `자폭 ${v} (모두)`;
  if (it.t === 'gblk') return `모든 적 방어 ${it.v}`;
  if (it.t === 'mend') return `적 회복 ${it.v}`;
  if (it.t === 'sum') return `부르기: ${FOE[it.id].name}`;
  if (it.t === 'steal') return `카드 훔치기`;
  if (it.t === 'aim') return `노림 바꿈: ${AIM_NAME[it.a]}`;
  return `공격 ${v} · 방어 ${it.b}`;
}

// 적의 단일 공격·상태가 노리는 동료 (살아 있는 동료 중). k = 연타의 몇 번째 타
export function aimTarget(f, k = 0) {
  const C = S.C, L = living(); if (!L.length) return null;
  if (C.taunt && alive(C.taunt)) return C.taunt;
  const a = f.aimOverride || f.aim || RULES.defaultAim;
  if (a === 'cycle') return L[f.cyc % L.length];
  if (a === 'dawn') { const it = intentOf(f); return it.n > 1 ? L[k % L.length] : L.reduce((x, y) => member(y).hp > member(x).hp ? y : x); }
  if (a === 'back') { const B = L.filter(p => !(p === 'sigrun' && C.air)); return (B.length ? B : L)[(B.length ? B : L).length - 1]; }
  if (a === 'weakest') return L.reduce((x, y) => member(y).hp < member(x).hp ? y : x);
  if (a === 'last' && f.lastHitter && alive(f.lastHitter)) return f.lastHitter;
  if (a === 'light') { const lit = litMembers().find(alive); if (lit) return lit; }
  return L[0];
}
// 화면 표시용: 이 적의 다음 행동이 노리는 동료 (공격·상태일 때만)
export const aimShown = f => { const it = intentOf(f); return intentHits(it) || it.t === 'deb' ? aimTarget(f) : null; };

// 동료가 적에게 주는 피해: (기본 + 연계·달 보너스) × 약화(동료) × 취약(적) → 방어 → 출혈
export function dmgToFoe(f, n, actor, pierceBlock = false) {
  const C = S.C;
  let d = Math.max(0, Math.floor(n * (actor && C.ms[actor]?.weak ? RULES.weakMul : 1) * (f.vuln ? RULES.vulnMul : 1)) - f.armor);
  const blocked = pierceBlock ? 0 : Math.min(f.block, d); f.block -= blocked; d -= blocked; f.hp = Math.max(0, f.hp - d);
  let bleed = 0;
  if (f.bleed > 0) { bleed = f.bleed; f.hp = Math.max(0, f.hp - bleed); f.bleed--; }
  pushFx({ kind: 'hitFoe', i: f.i, dmg: d, blocked, bleed, actor, crit: f.vuln > 0, slash: !!C.curSlash });
  // 가시(등불 장어·톱니 기사): 친 동료가 피해를 받는다
  if (f.thorns && d + blocked > 0 && actor && alive(actor) && !C.spiritHit) hurtMember(actor, f.thorns, `${f.name}의 가시`);
  return { dealt: d, blocked, bleed };
}
// 보스 2단계: 체력이 phase2.at 비율 아래로 내려가면 한 번 바뀐다
function enterPhase2(f) {
  const p = f.phase2; f.p2 = true;
  for (const k of ['armor', 'acts', 'aim', 'turnClock']) if (k in p) f[k] = p[k];
  if (p.pat) { f.pat = p.pat; f.pi = 0; }
  if (p.clockOnce) addTime(p.clockOnce);
  logMsg(`<b>${p.msg}</b>`);
  pushFx({ kind: 'phase', name: f.name, text: p.msg });
}
export function killCheck(f) {
  if (f.hp > 0 && f.phase2 && !f.p2 && f.hp <= f.max * f.phase2.at) enterPhase2(f);
  if (f.hp <= 0 && !f.dead) {
    f.dead = true; pushFx({ kind: 'kill', i: f.i, boss: S.C.kind === 'boss' }); logMsg(`<b>${f.name}</b> 쓰러뜨림`); if (S.C.tf === f.i) S.C.tf = null;
    if (f.bounty) { gainGold(f.bounty); logMsg(`현상금: 별빛 <b>+${f.bounty}</b>`); }
    if (f.stolen?.length) { S.C.disc.push(...f.stolen); logMsg(`훔쳐 간 카드 ${f.stolen.length}장을 되찾았다`); f.stolen = []; }
    if (f.deathBoom) for (const p of living()) hurtMember(p, f.deathBoom, `${f.name}의 폭발`);
  }
}

function hurtMember(id, d, src, fi = null) {
  const C = S.C, m = member(id), nm = CHARACTERS[id].name;
  if (C.noDmg) d = 0;                                  // 숨바꼭질
  if (id === 'sigrun' && C.air) d = Math.ceil(d / 2);  // 공중: 받는 피해 절반
  const b = Math.min(C.blocks[id], d); C.blocks[id] -= b; d -= b;
  const before = m.hp; m.hp = Math.max(0, m.hp - d);
  m.lost = (m.lost || 0) + (before - m.hp); C.lostTurn[id] = (C.lostTurn[id] || 0) + (before - m.hp);
  logMsg(`${src} → ${nm}: 피해 <b>${d}</b>${b ? ` (방어 ${b} 막음)` : ''}`);
  // 금빛 깃털: 판마다 동료당 한 번 버틴다
  if (m.hp <= 0 && !m.down && hasRelic('gold_feather') && !m.feather) { m.feather = true; m.hp = RELICS.gold_feather.goldFeather; logMsg(`금빛 깃털: <b>${nm}</b>이(가) 버텼다`); }
  if (m.hp <= 0 && !m.down) { m.down = true; m.wasDown = true; logMsg(`<b>${nm} 쓰러짐</b> · 카드를 쓸 수 없다`); }
  pushFx({ kind: 'hurt', id, dmg: before - m.hp, blocked: b, foe: fi, down: m.down && before > 0 && m.hp <= 0, air: id === 'sigrun' && C.air > 0 });
}
function enemyHit(f, v, k = 0) {
  const C = S.C, id = aimTarget(f, k); if (!id) return;
  if (f.aim === 'cycle' && !C.taunt) f.cyc++;
  hurtMember(id, foeDmg(f, v, id), f.name, f.i);
  if (id === 'marta' && C.counter > 0 && !f.dead) { f.hp = Math.max(0, f.hp - C.counter); pushFx({ kind: 'hitFoe', i: f.i, dmg: C.counter, blocked: 0, bleed: 0, actor: 'marta', counter: true }); logMsg(`마르타의 반격 <b>${C.counter}</b>`); killCheck(f); }
  if (id === 'sigrun' && C.sigCounter > 0 && !f.dead) { f.hp = Math.max(0, f.hp - C.sigCounter); pushFx({ kind: 'hitFoe', i: f.i, dmg: C.sigCounter, blocked: 0, bleed: 0, actor: 'sigrun', counter: true }); logMsg(`창벽 반격 <b>${C.sigCounter}</b>`); killCheck(f); }
  if (id === 'akane' && C.flameGuard > 0 && !f.dead) f.burn += C.flameGuard;
}

export const cardDef = inst => cardData(inst.id);

// 카드를 내는 동료: 보통 카드는 주인, 듀오는 둘 중 살아 있고 앞에 선 사람. 저주는 없음.
export function actorOf(d) {
  if (d.ch === 'curse') return null;
  if (d.ch !== 'duo') return alive(d.ch) ? d.ch : null;
  return living().find(p => p === d.a || p === d.b) || null;
}
// 이번에 쓰면 드는 에너지: 기본(free면 0) + 불빛 +1 − 연막
export function costOf(inst) {
  const C = S.C, d = cardDef(inst);
  if (d.unplayable) return null;
  let c = d.free && d.free(C) ? 0 : d.cost;
  if (C.atkFree && d.atk) c = 0;                                   // 떨이
  if (inst.disc) c = Math.max(0, c - inst.disc);                   // 등기·대리 응대·예약·잔상
  if (d.ch === 'duo' && relicFlag('duoFree')) c = 0;               // 은 호루라기
  if (d.time && C.payEnergy && relicFlag('hourglass')) c = Math.max(c, 1);   // 깨진 모래시계: 시간 대신 에너지 1
  const who = actorOf(d);
  if (who && litMembers().includes(who)) c += RULES.lightCost;
  c = Math.max(0, c - C.discount);
  return C.freeNext > 0 ? 0 : c;                                   // 속달
}
// 잠든 노엘은 깨우는 공격(wake)과 잠든 채 쓰는 카드(sleepOk)만
const sleepBlocked = d => d.ch === 'noel' && S.C.asleep && d.atk && !d.wake && !d.sleepOk;
export function usable(inst) {
  const d = cardDef(inst), cost = costOf(inst);
  if (cost == null || sleepBlocked(d)) return false;
  if (d.need && !d.need(S.C)) return false;
  if (d.ch !== 'curse' && !actorOf(d)) return false;
  return S.C.energy >= cost;
}
export const targetOf = inst => cardDef(inst).target;

// 카드를 쓴다. pick = { foe: 적 번호, ally: 동료 id }. 돌려주는 값: { duo } 또는 { needFoe } / { needAlly }
export function playCard(id, pick = {}) {
  const C = S.C, G = S.G;
  const i = C.hand.findIndex(h => h.uid === id); if (i < 0) return {};
  const inst = C.hand[i], d = cardDef(inst), who = actorOf(d);
  if (!usable(inst)) { logMsg(d.ch !== 'curse' && !who ? '쓰러진 동료의 카드는 쓸 수 없다.' : sleepBlocked(d) ? '노엘이 자고 있다.' : '에너지가 모자라.'); return {}; }
  if (d.target === 'ally' && !(pick.ally && alive(pick.ally))) return { needAlly: true };
  if (d.target === 'foe') {
    const L = livingFoes();
    if (pick.foe == null && L.length === 1) pick.foe = L[0].i;
    if (pick.foe == null || !C.all[pick.foe] || C.all[pick.foe].dead) return { needFoe: true };
  }
  const paid = costOf(inst);
  C.energy -= paid; C.discount = 0;
  if (C.freeNext > 0) C.freeNext--;
  C.hand.splice(i, 1);
  C.pending = null;
  G.played?.add(inst.id.replace(/\+$/, ''));
  if (d.time && !(C.payEnergy && relicFlag('hourglass'))) {
    const t = timeCost(d); if (t) { addTime(t); logMsg(`시간을 썼다: <b>+${t}분</b>`); }
    // 엘레오노르: 매 턴 처음 쓴 시간 카드는 에너지를 돌려준다
    if (!C.timeUsedTurn) { const back = G.party.reduce((s, p) => s + (alive(p) ? CHARACTERS[p].passive?.firstTimeEnergy || 0 : 0), 0); if (back) C.energy += back; }
  }
  if (d.time) { C.timeUsedTurn++; if (relicSum('timeCardBlock') && who) C.blocks[who] += relicSum('timeCardBlock'); }   // 모래시계 펜던트
  let duo = null, bond = null;
  if (d.ch === 'duo' && !d.bond) G.duoSet.add(`${d.a}+${d.b}`);
  // 맞춤 목도리·한 쌍의 방패: 듀오를 쓰면 두 사람에게
  if (d.ch === 'duo') for (const p of [d.a, d.b]) if (alive(p)) { if (relicSum('duoBlock')) C.blocks[p] += relicSum('duoBlock'); if (relicSum('duoHeal')) healMember(p, relicSum('duoHeal')); }
  if (d.ch !== 'duo' && d.ch !== 'curse') {
    // 연계 열쇠: 쌍둥이는 미미·모모가 서로 다른 동료. 「둘 다」 카드와 핀의 카드(link)는 언제나 잇는다.
    const key = d.sub ? `${d.ch}:${d.sub}` : d.ch;
    const differs = C.lastKey && (C.lastKey !== key || d.link || d.sub === 'both');
    if (differs) {
      const before = C.chain;
      C.chain = Math.min(RULES.chainMax, C.chain + 1);
      if (before < RULES.chainMax && C.chain === RULES.chainMax && relicSum('chain3Draw')) draw(relicSum('chain3Draw'));   // 쌍둥이 리본
      if (C.last !== d.ch) {
        const k = duoKey(C.last, d.ch), need = MOONS[G.moon].duoNeed ?? RULES.duoNeed;
        if (C.chain >= need && DUOS[k] && !C.duoUsed.has(k) && alive(C.last)) { C.duoUsed.add(k); duo = k; }
        // 인연의 실: 인연이 아닌 짝도 연계 3칸에서 「합동」
        else if (!DUOS[k] && relicFlag('bond') && C.chain >= RULES.chainMax && !C.duoUsed.has('bond:' + k) && alive(C.last)) { C.duoUsed.add('bond:' + k); bond = k; }
      }
    } else if (C.lastKey === key) C.chain = 0;
    // 쌍: 직전이 반대쪽 쌍둥이 카드(또는 「둘 다」)
    C.pair = !!d.sub && !!C.lastSub && (C.lastSub === 'both' || (d.sub !== 'both' && C.lastSub !== d.sub));
    C.pairMul = MOONS[G.moon].twinMul || 1;
    C.last = d.ch; C.lastKey = key; C.lastSub = d.sub || null;
    C.turnChars.add(d.ch);
  } else C.pair = false;
  C.playedTurn++;
  if (d.up) C.playedUp = true;
  C.actor = who; C.target = d.target === 'ally' ? pick.ally : who; C.tf = d.target === 'foe' ? pick.foe : null;
  // 공격 보너스: 연계 + 이번 턴 모든 동료 공격 + 비용 0 카드(각오) + 제노(포효·각성)
  C.bonus = d.atk ? C.chain + C.turnAtk + (paid === 0 ? C.zeroBonus : 0)
    + (who === 'zeno' ? C.zenoStr + (C.zenoAwake && E.low('zeno') ? C.zenoAwake : 0) : 0) : 0;
  C.atkCard = !!d.atk;
  if (d.ch !== 'curse') passives('beforeCard', d);
  pushFx({ kind: 'play', uid: inst.uid, id: inst.id, ch: d.ch, a: d.a, b: d.b, actor: who, target: d.target, foe: d.target === 'foe' ? pick.foe : null, ally: d.target === 'ally' ? pick.ally : null, time: !!d.time, atk: !!d.atk, chain: C.chain });
  C.curSlash = !!d.slash || /slash/.test(d.tags || '');
  const twice = C.double && d.ch !== 'curse' && !d.id.startsWith('seb.service'); if (twice) C.double = false;
  const bonus = C.bonus;
  d.play?.(C, E, d.v, d.up);
  if (twice && livingFoes().length) { C.bonus = bonus; d.play?.(C, E, d.v, d.up); }
  if (d.ch !== 'curse') passives('afterCard', d, pick);
  C.lastPlay = { d, tf: C.tf, target: C.target, actor: C.actor, pair: C.pair }; C.curSlash = false;
  C.bonus = 0; C.actor = null; C.target = null; C.tf = null; C.atkCard = false;
  if (d.exhaust || inst.ghost) C.exh.push(inst); else C.disc.push(inst);
  delete inst.disc;
  if (duo) { C.hand.push({ uid: uid++, id: 'duo:' + duo }); G.duos++; if (relicSum('duoDraw')) draw(relicSum('duoDraw')); }   // 쌍별 펜던트
  if (bond) C.hand.push({ uid: uid++, id: 'bond:' + bond });
  if (!livingFoes().length) winCombat();
  return { duo, bond };
}

// 이 카드를 지금 쓰면 듀오가 생기는지 (손패에서 미리 반짝이게). playCard의 조건과 같다.
export function duoPreview(inst) {
  const C = S.C, G = S.G; if (!C || !C.last) return null;
  const d = cardData(inst.id); if (d.ch === 'duo' || d.ch === 'curse' || d.ch === C.last) return null;
  const k = duoKey(C.last, d.ch), need = MOONS[G.moon].duoNeed ?? RULES.duoNeed;
  return DUOS[k] && !C.duoUsed.has(k) && alive(C.last) && Math.min(RULES.chainMax, C.chain + 1) >= need ? DUOS[k].name : null;
}

// 전투 중 대열 바꾸기: formation[i] ↔ [i+1], 턴마다 RULES.swapsPerTurn번, 바꾼 둘 방어 감소
export function swapInCombat(i) {
  const C = S.C, F = S.G.formation;
  if (C.swaps >= swapLimit() || i < 0 || i + 1 >= F.length) return false;
  swapFormation(i, i + 1); C.swaps++;
  if (relicSum('swapBlock')) for (const p of [F[i], F[i + 1]]) C.blocks[p] += relicSum('swapBlock');     // 묶음 밧줄
  else if (!relicFlag('swapFree')) for (const p of [F[i], F[i + 1]]) C.blocks[p] = Math.max(0, C.blocks[p] - RULES.swapBlockCost);
  logMsg(`대열을 바꿨다: ${CHARACTERS[F[i]].name} ↔ ${CHARACTERS[F[i + 1]].name}`);
  return true;
}

// 루나리아 「월광」: 첫 턴에 이번 전투의 달을 고른다
export function pickCombatMoon(k) {
  const C = S.C; if (!C?.moonPick || !MOONS[k]) return false;
  C.moonPick = false; E.setMoon(k); return true;
}
export const swapLimit = () => (relicSum('swaps') || RULES.swapsPerTurn) + (S.C?.swapsBonus || 0);

function foeAct(f) {
  const C = S.C, it = intentOf(f);
  pushFx({ kind: 'foeAct', i: f.i, t: it.t, v: it.v, n: it.n || 1 });
  if (it.t === 'atk') for (let k = 0; k < it.n && living().length; k++) enemyHit(f, it.v, k);
  else if (it.t === 'blk') { f.block += it.v; logMsg(`${f.name} 방어 ${it.v}`); }
  else if (it.t === 'buf') { f.str += it.v; logMsg(`${f.name}의 힘 +${it.v}`); }
  else if (it.t === 'deb') { const id = aimTarget(f); if (id) { C.ms[id][it.s] += it.v; logMsg(`${f.name} → ${CHARACTERS[id].name}: ${ST_NAME[it.s]} ${it.v}`); } }
  else if (it.t === 'curse') { for (let k = 0; k < it.n; k++) C.draw.push({ uid: uid++, id: it.card }); logMsg(`${f.name}: 저주 「${CARDS[it.card].name}」 ${it.n}장이 뽑을 더미 위에`); }
  else if (it.t === 'time') { addTime(it.v); logMsg(`${f.name}이(가) 밤 시계를 <b>${it.v}분</b> 돌렸다`); }
  else if (it.t === 'aoe') { for (const p of living()) hurtMember(p, foeDmg(f, it.v, p), f.name); }
  else if (it.t === 'boom') {
    for (const p of living()) hurtMember(p, foeDmg(f, it.v, p), `${f.name}의 자폭`);
    f.hp = 0; f.deathBoom = 0; killCheck(f);
  }
  else if (it.t === 'gblk') { for (const g of livingFoes()) g.block += it.v; logMsg(`${f.name}: 모든 적 방어 ${it.v}`); }
  else if (it.t === 'mend') {
    const g = livingFoes().reduce((a, b) => (b.hp / b.max) < (a.hp / a.max) ? b : a);
    g.hp = Math.min(g.max, g.hp + it.v); logMsg(`${f.name} → ${g.name}: 체력 ${it.v} 회복`);
  }
  else if (it.t === 'sum') {
    if (livingFoes().length < 3 && C.all.length < 6) {
      const g = makeFoe(it.id, C.all.length, 1 + (depthRule('fightHp') || 0)); g.str = Math.max(g.str, f.str > 0 ? 0 : g.str);
      C.all.push(g); logMsg(`${f.name}이(가) <b>${g.name}</b>을(를) 불렀다`);
    } else { f.block += 6; logMsg(`${f.name} 방어 6`); }
  }
  else if (it.t === 'steal') {
    for (let k = 0; k < it.n; k++) {
      const pile = C.draw.length ? C.draw : C.disc; if (!pile.length) break;
      const j = S.G.rng.int(pile.length), [h] = pile.splice(j, 1); f.stolen.push(h);
      logMsg(`${f.name}이(가) 「${cardDef(h).name}」을(를) 훔쳤다`);
    }
  }
  else if (it.t === 'aim') { f.aim = it.a; logMsg(`${f.name}의 노림: ${AIM_NAME[it.a]}`); }
  else { enemyHit(f, it.v); f.block += it.b; }
}

export function endTurn() {
  const C = S.C, G = S.G;
  // 손패에 남은 저주
  for (const h of C.hand) {
    const x = cardDef(h).inHandEnd; if (!x) continue;
    if (x.time) { addTime(x.time); logMsg(`졸음: 밤 시계 <b>+${x.time}분</b>`); }
    if (x.hurt) { const L = living(); if (L.length) hurtMember(G.rng.pick(L), x.hurt, '안개'); }
    if (x.frontBlock) { const p = living()[0]; if (p) C.blocks[p] = Math.max(0, C.blocks[p] - x.frontBlock); }
  }
  // 남기기: 세바스 패시브(가장 비싼 1장) + 예약·전해 줄게(가장 비싼 카드, 다음 턴 비용 −1)
  const keepN = (alive('sebas') ? CHARACTERS.sebas.passive.keepCard : 0) + C.reserve;
  const keepable = C.hand.filter(h => !/^(duo|bond):/.test(h.id) && cardDef(h).ch !== 'curse' && !h.ghost)
    .sort((a, b) => (cardDef(b).cost - cardDef(a).cost) || (b.uid - a.uid));
  // 직접 고른 카드(남기기 표시)가 먼저, 나머지는 가장 비싼 카드
  const marked = (C.keepMark || []).map(u => keepable.find(h => h.uid === u)).filter(Boolean);
  const keep = [...marked, ...keepable.filter(h => !marked.includes(h))].slice(0, keepN);
  C.keepMark = [];
  keep.forEach((h, k) => { if (k >= keepN - C.reserve) h.disc = (h.disc || 0) + 1; });
  C.keepCards = keep;
  for (const h of C.hand) if (!/^(duo|bond):/.test(h.id) && !keep.includes(h)) (h.ghost ? C.exh : C.disc).push(h);
  C.hand = []; C.pending = null;
  pushFx({ kind: 'foeTurn', keep: keep.map(h => h.uid) });
  // 정령: 내 턴 끝마다 (시온이 서 있을 때)
  if (alive('sion') && C.spirits.length) { E.spiritsAct(1 + C.spiritExtra); if (!livingFoes().length) return winCombat(); }
  for (const f of C.all) {
    if (f.dead) continue;
    if (f.burn > 0) { f.hp = Math.max(0, f.hp - f.burn); pushFx({ kind: 'tick', i: f.i, dmg: f.burn, what: 'burn' }); logMsg(`${f.name} 화상 피해 <b>${f.burn}</b>`); f.burn = Math.floor(f.burn / 2); }
    if (f.poison > 0 && !(f.noPoisonWhileBlock && f.block > 0)) { f.hp = Math.max(0, f.hp - f.poison); pushFx({ kind: 'tick', i: f.i, dmg: f.poison, what: 'poison' }); logMsg(`${f.name} 독 피해 <b>${f.poison}</b>`); f.poison--; }
    killCheck(f); if (f.dead) continue;
    f.block = 0;
    for (let a = 0; a < f.acts && !f.dead && living().length; a++) {
      if (f.skip > 0) { f.skip--; logMsg(`${f.name}의 행동이 멈췄다`); }
      else foeAct(f);
      f.pi++;
    }
    f.dim = 0; f.aimOverride = null;
    if (f.weak > 0) f.weak--; if (f.vuln > 0) f.vuln--;
  }
  if (C.air > 0) C.air--;
  for (const p in C.ms) { const s = C.ms[p]; if (s.weak > 0) s.weak--; if (s.vuln > 0) s.vuln--; }
  if (!livingFoes().length) return winCombat();
  if (!living().length) return endRun(false);
  startTurn();
}

// 보상 카드: 파티 셋에게서 한 장씩. 희귀도는 칸 종류별 확률 + 희귀가 안 나온 만큼 보정 (docs/10_details.md §1)
export function rewardCards(kind = 'fight', extra = 0) {
  const G = S.G, odds = REWARD.odds[kind] || REWARD.odds.fight;
  const out = [];
  const who = G.rng.shuffle(G.party.slice());
  for (let k = 0; k < extra; k++) who.push(G.rng.pick(G.party));     // 보물 지도: 한 장 더
  for (const p of who) {
    let x = G.rng.next(), r;
    const rare = odds.r + (kind === 'boss' ? 0 : G.pity);
    if (x < rare) r = 'r'; else if (x < rare + odds.u) r = 'u'; else r = 'c';
    // 아직 안 열린 카드 묶음(G.locked)은 나오지 않는다
    const mine = Object.keys(CARDS).filter(id => CARDS[id].ch === p && !out.includes(id) && !G.locked?.has(id));
    const pool = mine.filter(id => CARDS[id].rarity === r);
    out.push(G.rng.pick(pool.length ? pool : mine));
  }
  if (kind !== 'boss') G.pity = out.some(id => CARDS[id].rarity === 'r') ? 0 : G.pity + REWARD.pityStep;
  for (const id of out) G.offered?.add(id);
  // 별자리 띠: 보상 카드가 한 장 적다 (보스 보상은 그대로)
  if (kind !== 'boss' && relicSum('rewardLess')) out.length = Math.max(1, out.length - relicSum('rewardLess'));
  return out;
}

function winCombat() {
  const G = S.G, C = S.C, k = C.kind, chain = C.chain, extra = C.rewardExtra, winGold = C.winGold;
  G.moon = C.moonBase;                       // 루나리아가 바꾼 달은 이번 전투만
  for (const f of C.all) G.foesBeat?.add(f.key);
  G.fights++; S.C = null;
  // 에피소드 특별 전투: 보상 없이 이야기로 돌아간다 (js/episodes.js)
  if (G.episode) { G.episode.won = true; G.screen = 'epdone'; return; }
  const lost = G.deck.filter(id => cardData(id).inDeckWin);
  for (const id of lost) addTime(cardData(id).inDeckWin.time);
  // 쓰러진 동료는 전투가 끝나면 체력 1로(붕대 묶음이면 30%로) 일어난다
  const pct = relicSum('revivePct');
  for (const p of G.party) { const m = member(p); if (m.down) { m.down = false; m.hp = pct ? Math.max(1, Math.ceil(m.max * pct)) : RULES.reviveHp; } }
  // 바다 유리: 남은 연계 칸마다 모두 회복 · 구급 가방: 가장 낮은 동료 회복
  if (relicSum('winChainHeal') && chain) for (const p of G.party) healMember(p, chain * relicSum('winChainHeal'));
  if (relicSum('winHealLowest')) { const p = G.party.reduce((x, y) => member(y).hp < member(x).hp ? y : x); healMember(p, relicSum('winHealLowest')); }
  // 패시브 onWin (마리아나 별빛, 고든 회복) · 큰 손님
  const x = { gold: n => gainGold(n), healAll: n => healAll(n) };
  for (const p of G.party) CHARACTERS[p].passive?.onWin?.(G, x);
  if (winGold) gainGold(winGold);
  if (relicSum('winRewind')) rewind(relicSum('winRewind'));   // 시곗줄·거꾸로 도는 시계
  if (k === 'boss') {
    G.bossKills++;
    if (G.tutorial) { G.tutorial.won = true; G.screen = 'tutdone'; return; }   // 첫 실행 튜토리얼 끝 (js/tutorial.js)
    if (G.act === 3) return endRun(true);
    for (const p of G.party) healMember(p, Math.ceil(member(p).max * RULES.bossHealPct));
    G.reward = { cards: rewardCards('boss', extra), next: 'act', kind: k };
  } else G.reward = { cards: rewardCards(k, extra), next: 'map', kind: k, bonus: k === 'elite' ? RULES.eliteHeal : 0 };
  if (G.reward.bonus) for (const p of G.party) healMember(p, G.reward.bonus);
  const [lo, hi] = RULES.gold[k] || RULES.gold.fight;
  G.reward.gold = lo + G.rng.int(hi - lo + 1) + relicSum('winGold');
  gainGold(G.reward.gold);
  if (k === 'elite') { G.elites++; const r = rollRelic(G.rng); if (r) { G.reward.relic = r; gainRelic(r); } }
  G.screen = 'reward';
}

// 개발판 점검용: 지금 전투를 바로 이긴다
export function devWin() { for (const f of S.C.all) { f.hp = 0; f.dead = true; } winCombat(); }

// ---- 화면에 보일 수 (docs/10_details.md §6: 힘·약화·연계·달을 반영한 실제 값)
// 이 카드를 지금 쓰면 붙을 연계 보너스 + 패시브 미리보기
function predictedBonus(d) {
  const C = S.C; if (!C || !d.atk) return 0;
  let chain = C.chain;
  if (d.ch !== 'duo' && d.ch !== 'curse') {
    const key = d.sub ? `${d.ch}:${d.sub}` : d.ch;
    chain = C.lastKey && (C.lastKey !== key || d.link || d.sub === 'both') ? Math.min(RULES.chainMax, C.chain + 1) : C.lastKey === key ? 0 : C.chain;
  }
  let p = C.turnAtk;
  if (d.cost === 0) p += C.zeroBonus;
  if (d.ch === 'zeno') p += C.zenoStr + (C.zenoAwake && E.low('zeno') ? C.zenoAwake : 0);
  for (const m of S.G.party) if (alive(m)) p += CHARACTERS[m].passive?.preview?.(C, d, E) || 0;
  return chain + p;
}
// type: d 피해 · b 방어 · k 장전/마력/독 · n 그냥 수. first = 카드 글의 첫 피해 수(연계 보너스는 첫 타에만)
export function shownValue(d, type, base, first) {
  const G = S.G; if (!G) return base;
  const who = S.C ? actorOf(d) : (d.ch === 'duo' ? d.a : d.ch);
  const boost = MOONS[G.moon].boost?.[who] || 0;
  if (type === 'k') return base + (MOONS[G.moon].darkBonus || 0);
  if (type === 'b') return base + boost;
  if (type !== 'd') return base;
  let x = base + boost + (first ? predictedBonus(d) : 0);
  const C = S.C; if (!C) return x;
  if (who && C.ms[who]?.weak) x *= RULES.weakMul;
  const L = livingFoes(), f = C.all[C.hover] && !C.all[C.hover].dead ? C.all[C.hover] : L.length === 1 ? L[0] : null;
  if (f?.vuln && d.target !== 'all') x *= RULES.vulnMul;
  return Math.floor(x);
}

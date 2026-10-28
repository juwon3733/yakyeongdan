// 자동 플레이 시뮬레이션 (docs/07_tech.md). DOM 없이 엔진(js/run·map·combat·data)을 Node에서 돌린다.
//   node tools/sim.mjs            기본 2000판
//   node tools/sim.mjs --quick    200판 (CI: 오류만 잡고 숫자는 참고)
//   node tools/sim.mjs --runs 500 --seed 1000 --json out.json
//   node tools/sim.mjs --fight captain --party iris,brick,marta --act 2 --n 200   보스 하나만 시작 덱으로
//   TW=0.8 node tools/sim.mjs   봇이 밤 시계 1분을 얼마로 치는지 (기본 1.2)
//
// 봇: 카드 한 장씩 "써 보고 되돌리기"(상태 스냅숏)로 가장 이득인 카드를 고른다.
//   이득 = 적 체력·상태 + 이번 턴 막을 피해 + 장전·마력·연계·듀오 + 밤 시계 비용(남은 시간에 따라 무게가 달라짐)
//   지도: 체력·남은 시간·별빛을 보고 칸 고르기 / 보상: 희귀도·덱 크기 / 휴식: 체력이면 쉬기, 늦으면 낮잠, 아니면 손질
import { S, newRun, checkCollapse, member, alive, living } from '../js/run.js';
import { goNode, reachable, takeReward, rest, chooseOpt, eventApi, removeCard, upgradeCard, dupeCard, shopBuy, leaveShop, pickBossRelic, pickMoon, useRelic, nodeTime, removePrice } from '../js/map.js';
import { playCard, endTurn, usable, targetOf, livingFoes, foeTarget, intentOf, aimTarget, foeDmg, cardDef, pickCombatMoon } from '../js/combat.js';
import { spiritDmg } from '../js/effects.js';
import { CHARACTERS } from '../js/data/characters.js';
import { CARDS, cardData, canUpgrade, DUOS } from '../js/data/cards.js';
import { RULES, SHOP, NODE } from '../js/data/rules.js';
import { RELICS } from '../js/data/relics.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const QUICK = args.includes('--quick');
const RUNS = +opt('--runs', QUICK ? 200 : 2000);
const SEED0 = +opt('--seed', 1);
const JSON_OUT = opt('--json', null);
const VERBOSE = args.includes('-v');

// ---------- 난수: 엔진의 G.rng를 상태를 저장·복원할 수 있는 같은 알고리즘으로 바꾼다 ----------
function rngFrom(a) {
  const r = {
    a: a >>> 0,
    next() {
      r.a = (r.a + 0x6D2B79F5) | 0;
      let t = Math.imul(r.a ^ (r.a >>> 15), 1 | r.a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int: n => Math.floor(r.next() * n),
    pick: arr => arr[r.int(arr.length)],
    pickN(arr, n) { const a2 = arr.slice(), out = []; while (out.length < n && a2.length) out.push(a2.splice(r.int(a2.length), 1)[0]); return out; },
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = r.int(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    get state() { return r.a >>> 0; },
  };
  return r;
}

// ---------- 스냅숏: 판(G)과 전투(C)를 깊이 복사했다가 되돌린다 ----------
function copy(x, seen = new Map()) {
  if (x === null || typeof x !== 'object') return x;
  if (seen.has(x)) return seen.get(x);
  if (x instanceof Set) { const s = new Set(); seen.set(x, s); for (const v of x) s.add(copy(v, seen)); return s; }
  if (Array.isArray(x)) { const a = []; seen.set(x, a); for (const v of x) a.push(copy(v, seen)); return a; }
  const o = {}; seen.set(x, o);
  for (const k of Object.keys(x)) { if (k === 'rng') continue; const v = x[k]; o[k] = typeof v === 'function' ? v : copy(v, seen); }
  return o;
}
function snap() {
  const seen = new Map();
  return { G: copy(S.G, seen), C: S.C ? copy(S.C, seen) : null, a: S.G.rng.a, fx: S.fxq.length };
}
function restore(s) {
  const seen = new Map();
  const G = copy(s.G, seen); G.rng = rngFrom(s.a); S.G = G;
  if (s.C) {
    const C = copy(s.C, seen);
    Object.defineProperty(C, 'block', { get() { return C.actor ? C.blocks[C.actor] : 0; }, set(v) { if (C.actor) C.blocks[C.actor] = v; }, configurable: true });
    Object.defineProperty(C, 'foe', { get: foeTarget, configurable: true });
    Object.defineProperty(C, 'foes', { get: livingFoes, configurable: true });
    Object.defineProperty(C, 'anyDown', { get: () => S.G.party.some(p => member(p).down), configurable: true });
    S.C = C;
  } else S.C = null;
  S.fxq.length = s.fx;
}

// ---------- 시간 무게: 일정보다 늦을수록 분이 비싸다 ----------
// 일정: 막마다 약 120분, 막 안에서는 층마다 25분 (평균 5:30 도착 목표)
function schedule() { const G = S.G; return (G.act - 1) * 120 + Math.min(G.row, 4) * 25; }
function timeWeight() {
  const G = S.G, slack = schedule() - G.clock;
  let w = (+process.env.TW || 1.2) + Math.max(0, -slack) / 60 * 0.4;
  if (G.clock >= RULES.dawn - 30) w += 0.6;
  return w;
}

// ---------- 전투 평가 ----------
// 이번 턴 끝에 적이 줄 피해를 동료별로 (방어 반영), 쓰러질 위험
function incoming() {
  const C = S.C, dmg = {}, blk = { ...C.blocks };
  for (const f of livingFoes()) {
    const it = intentOf(f);
    for (let a = 0; a < (f.acts || 1); a++) {
      const all = it.t === 'aoe' || it.t === 'boom';
      const hits = it.t === 'atk' ? it.n : it.t === 'mix' ? 1 : all ? living().length : 0;
      for (let k = 0; k < hits; k++) {
        const id = all ? living()[k] : aimTarget(f, k); if (!id) continue;
        let d = C.noDmg ? 0 : foeDmg(f, it.v, id);
        if (id === 'sigrun' && C.air) d = Math.ceil(d / 2);
        if (f.skip > 0) d = 0;
        const b = Math.min(blk[id] || 0, d); blk[id] -= b; d -= b;
        dmg[id] = (dmg[id] || 0) + d;
      }
    }
  }
  return dmg;
}
function combatValue(t0clock) {
  const G = S.G, C = S.C;
  if (!C) {
    // 전투가 끝났다: 이김(보상 화면) 또는 짐
    if (G.screen === 'result' && !G.won) return -9999;
    let v = 2000;
    for (const p of G.party) v += member(p).hp * 2;
    return v - (G.clock - t0clock) * timeWeight();
  }
  let v = 0;
  for (const f of C.all) {
    if (f.dead) { v += 40 + f.max * 0.6; continue; }
    v -= f.hp * 1.0 + f.block * 0.6;
    const atk = intentOf(f).t === 'atk' || intentOf(f).t === 'mix';
    v += Math.min(f.poison, f.hp) * 0.9 + Math.min(f.burn, f.hp) * 0.7 + f.bleed * 1.2;
    v += f.weak * (atk ? 3 : 1.5) + f.vuln * 3;
    v -= f.str * 2;
  }
  const inc = incoming();
  for (const p of G.party) {
    const m = member(p);
    if (m.down) { v -= 60; continue; }
    const d = inc[p] || 0, left = m.hp - d;
    v += m.hp * 1.2 - d * 1.4;
    if (left <= 0) v -= 45;                 // 이번 턴에 쓰러짐
    else if (left < m.max * 0.25) v -= 6;
  }
  v += C.loaded * 3.5 + C.mana * 2.2 + (C.asleep && alive('noel') ? 6 : 0) + (C.late ? C.mana * 2 : 0);
  v += C.chain * 1.5 + C.sheath * 1 + C.garden * 6 + (C.retain ? 4 : 0) + C.nextEnergy * 5 + C.counter * 0.8;
  v += C.hand.filter(h => /^(duo|bond):/.test(h.id)).length * 5;
  // 새 동료 상태: 정령(턴 끝 피해), 다음 턴 덕, 담금질, 남길 카드
  if (alive('sion')) v += C.spirits.reduce((t, s) => t + spiritDmg(s), 0) * (1 + C.spiritExtra) * 1.3;
  v += C.nextDraw * 2 + C.nextAtk * 3 + C.reserve * 2 + C.tempered * 1.5 + (C.double ? 6 : 0) + C.freeNext * 3 + C.zenoStr * 2 + C.spiritExtra * 4;
  v += Object.values(C.nextBlock).reduce((t, x) => t + x, 0) * 0.6;
  for (const f of C.all) if (!f.dead) v += f.bounty * 0.15;
  v += G.gold * 0.05;
  v += C.hand.length * 0.6;
  v -= (G.clock - t0clock) * timeWeight();
  return v;
}

// 스냅숏을 되돌리면 S.C가 새 객체가 되므로, 같은 전투인지는 표식으로 본다
let combatTag = 0;
const sameCombat = tag => !!S.C && S.C._tag === tag;
// 루나리아 「월광」: 파티에 맞는 달 고르기
function chooseMoon() {
  const P = S.G.party, has = k => P.includes(k);
  const k = has('sion') || has('iris') || has('marta') ? 'full' : has('noel') || has('raven') || has('brick') ? 'new'
    : has('mimimomo') ? 'half' : S.G.deck.some(id => cardData(id)?.time) ? 'crescent' : 'half';
  pickCombatMoon(k);
}
function playTurn(stats) {
  if (S.C.moonPick) chooseMoon();
  const tag = S.C._tag, turn = S.C.turn;
  for (let guard = 0; guard < 20 && sameCombat(tag) && S.C.turn === turn; guard++) {
    const t0 = S.G.clock;
    const base = combatValue(t0);
    let best = null;
    // 써 보기가 S.C를 바꾸므로 손패는 복사해 두고 돈다
    for (const inst of S.C.hand.slice()) {
      if (!usable(inst)) continue;
      const d = cardDef(inst), tk = targetOf(inst);
      const picks = tk === 'foe' ? livingFoes().map(f => ({ foe: f.i })) : tk === 'ally' ? living().map(a => ({ ally: a })) : [{}];
      for (const pick of picks) {
        const s = snap();
        playCard(inst.uid, pick);
        const gain = combatValue(t0) - base;
        restore(s);
        // 에너지를 쓰는 카드는 아주 작은 이득이면 안 쓴다 (다음 카드 몫)
        const need = (d.cost || 0) * 0.5;
        if (gain > need && (!best || gain > best.gain)) best = { uid: inst.uid, pick, gain, id: inst.id };
      }
    }
    if (!best) break;
    const ck = S.G.clock;
    const r = playCard(best.uid, best.pick);
    stats.cardMin = (stats.cardMin || 0) + (S.G ? S.G.clock - ck : 0);
    stats.plays[best.id.replace(/\+$/, '')] = (stats.plays[best.id.replace(/\+$/, '')] || 0) + 1;
    if (r.duo) stats.duoMade[r.duo] = (stats.duoMade[r.duo] || 0) + 1;
    if (/^duo:/.test(best.id)) stats.duoPlayed[best.id.slice(4)] = (stats.duoPlayed[best.id.slice(4)] || 0) + 1;
  }
  if (sameCombat(tag) && S.C.turn === turn) {
    stats.turns = (stats.turns || 0) + 1;
    stats.leftEnergy = (stats.leftEnergy || 0) + S.C.energy;
    stats.leftUsable = (stats.leftUsable || 0) + S.C.hand.filter(usable).length;
    endTurn();
  }
}

// ---------- 판 평가 (사건 고르기용) ----------
function runValue() {
  const G = S.G;
  let v = 0;
  for (const p of G.party) { const m = member(p); v += m.hp * 1.0 + m.max * 0.6; }
  v += G.gold * 0.12 + G.relics.length * 10;
  for (const id of G.deck) {
    const d = cardData(id); if (!d) continue;
    if (d.ch === 'curse') v -= 14; else v += { c: 2, u: 4, r: 7 }[d.rarity] || 2;
    if (id.endsWith('+')) v += 3;
  }
  v -= G.clock * timeWeight();
  return v;
}

// ---------- 판 밖 결정 ----------
const hpRatio = () => { const G = S.G; let h = 0, m = 0; for (const p of G.party) { h += member(p).hp; m += member(p).max; } return h / m; };
const minRatio = () => Math.min(...S.G.party.map(p => member(p).hp / member(p).max));

function chooseNode(stats) {
  const G = S.G, opts = reachable(G.row);
  if (G.clock >= 300 && G.relics.includes('old_watch') && !G.used.old_watch) useRelic('old_watch');
  const slack = schedule() + 25 - G.clock, hr = hpRatio(), mr = minRatio(), w = timeWeight();
  let best = opts[0], bs = -1e9;
  for (const i of opts) {
    const t = G.map.rows[G.row][i];
    let s = 0;
    if (t === 'fight') s = 7 - (hr < 0.35 ? 6 : 0);
    else if (t === 'elite') s = hr > 0.7 && mr > 0.5 ? 12 : hr > 0.5 ? 2 : -12;
    else if (t === 'rest') s = (1 - hr) * (G.map.rows[G.row + 1]?.[0] === 'boss' ? 70 : 30) + (mr < 0.4 ? 8 : 0) + (slack < -20 ? 8 : 0) + 2;
    else if (t === 'shop') s = G.gold >= 90 ? 9 : G.gold >= 60 ? 4 : -2;
    else if (t === 'event') s = 5;
    else if (t === 'boss') s = 0;
    s -= nodeTime(t) * w;
    s += S.G.rng ? 0 : 0;
    if (s > bs) { bs = s; best = i; }
  }
  stats.nodeMin = (stats.nodeMin || 0) + nodeTime(G.map.rows[G.row][best]);
  goNode(G.row, best);
}

function cardScore(id) {
  const d = cardData(id); if (!d) return -99;
  if (d.ch === 'curse') return -20;
  let s = { c: 3, u: 5, r: 8 }[d.rarity] || 3;
  if (d.time) s -= 1.5;
  if (d.cost >= 3) s -= 1;
  const G = S.G, same = G.deck.filter(x => x.replace(/\+$/, '') === id).length;
  s -= same * 1.5;
  if (G.deck.length > 22) s -= (G.deck.length - 22) * 0.4;
  return s;
}
function chooseReward(stats) {
  const G = S.G, cards = G.reward.cards || [];
  for (const c of cards) stats.offered[c] = (stats.offered[c] || 0) + 1;
  let best = null, bs = 2.5;
  for (const c of cards) { const s = cardScore(c); if (s > bs) { bs = s; best = c; } }
  if (best) stats.taken[best] = (stats.taken[best] || 0) + 1;
  takeReward(best);
}
function upgradeIndex() {
  const G = S.G; let bi = -1, bs = -1e9;
  G.deck.forEach((id, i) => {
    if (!canUpgrade(id)) return;
    const d = cardData(id), s = ({ c: 2, u: 4, r: 6 }[d.rarity] || 1) + (d.time ? 1 : 0) + (d.atk ? 1 : 0);
    if (s > bs) { bs = s; bi = i; }
  });
  return bi;
}
function removeIndex() {
  const G = S.G; let bi = -1, bs = 1e9;
  G.deck.forEach((id, i) => {
    const d = cardData(id); if (!d) return;
    const s = d.ch === 'curse' ? -10 : ({ c: 2, u: 4, r: 6 }[d.rarity] || 2) + (id.endsWith('+') ? 3 : 0) + (d.time ? 2 : 0);
    if (s < bs) { bs = s; bi = i; }
  });
  return bi;
}
function dupeIndex() {
  const G = S.G; let bi = -1, bs = -1e9;
  G.deck.forEach((id, i) => { const s = cardScore(id) + (id.endsWith('+') ? 2 : 0); if (s > bs) { bs = s; bi = i; } });
  return bi;
}
function doRest() {
  const G = S.G, hr = hpRatio(), mr = minRatio(), slack = schedule() + 25 - G.clock;
  const boss = G.map.rows[G.row + 1]?.[0] === 'boss';
  if (hr < (boss ? 0.8 : 0.6) || mr < (boss ? 0.6 : 0.4)) rest('heal');
  else if (slack < -25) rest('nap');
  else if (G.deck.some(canUpgrade)) rest('smith');
  else rest('heal');
}
function doShop() {
  const G = S.G, sh = G.shop;
  if (G.deck.some(id => cardData(id).ch === 'curse') && G.gold >= removePrice() && !sh.removed) { shopBuy('remove'); return; }
  for (let k = 0; k < sh.relics.length; k++) { const r = sh.relics[k]; if (!r.sold && G.gold >= r.price + 20) { shopBuy('relic', k); return; } }
  let bi = -1, bs = 5;
  sh.cards.forEach((c, k) => { if (c.sold || G.gold < c.price) return; const s = cardScore(c.id) + (c.sale ? 1 : 0); if (s > bs) { bs = s; bi = k; } });
  if (bi >= 0) { shopBuy('card', bi); return; }
  if (G.gold >= removePrice() && !sh.removed && G.deck.length > 14) { shopBuy('remove'); return; }
  if (G.gold >= SHOP.upgrade && G.deck.some(canUpgrade)) { shopBuy('upgrade'); return; }
  leaveShop();
}
function doEvent() {
  const G = S.G, ev = G.event, x0 = runValue();
  let bi = 0, bs = -1e9;
  const x = eventApi();
  ev.opts.forEach((o, i) => {
    if (o.can && !o.can(x)) return;                                       // 못 고르는 선택지
    const s = snap();
    chooseOpt(i);
    let v = runValue();
    if (S.G.screen === 'event' && S.G.event?.def.id === ev.def.id) v = -1e9;
    if (S.G.screen === 'remove') v += 8; else if (S.G.screen === 'dupe') v += 6;
    restore(s);
    if (v > bs) { bs = v; bi = i; }
  });
  void x0;
  chooseOpt(bi);
}
function chooseBossRelic() {
  const G = S.G, list = G.bossRelics || [];
  const pref = G.clock > 260 ? ['dawn_feather', 'star_crown', 'stopped_tower'] : ['star_crown', 'stopped_tower', 'dawn_feather'];
  pickBossRelic(pref.find(k => list.includes(k)) || list[0]);
}

// ---------- 한 판 ----------
function playRun(party, seed, stats) {
  newRun(party, seed);
  S.G.rng = rngFrom(S.G.rng.state);
  const G0 = S.G;
  const rec = { party, seed, won: false, why: '', bossReach: [0, 0, 0, 0], bossClock: [null, null, null, null], over6: false, clock: 0, duos: 0, act: 1, fights: 0 };
  let lastAct = 1, steps = 0;
  while (S.G.screen !== 'result' && steps++ < 4000) {
    const G = S.G;
    if (G.clock >= RULES.dawn) rec.over6 = true;
    if (G.moonPick && G.screen !== 'combat') { pickMoon(G.deck.some(id => cardData(id).time) ? 'crescent' : 'half'); continue; }
    const sc = G.screen;
    if (sc === 'map') {
      if (G.map.rows[G.row]?.[0] === 'boss') rec.bossReach[G.act] = 1;
      chooseNode(stats);
    }
    else if (sc === 'combat') {
      rec.lastFight = `${G.act}막 ${S.C.kind}`;
      let turns = 0; const tag = S.C._tag = ++combatTag;
      while (sameCombat(tag) && S.G.screen === 'combat' && turns++ < 60) { playTurn(stats); if (checkCollapse()) break; }
      if (sameCombat(tag) && turns >= 60) { rec.why = 'stall'; S.G.screen = 'result'; S.G.won = false; break; }
      if (S.G.screen === 'reward' && S.G.reward?.next === 'act') rec.bossClock[S.G.act] = S.G.clock;
    }
    else if (sc === 'reward') chooseReward(stats);
    else if (sc === 'bossrelic') chooseBossRelic();
    else if (sc === 'rest') doRest();
    else if (sc === 'upgrade') upgradeCard(upgradeIndex());
    else if (sc === 'remove') removeCard(removeIndex());
    else if (sc === 'dupe') dupeCard(dupeIndex());
    else if (sc === 'shop') doShop();
    else if (sc === 'event') doEvent();
    else throw new Error('모르는 화면: ' + sc);
    checkCollapse();
    if (S.G.act !== lastAct) lastAct = S.G.act;
  }
  const G = S.G;
  void G0;
  if (!G.won) stats.deathAt[(G.why === 'collapse' ? '7시 ' : '') + rec.lastFight] = (stats.deathAt[(G.why === 'collapse' ? '7시 ' : '') + rec.lastFight] || 0) + 1;
  if (G.screen !== 'result') { rec.why = rec.why || `stuck:${G.screen}`; console.error(`멈춘 판: 시드 ${seed} ${party.join('·')} 화면 ${G.screen}${G.event ? ` 사건 ${G.event.def.id}` : ''}`); }
  rec.won = !!G.won; rec.why = rec.why || G.why; rec.clock = G.clock; rec.act = G.act; rec.duos = G.duoSet.size; rec.fights = G.fights;
  if (G.clock >= RULES.dawn) rec.over6 = true;
  if (rec.won) rec.bossClock[3] = G.clock;
  for (const k of G.duoSet) stats.duoRuns[k] = (stats.duoRuns[k] || 0) + 1;
  return rec;
}

// 보스 하나만 여러 번 (밸런스 확인용): node tools/sim.mjs --fight captain --party iris,brick,marta --deck act2
if (opt('--fight', null)) {
  const ids = opt('--fight').split(','), party = (opt('--party', 'iris,brick,marta')).split(','), n = +opt('--n', 200);
  const { startCombat } = await import('../js/combat.js');
  let won = 0, turnsT = 0; const st = { plays: {}, duoMade: {}, duoPlayed: {}, deathAt: {} };
  for (let k = 0; k < n; k++) {
    newRun(party, 1000 + k); S.G.rng = rngFrom(S.G.rng.state);
    S.G.act = +opt('--act', 2); S.G.clock = +opt('--clock', 240);
    startCombat(ids, 'boss');
    const tag = S.C._tag = ++combatTag; let t = 0;
    while (sameCombat(tag) && t++ < 60) playTurn(st);
    turnsT += t; if (S.G.screen !== 'result') won++;
  }
  console.log(`${ids.join('+')} vs ${party.join('·')}: 이김 ${(100 * won / n).toFixed(0)}%, 평균 ${(turnsT / n).toFixed(1)}턴`);
  process.exit(0);
}

// ---------- 돌리기 ----------
const IDS = Object.keys(CHARACTERS);
// --stars 3 : 그 성급 동료만으로 짠 파티만 (성급별 밸런스 확인용)
const ONLY = +opt('--stars', 0);
const combos = [];
for (let a = 0; a < IDS.length; a++) for (let b = a + 1; b < IDS.length; b++) for (let c = b + 1; c < IDS.length; c++) {
  const p = [IDS[a], IDS[b], IDS[c]];
  if (!ONLY || p.every(id => CHARACTERS[id].rarity === ONLY)) combos.push(p);
}
// 조합 순서를 시드로 섞어서 판 수가 적어도 동료가 고르게 나오게
{ const r = rngFrom(SEED0 * 2654435761); r.shuffle(combos); }

const stats = { deathAt: {}, plays: {}, offered: {}, taken: {}, duoMade: {}, duoPlayed: {}, duoRuns: {} };
const recs = [];
const t0 = Date.now();
for (let n = 0; n < RUNS; n++) {
  const party = combos[n % combos.length].slice();
  const seed = (SEED0 + n * 7919) >>> 0;
  try { recs.push(playRun(party, seed, stats)); }
  catch (e) { console.error(`판 ${n} (시드 ${seed}, ${party.join('·')}) 오류:`, e.stack); process.exit(1); }
  if (VERBOSE && n % 50 === 0) process.stderr.write(`${n}…`);
}
const secs = (Date.now() - t0) / 1000;

// ---------- 결과 ----------
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-';
const avg = arr => arr.length ? arr.reduce((t, x) => t + x, 0) / arr.length : NaN;
const hhmm = m => { if (isNaN(m)) return '-'; m = Math.round(m); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const N = recs.length;
const reach1 = recs.filter(r => r.bossReach[1]).length, reach2 = recs.filter(r => r.bossReach[2]).length, reach3 = recs.filter(r => r.bossReach[3]).length;
const wins = recs.filter(r => r.won);
const why = {}; for (const r of recs) if (!r.won) why[r.why] = (why[r.why] || 0) + 1;

const out = {
  runs: N, seconds: secs,
  reachBoss1: reach1 / N, reachBoss2: reach2 / N, reachBoss3: reach3 / N, winRate: wins.length / N,
  avgArrival: avg(wins.map(r => r.clock)), over6: recs.filter(r => r.over6).length / N,
  act1End: avg(recs.filter(r => r.bossClock[1] != null).map(r => r.bossClock[1])),
  act2End: avg(recs.filter(r => r.bossClock[2] != null).map(r => r.bossClock[2])),
  loss: why,
};
console.log(`야경단 시뮬레이션: ${N}판, ${secs.toFixed(1)}초 (시드 ${SEED0}부터, 동료 ${IDS.length}명 조합 ${combos.length}개 돌아가며)`);
console.log('');
console.log('| 항목 | 값 | 목표 |');
console.log('|---|---|---|');
console.log(`| 1막 보스 도달 | ${pct(reach1, N)} | 90% |`);
console.log(`| 2막 보스 도달 | ${pct(reach2, N)} | 60% |`);
console.log(`| 3막 보스(새벽) 도달 | ${pct(reach3, N)} | |`);
console.log(`| 「새벽」 격파 | ${pct(wins.length, N)} | 25~35% |`);
console.log(`| 평균 도착 시각(이긴 판) | ${hhmm(out.avgArrival)} | 5:30 전후 |`);
console.log(`| 6시 넘은 판 | ${pct(recs.filter(r => r.over6).length, N)} | 20% |`);
console.log(`| 1막 보스 격파 시각 | ${hhmm(out.act1End)} | 약 2:00 |`);
console.log(`| 2막 보스 격파 시각 | ${hhmm(out.act2End)} | 약 4:00 |`);
console.log(`| 진 이유 | ${Object.entries(why).map(([k, v]) => `${k} ${pct(v, N)}`).join(', ')} | |`);

console.log('\n동료별 (그 동료가 낀 판)');
console.log('| 동료 | 성급 | 판 | 새벽 격파 | 2막 보스 도달 |');
console.log('|---|---|---|---|---|');
out.chars = {};
for (const id of IDS) {
  const rs = recs.filter(r => r.party.includes(id)), w = rs.filter(r => r.won).length;
  out.chars[id] = { runs: rs.length, win: w / rs.length };
  console.log(`| ${CHARACTERS[id].name} | ★${CHARACTERS[id].rarity} | ${rs.length} | ${pct(w, rs.length)} | ${pct(rs.filter(r => r.bossReach[2]).length, rs.length)} |`);
}
// 성급별: ★5 포함 파티 / ★5 없는 파티 / ★3만 파티
const RAR = id => CHARACTERS[id].rarity;
const tier = (name, f) => { const rs = recs.filter(r => f(r.party)); return [name, rs.length, rs.filter(r => r.won).length]; };
const tiers = [
  tier('★5 포함', p => p.some(id => RAR(id) === 5)), tier('★5 없음', p => !p.some(id => RAR(id) === 5)),
  tier('★3만', p => p.every(id => RAR(id) === 3)), tier('★4만', p => p.every(id => RAR(id) === 4)),
];
out.tiers = Object.fromEntries(tiers.map(([n, a, w]) => [n, { runs: a, win: w / a }]));
console.log('\n성급별 파티');
console.log('| 파티 | 판 | 새벽 격파 |');
console.log('|---|---|---|');
for (const [n, a, w] of tiers) console.log(`| ${n} | ${a} | ${pct(w, a)} |`);
for (const r of [5, 4, 3]) {
  const ids = IDS.filter(id => RAR(id) === r), ws = ids.map(id => out.chars[id].win), m = avg(ws);
  console.log(`★${r} 평균 ${(m * 100).toFixed(1)}% · 가장 낮음 ${CHARACTERS[ids[ws.indexOf(Math.min(...ws))]].name} ${(Math.min(...ws) * 100).toFixed(1)}% (${((Math.min(...ws) / m - 1) * 100).toFixed(0)}%) · 가장 높음 ${CHARACTERS[ids[ws.indexOf(Math.max(...ws))]].name} ${(Math.max(...ws) * 100).toFixed(1)}% (+${((Math.max(...ws) / m - 1) * 100).toFixed(0)}%)`);
}
if (!QUICK) {
console.log('\n조합별 (상위·하위 10)');
const cs = [];
for (const c of combos) {
  const k = c.join('+'), rs = recs.filter(r => r.party.join('+') === k); if (rs.length < 2) continue;
  cs.push([c, rs.length, rs.filter(r => r.won).length / rs.length]);
}
cs.sort((a, b) => b[2] - a[2]);
for (const [c, n, w] of [...cs.slice(0, 10), ...cs.slice(-10)]) console.log(`${c.map(x => CHARACTERS[x].name).join('·')} ${n}판 ${(w * 100).toFixed(0)}%`);
}
console.log('\n듀오 (그 짝이 파티에 있던 판 중 듀오를 한 번 이상 만든 비율, 쓴 횟수)');
console.log('| 듀오 | 판 비율 | 쓴 횟수 |');
console.log('|---|---|---|');
for (const k of Object.keys(DUOS)) {
  const [a, b] = k.split('+'), rs = recs.filter(r => r.party.includes(a) && r.party.includes(b));
  console.log(`| ${DUOS[k].name} (${CHARACTERS[a].name}·${CHARACTERS[b].name}) | ${pct(stats.duoRuns[k] || 0, rs.length)} | ${stats.duoPlayed[k] || 0} |`);
}
if (!QUICK) {
  console.log('\n보상 카드 선택률 (나온 횟수 중 고른 비율, 높은 순 / 낮은 순 10개)');
  const rows = Object.keys(stats.offered).map(id => [id, (stats.taken[id] || 0) / stats.offered[id], stats.offered[id]]).sort((a, b) => b[1] - a[1]);
  const fmt = ([id, r, n]) => `${CARDS[id]?.name || id}(${id}) ${(r * 100).toFixed(0)}% / ${n}`;
  console.log('높음: ' + rows.slice(0, 10).map(fmt).join(', '));
  console.log('낮음: ' + rows.slice(-10).map(fmt).join(', '));
  console.log('\n많이 쓴 카드 10개: ' + Object.entries(stats.plays).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${cardData(k)?.name || k} ${v}`).join(', '));
}
if (JSON_OUT) { const fs = await import('node:fs'); fs.writeFileSync(JSON_OUT, JSON.stringify({ ...out, stats }, null, 1)); }

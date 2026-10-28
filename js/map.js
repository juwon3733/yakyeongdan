// 지도 생성·이동·시간 계산, 보상·휴식·야시장·사건 처리.
import { S, addTime, rewind, healAll, healMember, member, swapFormation, pickElite, gainRelic, gainGold, endRun, partySum, depthRule } from './run.js';
import { TALKS } from './data/talks.js';
import { startCombat, rewardCards } from './combat.js';
import { ACTS, FOE } from './data/enemies.js';
import { CARDS, CURSES, canUpgrade, cardData } from './data/cards.js';
import { CHARACTERS } from './data/characters.js';
import { EVENTS } from './data/events.js';
import { MOONS } from './data/moons.js';
import { RELICS } from './data/relics.js';
import { RULES, NODE, SHOP } from './data/rules.js';
import { hasRelic, relicSum, relicMul, rollRelic } from './relics.js';
import { tutNode, rigHand } from './tutorial.js';
import { setMoon } from './effects.js';
import { nextSegment } from './endless.js';
import { endlessBoss } from './data/endless.js';

// ---------- 지도 만들기 (docs/10_details.md §4) ----------
// 층 i의 칸 n개를 층 i+1의 칸 m개에 겹치지 않게 잇는다 (갈렸다 합쳐짐, 교차 없음)
function link(n, m) {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.floor(i * m / n), b = Math.floor(((i + 1) * m - 1) / n), out = [];
    for (let j = a; j <= b; j++) out.push(j);
    return out;
  });
}
function rollType(rng, weights) {
  let x = rng.next();
  for (const [k, w] of weights) { if (x < w) return k; x -= w; }
  return weights[weights.length - 1][0];
}
// 경로마다 칸 종류 줄 (보스 앞까지)
function paths(rows, edges) {
  const out = [];
  const walk = (r, i, acc) => {
    acc = [...acc, rows[r][i]];
    if (r === rows.length - 1) { out.push(acc); return; }
    for (const j of edges[r][i]) walk(r + 1, j, acc);
  };
  rows[0].forEach((_, i) => walk(0, i, []));
  return out;
}
function valid(rows, edges) {
  const mid = rows.slice(1).flat();
  const elites = mid.filter(t => t === 'elite').length;
  if (elites < 1 || elites > RULES.eliteMax) return false;
  if (!mid.includes('shop')) return false;
  if (!rows[rows.length - 1].includes('rest')) return false;   // 보스 바로 앞 층에 휴식
  for (const p of paths(rows, edges)) for (let k = 2; k < p.length; k++) if (p[k] === p[k - 1] && p[k] === p[k - 2]) return false;
  return true;
}
export function makeMap(rng, moon) {
  const weights = RULES.mapWeights.map(([k, w]) => [k, k === 'event' && MOONS[moon]?.darkBonus ? RULES.newMoonEvent : w]);
  const tot = weights.reduce((t, [, w]) => t + w, 0), norm = weights.map(([k, w]) => [k, w / tot]);
  const [lo, hi] = RULES.mapWidth;
  let best = null;
  for (let tries = 0; tries < RULES.mapTries; tries++) {
    const rows = [];
    for (let r = 0; r < RULES.mapRows; r++) {
      const n = lo + rng.int(hi - lo + 1);
      rows.push(Array.from({ length: n }, () => r === 0 ? 'fight' : rollType(rng, norm)));
    }
    const edges = rows.map((row, r) => link(row.length, r + 1 < rows.length ? rows[r + 1].length : 1));
    best = { rows: [...rows, ['boss']], edges: [...edges, [[]]] };
    if (valid(rows, edges)) break;
  }
  return best;
}
// 이 층에서 갈 수 있는 칸 번호
export function reachable(r) {
  const G = S.G, M = G.map;
  if (r !== G.row) return [];
  const prev = G.took[r - 1];
  if (r === 0 || prev == null) return M.rows[r].map((_, i) => i);
  return M.edges[r - 1][prev];
}
// 칸 시간: 기본 + 도구(구리 나침반 강적 -10, 멈춘 시계탑 +5)
// 핀(지름길): 전투 칸 −5분
// 밤의 깊이 2: +5분
// 도구: 칸 종류별 '<종류>Time' 필드(구리 나침반 eliteTime, 막차표 restTime)
export const nodeTime = t => Math.max(0, NODE[t].min + relicSum(t + 'Time') + (t === 'fight' ? partySum('fightTime') : 0) + relicSum('nodeTimeAdd') + (depthRule('nodeTime') || 0));

export function goNode(r, i) {
  const G = S.G, t = G.map.rows[r]?.[i];
  if (!t || !reachable(r).includes(i)) return;
  G.took[r] = i; G.floors++; G.note = '';
  if (G.endless) G.endless.floor++;   // 끝없는 탑: 층 세기 (js/endless.js)
  addTime(nodeTime(t));
  const pool = ACTS[G.act], tn = tutNode(r);
  // 첫 실행 튜토리얼: 정해진 적·사건, 첫 턴 손패 맞추기 (js/tutorial.js)
  if (tn?.foes) { startCombat(tn.foes.slice(), tn.kind); if (tn.rig) rigHand(tn.rig); }
  else if (tn?.event) openEvent(tn.event);
  else if (t === 'fight') startCombat(G.rng.pick(r === 0 ? pool.easy : pool.fights), 'fight');
  else if (t === 'elite') { const e = G.nextElite; G.nextElite = pickElite(); startCombat(e, 'elite'); }
  else if (t === 'boss') startCombat(G.endless ? [endlessBoss(G.endless.floor)] : pool.boss, 'boss');
  else if (t === 'rest') { G.restTalk = restTalk(G); if (G.restTalk != null) G.talks?.add(G.restTalk); G.screen = 'rest'; }
  else if (t === 'shop') openShop();
  else openEvent();
}

export function nextRow() {
  const G = S.G; G.row++; G.screen = 'map';
  if (G.endless && G.row >= G.map.rows.length) nextSegment();   // 끝없는 탑: 관문(강적)을 넘으면 다음 층 묶음
}
export function nextAct() {
  const G = S.G;
  if (G.endless) { G.endless.bosses++; return nextSegment(); }   // 끝없는 탑: 보스 관문 뒤
  G.act++; G.row = 0; G.took = [];
  G.map = G.nextMap; G.nextMap = G.act < 3 ? makeMap(G.rng, G.moon) : null;
  G.nextElite = pickElite(); G.screen = 'map';
}

// ---------- 보상 ----------
export function takeReward(id) {
  const G = S.G;
  if (id) G.deck.push(id);
  if (G.reward.next !== 'act') return nextRow();
  const left = Object.keys(RELICS).filter(k => RELICS[k].tier === 'boss' && !G.relics.includes(k));
  if (left.length) { G.bossRelics = G.rng.pickN(left, 3); G.screen = 'bossrelic'; }
  else nextAct();
}
export function pickBossRelic(id) {
  const G = S.G;
  if (id && G.bossRelics?.includes(id)) gainRelic(id);
  G.bossRelics = null;
  nextAct();
}

// ---------- 휴식: 쉬기 = 각자 최대 체력의 비율(쓰러졌던 동료는 더), 낮잠 = 시간 되찾기, 손질 = 카드 1장 강화 ----------
// 엘레오노르 +15분 · 전용 도구(깃털 베개·태엽 열쇠) · 밤의 깊이 5: 기본 20분
export const napTime = () => (depthRule('napTime') ?? RULES.rest.napTime) + partySum('napBonus') + relicSum('napAdd');
// 밤의 깊이 9: 쉬기 기본 20%
export const restPct = wasDown => ((wasDown ? RULES.rest.downHealPct : depthRule('restPct') ?? RULES.rest.healPct) + relicSum('restHealAdd')) * relicMul('restHealMul');
// 휴식 대화: 파티에 두 사람이 다 있는 대화 중 하나 (층마다 바뀜). TALKS 번호, 없으면 null
export function restTalk(G) {
  const L = TALKS.map((t, i) => i).filter(i => G.party.includes(TALKS[i].a) && G.party.includes(TALKS[i].b));
  return L.length ? L[(G.floors + G.act * 7) % L.length] : null;
}
export function rest(kind) {
  const R = RULES.rest, G = S.G;
  if (kind === 'heal') for (const p of G.party) {
    const m = member(p);
    m.hp = Math.min(m.max, m.hp + Math.ceil(m.max * restPct(m.wasDown)));
    m.wasDown = false;
  }
  else if (kind === 'smith') { G.back = null; G.smithLeft = 1 + partySum('smithExtra'); G.screen = 'upgrade'; return; }   // 도라: 1장 더
  else rewind(napTime());
  nextRow();
}
// 손질·지우기가 끝나면 돌아갈 곳 (야시장에서 왔으면 야시장)
function back() { const G = S.G; G.paid = null; if (G.back === 'shop') { G.back = null; G.screen = 'shop'; } else nextRow(); }
// 야시장에서 돈을 내고 들어왔다가 그만두면 돌려준다
function refund() {
  const G = S.G, p = G.paid; if (!p || G.back !== 'shop') return;
  G.gold += p.price;
  if (p.kind === 'remove') { G.removes--; if (G.shop) G.shop.removed = false; }
}
export function upgradeCard(i) {
  const G = S.G;
  if (i >= 0 && canUpgrade(G.deck[i])) G.deck[i] += '+';
  else refund();
  if (G.back !== 'shop' && --G.smithLeft > 0 && G.deck.some(canUpgrade) && i >= 0) return;   // 손질 한 장 더
  back();
}
export function removeCard(i) { const G = S.G; if (i >= 0 && G.deck[i]) G.deck.splice(i, 1); else refund(); back(); }
export function dupeCard(i) { const G = S.G; if (i >= 0 && G.deck[i]) G.deck.push(G.deck[i]); nextRow(); }

// 지도에서 대열 바꾸기: 한 칸 누르고 다른 칸 누르면 자리를 맞바꾼다 (자유)
export function pickSlot(i) {
  const G = S.G;
  if (G.fsel === null || G.fsel === undefined) G.fsel = i;
  else { if (G.fsel !== i) swapFormation(G.fsel, i); G.fsel = null; }
}

// ---------- 야시장 (docs/02_rules.md §8) ----------
// 할인: 후쿠로 패시브 + 흥정(다음 야시장 한 번)
const shopMul = () => 1 - Math.min(.6, partySum('shopDiscount') + (S.G.haggle || 0));
const cut = n => Math.ceil(n * shopMul());
function priceOf(id) { return cut(SHOP.cardPrice[CARDS[id].rarity] || SHOP.cardPrice.c); }
function openShop() {
  const G = S.G, rng = G.rng;
  const cards = [];
  for (let k = 0; k < SHOP.cards; k++) {
    const p = G.party[k % G.party.length];
    const pool = Object.keys(CARDS).filter(id => CARDS[id].ch === p && !cards.some(c => c.id === id) && !CHARACTERS[p].start.includes(id) && !G.locked?.has(id));
    if (pool.length) { const id = rng.pick(pool); cards.push({ id, price: priceOf(id), sold: false }); }
  }
  if (cards.length) { const s = rng.pick(cards); s.price = Math.ceil(s.price * SHOP.sale); s.sale = true; }
  const relics = [];
  for (let k = 0; k < SHOP.relics; k++) {
    const id = rollRelic(rng, null, relics.map(x => x.id)); if (!id) continue;
    relics.push({ id, price: cut(SHOP.relicPrice[RELICS[id].tier]), sold: false });
  }
  G.shop = { cards, relics, talk: rng.pick(SHOP.talk), off: Math.round((1 - shopMul()) * 100), special: openSpecial(rng, relics.map(x => x.id)) };
  G.haggle = 0;
  G.screen = 'shop';
}
// 특별 노점: 모래시계 노점(밤 시계로 산다) · 짐꾼 노점(체력으로 산다). 카드 2장 + 도구 1개
function openSpecial(rng, taken = []) {
  const sp = SHOP.special; if (rng.next() >= sp.chance) return null;
  const kind = rng.pick(Object.keys(sp.kinds)), k = sp.kinds[kind], G = S.G, items = [];
  for (let n = 0; n < 2; n++) {
    const p = rng.pick(G.party), rare = n === 1;
    const pool = Object.keys(CARDS).filter(id => CARDS[id].ch === p && CARDS[id].rarity === (rare ? 'r' : 'u') && !G.locked?.has(id) && !items.some(x => x.id === id));
    if (pool.length) items.push({ kind: 'card', id: rng.pick(pool), cost: rare ? k.cardRare : k.card, sold: false });
  }
  const r = rollRelic(rng, ['c', 'u'], taken); if (r) items.push({ kind: 'relic', id: r, cost: k.relic, sold: false });
  return { key: kind, name: k.name, pay: k.pay, talk: k.talk, items };
}
// 특별 노점에서 사기: time = 밤 시계 +분, hp = 모든 동료 체력 −(1 아래로는 안 내려감)
export function specialBuy(i) {
  const G = S.G, sp = G.shop?.special, it = sp?.items[i]; if (!it || it.sold) return;
  if (sp.pay === 'time') addTime(it.cost);
  else for (const p of G.party) { const m = member(p); if (!m.down) m.hp = Math.max(1, m.hp - it.cost); }
  it.sold = true;
  if (it.kind === 'card') G.deck.push(it.id); else gainRelic(it.id);
}
export const removePrice = () => SHOP.remove + SHOP.removeStep * S.G.removes;
export function shopBuy(kind, i) {
  const G = S.G, sh = G.shop; if (!sh) return;
  if (kind === 'card') {
    const c = sh.cards[i]; if (!c || c.sold || G.gold < c.price) return;
    G.gold -= c.price; c.sold = true; G.deck.push(c.id); sh.talk = '"좋은 눈이야."';
  } else if (kind === 'relic') {
    const r = sh.relics[i]; if (!r || r.sold || G.gold < r.price) return;
    G.gold -= r.price; r.sold = true; gainRelic(r.id); sh.talk = '"잘 써. 탑 꼭대기까지."';
  } else if (kind === 'remove') {
    const p = removePrice(); if (G.gold < p || sh.removed) return;
    G.gold -= p; G.removes++; sh.removed = true; G.back = 'shop'; G.paid = { kind: 'remove', price: p }; G.screen = 'remove';
  } else if (kind === 'upgrade') {
    if (G.gold < SHOP.upgrade || !G.deck.some(canUpgrade)) return;
    G.gold -= SHOP.upgrade; G.back = 'shop'; G.paid = { kind: 'upgrade', price: SHOP.upgrade }; G.screen = 'upgrade';
  }
}
export function leaveShop() { S.G.shop = null; nextRow(); }

// ---------- 사건 ----------
function openEvent(id) {
  const G = S.G;
  // 달 사건(moon)은 그 달일 때만, 막 사건(acts)은 그 막에서만
  const fits = e => (!e.moon || e.moon === G.moon) && (!e.acts || e.acts.includes(G.act));
  let pool = EVENTS.filter(e => fits(e) && !G.seenEvents.includes(e.id));
  if (!pool.length) pool = EVENTS.filter(fits);
  const def = EVENTS.find(e => e.id === id) || G.rng.pick(pool);
  G.seenEvents.push(def.id);
  // 동료 전용 선택지(need)는 그 동료가 파티에 있고 서 있을 때만 보인다
  const opts = def.opts.filter(o => !o.need || (G.party.includes(o.need) && !member(o.need).down));
  G.event = { def, opts, mate: G.rng.pick(G.party) };
  G.screen = 'event';
}
// 소금 주머니: 나쁜 결과(저주·체력 잃기)를 판마다 한 번 막는다
function salted() {
  const G = S.G;
  if (!hasRelic('salt_pouch') || G.used.salt_pouch) return false;
  G.used.salt_pouch = true; G.note = '소금 주머니가 나쁜 결과를 한 번 막아 줬다.';
  return true;
}
export function eventApi() {
  const G = S.G, E2 = G.event;
  const x = {
    heal: n => healAll(n), addTime: m => addTime(m), rewind: m => rewind(m),
    loseHp: n => { if (salted()) return; for (const p of G.party) { const m = member(p); if (!m.down) m.hp = Math.max(1, m.hp - n); } },
    loseHpOne: (id, n) => { if (salted()) return; const m = member(id); if (m && !m.down) m.hp = Math.max(1, m.hp - n); },
    maxHp: n => { for (const p of G.party) { const m = member(p); m.max += n; if (!m.down) m.hp += n; } },
    addRandomCard: () => { G.deck.push(rewardCards()[0]); },
    // 그 동료의 카드 1장 (희귀도 r·u·c를 주면 그중에서)
    addCardOf: (ch, r) => {
      const mine = Object.keys(CARDS).filter(id => CARDS[id].ch === ch && !G.locked?.has(id)), pool = r ? mine.filter(id => CARDS[id].rarity === r) : mine;
      const id = G.rng.pick(pool.length ? pool : mine); if (id) G.deck.push(id);
    },
    healOne: (id, n) => healMember(id, n),
    maxHpOne: (id, n) => { const m = member(id); if (!m) return; m.max += n; if (!m.down) m.hp += n; },
    removeCurse: () => { const i = G.deck.findIndex(id => cardData(id).ch === 'curse'); if (i >= 0) { G.deck.splice(i, 1); return true; } return false; },
    get hasCurse() { return G.deck.some(id => cardData(id).ch === 'curse'); },
    relicTier: t => gainRelic(rollRelic(G.rng, [t]) || rollRelic(G.rng)),
    get clock() { return G.clock; },
    removeCard: () => { G.back = null; G.screen = 'remove'; return true; },
    dupeCard: () => { G.screen = 'dupe'; return true; },
    addCurse: () => { if (!salted()) G.deck.push(G.rng.pick(CURSES)); },
    chance: p => G.rng.next() < p,
    upgradeRandom: (filter = () => true) => {
      const ix = G.deck.map((id, i) => i).filter(i => canUpgrade(G.deck[i]) && filter(cardData(G.deck[i])));
      if (ix.length) G.deck[G.rng.pick(ix)] += '+';
    },
    gold: n => gainGold(n),
    get haveGold() { return G.gold; },
    get hasTimeCard() { return G.deck.some(id => canUpgrade(id) && cardData(id).time); },
    relic: () => gainRelic(rollRelic(G.rng)),
    relicOrCurse: () => { if (G.rng.next() < .5) gainRelic(rollRelic(G.rng)); else x.addCurse(); },
    moonNext: () => { const ks = Object.keys(MOONS); G.moon = ks[(ks.indexOf(G.moon) + 1) % ks.length]; },
    get moonName() { return MOONS[G.moon].name; },
    get canSkip() { return G.row + 2 < G.map.rows.length; },
    skipFloor: () => { G.row++; },        // 다음 층을 건너뜀: 그다음 층의 칸은 어디로든 갈 수 있다
    has: id => G.party.includes(id),
    get mate() { return E2.mate; },
    get front() { return G.formation.find(p => !member(p).down) || G.formation[0]; },
    get frontName() { return CHARACTERS[x.front].name; },
    get eliteName() { return G.nextElite.map(k => FOE[k].name).join('·'); },
  };
  return x;
}

export function chooseOpt(i) {
  const G = S.G, opt = G.event?.opts[i]; if (!opt) return;
  const x = eventApi();
  if (opt.can && !opt.can(x)) return;
  const stay = opt.f(x);
  if (!stay) nextRow();
}

// 달 조각: 달 모양 고르기
export function pickMoon(k) { const G = S.G; if (MOONS[k]) G.moon = k; G.moonPick = false; }
// 판마다 한 번 누르는 도구 (낡은 회중시계, 달빛 병)
export function useRelic(id) {
  const G = S.G, d = RELICS[id];
  if (!d?.use || !G.relics.includes(id) || G.used[id]) return false;
  if (d.use === 'moon' && !S.C) return false;    // 달빛 병은 전투 중에만
  G.used[id] = true;
  if (d.use === 'rewind') rewind(d.v);
  else if (d.use === 'moon') { const ks = Object.keys(MOONS); setMoon(ks[(ks.indexOf(G.moon) + 1) % ks.length]); S.C.moonBase = G.moon; }
  return true;
}
export { endRun };

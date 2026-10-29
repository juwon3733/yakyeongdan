// 판 바깥 (docs/05_meta.md): 가진 동료·별자리·의상·카드 묶음·별 조각·별가루·소환(천장·픽업·초심자 고르기)·교환소·
// 도감·기록·밤의 깊이를 localStorage에 저장한다. 수치는 js/data/gacha.js · depth.js.
// 저장이 안 되는 환경(사생활 보호 창 등)이면 메모리에만 두고 그대로 진행한다.
import { makeRng, newSeed } from './rng.js';
import { ROSTER, ROSTER_IDS, byRarity } from './data/roster.js';
import { STARTER_OWNED, CHARACTERS } from './data/characters.js';
import { SUMMON, SUMMON_ITEMS, SHARDS, ITEM_DUST, PICKUPS, PICKUP_DAYS, PICKUP_EPOCH, EXCHANGE, START_PICK_RUNS, PACK_SIZE, PACK_COUNT } from './data/gacha.js';
import { RULES } from './data/rules.js';
import { MOONS } from './data/moons.js';
import { RELICS } from './data/relics.js';
import { CARDS } from './data/cards.js';
import { TALKS } from './data/talks.js';
import { DEPTH_MAX, DEPTH_BONUS } from './data/depth.js';
import { EPISODES, BOND_SCENES } from './data/episodes.js';
import { DAILY_SHARDS, DAILY_CANDIDATES, dailyKey, dailySeed, dailyRule } from './data/daily.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { MASTERY_GAIN, MASTERY_REWARDS, masteryLv } from './data/mastery.js';
import { ENDLESS } from './data/endless.js';

const KEY = 'yk-profile';
const VERSION = 4;

function fresh() {
  return {
    v: VERSION, owned: Object.fromEntries(STARTER_OWNED.map(k => [k, { stars: 0 }])),
    shards: SUMMON.firstGift, dust: 0, items: [],
    pulls: 0, pity5: 0, pity4: 0, firstTen: false, got5: false,
    seenDuos: [], runs: 0, wins: 0, best: null, sseed: newSeed(),
    // 에피소드 (docs/09): 동료별 진행 · 다 본 화 · 열린 인연 장면 · 본 인연 장면
    epProg: {}, epSeen: {}, bondOpen: [], bondSeen: [],
    // v2 (M5): 초심자 ★5 고르기 대기 수 · 픽업 확정 · 의상(열린 것·입은 것) · 산 카드 묶음 수 · 시작 도구 고르기 후보
    pick5: 0, pickGuar: false, costumeOwn: [], costume: {}, packs: {}, startRelics: [],
    talksSeen: [], titles: [], charStats: {}, cardsSeen: [], cardsUsed: [], foesSeen: [], foesBeaten: [], affixSeen: [],
    rec: { combo: {}, moons: {}, depthBest: 0, endlessBest: 0, endlessCombo: {}, endlessBosses: 0 },   // v4: 끝없는 탑 최고 층·조합별 최고 층·탑 위 보스
    tutDone: false,   // 첫 실행 튜토리얼을 끝냈거나 건너뜀 (js/tutorial.js)
    // v3: 매일의 밤(날짜 → { best 가장 빠른 도착, won, tries }) · 업적(달성한 id) · 평생 기록 · 최근 판 20개 · 숙련도 점수 · 카드 뒷면
    daily: {}, achDone: [], history: [], mxp: {}, cardBack: null,
    life: { bestTurn: 0, bigTurns: 0, bossKills: 0, dailyWins: 0, facts: [] },
  };
}
// 예전 저장(v1)을 이어받는다: 없는 필드만 새 값으로 채운다
function migrate(d) {
  const f = fresh(), out = Object.assign(f, d);
  out.rec = Object.assign(fresh().rec, d.rec || {});
  out.life = Object.assign(fresh().life, d.life || {});
  // v2 → v3: 지난 판들로 숙련도 점수를 대강 채운다(판 수 + 이긴 판 ×2)
  if (!d.mxp) for (const [k, st] of Object.entries(d.charStats || {})) out.mxp[k] = (st.runs || 0) + (st.wins || 0) * 2;
  if (!d.life) out.life.bossKills = d.wins || 0;
  if (d.tutDone === undefined) out.tutDone = (d.runs || 0) > 0;   // 이미 판을 해 본 저장이면 튜토리얼을 건너뛴다
  out.v = VERSION;
  return out;
}
export let P = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v >= 1 && d.v <= VERSION) return migrate(d);
  } catch (e) { /* 저장이 막힌 환경 */ }
  return fresh();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* 저장 안 됨 */ }
}
// 개발판 점검용: 새 프로필로 / 예전 저장 흉내
export function resetProfile() { P = fresh(); save(); return P; }
export function loadRaw(obj) { P = migrate(obj); save(); return P; }

// ---------- 저장 백업 (설정 「저장 내보내기 / 불러오기」: 폰을 바꿀 때) ----------
// 코드 = "YK<버전>-" + base64(UTF-8 JSON) + "-" + 확인값(FNV-1a 8자리). 잘리거나 바뀐 코드를 걸러 낸다.
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const b64e = s => { const u = new TextEncoder().encode(s); let t = ''; for (let i = 0; i < u.length; i += 0x8000) t += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(t); };
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
export function exportSave(settings) {
  const body = b64e(JSON.stringify({ k: 'yakyeongdan', v: VERSION, t: Date.now(), p: P, s: settings || null }));
  return `YK${VERSION}-${body}-${fnv(body)}`;
}
// 코드를 읽어 본다(저장은 아직 안 바꿈). { ok, err, data }
export function readSave(code) {
  const m = String(code || '').replace(/\s+/g, '').match(/^YK(\d+)-([A-Za-z0-9+/=]+)-([0-9a-f]{8})$/);
  if (!m) return { ok: false, err: '저장 코드 모양이 아니에요. 내보낸 코드를 처음부터 끝까지 그대로 붙여 넣어 주세요.' };
  if (fnv(m[2]) !== m[3]) return { ok: false, err: '코드가 잘렸거나 바뀌었어요. 다시 복사해 주세요.' };
  let d;
  try { d = JSON.parse(b64d(m[2])); } catch (e) { return { ok: false, err: '코드를 읽을 수 없어요.' }; }
  if (d?.k !== 'yakyeongdan' || !d.p) return { ok: false, err: '야경단 저장 코드가 아니에요.' };
  if (!(d.v >= 1) || !(d.p.v >= 1)) return { ok: false, err: '알 수 없는 저장 버전이에요.' };
  if (d.v > VERSION || d.p.v > VERSION) return { ok: false, err: '더 새 버전에서 만든 저장이에요. 게임을 새로고침해서 최신으로 만든 뒤 불러와 주세요.' };
  return { ok: true, data: d };
}
// 불러오기: 지금 저장을 코드의 저장으로 바꾼다(예전 버전이면 이어받기)
export function importSave(code) {
  const r = readSave(code); if (!r.ok) return r;
  P = migrate(r.data.p); save();
  return { ok: true, settings: r.data.s, when: r.data.t };
}

export const owns = id => !!P.owned[id];
const uniqPush = (arr, x) => { if (!arr.includes(x)) arr.push(x); };

// ---------- 별자리 (§4) ----------
export const starsOf = id => P.owned[id]?.stars ?? -1;
export const costumeOpen = id => owns(id) && (P.costumeOwn.includes(id) || starsOf(id) >= 1);
export const wearing = id => !!P.costume[id] && costumeOpen(id);
// 카드 묶음: 보상 풀(시작 카드가 아닌 카드)의 마지막 4장을 2장씩
export function packCards(id) {
  const c = CHARACTERS[id]; if (!c) return [];
  const pool = Object.keys(CARDS).filter(k => CARDS[k].ch === id && !c.start.includes(k));
  const tail = pool.slice(-PACK_SIZE * PACK_COUNT), out = [];
  for (let i = 0; i < tail.length; i += PACK_SIZE) out.push(tail.slice(i, i + PACK_SIZE));
  return out;
}
export const packsOpen = id => Math.min(packCards(id).length, (P.packs[id] || 0) + (starsOf(id) >= 2 ? 1 : 0));
export const startUp = id => starsOf(id) >= 3;
export const sigOpen = id => starsOf(id) >= 4;
export const duoSpecial = id => starsOf(id) >= 5;
export const sigOf = id => Object.keys(RELICS).find(k => RELICS[k].tier === 'sig' && RELICS[k].owner === id);

// 판을 시작할 때 넘기는 것 (run.js newRun opts)
export function runOptions(party, depth = 0, startRelic) {
  const locked = [];
  for (const id of party) packCards(id).slice(packsOpen(id)).forEach(pk => locked.push(...pk));
  return {
    depth: depthOpen() ? Math.min(depth, depthMax()) : 0, locked,
    upgrades: party.filter(startUp), sigs: party.filter(sigOpen),
    startRelic: startPickOpen() && startRelicChoices().includes(startRelic) ? startRelic : undefined,
  };
}

// ---------- 밤의 깊이 (§10) · 시작 도구 고르기 ----------
export const depthOpen = () => P.wins > 0;
export const depthMax = () => Math.min(DEPTH_MAX, (P.rec.depthBest || 0) + 1);
export const startPickOpen = () => P.runs >= START_PICK_RUNS;
export const startRelicChoices = () => [...Object.keys(RELICS).filter(k => RELICS[k].tier === 'start'), ...P.startRelics.filter(k => RELICS[k])];

// ---------- 별 소환 ----------
// 한 번 뽑기의 ★5 확률: 40번째부터 매번 +4%, 51번째는 확정
function rate5() {
  const k = P.pity5 + 1;
  if (k >= SUMMON.hard) return 1;
  return SUMMON.rate5 + (k >= SUMMON.softFrom ? SUMMON.softStep * (k - SUMMON.softFrom + 1) : 0);
}
export const nextRate5 = rate5;
// 지금 픽업 (2주 단위로 돌아감)
export function pickupNow(now = Date.now()) {
  const span = PICKUP_DAYS * 86400000;
  const n = Math.floor((now - PICKUP_EPOCH) / span), i = ((n % PICKUPS.length) + PICKUPS.length) % PICKUPS.length;
  return { ...PICKUPS[i], ends: PICKUP_EPOCH + (n + 1) * span };
}

// 동료 하나 고르기: 픽업 먼저, 그다음 아직 없는 동료가 newFirst 확률로 먼저
function pickChar(rng, rarity, prefer) {
  let all = prefer || byRarity(rarity);
  if (!prefer) {
    const pk = pickupNow();
    if (rarity === 5) {
      if (P.pickGuar || rng.next() < SUMMON.pickShare5) { P.pickGuar = false; return pk.five; }
      P.pickGuar = true; all = all.filter(k => k !== pk.five);
    } else if (rarity === 4 && rng.next() < SUMMON.pickShare4) return rng.pick(pk.four);
  }
  const fresh2 = all.filter(k => !owns(k));
  const pool = fresh2.length && rng.next() < SUMMON.newFirst ? fresh2 : all;
  return rng.pick(pool);
}
function grantChar(id) {
  const r = { kind: 'char', id, rarity: ROSTER[id].rarity };
  if (!owns(id)) { P.owned[id] = { stars: 0 }; r.isNew = true; }
  else if (P.owned[id].stars < SUMMON.maxStars) { P.owned[id].stars++; r.stars = P.owned[id].stars; }
  else { P.dust += SUMMON.dustFullStars; r.dust = SUMMON.dustFullStars; }
  return r;
}
// 물건 열기 (소환·교환소). arg를 주면 그것, 없으면 무작위. 열었으면 설명 글, 열 것이 없으면 null.
function unlock(kind, rng, arg, tier) {
  const pick = L => arg != null ? (L.includes(arg) ? arg : null) : L.length ? rng.pick(L) : null;
  if (kind === 'costume') {
    const k = pick(ROSTER_IDS.filter(x => owns(x) && !costumeOpen(x))); if (!k) return null;
    P.costumeOwn.push(k); return `${ROSTER[k].name}의 두 번째 의상`;
  }
  if (kind === 'pack') {
    const k = pick(ROSTER_IDS.filter(x => owns(x) && packsOpen(x) < packCards(x).length)); if (!k) return null;
    P.packs[k] = (P.packs[k] || 0) + 1;
    const pk = packCards(k)[packsOpen(k) - 1] || [];
    return `${ROSTER[k].name} 카드 묶음 ${packsOpen(k)}: ${pk.map(c => CARDS[c].name).join('·')}`;
  }
  if (kind === 'relic') {
    const k = pick(Object.keys(RELICS).filter(x => RELICS[x].tier === (tier || RELICS[arg]?.tier) && !P.startRelics.includes(x))); if (!k) return null;
    P.startRelics.push(k); return `시작 도구 「${RELICS[k].name}」`;
  }
  if (kind === 'talk') {
    const k = pick(TALKS.map((t, i) => i).filter(i => !P.talksSeen.includes(i))); if (k == null) return null;
    P.talksSeen.push(k); return `휴식 대화 「${ROSTER[TALKS[k].a].name}·${ROSTER[TALKS[k].b].name}」`;
  }
  return null;
}
function grantItem(rng, rarity) {
  const it = rng.pick(SUMMON_ITEMS[rarity]), r = { kind: it.kind, name: it.name, text: it.text, rarity };
  P.items.push(it.name);
  if (it.dust) { P.dust += it.dust; r.dust = it.dust; return r; }
  const got = unlock(it.kind, rng, null, it.tier);
  if (got) r.text = got;
  else { r.dust = ITEM_DUST[it.kind] || SUMMON.dustDupItem; P.dust += r.dust; r.text = '열 것이 없어 별가루로'; }
  return r;
}
function rollOne(rng, force4) {
  P.pulls++; P.pity5++;
  // 초심자: 처음 30번 안에 ★5 확정
  const beginner = !P.got5 && P.pulls >= SUMMON.beginner;
  let rarity;
  const x = rng.next();
  if (beginner || x < rate5()) rarity = 5;
  else if (force4 || x < rate5() + SUMMON.rate4) rarity = 4;
  else rarity = 3;
  let r;
  if (rarity === 5) {
    P.pity5 = 0;
    // 처음 얻는 ★5는 ★5 동료 중 직접 고른다 (소환 결과 뒤 고르기 화면)
    if (!P.got5) { P.got5 = true; P.pick5++; r = { kind: 'choose5', rarity: 5 }; }
    else r = grantChar(pickChar(rng, 5));
  }
  else if (rarity === 4) r = rng.next() < SUMMON.char4Share || force4 === 'char' ? grantChar(pickChar(rng, 4)) : grantItem(rng, 4);
  else r = rng.next() < SUMMON.char3Share ? grantChar(pickChar(rng, 3)) : grantItem(rng, 3);
  return r;
}
// n = 1 또는 10. 별 조각이 모자라면 null.
export function summon(n) {
  const cost = n === 10 ? SUMMON.tenCost : SUMMON.cost * n;
  if (P.shards < cost) return null;
  P.shards -= cost;
  const rng = makeRng(P.sseed), out = [];
  const firstTen = n === 10 && !P.firstTen;
  for (let k = 0; k < n; k++) {
    const last = k === n - 1;
    // 10연: ★4 이상 1개 확정. 첫 10연은 노엘·레이븐 중 ★4 동료 확정.
    if (last && n === 10 && firstTen && !out.some(r => SUMMON.firstTen.includes(r.id))) {
      P.pulls++; P.pity5++; out.push(grantChar(pickChar(rng, 4, SUMMON.firstTen)));
    } else if (last && n === 10 && !out.some(r => r.rarity >= 4)) out.push(rollOne(rng, true));
    else out.push(rollOne(rng));
  }
  if (firstTen) P.firstTen = true;
  P.sseed = (rng.state + 0x9E3779B9) >>> 0;
  save();
  return out;
}
// 초심자 ★5 고르기
export function choose5(id) {
  if (!P.pick5 || ROSTER[id]?.rarity !== 5) return null;
  P.pick5--; const r = grantChar(id); save(); return r;
}

// ---------- 교환소 (§5) ----------
export function exchangePrice(kind, arg) {
  if (kind === 'char') return EXCHANGE.char[ROSTER[arg]?.rarity];
  if (kind === 'relic') return EXCHANGE.relic[RELICS[arg]?.tier];
  return EXCHANGE[kind];
}
export function canExchange(kind, arg) {
  const price = exchangePrice(kind, arg); if (price == null || P.dust < price) return false;
  if (kind === 'char') return !!ROSTER[arg] && (!owns(arg) || P.owned[arg].stars < SUMMON.maxStars);
  if (kind === 'costume') return owns(arg) && !costumeOpen(arg);
  if (kind === 'pack') return owns(arg) && packsOpen(arg) < packCards(arg).length;
  if (kind === 'relic') return !!RELICS[arg] && !P.startRelics.includes(arg);
  if (kind === 'talk') return P.talksSeen.length < TALKS.length;
  return false;
}
export function exchange(kind, arg) {
  if (!canExchange(kind, arg)) return null;
  const price = exchangePrice(kind, arg);
  const rng = makeRng(P.sseed);
  let msg;
  if (kind === 'char') { const r = grantChar(arg); msg = `${ROSTER[arg].name} ${r.isNew ? '합류' : `별자리 ${r.stars}`}`; }
  else msg = unlock(kind, rng, kind === 'talk' ? null : arg);
  if (!msg) return null;
  P.dust -= price; P.sseed = (rng.state + 0x9E3779B9) >>> 0;
  save();
  return msg;
}

// ---------- 동료 화면 ----------
export function setCostume(id, on) { if (!costumeOpen(id)) return; P.costume[id] = on ? 1 : 0; save(); }

// ---------- 판이 끝나면 별 조각 ----------
export function runShards(G) {
  const lines = [];
  const add = (t, v) => { if (v) lines.push([t, v]); };
  const bosses = G.bossKills || 0;
  add(`막 보스 격파 ${bosses}번`, bosses * SHARDS.actBoss);
  if (G.won) {
    add('「새벽」 격파', SHARDS.dawnWin);
    const early = Math.max(0, RULES.dawn - G.clock);
    add(`6시 전 ${early}분`, Math.min(SHARDS.earlyMax, Math.floor(early / 10) * SHARDS.earlyPer10));
    if ((G.depth || 0) > (P.rec.depthBest || 0)) add(`밤의 깊이 ${G.depth} 처음 격파`, G.depth * DEPTH_BONUS);
  }
  const newDuos = [...(G.duoSet || [])].filter(k => !P.seenDuos.includes(k));
  add(`새로 찾은 듀오 ${newDuos.length}쌍`, newDuos.length * SHARDS.newDuo);
  add(`강적 ${G.elites || 0}번`, (G.elites || 0) * SHARDS.elite);
  if (!G.won) add(`오른 층 ${G.floors || 0}칸`, Math.max(SHARDS.lossMin, G.floors || 0));
  if (G.daily && G.won && !P.daily[G.daily.key]?.won) add('오늘의 매일의 밤 첫 격파', DAILY_SHARDS);
  return { lines, total: lines.reduce((t, [, v]) => t + v, 0), newDuos };
}
// ---------- 에피소드 (docs/09_episodes.md) ----------
// 화 n(0~2)이 열렸나: 그 동료를 데리고 판 1번 끝냄 / 2막 보스 격파 / 「새벽」 격파
export function epOpen(cid, n) {
  const g = P.epProg[cid]; if (!g || !EPISODES[cid]?.[n]) return false;
  return n === 0 ? g.runs >= 1 : n === 1 ? !!g.act2 : !!g.dawn;
}
export const epKey = (cid, n) => `${cid}:${n}`;
// 열렸는데 아직 안 본 화 수 (본부 메뉴 알림)
export function epNewCount() {
  let k = 0;
  for (const cid in EPISODES) for (let n = 0; n < EPISODES[cid].length; n++) if (epOpen(cid, n) && !P.epSeen[epKey(cid, n)]) k++;
  return k + P.bondOpen.filter(b => !P.bondSeen.includes(b)).length;
}
// 판이 끝나면 데려간 동료마다 진행을 올리고, 새로 열린 화를 돌려준다
function epProgress(G) {
  const party = G.party.filter(owns);   // 매일의 밤에 빌린 동료는 진행이 안 오른다
  const before = new Set();
  for (const cid of party) for (let n = 0; n < 3; n++) if (epOpen(cid, n)) before.add(epKey(cid, n));
  for (const cid of party) {
    const g = P.epProg[cid] ||= { runs: 0, act2: false, dawn: false };
    g.runs++;
    if ((G.bossKills || 0) >= 2) g.act2 = true;
    if (G.won) g.dawn = true;
  }
  const out = [];
  for (const cid of party) for (let n = 0; n < 3; n++) if (epOpen(cid, n) && !before.has(epKey(cid, n))) out.push({ cid, n });
  return out;
}
// 에피소드 보상 (2화: 그 동료 휴식 대화 2개, 3화: 칭호). 받은 것 설명 목록.
export function epExtra(cid, n) {
  const out = [];
  if (n === 1) {
    const L = TALKS.map((t, i) => i).filter(i => (TALKS[i].a === cid || TALKS[i].b === cid) && !P.talksSeen.includes(i)).slice(0, 2);
    for (const i of L) P.talksSeen.push(i);
    if (L.length) out.push(`휴식 대화 ${L.length}개`);
  }
  if (n === 2) { uniqPush(P.titles, cid); out.push(`칭호 「${ROSTER[cid]?.name || cid}의 새벽」`); }
  return out;
}

// 결과 화면에서 한 번만: 별 조각·도감·기록
export function grantRun(G) {
  if (G.granted) return G.granted;
  const r = runShards(G);
  P.shards += r.total; P.runs++;
  if (G.won) { P.wins++; if (P.best == null || G.clock < P.best) P.best = G.clock; }
  for (const k of r.newDuos) P.seenDuos.push(k);
  // 기록: 동료별 판·이긴 판, 조합별 가장 빠른 도착, 달별 승리, 밤의 깊이
  for (const p of G.party) { const s = P.charStats[p] ||= { runs: 0, wins: 0 }; s.runs++; if (G.won) s.wins++; }
  if (G.won) {
    const key = G.party.slice().sort().join('+');
    if (P.rec.combo[key] == null || G.clock < P.rec.combo[key]) P.rec.combo[key] = G.clock;
    P.rec.moons[G.moon] = (P.rec.moons[G.moon] || 0) + 1;
    if ((G.depth || 0) > (P.rec.depthBest || 0)) P.rec.depthBest = G.depth;
  }
  // 도감: 본 카드(덱·보상에 나온 카드·쓴 카드)·쓴 카드·만난 적·이긴 적·휴식 대화
  const base = id => id.replace(/\+$/, '');
  for (const id of [...G.deck.map(base), ...(G.offered || []), ...(G.played || [])]) if (CARDS[id]) uniqPush(P.cardsSeen, id);
  for (const id of G.played || []) if (CARDS[id]) uniqPush(P.cardsUsed, id);
  for (const k of G.foesMet || []) uniqPush(P.foesSeen, k);
  for (const k of G.foesBeat || []) uniqPush(P.foesBeaten, k);
  for (const k of G.affixSeen || []) uniqPush(P.affixSeen, k);
  for (const i of G.talks || []) uniqPush(P.talksSeen, i);
  r.newEps = epProgress(G);
  // 인연 듀오를 처음 썼으면 인연 장면이 열린다
  r.newBonds = [...(G.duoSet || [])].filter(k => BOND_SCENES[k] && !P.bondOpen.includes(k));
  for (const k of r.newBonds) P.bondOpen.push(k);
  r.daily = recordDaily(G);
  r.mastery = recordMastery(G);
  recordLife(G);
  recordHistory(G);
  r.ach = achCheck();
  save();
  G.granted = r;
  return r;
}

// ---------- 매일의 밤 (§11, js/data/daily.js) ----------
// 오늘의 판: 시드·달·규칙·동료 후보 6명(구현된 동료 중, 가진 동료가 아니어도 빌려 쓴다)
export function dailyToday(now = new Date()) {
  const key = dailyKey(now), seed = dailySeed(key), rule = dailyRule(key);
  const moon = makeRng(seed).pick(Object.keys(MOONS));   // run.js newRun이 같은 시드로 처음 뽑는 것이 달
  const pool = ROSTER_IDS.filter(k => CHARACTERS[k]);
  const cands = makeRng(seed ^ 0x5bd1e995).pickN(pool, DAILY_CANDIDATES);
  return { key, seed, rule, moon, cands, rec: P.daily[key] || null };
}
function recordDaily(G) {
  if (!G.daily) return null;
  const d = P.daily[G.daily.key] ||= { best: null, won: false, tries: 0 };
  const first = G.won && !d.won;
  d.tries++;
  if (G.won) { d.won = true; if (d.best == null || G.clock < d.best) d.best = G.clock; }
  if (first) P.life.dailyWins++;
  // 오래된 날은 30일만 남긴다
  const keys = Object.keys(P.daily).sort();
  while (keys.length > 30) delete P.daily[keys.shift()];
  return { first, best: d.best };
}

// ---------- 동료 숙련도 (js/data/mastery.js) ----------
export const mastery = id => masteryLv(P.mxp[id]);
export const masteryTitles = () => {
  const out = [];
  for (const [id, xp] of Object.entries(P.mxp)) {
    const lv = masteryLv(xp), name = ROSTER[id]?.name || id;
    for (const rw of MASTERY_REWARDS) if (rw.title && lv >= rw.lv) out.push({ id, lv: rw.lv, title: rw.title.replace('{name}', name) });
  }
  return out.sort((a, b) => b.lv - a.lv);
};
export const backOpen = id => mastery(id) >= 4;
export function setCardBack(id) { if (id && !backOpen(id)) return; P.cardBack = id || null; save(); }
function recordMastery(G) {
  const ups = [];
  for (const id of G.party.filter(owns)) {
    const before = mastery(id);
    P.mxp[id] = (P.mxp[id] || 0) + MASTERY_GAIN.run + ((G.bossKills || 0) >= 2 ? MASTERY_GAIN.act2 : 0) + (G.won ? MASTERY_GAIN.win : 0);
    const after = mastery(id);
    if (after > before) ups.push({ id, lv: after });
  }
  return ups;
}

// ---------- 평생 기록 · 최근 판 ----------
function recordLife(G) {
  const L = P.life, F = new Set(L.facts);
  L.bestTurn = Math.max(L.bestTurn || 0, G.bestTurn?.dmg || 0);
  L.bigTurns = (L.bigTurns || 0) + (G.bigTurns || 0);
  L.bossKills = (L.bossKills || 0) + (G.bossKills || 0);
  if ((G.bossKills || 0) >= 2) F.add('act2');
  if (G.noonBeat) F.add('noon');
  if ((G.bigTurns || 0) >= 5) F.add('big5');
  if ((G.duoSet?.size || 0) >= 3) F.add('duo3');
  if ((G.elites || 0) >= 3) F.add('elite3');
  if (G.relics.length >= 10) F.add('relic10');
  if (G.gold >= 300) F.add('rich');
  if (G.won) {
    if (G.clock >= RULES.dawn) F.add('lateWin');
    if (G.deck.length <= 12) F.add('thinWin');
    if (G.deck.length >= 30) F.add('thickWin');
    if (!G.downs) F.add('noDownWin');
    if (G.party.every(k => ROSTER[k]?.rarity === 3)) F.add('star3Win');
    if (!G.party.some(k => ROSTER[k]?.rarity === 5)) F.add('no5Win');
  }
  L.facts = [...F];
}
const HISTORY_MAX = 20;
// 판 MVP: 피해 + 방어×0.5 + 회복이 가장 큰 동료, 같으면 피해가 큰 쪽 (결과·끝없는 탑 결과·기록이 같이 쓴다)
export function mvpOf(G) {
  const st = k => G.stats?.[k] || {};
  const score = k => (st(k).dmg || 0) + (st(k).block || 0) * 0.5 + (st(k).heal || 0);
  return G.party.reduce((a, b) => {
    const d = score(b) - score(a);
    return d > 0 || (d === 0 && (st(b).dmg || 0) > (st(a).dmg || 0)) ? b : a;
  });
}
function recordHistory(G) {
  const mvp = mvpOf(G);
  P.history.unshift({
    t: Date.now(), party: G.party.slice(), moon: G.moon, won: !!G.won, why: G.why, clock: G.clock, act: G.act, floors: G.floors || 0,
    mvp, best: G.bestTurn?.dmg || 0, duos: G.duoSet?.size || 0, depth: G.depth || 0, daily: G.daily?.key || null,
    endless: G.endless ? G.endless.floor : null,
  });
  P.history.length = Math.min(P.history.length, HISTORY_MAX);
}

// ---------- 업적 (js/data/achievements.js) ----------
// 새로 달성한 업적에 별 조각을 주고 목록을 돌려준다. 화면은 achToasts를 꺼내 띠로 보여 준다.
export const achToasts = [];
export function achCheck() {
  const got = [];
  for (const a of ACHIEVEMENTS) {
    if (P.achDone.includes(a.id)) continue;
    let ok = false;
    try { ok = !!a.test(P, ROSTER); } catch (e) { ok = false; }
    if (!ok) continue;
    P.achDone.push(a.id); P.shards += a.r; got.push(a); achToasts.push(a);
  }
  if (got.length) save();
  return got;
}

// ---------- 끝없는 탑 (§12, js/data/endless.js) ----------
export const endlessOpen = () => P.wins > 0;
// 끝없는 탑이 끝나면 한 번만: 별 조각(층 비례·상한 + 탑 위 보스) · 최고 층 · 조합별 최고 층 · 최근 판 · 업적
// 「새벽」을 깬 판에서 이어 올랐으면 그 판의 보상(grantRun)은 이미 받았다. 새로 시작한 판이면 판 수에 넣는다.
export function grantEndless(G) {
  const E = G.endless; if (E.granted) return E.granted;
  const S2 = ENDLESS.shards, lines = [];
  const fl = Math.min(S2.cap, E.floor * S2.perFloor);
  if (fl) lines.push([`탑 위 ${E.floor}층`, fl]);
  if (E.bosses) lines.push([`탑 위 보스 ${E.bosses}번`, E.bosses * S2.perBoss]);
  const total = lines.reduce((t, [, v]) => t + v, 0);
  P.shards += total;
  if (E.fresh) P.runs++;
  const R = P.rec, key = G.party.slice().sort().join('+');
  const newBest = E.floor > (R.endlessBest || 0);
  R.endlessBest = Math.max(R.endlessBest || 0, E.floor);
  R.endlessCombo[key] = Math.max(R.endlessCombo[key] || 0, E.floor);
  R.endlessBosses = (R.endlessBosses || 0) + E.bosses;
  const F = new Set(P.life.facts);
  if (E.floor >= 10 && G.party.every(k => ROSTER[k]?.rarity === 3)) F.add('endless3star');
  P.life.facts = [...F];
  P.life.bestTurn = Math.max(P.life.bestTurn || 0, G.bestTurn?.dmg || 0);
  recordHistory(G);
  const ach = achCheck();
  save();
  E.granted = { lines, total, newBest, best: R.endlessBest, combo: R.endlessCombo[key], ach };
  return E.granted;
}

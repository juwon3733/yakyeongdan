// 판 바깥: 가진 동료·별 조각·별가루·소환 천장 저장(localStorage), 별 소환, 판이 끝나면 받는 별 조각.
// 수치는 js/data/gacha.js. 저장이 안 되는 환경(사생활 보호 창 등)이면 메모리에만 두고 그대로 진행한다.
import { makeRng, newSeed } from './rng.js';
import { ROSTER, byRarity } from './data/roster.js';
import { STARTER_OWNED } from './data/characters.js';
import { SUMMON, SUMMON_ITEMS, SHARDS } from './data/gacha.js';
import { RULES } from './data/rules.js';
import { EPISODES, BOND_SCENES } from './data/episodes.js';

const KEY = 'yk-profile';
const VERSION = 1;

function fresh() {
  return {
    v: VERSION, owned: Object.fromEntries(STARTER_OWNED.map(k => [k, { stars: 0 }])),
    shards: SUMMON.firstGift, dust: 0, items: [],
    pulls: 0, pity5: 0, pity4: 0, firstTen: false, got5: false,
    seenDuos: [], runs: 0, wins: 0, best: null, sseed: newSeed(),
    // 에피소드 (docs/09): 동료별 진행 · 다 본 화 · 열린 인연 장면 · 본 인연 장면
    epProg: {}, epSeen: {}, bondOpen: [], bondSeen: [],
  };
}
export let P = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && d.v === VERSION) return Object.assign(fresh(), d);
  } catch (e) { /* 저장이 막힌 환경 */ }
  return fresh();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* 저장 안 됨 */ }
}
// 개발판 점검용: 새 프로필로
export function resetProfile() { P = fresh(); save(); return P; }

export const owns = id => !!P.owned[id];

// ---------- 별 소환 ----------
// 한 번 뽑기의 ★5 확률: 40번째부터 매번 +4%, 51번째는 확정
function rate5() {
  const k = P.pity5 + 1;
  if (k >= SUMMON.hard) return 1;
  return SUMMON.rate5 + (k >= SUMMON.softFrom ? SUMMON.softStep * (k - SUMMON.softFrom + 1) : 0);
}
export const nextRate5 = rate5;

// 동료 하나 고르기: 아직 없는 동료가 newFirst 확률로 먼저
function pickChar(rng, rarity, prefer) {
  const all = prefer || byRarity(rarity), fresh2 = all.filter(k => !owns(k));
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
function grantItem(rng, rarity) {
  const it = rng.pick(SUMMON_ITEMS[rarity]), r = { kind: it.kind, name: it.name, text: it.text, rarity };
  if (it.dust) { P.dust += it.dust; r.dust = it.dust; }
  else if (rarity === 3 && P.items.includes(it.name)) { P.dust += SUMMON.dustDupItem; r.dust = SUMMON.dustDupItem; }
  else P.items.push(it.name);
  return r;
}
function rollOne(rng, force4) {
  P.pulls++; P.pity5++;
  // 초심자: 처음 30번 안에 ★5 확정 (고르기 화면은 나중에)
  const beginner = !P.got5 && P.pulls >= SUMMON.beginner;
  let rarity;
  const x = rng.next();
  if (beginner || x < rate5()) rarity = 5;
  else if (force4 || x < rate5() + SUMMON.rate4) rarity = 4;
  else rarity = 3;
  let r;
  if (rarity === 5) { P.pity5 = 0; P.got5 = true; r = grantChar(pickChar(rng, 5)); }
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
  }
  const newDuos = [...(G.duoSet || [])].filter(k => !P.seenDuos.includes(k));
  add(`새로 찾은 듀오 ${newDuos.length}쌍`, newDuos.length * SHARDS.newDuo);
  add(`강적 ${G.elites || 0}번`, (G.elites || 0) * SHARDS.elite);
  if (!G.won) add(`오른 층 ${G.floors || 0}칸`, Math.max(SHARDS.lossMin, G.floors || 0));
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
  const before = new Set();
  for (const cid of G.party) for (let n = 0; n < 3; n++) if (epOpen(cid, n)) before.add(epKey(cid, n));
  for (const cid of G.party) {
    const g = P.epProg[cid] ||= { runs: 0, act2: false, dawn: false };
    g.runs++;
    if ((G.bossKills || 0) >= 2) g.act2 = true;
    if (G.won) g.dawn = true;
  }
  const out = [];
  for (const cid of G.party) for (let n = 0; n < 3; n++) if (epOpen(cid, n) && !before.has(epKey(cid, n))) out.push({ cid, n });
  return out;
}

// 결과 화면에서 한 번만
export function grantRun(G) {
  if (G.granted) return G.granted;
  const r = runShards(G);
  P.shards += r.total; P.runs++;
  if (G.won) { P.wins++; if (P.best == null || G.clock < P.best) P.best = G.clock; }
  for (const k of r.newDuos) P.seenDuos.push(k);
  r.newEps = epProgress(G);
  // 인연 듀오를 처음 썼으면 인연 장면이 열린다
  r.newBonds = [...(G.duoSet || [])].filter(k => BOND_SCENES[k] && !P.bondOpen.includes(k));
  for (const k of r.newBonds) P.bondOpen.push(k);
  save();
  G.granted = r;
  return r;
}

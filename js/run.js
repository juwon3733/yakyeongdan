// 한 판 상태. S.G = 판, S.C = 지금 전투. 판이 없을 때는 S.view가 화면(타이틀·본부·소환·파티 고르기).
import { makeRng, newSeed } from './rng.js';
import { CHARACTERS } from './data/characters.js';
import { canUpgrade } from './data/cards.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { RELICS, START_RELIC } from './data/relics.js';
import { ACTS } from './data/enemies.js';
import { makeMap } from './map.js';
import { relicFlag, relicSum } from './relics.js';
import { depthRuleAt } from './data/depth.js';

export const S = { G: null, C: null, picked: [], dev: false, view: 'title', reveal: null, fxq: [] };

// opts (판 바깥에서 정함, meta.js runOptions): depth 밤의 깊이 · locked 아직 안 열린 카드 묶음 카드 · upgrades 시작 카드 하나를 강화판으로 시작할 동료(별자리 3)
//   sigs 전용 도구가 열린 동료(별자리 4) · startRelic 시작 도구
export function newRun(party, seed = newSeed(), opts = {}) {
  const rng = makeRng(seed), depth = opts.depth || 0;
  const startHp = depthRuleAt(depth, 'startHp') || 0;
  const members = Object.fromEntries(party.map(p => {
    const max = CHARACTERS[p].maxHp;
    return [p, { hp: Math.max(1, max + startHp), max, down: false, wasDown: false, feather: false, lost: 0 }];
  }));
  const deck = party.flatMap(p => {
    const st = CHARACTERS[p].start.slice();
    if ((opts.upgrades || []).includes(p)) { const i = st.findIndex(canUpgrade); if (i >= 0) st[i] += '+'; }
    return st;
  });
  const curse = depthRuleAt(depth, 'curse'); if (curse) deck.push(curse);
  const moon = rng.pick(Object.keys(MOONS));
  S.G = {
    seed, rng, screen: 'map', party, moon,
    clock: 0, members, formation: defaultFormation(party), fsel: null,
    deck, depth, locked: new Set(opts.locked || []), sigs: opts.sigs || [],
    act: 1, row: 0, map: null, nextMap: null, took: [], duos: 0, fights: 0, pity: 0,
    gold: RULES.startGold, relics: [opts.startRelic && RELICS[opts.startRelic] ? opts.startRelic : START_RELIC], used: {}, salt: 0,
    duoSet: new Set(), stats: Object.fromEntries(party.map(p => [p, { dmg: 0, block: 0 }])),
    floors: 0, elites: 0, bossKills: 0, removes: 0, seenEvents: [], note: '', moonPick: false, shop: null,
    haggle: 0, nextFight: null, smithLeft: 0,
    // 도감·기록용 (meta.js grantRun이 모은다)
    offered: new Set(), played: new Set(), foesMet: new Set(), foesBeat: new Set(), affixSeen: new Set(), talks: new Set(),
  };
  S.G.map = makeMap(rng, moon, 1);
  S.G.nextMap = makeMap(rng, moon, 2);
  S.G.nextElite = pickElite();
  S.view = 'run';
}

// 이번 막의 다음 강적 (사건 「탑의 낙서」가 미리 알려 준다)
export function pickElite() {
  const G = S.G;
  return G.rng.pick(ACTS[G.act].elites);
}

// 대열: formation[0] = 앞줄(적 쪽), [1] = 가운데, [2] = 뒤. 처음엔 최대 체력이 높은 동료가 앞.
const defaultFormation = party => party.slice().sort((a, b) => CHARACTERS[b].maxHp - CHARACTERS[a].maxHp);

export const member = id => S.G.members[id];
export const alive = id => !!S.G.members[id] && !S.G.members[id].down;
export const living = () => S.G.formation.filter(alive);   // 앞에서 뒤 순서
export const swapFormation = (i, j) => { const F = S.G.formation; [F[i], F[j]] = [F[j], F[i]]; };

export function healMember(id, n) {
  const m = member(id); if (!m || m.down) return 0;
  const before = m.hp; m.hp = Math.min(m.max, m.hp + n);
  if (m.hp > before) pushFx({ kind: 'heal', id, n: m.hp - before });
  return m.hp - before;
}
export const healAll = n => S.G.party.forEach(id => healMember(id, n));

export function logMsg(s) {
  const C = S.C; if (!C) return;
  C.log.push(s); if (C.log.length > 3) C.log.shift();
}
// 화면에 띄울 연출 (main.js가 꺼내 보여 준다): { kind: 'phase' | 'duo' | 'note', text }
// 화면에서 하는 판(S.ui, main.js)일 때만 쌓는다. 시뮬레이션·점검 엔진은 연출 사건을 모으지 않는다.
// 연출 사건(js/juice.js가 순서대로 보여 준다): play hitFoe kill hurt tick block heal foeAct foeTurn turn time rewind combat phase
export const pushFx = fx => { if (S.ui) S.fxq.push(fx); };

// 밤의 깊이 규칙 (js/data/depth.js)
export const depthRule = k => depthRuleAt(S.G?.depth || 0, k);
// 여명이 시작되는 시각: 6:00 (깊이 8이면 5:30)
export const dawnAt = () => depthRule('dawnAt') ?? RULES.dawn;
export function addTime(m) {
  const G = S.G, before = G.clock; G.clock += m;
  if (m > 0) pushFx({ kind: 'time', m, dawn: before < dawnAt() && G.clock >= dawnAt() });
  if (before < dawnAt() && G.clock >= dawnAt() && !relicFlag('noDawn')) logMsg('<b>해가 뜬다.</b> 탑이 무너지기 시작해 적이 매 턴 강해진다.');
}
export const rewind = m => { S.G.clock = Math.max(0, S.G.clock - m); pushFx({ kind: 'rewind', m }); };
// 파티 패시브 숫자 합 (서 있는 동료만)
export const partySum = k => S.G.party.reduce((t, p) => t + (alive(p) ? CHARACTERS[p].passive?.[k] || 0 : 0), 0);
// 지금 걸린 달 효과 값. 루나리아 「만월야」(C.allMoons)면 네 달 효과가 한꺼번에: 수치는 가장 좋은 쪽, boost는 동료별 가장 큰 값.
const MOON_MIN = { timeCost: 1, duoNeed: 1 };
export function moonFx(k) {
  const ms = S.C?.allMoons ? Object.values(MOONS) : [MOONS[S.G.moon]];
  if (k === 'boost') {
    const o = {}; for (const m of ms) for (const [c, v] of Object.entries(m.boost || {})) o[c] = Math.max(o[c] || 0, v);
    return o;
  }
  const vs = ms.map(m => m[k]).filter(v => v != null);
  if (!vs.length) return undefined;
  return MOON_MIN[k] ? Math.min(...vs) : Math.max(...vs);
}
// 시간 카드 비용(분): 달(초승 8) · 멈춘 시계탑(0) · 엘레오노르(−5) · 엘레오노르 「멈춘 자정」이 터진 턴(0) · 거꾸로 도는 시계 +10
export const timeCost = () => relicFlag('timeCardFree') || S.C?.timeFree ? 0 : Math.max(0, (moonFx('timeCost') ?? RULES.timeCard) - partySum('timeMinus') + relicSum('timeCardAdd'));
export const isDawn = () => S.G.clock >= dawnAt() && !relicFlag('noDawn') && !S.G.endless;   // 끝없는 탑은 여명 대신 여명 게이지(js/endless.js)

// 7시가 되면 탑이 무너진다 (어떤 행동 뒤든 main.js가 부른다)
export function checkCollapse() {
  const G = S.G;
  if (!G || G.endless || G.screen === 'result' || G.clock < RULES.collapse) return false;   // 끝없는 탑은 무너지지 않는다(대신 여명 게이지)
  endRun(false, 'collapse');
  return true;
}
export function endRun(won, why) {
  if (S.G.episode) { S.C = null; S.G.episode.won = won; S.G.screen = 'epdone'; return; }   // 에피소드 특별 전투
  if (S.G.tutorial) { S.C = null; S.G.tutorial.won = won; S.G.screen = 'tutdone'; return; }   // 첫 실행 튜토리얼
  S.C = null; S.G.won = won; S.G.why = why || (won ? 'win' : 'down'); S.G.screen = 'result'; }

// 도구 얻기 (얻는 순간 효과가 있는 도구는 화면을 바꾼다)
export function gainRelic(id) {
  const G = S.G; if (!id || G.relics.includes(id)) return;
  G.relics.push(id);
  if (RELICS[id].onGet === 'moonPick') G.moonPick = true;   // 다음 화면 대신 달 고르기 (render/index.js)
}
export const gainGold = n => { S.G.gold = Math.max(0, S.G.gold + n); };
export const relicCount = relicSum;

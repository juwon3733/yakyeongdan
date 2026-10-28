// 한 판 상태. S.G = 판, S.C = 지금 전투. 판이 없을 때는 S.view가 화면(타이틀·본부·소환·파티 고르기).
import { makeRng, newSeed } from './rng.js';
import { CHARACTERS } from './data/characters.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { RELICS, START_RELIC } from './data/relics.js';
import { ACTS } from './data/enemies.js';
import { makeMap } from './map.js';
import { relicFlag, relicSum } from './relics.js';

export const S = { G: null, C: null, picked: [], dev: false, view: 'title', reveal: null, fxq: [] };

export function newRun(party, seed = newSeed()) {
  const rng = makeRng(seed);
  const members = Object.fromEntries(party.map(p => {
    const max = CHARACTERS[p].maxHp;
    return [p, { hp: max, max, down: false, wasDown: false, feather: false }];
  }));
  const moon = rng.pick(Object.keys(MOONS));
  S.G = {
    seed, rng, screen: 'map', party, moon,
    clock: 0, members, formation: defaultFormation(party), fsel: null,
    deck: party.flatMap(p => CHARACTERS[p].start),
    act: 1, row: 0, map: null, nextMap: null, took: [], duos: 0, fights: 0, pity: 0,
    gold: RULES.startGold, relics: [START_RELIC], used: {}, salt: 0,
    duoSet: new Set(), stats: Object.fromEntries(party.map(p => [p, { dmg: 0, block: 0 }])),
    floors: 0, elites: 0, bossKills: 0, removes: 0, seenEvents: [], note: '', moonPick: false, shop: null,
  };
  S.G.map = makeMap(rng, moon);
  S.G.nextMap = makeMap(rng, moon);
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
  const before = m.hp; m.hp = Math.min(m.max, m.hp + n); return m.hp - before;
}
export const healAll = n => S.G.party.forEach(id => healMember(id, n));

export function logMsg(s) {
  const C = S.C; if (!C) return;
  C.log.push(s); if (C.log.length > 3) C.log.shift();
}
// 화면에 띄울 연출 (main.js가 꺼내 보여 준다): { kind: 'phase' | 'duo' | 'note', text }
export const pushFx = fx => { S.fxq.push(fx); };

export function addTime(m) {
  const G = S.G, before = G.clock; G.clock += m;
  if (before < RULES.dawn && G.clock >= RULES.dawn && !relicFlag('noDawn')) logMsg('<b>6시. 해가 뜬다.</b> 탑이 무너지기 시작해 적이 매 턴 강해진다.');
}
export const rewind = m => { S.G.clock = Math.max(0, S.G.clock - m); };
// 시간 카드 비용(분): 달(초승 15) · 멈춘 시계탑(0)
export const timeCost = () => relicFlag('timeCardFree') ? 0 : MOONS[S.G.moon].timeCost ?? RULES.timeCard;
export const isDawn = () => S.G.clock >= RULES.dawn && !relicFlag('noDawn');

// 7시가 되면 탑이 무너진다 (어떤 행동 뒤든 main.js가 부른다)
export function checkCollapse() {
  const G = S.G;
  if (!G || G.screen === 'result' || G.clock < RULES.collapse) return false;
  endRun(false, 'collapse');
  return true;
}
export function endRun(won, why) {
  if (S.G.episode) { S.C = null; S.G.episode.won = won; S.G.screen = 'epdone'; return; }   // 에피소드 특별 전투
  S.C = null; S.G.won = won; S.G.why = why || (won ? 'win' : 'down'); S.G.screen = 'result'; }

// 도구 얻기 (얻는 순간 효과가 있는 도구는 화면을 바꾼다)
export function gainRelic(id) {
  const G = S.G; if (!id || G.relics.includes(id)) return;
  G.relics.push(id);
  if (RELICS[id].onGet === 'moonPick') G.moonPick = true;   // 다음 화면 대신 달 고르기 (render/index.js)
}
export const gainGold = n => { S.G.gold = Math.max(0, S.G.gold + n); };
export const relicCount = relicSum;

// 한 판 상태. S.G = 판, S.C = 지금 전투.
import { makeRng, newSeed } from './rng.js';
import { CHARACTERS } from './data/characters.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { makeMap } from './map.js';

export const S = { G: null, C: null, picked: [], dev: false };

export function newRun(party, seed = newSeed()) {
  const rng = makeRng(seed);
  const members = Object.fromEntries(party.map(p => {
    const max = CHARACTERS[p].maxHp;
    return [p, { hp: max, max, down: false, wasDown: false }];
  }));
  S.G = {
    seed, rng, screen: 'map', party, moon: rng.pick(Object.keys(MOONS)),
    clock: 0, members, formation: defaultFormation(party), fsel: null,
    deck: party.flatMap(p => CHARACTERS[p].start),
    act: 1, row: 0, map: null, took: [], duos: 0, fights: 0, pity: 0,
  };
  S.G.map = makeMap(rng);
}

// 대열: formation[0] = 앞줄(적 쪽), [1] = 가운데, [2] = 뒤. 처음엔 최대 체력이 높은 동료가 앞.
const defaultFormation = party => party.slice().sort((a, b) => CHARACTERS[b].maxHp - CHARACTERS[a].maxHp);

export const member = id => S.G.members[id];
export const alive = id => !S.G.members[id].down;
export const living = () => S.G.formation.filter(alive);   // 앞에서 뒤 순서
export const swapFormation = (i, j) => { const F = S.G.formation; [F[i], F[j]] = [F[j], F[i]]; };

export function healMember(id, n) {
  const m = member(id); if (m.down) return 0;
  const before = m.hp; m.hp = Math.min(m.max, m.hp + n); return m.hp - before;
}
export const healAll = n => S.G.party.forEach(id => healMember(id, n));

export function logMsg(s) {
  const C = S.C; if (!C) return;
  C.log.push(s); if (C.log.length > 3) C.log.shift();
}
export function addTime(m) {
  const G = S.G, before = G.clock; G.clock += m;
  if (before < RULES.dawn && G.clock >= RULES.dawn) logMsg('<b>6시. 해가 뜬다.</b> 탑이 무너지기 시작해 적이 매 턴 강해진다.');
}
export const rewind = m => { S.G.clock = Math.max(0, S.G.clock - m); };
export const timeCost = () => MOONS[S.G.moon].timeCost ?? RULES.timeCard;
export const isDawn = () => S.G.clock >= RULES.dawn;

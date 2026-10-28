// 한 판 상태. S.G = 판, S.C = 지금 전투.
import { makeRng, newSeed } from './rng.js';
import { CHARACTERS } from './data/characters.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { makeMap } from './map.js';

export const S = { G: null, C: null, picked: [], dev: false };

export function newRun(party, seed = newSeed()) {
  const rng = makeRng(seed);
  const maxHp = party.reduce((s, p) => s + RULES.hpByRarity[CHARACTERS[p].rarity], 0);
  S.G = {
    seed, rng, screen: 'map', party, moon: rng.pick(Object.keys(MOONS)),
    clock: 0, hp: maxHp, maxHp, deck: party.flatMap(p => CHARACTERS[p].start),
    act: 1, row: 0, map: null, took: [], duos: 0, fights: 0,
  };
  S.G.map = makeMap(rng);
}

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
export const heal = n => { const G = S.G; G.hp = Math.min(G.maxHp, G.hp + n); };
export const isDawn = () => S.G.clock >= RULES.dawn;

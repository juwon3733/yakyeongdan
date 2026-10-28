// 카드·패시브가 쓰는 효과 도우미. 데이터는 이 함수들만 부른다.
import { S, heal, logMsg } from './run.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';

export function hit(n) {
  const C = S.C, f = C.foe;
  let d = Math.max(0, Math.floor(n + C.bonus)); C.bonus = 0;
  const b = Math.min(f.block, d); f.block -= b; d -= b; f.hp = Math.max(0, f.hp - d);
  logMsg(`${f.name}에게 피해 <b>${d}</b>${b ? ` (방어 ${b} 막힘)` : ''}`);
}
export function guard(n) { S.C.block += Math.max(0, n); }
export function draw(n) {
  const C = S.C;
  for (let i = 0; i < n; i++) {
    if (!C.draw.length) { if (!C.disc.length) return; C.draw = S.G.rng.shuffle(C.disc); C.disc = []; }
    if (C.hand.length >= RULES.maxHand) return;
    C.hand.push(C.draw.pop());
  }
}
export const effects = {
  hit, guard, draw,
  heal: n => heal(n),
  get moon() { return S.G.moon; },
  full: ch => MOONS[S.G.moon].boost?.[ch] || 0,
  dark: () => MOONS[S.G.moon].darkBonus || 0,
};

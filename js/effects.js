// 카드·패시브가 쓰는 효과 도우미. 데이터는 이 함수들만 부른다.
// C.actor = 지금 효과를 내는 동료(카드 주인, 패시브 주인), C.target = 'ally' 카드에서 고른 동료.
import { S, healMember, logMsg } from './run.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';

export function hit(n) {
  const C = S.C, f = C.foe;
  let d = Math.max(0, Math.floor(n + C.bonus)); C.bonus = 0;
  const b = Math.min(f.block, d); f.block -= b; d -= b; f.hp = Math.max(0, f.hp - d);
  if (C.actor) C.lastHitter = C.actor;
  logMsg(`${f.name}에게 피해 <b>${d}</b>${b ? ` (방어 ${b} 막힘)` : ''}`);
}
export function guard(n) { const C = S.C; if (C.actor) C.blocks[C.actor] += Math.max(0, n); }
export function heal(n) { const C = S.C, id = C.target || C.actor; if (id) healMember(id, n); }
export function draw(n) {
  const C = S.C;
  for (let i = 0; i < n; i++) {
    if (!C.draw.length) { if (!C.disc.length) return; C.draw = S.G.rng.shuffle(C.disc); C.disc = []; }
    if (C.hand.length >= RULES.maxHand) return;
    C.hand.push(C.draw.pop());
  }
}
export const effects = {
  hit, guard, draw, heal,
  get moon() { return S.G.moon; },
  full: ch => MOONS[S.G.moon].boost?.[ch] || 0,
  dark: () => MOONS[S.G.moon].darkBonus || 0,
};

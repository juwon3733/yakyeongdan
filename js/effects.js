// 카드·패시브가 쓰는 효과 도우미. 데이터는 이 함수들만 부른다.
// C.actor = 지금 효과를 내는 동료(카드 주인, 패시브 주인), C.target = 'ally' 카드에서 고른 동료,
// C.tf = 고른 적의 번호. 피해 계산은 combat.js의 dmgToFoe가 한다.
import { S, healMember, member, logMsg } from './run.js';
import { MOONS } from './data/moons.js';
import { RULES } from './data/rules.js';
import { dmgToFoe, foeTarget, livingFoes, killCheck } from './combat.js';

// 달 보너스(보름달: 아이리스·마르타 피해·방어 +2)는 효과를 내는 동료 기준으로 자동으로 붙는다.
const boost = () => MOONS[S.G.moon].boost?.[S.C.actor] || 0;

export function hit(n, f = foeTarget()) {
  const C = S.C; if (!f) return;
  const d = dmgToFoe(f, n + C.bonus + boost(), C.actor); C.bonus = 0;
  if (C.actor) { f.lastHitter = C.actor; stat(C.actor, 'dmg', d.dealt); }
  logMsg(`${f.name}에게 피해 <b>${d.dealt}</b>${d.blocked ? ` (방어 ${d.blocked} 막힘)` : ''}${d.bleed ? ` · 출혈 ${d.bleed}` : ''}`);
  killCheck(f);
}
// 결과 화면 MVP용: 동료마다 준 피해·쌓은 방어
function stat(id, k, n) { const st = S.G.stats[id]; if (st && n > 0) st[k] += n; }
export function hitAll(n) {
  const C = S.C, b = C.bonus;
  for (const f of livingFoes()) { C.bonus = b; hit(n, f); }
  C.bonus = 0;
}
export function hitRandom(n) { const L = livingFoes(); if (L.length) hit(n, S.G.rng.pick(L)); }
// 방어 무시 피해 (독 터뜨리기 등)
export function pierce(f, n) {
  if (!f || f.dead || n <= 0) return;
  f.hp = Math.max(0, f.hp - n); logMsg(`${f.name}에게 피해 <b>${n}</b>`); if (S.C.actor) stat(S.C.actor, 'dmg', n); killCheck(f);
}
export function guard(n, who = S.C.actor) {
  const C = S.C; if (!who) return;
  const v = Math.max(0, n + (who === C.actor ? boost() : 0));
  C.blocks[who] += v; stat(C.actor || who, 'block', v);
}
// 'ally' 카드면 고른 동료에게, 아니면 카드 주인에게
export function guardTarget(n) { guard(n, S.C.target || S.C.actor); }
export function heal(n) { const C = S.C, id = C.target || C.actor; if (id) healMember(id, n); }
export function loseHp(n) {
  const C = S.C, m = C.actor && member(C.actor); if (!m) return;
  m.hp = Math.max(1, m.hp - n);
}
export function keepBlock() { const C = S.C; if (C.actor) C.keep[C.actor] = true; }
export function foeStatus(k, n, f = foeTarget()) { if (f && !f.dead) f[k] += n; }
export function foeStatusAll(k, n) { for (const f of livingFoes()) f[k] += n; }
// 베기 횟수 (거울 자세: 베기마다 아이리스 방어)
export function slash(n) {
  const C = S.C; C.slashes += n; C.totalSlashes += n;
  if (C.mirror) guard(C.mirror * n);
}
// 칼집 치기로 쌓인 「다음 베기 +」를 꺼내 쓴다
export function sheath() { const C = S.C, v = C.sheath; C.sheath = 0; return v; }

export function draw(n) {
  const C = S.C;
  for (let i = 0; i < n; i++) {
    if (!C.draw.length) { if (!C.disc.length) return; C.draw = S.G.rng.shuffle(C.disc); C.disc = []; }
    if (C.hand.length >= RULES.maxHand) return;
    C.hand.push(C.draw.pop());
  }
}
export const effects = {
  hit, hitAll, hitRandom, pierce, guard, guardTarget, draw, heal, loseHp, keepBlock, foeStatus, foeStatusAll, slash, sheath,
  get moon() { return S.G.moon; },
  full: ch => MOONS[S.G.moon].boost?.[ch] || 0,
  dark: () => MOONS[S.G.moon].darkBonus || 0,
};

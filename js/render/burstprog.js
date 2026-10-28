// 동료 초상 옆 ③ 폭발 진행 (docs/12_signature.md): [지금, 필요]. 조건 글은 characters.js passive.lines의 burst 줄.
// 조건 수치는 characters.js·combat.js·effects.js의 ③ 코드와 같아야 한다 (밸런스로 바꾸면 여기도).
import { S } from '../run.js';
import { CHARACTERS } from '../data/characters.js';
import { esc } from './common.js';

const maxFoe = k => Math.max(0, ...(S.C?.all || []).filter(f => !f.dead).map(f => f[k] || 0));
export const BURST_PROG = {
  iris: C => [C.slashes, 2],                 // 베기 2번 뒤부터 2배
  brick: C => [C.loaded, 6],
  marta: C => [C.blocks.marta || 0, 30],
  noel: C => [C.mana, 20],
  raven: () => [maxFoe('poison'), 40],
  sion: C => [C.spirits?.length || 0, 6],
  lunaria: C => [C.moonTurn, 3],
  akane: () => [maxFoe('burn'), 8],
  eleonore: C => C.bursts.eleonore ? null : [C.timeUsedTurn, 2],
  mimimomo: C => [C.pairTurn, 2],
  sebas: C => [C.hand.length, 6],
  mariana: () => [S.G.gold, 30],
  tomori: C => [C.aimTurn, 2],
  sigrun: C => [C.air ? C.diveStreak : 0, 2],
  zeno: C => [C.lostCombat.zeno || 0, 20],
  finn: C => [Math.min(C.chain, 3) + C.chain3Streak, 5],
  laila: C => [C.zeroTurn, 5],
  dora: C => [C.tempered, 3],
  gordon: C => [C.healTurn, 15],
  fukuro: C => [C.randTurn, 2],
};
const burstLine = p => (CHARACTERS[p].passive?.lines || []).find(l => l[0] === 'burst');

// 작은 칸(필요 ≤ 6) 또는 막대+숫자. 하나 남으면 깜빡이고(near), 이번 턴 터졌으면 빛남(on).
export function burstProgHTML(p) {
  const C = S.C, fn = BURST_PROG[p], ln = burstLine(p); if (!C || !fn || !ln) return '';
  const on = C.burstTurn.has(p) || (p === 'eleonore' && !!C.bursts.eleonore);
  const v = fn(C); if (!v && !on) return '';
  const [cur, need] = v || [1, 1], k = Math.max(0, Math.min(cur || 0, need));
  const ready = !on && k >= need, near = !on && !ready && k > 0 && (need <= 6 ? k === need - 1 : k / need >= .8);
  const body = need <= 6
    ? Array.from({ length: need }, (_, i) => `<i class="${i < k || on ? 'f' : ''}"></i>`).join('')
    : `<u><s style="width:${on ? 100 : Math.round(k / need * 100)}%"></s></u><em>${cur || 0}/${need}</em>`;
  const tip = `③ 「${ln[1]}」: ${ln[2]}\n지금 ${cur || 0} / ${need}${on ? ' · 이번 턴 터짐' : ''}`;
  return `<span class="bprog ${on ? 'on' : ready ? 'ready' : near ? 'near' : ''}" data-tip="${esc(tip)}"><b>③</b>${body}</span>`;
}

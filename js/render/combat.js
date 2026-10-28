import { S } from '../run.js';
import { cardDef, intentText, aimShown, needsAlly, usable } from '../combat.js';
import { CHARACTERS } from '../data/characters.js';
import { FOE_PAL } from '../data/enemies.js';
import { RULES, AIM_NAME, ROW_NAME } from '../data/rules.js';
import { sprite } from './sprites.js';
import { esc, cardHTML, face, hpBar } from './common.js';

// 동료별 고유 수치 표시
const STAT = {
  brick: C => `장전 ${C.loaded}`,
  noel: C => `마력 ${C.mana}${C.asleep ? ' · 잠' : ''}`,
  iris: C => C.slashes ? `베기 ${C.slashes}` : '',
  marta: C => C.counter ? `반격 ${C.counter}` : '',
  raven: C => C.foe.poison ? `독 ${C.foe.poison}` : '',
};

export function combatView() {
  const G = S.G, C = S.C, f = C.foe;
  const pend = C.pending != null ? C.hand.find(h => h.uid === C.pending) : null;
  const wantAlly = pend && needsAlly(pend), wantFoe = pend && !wantAlly;
  const aim = aimShown();
  // 왼쪽→오른쪽 = 뒤·가운데·앞 (앞이 적 쪽)
  const order = [2, 1, 0];
  const party = order.map((fi, k) => {
    const p = G.formation[fi], c = CHARACTERS[p], M = G.members[p], s = STAT[p] ? STAT[p](C) : '';
    const blk = C.blocks[p];
    const swap = k < 2 ? `<button type="button" class="swap" data-swap="${fi - 1}" ${C.swaps >= RULES.swapsPerTurn ? 'disabled' : ''} title="자리 바꾸기 (바꾼 둘 방어 -${RULES.swapBlockCost})">⇄</button>` : '';
    return `<button type="button" class="pm ${M.down ? 'down' : ''} ${aim === p ? 'aimed' : ''} ${wantAlly && !M.down ? 'tg' : ''} ${C.last === p ? 'last' : ''}" style="--c:${c.col}" data-ally="${p}" ${wantAlly && !M.down ? '' : 'tabindex="-1"'}>
        <span class="row">${ROW_NAME[fi]}</span>
        <img class="px" src="${sprite(c.pal, c.long)}" alt="">
        <span class="nm">${c.name}</span>
        ${hpBar(M)}<span class="hp">${M.down ? '쓰러짐' : `${M.hp}/${M.max}`}${blk ? ` <b class="blk">방어 ${blk}</b>` : ''}</span>
        <span class="s">${s}</span></button>${swap}`;
  }).join('');
  const st = [f.block ? `<span class="chip" style="color:var(--moon)">방어 ${f.block}</span>` : '',
              f.poison ? `<span class="chip" style="color:#9af07a">독 ${f.poison}</span>` : '',
              f.str ? `<span class="chip" style="color:#ff9a8a">힘 ${f.str}</span>` : '',
              f.weak ? `<span class="chip" style="color:#f08ac0">약화 ${f.weak}</span>` : ''].join('');
  const hand = C.hand.map(h => cardHTML(h, usable(h), 'play', undefined, h.uid === C.pending)).join('');
  const pip = (n, on, cls) => Array.from({ length: n }, (_, k) => `<i class="${k < on ? cls : (cls ? '' : 'off')}"></i>`).join('');
  const pd = pend && cardDef(pend);
  const tip = wantAlly ? '받을 동료를 누르세요.' : pd?.atk ? '적을 누르면 씁니다 (카드를 한 번 더 눌러도 됨).' : pend ? '카드를 한 번 더 누르면 씁니다.' : '카드를 누르고 대상을 누르세요.';
  return `<div class="field">
      <div class="party">${party}</div>
      <button type="button" class="foe ${wantFoe ? 'tg' : ''}" data-foe>
        <span class="intent">${intentText(f)}${aim ? ` → ${face(aim, 'sm')} <span class="aimnm">${AIM_NAME[f.aim || RULES.defaultAim]}</span>` : ''}</span>
        <img class="px" src="${sprite(FOE_PAL[f.pal], f.long, f.crown)}" alt="">
        <span class="nm">${esc(f.name)}${C.kind === 'boss' ? ' <span class="chip" style="color:var(--rose)">보스</span>' : C.kind === 'elite' ? ' <span class="chip" style="color:#b06ae0">강적</span>' : ''}</span>
        <span class="hpbar foehp"><i style="width:${f.hp / f.max * 100}%"></i></span>
        <span class="hp">${f.hp}/${f.max}</span>
        <span class="st">${st}</span>
      </button>
    </div>
    <div class="log" aria-live="polite">${C.log.slice(-2).join(' · ') || ''}<span class="tip">${tip}</span></div>
    <div class="bottom">
      <span class="energy" title="에너지">${pip(RULES.energy, C.energy, '')}<b>${C.energy}</b></span>
      <div class="hand">${hand || '<p class="note">손패가 비었다.</p>'}</div>
      <div class="endcol"><button type="button" class="primary" data-end>턴 끝</button><span class="note">뽑을 ${C.draw.length} · 버린 ${C.disc.length}</span></div>
    </div>`;
}

export const combatTopExtra = () => {
  const C = S.C;
  return `<span class="chip">연계</span><span class="chain">${Array.from({ length: RULES.chainMax }, (_, k) => `<i class="${k < C.chain ? 'on' : ''}"></i>`).join('')}</span><span class="note">${C.turn}턴</span>`;
};

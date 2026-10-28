import { S, alive } from '../run.js';
import { cardDef, intentText, aimShown, targetOf, usable, litMembers, swapLimit } from '../combat.js';
import { relicFlag } from '../relics.js';
import { CHARACTERS } from '../data/characters.js';
import { canUpgrade } from '../data/cards.js';
import { FOE_PAL } from '../data/enemies.js';
import { RULES, AIM_NAME, ROW_NAME } from '../data/rules.js';
import { MOONS } from '../data/moons.js';
import { sprite, moonImg } from './sprites.js';
import { esc, cardHTML, face, hpBar, palOf } from './common.js';

// 동료별 고유 수치 표시
const STAT = {
  brick: C => C.loaded ? `장전 ${C.loaded}` : '',
  noel: C => [C.mana ? `마력 ${C.mana}` : '', C.asleep ? '잠' : '', C.late ? '늦잠' : ''].filter(Boolean).join(' · '),
  iris: C => [C.slashes ? `베기 ${C.slashes}` : '', C.sheath ? `다음 베기 +${C.sheath}` : ''].filter(Boolean).join(' · '),
  marta: C => [C.counter ? `반격 ${C.counter}` : '', C.taunt === 'marta' ? '대신 맞기' : ''].filter(Boolean).join(' · '),
  raven: C => C.garden ? `정원 +${C.garden}` : '',
  sion: C => C.spirits.length ? `정령 ${C.spirits.length}${C.spiritExtra ? ` (행동 +${C.spiritExtra})` : ''}` : '',
  lunaria: C => C.moonChanged ? '달 바뀜' : '',
  akane: C => [C.flameGuard ? `불꽃 ${C.flameGuard}` : '', C.sheath ? `다음 베기 +${C.sheath}` : ''].filter(Boolean).join(' · '),
  eleonore: C => C.timeUsedTurn ? `시간 카드 ${C.timeUsedTurn}` : '',
  mimimomo: C => C.lastSub ? `직전 ${C.lastSub === 'mimi' ? '미미' : C.lastSub === 'momo' ? '모모' : '둘 다'}` : '',
  sebas: C => [C.reserve ? `예약 ${C.reserve}` : '', C.double ? '두 번 쓰기' : ''].filter(Boolean).join(' · '),
  sigrun: C => [C.air ? '공중' : '', C.sigCounter ? `반격 ${C.sigCounter}` : '', C.taunt === 'sigrun' ? '대신 맞기' : ''].filter(Boolean).join(' · '),
  zeno: C => [C.zenoStr ? `공격 +${C.zenoStr}` : '', C.taunt === 'zeno' ? '대신 맞기' : ''].filter(Boolean).join(' · '),
  finn: C => C.freeNext ? `다음 ${C.freeNext}장 0` : '',
  laila: C => C.zeroBonus ? `0비용 +${C.zeroBonus}` : '',
  dora: C => C.tempered ? `담금질 ${C.tempered}` : '',
  gordon: C => C.nextAtk ? `다음 턴 공격 +${C.nextAtk}` : '',
  fukuro: C => C.atkFree ? '공격 0비용' : '',
};
const chip = (v, nm, col) => v ? `<span class="chip" style="color:${col}">${nm} ${v}</span>` : '';
const foeSt = f => chip(f.skip, '멈춤', '#b48ae8') + chip(f.dim ? Math.round(f.dim * 100) + '%' : 0, '빛 −', '#f0d040') + chip(f.bounty, '현상금', '#e0a050') + chip(f.block, '방어', 'var(--moon)') + chip(f.poison, '독', '#9af07a') + chip(f.burn, '화상', '#ff9a4a') + chip(f.bleed, '출혈', '#ff6a6a')
  + chip(f.str, '힘', '#ff9a8a') + chip(f.weak, '약화', '#f08ac0') + chip(f.vuln, '취약', '#ffd060');

export function combatView() {
  const G = S.G, C = S.C;
  const pend = C.pending != null ? C.hand.find(h => h.uid === C.pending) : null;
  const tk = pend && targetOf(pend), wantAlly = tk === 'ally', wantFoe = tk === 'foe';
  const lit = litMembers();
  const aims = new Set(C.all.filter(f => !f.dead).map(aimShown).filter(Boolean));
  // 왼쪽→오른쪽 = 뒤·가운데·앞 (앞이 적 쪽)
  const party = [2, 1, 0].map((fi, k) => {
    const p = G.formation[fi], c = CHARACTERS[p], M = G.members[p], ms = C.ms[p];
    const s = [STAT[p] ? STAT[p](C) : '', ms.weak ? `약화 ${ms.weak}` : '', ms.vuln ? `취약 ${ms.vuln}` : ''].filter(Boolean).join(' · ');
    const blk = C.blocks[p];
    const swap = k < 2 ? `<button type="button" class="swap" data-swap="${fi - 1}" ${C.swaps >= swapLimit() ? 'disabled' : ''} title="자리 바꾸기 (바꾼 둘 방어 -${RULES.swapBlockCost})">⇄</button>` : '';
    return `<button type="button" class="pm ${M.down ? 'down' : ''} ${aims.has(p) ? 'aimed' : ''} ${lit.includes(p) ? 'lit' : ''} ${wantAlly && !M.down ? 'tg' : ''} ${C.last === p ? 'last' : ''}" style="--c:${c.col}" data-ally="${p}" ${wantAlly && !M.down ? '' : 'tabindex="-1"'}>
        <span class="row">${ROW_NAME[fi]}${lit.includes(p) ? ' · <b class="litnm">불빛 +1</b>' : ''}</span>
        <img class="px" src="${sprite(palOf(p), c.long)}" alt="">
        <span class="nm">${c.name}</span>
        ${hpBar(M)}<span class="hp">${M.down ? '쓰러짐' : `${M.hp}/${M.max}`}${blk ? ` <b class="blk">방어 ${blk}</b>` : ''}</span>
        <span class="s">${s}</span></button>${swap}`;
  }).join('');
  const many = C.all.length > 1;
  const foes = C.all.map(f => {
    if (f.dead) return `<span class="foe gone ${many ? 'sm' : ''}"><span class="nm">${esc(f.name)}</span><span class="note">쓰러짐</span></span>`;
    const aim = aimShown(f);
    return `<button type="button" class="foe ${many ? 'sm' : ''} ${wantFoe ? 'tg' : ''}" data-foe="${f.i}">
        <span class="intent">${intentText(f)}${aim ? ` → ${face(aim, 'sm')}${many ? '' : ` <span class="aimnm">${AIM_NAME[C.taunt ? 'taunt' : f.aim || RULES.defaultAim]}</span>`}` : ''}</span>
        <img class="px" src="${sprite(FOE_PAL[f.pal], f.long, f.crown)}" alt="">
        <span class="nm">${esc(f.name)}${C.kind === 'boss' ? ' <span class="chip" style="color:var(--rose)">보스</span>' : C.kind === 'elite' ? ' <span class="chip" style="color:#b06ae0">강적</span>' : ''}</span>
        <span class="hpbar foehp"><i style="width:${f.hp / f.max * 100}%"></i></span>
        <span class="hp">${f.hp}/${f.max}</span>
        <span class="st">${foeSt(f)}</span>
      </button>`;
  }).join('');
  // 담금질 고르기 중이면 강화할 수 있는 카드만 누를 수 있다. 세바스·예약: 남길 카드 표시.
  const tempering = C.choose?.kind === 'temper';
  const canTemper = h => !/^(duo|bond):/.test(h.id) && cardDef(h).ch !== 'curse' && canUpgrade(h.id);
  const keepN = (alive('sebas') ? CHARACTERS.sebas.passive.keepCard || 0 : 0) + (C.reserve || 0);
  const marks = C.keepMark || [];
  const hand = C.hand.map(h => {
    const html = tempering ? cardHTML(h, canTemper(h), canTemper(h) ? 'temper' : 'none') : cardHTML(h, usable(h), 'play', undefined, h.uid === C.pending);
    return marks.includes(h.uid) ? html.replace('class="card ', 'class="card kept ') : html;
  }).join('');
  const pendKeep = !tempering && keepN && pend && !/^(duo|bond):/.test(pend.id) && cardDef(pend).ch !== 'curse'
    ? `<button type="button" class="mini keepbtn ${marks.includes(pend.uid) ? 'on' : ''}" data-keepmark title="턴 끝에 이 카드를 버리지 않고 남긴다 (${keepN}장)">${marks.includes(pend.uid) ? '남기기 취소' : `남기기 (${marks.length}/${keepN})`}</button>` : '';
  const temperBar = tempering ? `<span class="tempbar">담금질: 강화할 카드를 고르세요 (${C.choose.left}장) <button type="button" class="mini" data-temperauto>자동으로</button></span>` : '';
  const pip = (n, on) => Array.from({ length: Math.max(n, on) }, (_, k) => `<i class="${k < on ? '' : 'off'}"></i>`).join('');
  const tip = tempering ? '' : wantAlly ? '받을 동료를 누르세요.' : wantFoe ? '칠 적을 누르세요.' : pend ? '카드를 한 번 더 누르면 씁니다.'
    : lit.length ? '불빛이 비춘 동료의 카드는 비용 +1.' : '카드를 누르고 대상을 누르세요.';
  return `<div class="field">
      <div class="party">${party}</div>
      <div class="foes ${many ? 'many' : ''}">${foes}</div>
    </div>
    <div class="log" aria-live="polite">${C.moonPick ? `<span class="cmoonpick">월광 · 이번 전투의 달: ${Object.keys(MOONS).map(k => `<button type="button" class="mini ${G.moon === k ? 'on' : ''}" data-cmoon="${k}" title="${esc(MOONS[k].text)}"><img class="px" src="${moonImg(k)}" alt="">${MOONS[k].name}</button>`).join('')}</span>` : ''}${temperBar}${C.log.slice(-2).join(' · ') || ''}<span class="tip">${tip}</span>${pendKeep}${relicFlag('hourglass')
      ? `<button type="button" class="mini hg ${C.payEnergy ? 'on' : ''}" data-hg aria-pressed="${C.payEnergy}" title="깨진 모래시계: 시간 카드를 시간 대신 에너지 1로">시간 카드: ${C.payEnergy ? '에너지 1' : '시간'}</button>` : ''}</div>
    <div class="bottom">
      <span class="energy" title="에너지">${pip(RULES.energy, C.energy)}<b>${C.energy}</b></span>
      <div class="hand">${hand || '<p class="note">손패가 비었다.</p>'}</div>
      <div class="endcol"><button type="button" class="primary" data-end ${tempering ? 'disabled' : ''}>턴 끝</button><span class="note">뽑을 ${C.draw.length} · 버린 ${C.disc.length}${C.exh.length ? ` · 소멸 ${C.exh.length}` : ''}</span></div>
    </div>`;
}

export const combatTopExtra = () => {
  const C = S.C;
  const extra = [C.turnAtk ? `<span class="chip" style="color:#ff9a8a">이번 턴 공격 +${C.turnAtk}</span>` : '', C.noDmg ? '<span class="chip" style="color:#9ad0f0">숨바꼭질</span>' : ''].join('');
  return extra + `<span class="chip">연계</span><span class="chain">${Array.from({ length: RULES.chainMax }, (_, k) => `<i class="${k < C.chain ? 'on' : ''}"></i>`).join('')}</span><span class="note">${C.turn}턴</span>`;
};

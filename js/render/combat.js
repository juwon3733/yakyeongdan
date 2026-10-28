import { S } from '../run.js';
import { cardDef, intentText } from '../combat.js';
import { CHARACTERS } from '../data/characters.js';
import { FOE_PAL } from '../data/enemies.js';
import { RULES } from '../data/rules.js';
import { sprite } from './sprites.js';
import { esc, cardHTML } from './common.js';

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
  const st = [f.block ? `<span class="chip" style="color:var(--moon)">방어 ${f.block}</span>` : '',
              f.poison ? `<span class="chip" style="color:#9af07a">독 ${f.poison}</span>` : '',
              f.str ? `<span class="chip" style="color:#ff9a8a">힘 ${f.str}</span>` : '',
              f.weak ? `<span class="chip" style="color:#f08ac0">약화 ${f.weak}</span>` : ''].join('');
  const party = G.party.map(p => {
    const c = CHARACTERS[p], s = STAT[p] ? STAT[p](C) : '';
    return `<div class="pm ${C.last === p ? 'last' : ''}" style="--c:${c.col}"><img class="px" src="${sprite(c.pal, c.long)}" alt=""><span class="nm">${c.name}</span><span class="s">${s}</span></div>`;
  }).join('');
  const hand = C.hand.map(h => cardHTML(h, C.energy >= cardDef(h).cost)).join('');
  const pip = (n, on, cls) => Array.from({ length: n }, (_, k) => `<i class="${k < on ? cls : (cls ? '' : 'off')}"></i>`).join('');
  return `<div class="foe"><img class="px" src="${sprite(FOE_PAL[f.pal], f.long, f.crown)}" alt="">
      <div style="min-width:0"><div class="nm">${esc(f.name)}${C.kind === 'boss' ? ' <span class="chip" style="color:var(--rose)">보스</span>' : C.kind === 'elite' ? ' <span class="chip" style="color:#b06ae0">강적</span>' : ''}</div>
        <div class="hpbar" style="margin-top:6px"><i style="width:${f.hp / f.max * 100}%"></i></div>
        <div class="note" style="margin-top:2px">체력 ${f.hp}/${f.max}</div>
        <div class="st">${st}</div>
        <div class="intent">다음: ${intentText(f)}</div></div></div>
    <div class="party">${party}</div>
    <div class="res">
      <span>에너지</span><span class="energy">${pip(RULES.energy, C.energy, '')}</span>
      <span>연계</span><span class="chain">${pip(RULES.chainMax, C.chain, 'on')}</span>
      <span class="grow" style="flex:1"></span>
      <span class="chip" style="color:var(--moon)">방어 ${C.block}</span>
    </div>
    <div class="hand">${hand || '<p class="note">손패가 비었다.</p>'}</div>
    <div class="acts"><button type="button" class="primary" data-end>턴 끝내기</button></div>
    <div class="log" aria-live="polite">${C.log.join('<br>') || '카드를 눌러 쓰세요.'}</div>
    <p class="note">뽑을 카드 ${C.draw.length} · 버린 카드 ${C.disc.length} · ${C.turn}턴</p>`;
}

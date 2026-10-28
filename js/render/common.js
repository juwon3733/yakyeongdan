import { S, timeCost } from '../run.js';
import { cardDef } from '../combat.js';
import { CARDS } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { MOONS } from '../data/moons.js';
import { RULES } from '../data/rules.js';
import { moonImg } from './sprites.js';

export const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const stars = n => '★'.repeat(n);

export function topbar() {
  const G = S.G, m = MOONS[G.moon];
  return `<div class="topbar">
    <span class="clock ${G.clock >= RULES.dawn ? 'dawn' : ''}">${fmt(G.clock)}</span>
    <img class="px" src="${moonImg(G.moon)}" width="22" height="22" alt="${m.name}">
    <span class="chip" style="color:var(--moon)" title="${esc(m.text)}">${m.name}</span>
    <span class="grow"></span>
    <span class="chip" style="color:var(--rose)">체력 ${G.hp}/${G.maxHp}</span>
  </div>
  <div class="night" aria-hidden="true"><i style="width:${Math.min(100, G.clock / RULES.dawn * 100)}%"></i></div>`;
}

// inst: 카드 id 문자열(덱·보상) 또는 손패 인스턴스
export function cardHTML(inst, playable, act = 'play', idOverride) {
  const isStr = typeof inst === 'string';
  const d = isStr ? CARDS[inst] : cardDef(inst);
  const id = idOverride ?? (isStr ? inst : inst.uid);
  const duo = d.ch === 'duo';
  const col = duo ? CHARACTERS[d.a].col : CHARACTERS[d.ch].col, col2 = duo ? CHARACTERS[d.b].col : col;
  const who = duo ? `${CHARACTERS[d.a].name} + ${CHARACTERS[d.b].name}` : CHARACTERS[d.ch].name;
  return `<button type="button" class="card ${duo ? 'duo' : ''} ${playable ? '' : 'no'}" style="--c:${col};--c2:${col2}" data-${act}="${id}">
    <span class="hd"><span class="cost">${d.cost}</span><span class="nm">${esc(d.name)}</span></span>
    <span class="bd">${d.time ? `<span class="tm">+${timeCost()}분</span>` : ''}${esc(d.text)}</span>
    <span class="who">${who}${duo ? ' · 듀오' : ''}</span></button>`;
}

import { S, timeCost } from '../run.js';
import { cardDef, actorOf } from '../combat.js';
import { CARDS } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { MOONS } from '../data/moons.js';
import { RULES } from '../data/rules.js';
import { moonImg, sprite } from './sprites.js';

export const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const stars = n => '★'.repeat(n);

// 동료 얼굴 (서 있는 그림의 윗부분을 잘라 보여 줌)
export function face(id, cls = '') {
  const c = CHARACTERS[id];
  return `<span class="face ${cls}" style="--c:${c.col}"><img class="px" src="${sprite(c.pal, c.long)}" alt="${esc(c.name)}"></span>`;
}
export function hpBar(m) {
  return `<span class="hpbar ${m.down ? 'down' : ''}"><i style="width:${m.hp / m.max * 100}%"></i></span>`;
}

// 위 띠: 밤 시계 · 달 · (전투면 연계) · 덱. 지도에서는 동료 얼굴과 체력도.
export function topbar(extra = '') {
  const G = S.G, m = MOONS[G.moon];
  const mates = G.screen === 'combat' ? '' : `<span class="mates">${G.formation.map(p => {
    const M = G.members[p];
    return `<span class="mt ${M.down ? 'down' : ''}">${face(p)}<span class="hp">${M.hp}/${M.max}</span>${hpBar(M)}</span>`;
  }).join('')}</span>`;
  return `<div class="topbar">
    <span class="clock ${G.clock >= RULES.dawn ? 'dawn' : ''}">${fmt(G.clock)}</span>
    <span class="night" aria-hidden="true"><i style="width:${Math.min(100, G.clock / RULES.dawn * 100)}%"></i></span>
    <img class="px moon" src="${moonImg(G.moon)}" alt="">
    <span class="chip" style="color:var(--moon)" title="${esc(m.text)}">${m.name}</span>
    ${extra}
    <span class="grow"></span>
    ${mates}
    <button type="button" class="mini" data-deck>덱 ${G.deck.length}</button>
  </div>`;
}

// inst: 카드 id 문자열(덱·보상) 또는 손패 인스턴스
export function cardHTML(inst, playable, act = 'play', idOverride, sel = false) {
  const isStr = typeof inst === 'string';
  const d = isStr ? CARDS[inst] : cardDef(inst);
  const id = idOverride ?? (isStr ? inst : inst.uid);
  const duo = d.ch === 'duo';
  const col = duo ? CHARACTERS[d.a].col : CHARACTERS[d.ch].col, col2 = duo ? CHARACTERS[d.b].col : col;
  const who = duo ? `${CHARACTERS[d.a].name}+${CHARACTERS[d.b].name}` : CHARACTERS[d.ch].name;
  const down = !isStr && S.C && !actorOf(d);
  return `<button type="button" class="card ${duo ? 'duo' : ''} ${playable ? '' : 'no'} ${down ? 'down' : ''} ${sel ? 'sel' : ''}" style="--c:${col};--c2:${col2}" data-${act}="${id}">
    <span class="hd"><span class="cost">${d.cost}</span><span class="nm">${esc(d.name)}</span></span>
    <span class="bd">${d.time ? `<span class="tm">+${timeCost()}분</span>` : ''}${d.target === 'ally' ? '<span class="tg">동료 고름</span>' : ''}${esc(d.text)}</span>
    <span class="who">${down ? '쓰러짐' : who}${duo ? ' · 듀오' : ''}</span></button>`;
}

import { S, timeCost, dawnAt } from '../run.js';
import { actorOf, costOf, shownValue } from '../combat.js';
import { cardData } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { MOONS } from '../data/moons.js';
import { RULES, RARITY_NAME } from '../data/rules.js';
import { ROSTER } from '../data/roster.js';
import { relicFlag } from '../relics.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { moonImg, sprite } from './sprites.js';
import { wearing } from '../meta.js';

export const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const stars = n => '★'.repeat(n);
// 임시 도트 색: 명단(roster)에 있으면 그것, 없으면 전투 데이터의 색. 두 번째 의상을 입었으면 옷 색을 바꾼다(그림이 오기 전 임시).
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
export const costumePal = pal => ({ ...pal, o: pal.a, O: shade(pal.a, .62), a: pal.o });
export const palOf = (id, alt) => { const pal = ROSTER[id]?.pal || CHARACTERS[id]?.pal; return pal && (alt ?? wearing(id)) ? costumePal(pal) : pal; };

// 도구 표시 (그림이 없으면 이름 첫 글자). 판마다 한 번 누르는 도구는 버튼.
export function relicChip(id, G) {
  const d = RELICS[id], usable = d.use && !G.used[id] && (d.use !== 'moon' || S.C);
  const tip = esc(`${d.name} (${RELIC_TIER_NAME[d.tier]}) — ${d.text}${d.use ? (G.used[id] ? ' · 이번 판엔 썼다' : ' · 누르면 쓴다') : ''}`);
  return d.use ? `<button type="button" class="relic t-${d.tier} ${usable ? 'can' : 'spent'}" data-relic="${id}" title="${tip}" aria-label="${tip}" ${usable ? '' : 'disabled'}>${esc(d.name.slice(0, 1))}</button>`
    : `<span class="relic t-${d.tier}" title="${tip}" aria-label="${tip}" tabindex="0">${esc(d.name.slice(0, 1))}</span>`;
}

// 동료 얼굴 (서 있는 그림의 윗부분을 잘라 보여 줌)
export function face(id, cls = '') {
  const c = CHARACTERS[id];
  return `<span class="face ${cls}" style="--c:${c.col}"><img class="px" src="${sprite(palOf(id), c.long)}" alt="${esc(c.name)}"></span>`;
}
export function hpBar(m) {
  return `<span class="hpbar ${m.down ? 'down' : ''}"><i style="width:${m.hp / m.max * 100}%"></i></span>`;
}

// 도구 줄: 누르는 도구 먼저, 위 띠가 넘치지 않게 몇 개만 (나머지는 +n, 덱 보기에서 전부)
function relicRow(G, max = 6) {
  const list = [...G.relics].sort((a, b) => !!RELICS[b].use - !!RELICS[a].use);
  const more = list.length - max;
  return list.slice(0, max).map(id => relicChip(id, G)).join('') + (more > 0 ? `<span class="more">+${more}</span>` : '');
}

// 위 띠: 밤 시계 · 달 · (전투면 연계) · 덱. 지도에서는 동료 얼굴과 체력도.
export function topbar(extra = '') {
  const G = S.G, m = MOONS[G.moon];
  const mates = G.screen === 'combat' ? '' : `<span class="mates">${G.formation.map(p => {
    const M = G.members[p];
    return `<span class="mt ${M.down ? 'down' : ''}">${face(p)}<span class="hp">${M.hp}/${M.max}</span>${hpBar(M)}</span>`;
  }).join('')}</span>`;
  return `<div class="topbar">
    <span class="clock ${G.clock >= dawnAt() ? 'dawn' : ''}">${fmt(G.clock)}</span>
    <span class="night" aria-hidden="true"><i style="width:${Math.min(100, G.clock / dawnAt() * 100)}%"></i></span>
    ${G.depth ? `<span class="chip depthchip" title="밤의 깊이 ${G.depth}">깊이 ${G.depth}</span>` : ''}
    <img class="px moon" src="${moonImg(G.moon)}" alt="">
    <span class="chip" style="color:var(--moon)" title="${esc(m.text)}">${m.name}</span>
    ${extra}
    <span class="grow"></span>
    <span class="relics">${relicRow(G)}</span>
    <span class="gold" title="별빛 (야시장·사건에서 쓴다)">별빛 ${G.gold}</span>
    ${mates}
    <button type="button" class="mini" data-deck>덱 ${G.deck.length}</button>
  </div>`;
}

// 카드 글: {d0}{b1}{k0}{n0} → 실제 값. 원래 값보다 오르면 .up(초록), 내리면 .dn(빨강)
export function cardText(d) {
  let firstD = true;
  return esc(d.text).replace(/\{([dbkn])(\d)\}/g, (_, t, k) => {
    const base = d.v[+k] ?? 0, v = shownValue(d, t, base, t === 'd' && firstD);
    if (t === 'd') firstD = false;
    return v === base ? String(v) : `<b class="${v > base ? 'up' : 'dn'}">${v}</b>`;
  });
}

// inst: 카드 id 문자열(덱·보상) 또는 손패 인스턴스 { uid, id }
export function cardHTML(inst, playable, act = 'play', idOverride, sel = false) {
  const isStr = typeof inst === 'string';
  const d = cardData(isStr ? inst : inst.id);
  const id = idOverride ?? (isStr ? inst : inst.uid);
  const duo = d.ch === 'duo', curse = d.ch === 'curse';
  const col = duo ? CHARACTERS[d.a].col : curse ? '#6a6478' : CHARACTERS[d.ch].col, col2 = duo ? CHARACTERS[d.b].col : col;
  const who = duo ? `${CHARACTERS[d.a].name}+${CHARACTERS[d.b].name}` : curse ? '저주' : CHARACTERS[d.ch].name;
  const down = !isStr && S.C && !curse && !actorOf(d);
  let cost = d.unplayable ? '–' : String(d.cost), cc = '';
  if (!isStr && S.C) { const c = costOf(inst); if (c != null) { cost = String(c); cc = c > d.cost ? 'dn' : c < d.cost ? 'up' : ''; } }
  const tags = [d.time ? `<span class="tm">${S.C?.payEnergy && relicFlag('hourglass') ? '에너지로' : `+${S.G ? timeCost() : RULES.timeCard}분`}</span>` : '', d.target === 'ally' ? '<span class="tg">동료 고름</span>' : '',
    d.target === 'all' ? '<span class="tg all">모든 적</span>' : ''].join('');
  return `<button type="button" class="card r-${d.rarity} ${duo ? 'duo' : ''} ${curse ? 'curse' : ''} ${d.up ? 'upg' : ''} ${playable ? '' : 'no'} ${down ? 'down' : ''} ${sel ? 'sel' : ''}" style="--c:${col};--c2:${col2}" data-${act}="${id}">
    <span class="hd"><span class="cost ${cc}">${cost}</span><span class="nm">${esc(d.name)}</span></span>
    <span class="bd">${tags}${cardText(d)}</span>
    <span class="who">${down ? '쓰러짐' : who}${duo ? ' · 듀오' : ''}<span class="rar">${RARITY_NAME[d.rarity] || ''}${d.exhaust && !duo ? ' · 소멸' : ''}</span></span></button>`;
}

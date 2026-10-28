import { S, timeCost, dawnAt } from '../run.js';
import { actorOf, costOf, shownValue, duoPreview } from '../combat.js';
import { cardData } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { MOONS } from '../data/moons.js';
import { RULES, RARITY_NAME } from '../data/rules.js';
import { ROSTER } from '../data/roster.js';
import { relicFlag } from '../relics.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { moonImg, sprite } from './sprites.js';
import { kwTip } from '../data/keywords.js';
import { wearing } from '../meta.js';
import { charArt } from '../art.js';
import { cardArtSrc } from './cardart.js';

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
  return d.use ? `<button type="button" class="relic t-${d.tier} ${usable ? 'can' : 'spent'}" data-relic="${id}" data-tip="${tip}" aria-label="${tip}" ${usable ? '' : 'disabled'}>${esc(d.name.slice(0, 1))}</button>`
    : `<span class="relic t-${d.tier}" data-tip="${tip}" aria-label="${tip}" tabindex="0">${esc(d.name.slice(0, 1))}</span>`;
}

// 동료 얼굴 (서 있는 그림의 윗부분을 잘라 보여 줌)
export function face(id, cls = '') {
  const c = CHARACTERS[id];
  return `<span class="face ${cls}" style="--c:${c.col}"><img class="px" src="${charSrc(id, 'normal')}" alt="${esc(c.name)}"></span>`;
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
  // 에피소드 특별 전투: 밤 시계·별빛·도구는 의미가 없어 숨긴다
  const ep = !!G.episode;
  return `<div class="topbar ${ep ? 'ep' : ''}">
    ${ep ? '<span class="chip eptag">에피소드 · 특별 전투</span>' : `<span class="clock ${G.clock >= dawnAt() ? 'dawn' : ''}">${fmt(G.clock)}</span>
    <span class="night" aria-hidden="true"><i style="width:${Math.min(100, G.clock / dawnAt() * 100)}%"></i></span>`}
    ${G.depth ? `<span class="chip depthchip" title="밤의 깊이 ${G.depth}">깊이 ${G.depth}</span>` : ''}
    <img class="px moon" src="${moonImg(G.moon)}" alt="">
    <span class="chip" style="color:var(--moon)" title="${esc(m.text)}">${m.name}</span>
    ${extra}
    <span class="grow"></span>
    ${ep ? '' : `<span class="relics">${relicRow(G)}</span>
    <span class="gold" title="별빛 (야시장·사건에서 쓴다)">별빛 ${G.gold}</span>`}
    ${mates}
    <button type="button" class="mini" data-settings title="설정">설정</button>
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

// 동료 그림 주소: 그림 파일이 있으면 그것(assets/…), 없으면 임시 도트.
// kind: stand | normal | smile | serious. 두 번째 의상을 입었으면 서 있는 그림은 _outfit2.
export function charSrc(id, kind = 'stand', alt) {
  const r = ROSTER[id] || CHARACTERS[id];
  const outfit = alt ?? wearing(id);
  return charArt(id, kind, outfit) || (kind !== 'stand' && charArt(id, 'stand', outfit)) || sprite(palOf(id, alt), r?.long);
}
const pals = new Proxy({}, { get: (_, id) => palOf(id) });
const longs = new Proxy({}, { get: (_, id) => (ROSTER[id] || CHARACTERS[id])?.long });

// 카드 한 장: 위 4:3 일러스트(그림 파일 또는 임시 일러스트) · 비용 보석(시간 카드는 시계) · 이름 띠 · 효과 글 · 아래 동료 얼굴·이름·희귀도.
// 희귀도 테두리: 흔함 은 / 보통 보라 / 희귀 금(빛). 듀오는 두 사람 반반 + 금, 저주는 검붉은 깨진 틀.
// inst: 카드 id 문자열(덱·보상) 또는 손패 인스턴스 { uid, id }. data-cid는 확대 보기(길게 누르기·오른쪽 클릭)가 쓴다.
export function cardHTML(inst, playable, act = 'play', idOverride, sel = false) {
  const isStr = typeof inst === 'string';
  const cid = isStr ? inst : inst.id;
  const d = cardData(cid);
  const id = idOverride ?? (isStr ? inst : inst.uid);
  const duo = d.ch === 'duo', curse = d.ch === 'curse';
  const col = duo ? CHARACTERS[d.a].col : curse ? '#6a6478' : CHARACTERS[d.ch].col, col2 = duo ? CHARACTERS[d.b].col : col;
  const who = duo ? `${CHARACTERS[d.a].name}+${CHARACTERS[d.b].name}` : curse ? '저주' : CHARACTERS[d.ch].name;
  const down = !isStr && S.C && !curse && !actorOf(d);
  let cost = d.unplayable ? '–' : String(d.cost), cc = '';
  if (!isStr && S.C) { const c = costOf(inst); if (c != null) { cost = String(c); cc = c > d.cost ? 'dn' : c < d.cost ? 'up' : ''; } }
  const tags = [d.time ? `<span class="tm">${S.C?.payEnergy && relicFlag('hourglass') ? '에너지로' : `+${S.G ? timeCost() : RULES.timeCard}분`}</span>` : '', d.target === 'ally' ? '<span class="tg">동료 고름</span>' : '',
    d.target === 'all' ? '<span class="tg all">모든 적</span>' : ''].join('');
  const dn = !isStr && S.C && playable && act === 'play' ? duoPreview(inst) : null;
  const tip = (dn ? `지금 쓰면 듀오 「${dn}」 카드가 손에 들어온다.\n` : '') + kwTip(`${d.text || ''} ${d.time ? '시간 카드' : ''} ${d.exhaust ? '소멸' : ''} ${duo ? '듀오' : ''} ${curse ? '저주' : ''} ${(d.tags || []).includes('slash') ? '베기' : ''}`);
  const faces = duo ? [d.a, d.b] : curse ? [] : [d.ch];
  const fc = faces.map(k => `<img class="px" src="${charSrc(k)}" alt="">`).join('');
  const rar = duo ? '듀오' : RARITY_NAME[d.rarity] || '';
  return `<button type="button" class="card r-${d.rarity} ${duo ? 'duo' : ''} ${curse ? 'curse' : ''} ${d.time ? 'time' : ''} ${d.up ? 'upg' : ''} ${playable ? '' : 'no'} ${down ? 'down' : ''} ${sel ? 'sel' : ''} ${dn ? 'duonext' : ''}" style="--c:${col};--c2:${col2}" data-${act}="${id}" data-cid="${esc(cid)}"${tip ? ` data-tip="${esc(tip)}"` : ''}>
    <span class="art"><img class="px" src="${cardArtSrc(d, pals, longs)}" alt="" draggable="false"></span>
    <span class="cost ${d.time ? 'clock' : 'gem'} ${cc}">${cost}</span>
    <span class="hd"><span class="nm ${d.name.length >= 6 ? 'long' : ''}">${esc(d.name)}</span></span>
    <span class="bd">${tags}${cardText(d)}</span>
    <span class="who"><span class="fc">${fc}</span><span class="wn">${down ? '쓰러짐' : who}</span><span class="rar">${rar}${d.exhaust && !duo ? '·소멸' : ''}</span></span></button>`;
}

// 보상·휴식·사건·야시장·카드 지우기/복제·보스 도구·달 고르기·결과
import { S } from '../run.js';
import { eventApi, restPct, removePrice, napTime } from '../map.js';
import { TALKS } from '../data/talks.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { DUOS, canUpgrade, cardData } from '../data/cards.js';
import { RULES, ACT_NAME, SHOP } from '../data/rules.js';
import { grantRun, P, mvpOf } from '../meta.js';
import { cardHTML, fmt, face, esc, charSrc } from './common.js';
import { pxNum } from './pxui.js';
import { artURL, battleArt } from '../art.js';
import { SUMMON } from '../data/gacha.js';
import { dawnAt } from '../run.js';
import { moonImg } from './sprites.js';
import { EPISODES, BOND_SCENES } from '../data/episodes.js';
import { endlessResultView, climbOnButton } from './endless.js';

const relicBox = (id, extra = '') => { const d = RELICS[id]; return `<span class="rbox t-${d.tier}">${(ic => `<span class="relic t-${d.tier} ${ic ? 'hasic' : ''}">${ic ? `<img class="px" src="${ic}" alt="">` : esc(d.name.slice(0, 1))}</span>`)(artURL(`icons/relic_${id}.png`))}<span><b>${esc(d.name)}</b> <small>${RELIC_TIER_NAME[d.tier]}</small><br>${esc(d.text)}${extra}</span></span>`; };

// 사건·휴식 무대: 배경 위 바닥에 동료 셋이 전투처럼 서 있고(전투 스프라이트), 아래는 대화 창(왼쪽 얼굴 액자 + 글·선택지).
// 화면 가운데 떠 있는 글 상자 + 구석에 잘린 큰 일러스트는 장면이 아니라 「배경 위에 상자를 얹은」 티가 나서 바꿈.
const SCENE_BG = { 1: ['act1', 'harbor'], 2: ['act2', 'roof'], 3: ['act3', 'dream'] };
function scene(bgKey, bgFile, people, inner) {
  const G = S.G, img = bgFile && artURL(`bg/${bgFile}.png`), who = people.find(Boolean);
  // 왼쪽→오른쪽 = 뒤·가운데·앞 (전투와 같은 줄)
  const cast = [2, 1, 0].map(fi => G.formation[fi]).map(p => {
    const u = battleArt(p, G.members[p]?.down ? 'down' : 'idle');
    return `<span class="sman ${p === who ? 'speak' : ''}" style="--c:${CHARACTERS[p].col}">${u ? `<img class="px" src="${u}" alt="">` : face(p)}</span>`;
  }).join('');
  return `<div class="scene bg-${bgKey}"><div class="epbg${bgFile ? '' : ' see'}" aria-hidden="true"><i></i>${img ? `<img class="bgimg" src="${img}" alt="">` : ''}</div>
    <div class="sground" aria-hidden="true">${bgKey === 'rest' ? '<i class="fire"></i>' : ''}${cast}</div>
    <div class="swin">${who ? `<span class="sface" style="--c:${CHARACTERS[who].col}"><img class="px" src="${charSrc(who, 'normal')}" alt=""><b>${CHARACTERS[who].name}</b></span>` : ''}<div class="sbody">${inner}</div></div></div>`;
}

export function rewardView() {
  const G = S.G, R = G.reward;
  const extra = [R.gold ? `별빛 +${R.gold}` : '', R.bonus ? `모든 동료 체력 +${R.bonus}` : '', R.kind === 'boss' ? `막 보스 격파 · 모든 동료 최대 체력의 ${RULES.bossHealPct * 100}% 회복` : ''].filter(Boolean).join(' · ');
  return `<div class="center rwscr"><h2>${R.kind === 'boss' ? '레전더리 카드' : '카드 한 장'}</h2>
    ${extra ? `<p class="note">${extra}</p>` : ''}
    ${R.relic ? `<p class="note">도구를 얻었다</p>${relicBox(R.relic)}` : ''}
    <div class="hand big">${R.cards.map(id => cardHTML(id, true, 'take')).join('')}</div>
    <div class="acts"><button type="button" data-take="">건너뛰기</button></div>${winParty(G)}</div>`;
}
// 보상 화면 왼쪽 아래: 이긴 동료들이 승리 자세로 남아 있다(쓰러진 동료는 쓰러진 자세). 대열 뒤 → 앞 순서로 왼쪽부터
function winParty(G) {
  const row = G.formation.slice().reverse().map((id, i) => {
    const down = G.members[id]?.down, src = battleArt(id, down ? 'down' : 'win') || battleArt(id, 'idle');
    return src ? `<img class="rwp ${down ? 'down' : ''}" style="--i:${i}" src="${src}" alt="">` : '';
  }).join('');
  return row ? `<div class="rwparty" aria-hidden="true">${row}<i class="rwglow"></i></div>` : '';
}
export function restView() {
  const R = RULES.rest, G = S.G;
  const talk = G.restTalk != null ? TALKS[G.restTalk] : null;
  // 대화가 있으면 말하는 둘, 없으면 대열 앞·가운데 둘이 모닥불 곁에
  const pair = talk ? [...new Set(talk.lines.map(([p]) => p))].slice(0, 2) : G.formation.slice(0, 2);
  return scene('rest', null, pair, `<h2>휴식</h2>
    ${talk ? `<div class="talk">${talk.lines.map(([p, t]) => `<p><b style="color:${CHARACTERS[p].col}">${CHARACTERS[p].name}</b>${esc(t)}</p>`).join('')}</div>` : ''}
    <div class="acts">
      <button type="button" class="primary" data-rest="heal" data-tip="각자 최대 체력의 ${Math.round(restPct(false) * 100)}%, 쓰러졌던 동료는 ${Math.round(restPct(true) * 100)}%">쉬기: 체력 회복 <small>${(g => g.length ? g.join(', ') : '모두 멀쩡하다')(G.formation.map(p => [p, Math.min(G.members[p].max - G.members[p].hp, Math.ceil(G.members[p].max * restPct(G.members[p].wasDown)))]).filter(([, n]) => n > 0).map(([p, n]) => `${CHARACTERS[p].name} +${n}`))}</small></button>
      <button type="button" data-rest="nap">낮잠: ${napTime()}분 되찾기</button>
      <button type="button" data-rest="smith" ${G.deck.some(canUpgrade) ? '' : 'disabled'}>손질: 카드 1장 강화</button></div>`);
}
const val = (v, x) => typeof v === 'function' ? v(x) : v;
export function eventView() {
  const G = S.G, e = G.event.def, x = eventApi();
  // 동료 전용 선택지가 있을 때만 그 동료 얼굴. 내레이션에 얼굴을 붙이면 그 동료가 말하는 것처럼 보여서 뺐다
  const need = G.event.opts.find(o => o.need)?.need;
  const [bk, bf] = SCENE_BG[Math.min(3, G.act)] || SCENE_BG[1];
  return scene(bf, bk, [need], `<h2>${e.title}</h2><p class="note evtext">${val(e.text, x)}</p>
    <div class="acts col">${G.event.opts.map((o, i) => `<button type="button" data-opt="${i}" ${o.can && !o.can(x) ? 'disabled' : ''}>${o.need ? `<span class="needtag" style="color:${CHARACTERS[o.need].col}">${CHARACTERS[o.need].name}</span> ` : ''}${val(o.t, x)}</button>`).join('')}</div>`);
}
export function upgradeView() {
  const G = S.G;
  // 같은 카드는 한 번만, 지금 ▸ 강화판을 옆으로 나란히(위·아래 두 줄로 두 벌씩 늘어놓아 화면 밖으로 넘치던 것)
  const seen = new Set(), list = G.deck.map((id, i) => [id, i]).filter(([id]) => canUpgrade(id) && !seen.has(id) && seen.add(id));
  const more = G.back !== 'shop' && G.smithLeft > 1 ? ` <small>${G.smithLeft}장</small>` : '';
  return `<div class="center upscr"><h2>강화할 카드${more}</h2>
    <div class="hand big scroll upgrid">${list.map(([id, i]) => `<span class="upone">${cardHTML(id, true, 'up', i)}<i class="uparr">▸</i>${cardHTML(id + '+', true, 'up', i)}</span>`).join('')}</div>
    <div class="acts"><button type="button" data-up="-1">그만두기</button></div></div>`;
}
export function removeView() {
  return `<div class="center"><h2>지울 카드</h2><div class="hand big scroll">${S.G.deck.map((id, i) => cardHTML(id, true, 'rm', i)).join('')}</div>
    <div class="acts"><button type="button" data-rm="-1">그만두기</button></div></div>`;
}
export function dupeView() {
  return `<div class="center"><h2>복제할 카드</h2><div class="hand big scroll">${S.G.deck.map((id, i) => cardHTML(id, true, 'dupe', i)).join('')}</div></div>`;
}
export function shopView() {
  const G = S.G, sh = G.shop;
  const cards = sh.cards.map((c, i) => `<span class="ware ${c.sold ? 'sold' : ''}">${cardHTML(c.id, !c.sold && G.gold >= c.price, 'buycard', i)}
    <span class="price ${G.gold >= c.price ? '' : 'short'}">${c.sold ? '팔림' : `<i class="gico"></i>${c.price}${c.sale ? ' <b>반값</b>' : ''}`}</span></span>`).join('');
  const relics = sh.relics.map((r, i) => `<button type="button" class="ware relicware ${r.sold ? 'sold' : ''}" data-tip="${esc(`${RELICS[r.id].name} (${RELIC_TIER_NAME[RELICS[r.id].tier]}) — ${RELICS[r.id].text}`)}" data-buyrelic="${i}" ${r.sold || G.gold < r.price ? 'disabled' : ''}>
    ${relicBox(r.id)}<span class="price">${r.sold ? '팔림' : `<i class="gico"></i>${r.price}`}</span></button>`).join('');
  // 야시장: 왼쪽에 상인 후쿠로(그림 + 말풍선), 오른쪽 진열대(카드 줄·도구 줄), 값은 별빛 아이콘
  return `<div class="shopscr s2">
    <div class="shopkeep" aria-hidden="true"><img class="px" src="${charSrc('fukuro', 'stand')}" alt=""><span class="bubble">${sh.talk}</span></div>
    <div class="shopmain">
    <div class="shophead"><span class="fukuro" aria-hidden="true">${artURL('chars/fukuro_normal.png') ? `<img class="px" src="${charSrc('fukuro', 'normal')}" alt="">` : 'F'}</span><span><b>후쿠로의 야시장</b></span>${sh.off ? `<span class="chip" style="color:var(--moon)">할인 ${sh.off}%</span>` : ''}<span class="grow"></span>${sh.special ? `<button type="button" class="mini ${sh.spView ? 'on' : ''}" data-spview>${sh.spView ? '◂ 후쿠로 노점' : `옆 노점: ${sh.special.name} ▸`}</button>` : ''}<span class="gold big"><i class="gico"></i>${G.gold}</span></div>
    ${sh.spView ? specialRow(sh.special) : `<div class="wares">${cards}</div>`}
    <div class="shoprow">${relics}
      <span class="services">
        <button type="button" data-shop="remove" ${G.gold >= removePrice() && !sh.removed ? '' : 'disabled'}>카드 지우기 <i class="gico"></i>${removePrice()}${sh.removed ? ' (오늘은 끝)' : ''}</button>
        <button type="button" data-shop="upgrade" ${G.gold >= SHOP.upgrade && G.deck.some(canUpgrade) ? '' : 'disabled'}>카드 강화 <i class="gico"></i>${SHOP.upgrade}</button>
        <button type="button" class="primary" data-leave>나간다</button></span>
    </div></div></div>`;
}
// 특별 노점: 별빛 대신 밤 시계(분)나 체력으로 산다
function specialRow(sp) {
  const unit = sp.pay === 'time' ? n => `밤 시계 +${n}분` : n => `모든 동료 체력 −${n}`;
  const items = sp.items.map((it, i) => it.kind === 'card'
    ? `<span class="ware ${it.sold ? 'sold' : ''}">${cardHTML(it.id, !it.sold, 'buysp', i)}<span class="price">${it.sold ? '팔림' : unit(it.cost)}</span></span>`
    : `<button type="button" class="ware relicware ${it.sold ? 'sold' : ''}" data-buysp="${i}" ${it.sold ? 'disabled' : ''}>${relicBox(it.id)}<span class="price">${it.sold ? '팔림' : unit(it.cost)}</span></button>`).join('');
  return `<div class="shopspecial"><p class="note sphead"><b>${sp.name}</b> ${sp.talk} <small>(별빛 대신 ${sp.pay === 'time' ? '밤 시계' : '체력'}로 산다)</small></p><div class="wares">${items}</div></div>`;
}
export function bossRelicView() {
  const G = S.G;
  return `<div class="center"><h2>보스 도구</h2>
    <div class="acts col wide">${G.bossRelics.map(id => `<button type="button" class="relicpick" data-brelic="${id}">${relicBox(id)}</button>`).join('')}
    <button type="button" data-brelic="">고르지 않는다</button></div></div>`;
}
export function moonView() {
  return `<div class="center"><h2>달 조각: 오늘 밤의 달을 고른다</h2>
    <div class="acts">${Object.entries(MOONS).map(([k, m]) => `<button type="button" class="moonpick ${S.G.moon === k ? 'on' : ''}" data-moon="${k}"><img class="px" src="${moonImg(k)}" alt=""><b>${m.name}</b><small>${m.text}</small></button>`).join('')}</div></div>`;
}

// 결과 화면 진행 막대 (docs/11 #3): 0:00 → 도착(또는 멈춘) 시각. 막 셋 구간과 6:00 눈금, 멈춘 막 표시.
function runBar(G) {
  const end = Math.max(dawnAt(), RULES.collapse, G.clock), pct = m => Math.min(100, m / end * 100).toFixed(1);
  const acts = [1, 2, 3].map(a => `<span class="seg a${a} ${a < G.act || G.won ? 'done' : a === G.act ? 'now' : ''}" style="left:${pct((a - 1) * dawnAt() / 3)}%;width:${pct(dawnAt() / 3)}%">${ACT_NAME[a]}</span>`).join('');
  return `<div class="runbar" aria-label="진행"><div class="track">${acts}<i class="fill ${G.won ? 'won' : ''}" style="width:${pct(G.clock)}%"></i><b class="dawnmark" style="left:${pct(dawnAt())}%" title="해 뜨는 시각"></b><u class="me${G.clock / end > .93 ? ' end' : ''}" style="left:${pct(G.clock)}%">${fmt(G.clock)}</u></div>
    <div class="ticks"><span>00:00</span><span style="left:${pct(dawnAt())}%">${fmt(dawnAt())}</span></div></div>`;
}

const WHY = { down: '모두 쓰러졌다', collapse: '7시. 탑이 무너졌다' };
// 결과: 매일의 밤 기록 · 숙련도 단계 오름 · 이번 판에 달성한 업적
function metaNote(R) {
  const out = [];
  if (R.daily) out.push(`<span class="chip dailychip">매일의 밤</span> ${R.daily.best != null ? `오늘 최고 <b>${fmt(R.daily.best)}</b>` : '오늘은 아직 못 깼다'}${R.daily.first ? ' · <b class="newt">오늘 첫 격파</b>' : ''}`);
  if (R.mastery?.length) out.push(`<span class="chip">숙련도</span> ${R.mastery.map(u => `${esc(CHARACTERS[u.id]?.name || u.id)} <b>${u.lv}단계</b>`).join(' · ')}`);
  // 업적이 많으면 앞의 4개만 이름으로, 나머지는 「외 n개」 (결과 화면이 판 밖으로 넘치지 않게)
  if (R.ach?.length) out.push(`<span class="chip">업적</span> ${R.ach.slice(0, 4).map(a => esc(a.name)).join(', ')}${R.ach.length > 4 ? ` 외 ${R.ach.length - 4}개` : ''} <b>+${R.ach.reduce((t, a) => t + a.r, 0)}</b>`);
  return out.length ? `<div class="metanote">${out.map(x => `<p class="note">${x}</p>`).join('')}</div>` : '';
}
// MVP 칸: 서 있는 일러스트를 크게(★5이고 전신 CG가 있으면 CG를 배경으로) + 이름 띠 + 「MVP」 도장이 쾅
function mvpPanel(id, c, st, won = true) {
  const cg = c.rarity === 5 && artURL(`cg/star5_${id}.png`);
  return `<div class="mvp${cg ? ' hascg' : ''}" style="--c:${c.col}">
    <span class="mvpbg" aria-hidden="true">${cg ? `<img class="cg" src="${cg}" alt="">` : '<i class="rays"></i>'}</span>
    <img class="px mvpart" src="${charSrc(id)}" alt="">
    <span class="mvpband"><b class="nm">${esc(c.name)}</b><small>${esc(c.role)} · 피해 ${st.dmg || 0}</small></span>
    <span class="mvpstamp" aria-label="${won ? 'MVP' : '끝까지 버틴'}">${won ? 'MVP' : '끝까지'}</span></div>`;
}
// 동료 셋의 피해·방어·회복 가로 막대 (항목마다 가장 큰 값을 꽉 찬 막대로)
const STAT_KEYS = [['dmg', '피해'], ['block', '방어'], ['heal', '회복']];
function statBars(G, mvp) {
  const v = (p, k) => G.stats?.[p]?.[k] || 0;
  const top = Object.fromEntries(STAT_KEYS.map(([k]) => [k, Math.max(1, ...G.party.map(p => v(p, k)))]));
  const rows = G.party.map((p, r) => `<span class="rsn${p === mvp ? ' me' : ''}" style="color:${CHARACTERS[p].col}">${esc(CHARACTERS[p].name)}</span>${STAT_KEYS.map(([k]) =>
    `<span class="rbar k-${k}" style="--w:${(v(p, k) / top[k] * 100).toFixed(1)}%;--r:${r}"><i></i><b>${v(p, k)}</b></span>`).join('')}`).join('');
  return `<div class="rstats"><span></span>${STAT_KEYS.map(([k, t]) => `<span class="rsh k-${k}">${t}</span>`).join('')}${rows}</div>`;
}
export function resultView() {
  if (S.G.endless) return endlessResultView();
  const G = S.G, R = grantRun(G);
  const mvp = mvpOf(G);
  const mc = CHARACTERS[mvp], st = G.stats[mvp];
  const duos = [...G.duoSet].map(k => `<span class="chip">${DUOS[k]?.name || k}</span>`).join('') || '<span class="note">없음</span>';
  // 새로 열린 에피소드 · 인연 장면 (본부 [에피소드]에서 본다)
  // 한 동료의 여러 화가 한꺼번에 열리면 「아이리스 1·2·3화」로 묶어 줄이 넘치지 않게
  const byCid = {};
  for (const e of R.newEps || []) (byCid[e.cid] ||= []).push(e.n);
  const opened = [...Object.entries(byCid).map(([cid, ns]) => ns.length === 1
      ? `${CHARACTERS[cid]?.name || cid} ${ns[0] + 1}화 ${EPISODES[cid][ns[0]].title}`
      : `${CHARACTERS[cid]?.name || cid} ${ns.map(n => n + 1).join('·')}화`),
    ...(R.newBonds || []).map(k => `인연 장면 ${BOND_SCENES[k].title}`)];
  const epNote = opened.length ? `<p class="epnew"><b class="newt">새 에피소드</b> ${opened.map(esc).join(' · ')}</p>` : '';
  return `<div class="resultscr ${G.won ? 'won' : 'lost'}">
    ${G.won ? '<i class="rdust" aria-hidden="true"></i><i class="rdust far" aria-hidden="true"></i>' : '<i class="rash" aria-hidden="true"></i><i class="rash far" aria-hidden="true"></i>'}
    ${mvpPanel(mvp, mc, st, G.won)}
    <div class="rinfo">
      <h2 class="rtitle">${G.won ? '새벽을 넘었다' : WHY[G.why] || '탑에서 떨어졌다'}</h2>
      <div class="rclockrow"><p class="clockbig ${G.clock >= RULES.dawn ? 'dawn' : ''}">${pxNum(fmt(G.clock), { s: 5, col: G.won ? '#fff4d0' : '#ff8a8a' })}</p>${statBars(G, mvp)}</div>
      <p class="note">${G.won ? `꼭대기에 닿은 시각${G.clock >= RULES.dawn ? ' (해가 뜬 뒤)' : ' (해 뜨기 전)'}` : `${ACT_NAME[G.act]}에서 멈췄다`}${G.bestTurn?.dmg ? ` · 최고의 한 턴 <b>${G.bestTurn.dmg}</b>` : ''}</p>
      ${G.duoSet.size ? `<p class="note">듀오 ${duos}</p>` : ''}
      ${epNote}
      ${metaNote(R)}
      ${runBar(G)}
      <table class="shards" data-tip="${esc(R.lines.map(([t, v]) => `${t} +${v}`).join('\n'))}">${R.lines.map(([t, v], i) => `<tr style="--i:${i}"><td>${t}</td><td>+${v}</td></tr>`).join('')}<tr class="sum" style="--i:${R.lines.length}"><td>얻은 별 조각</td><td>+<b class="countup" data-to="${R.total}">${R.total}</b></td></tr></table>
      <div class="acts"><button type="button" class="primary" data-home>본부로</button><button type="button" data-view="party">다시 오르기</button>${climbOnButton(G)}</div>
    </div></div>`;
}
// 덱: 동료별로 묶어(대열 순서, 저주·듀오는 끝) 레전더리 → 에픽 → 레어 순, 카드 그림이 보이게 격자로
const RORD = { r: 0, duo: 0, u: 1, c: 2, curse: 3 };
function deckGroups(deck) {
  const by = new Map();
  for (const id of deck) { const d = cardData(id), k = d.ch === 'duo' ? 'duo' : d.ch; if (!by.has(k)) by.set(k, []); by.get(k).push(id); }
  const order = [...(S.G.formation || []), 'duo', 'curse'].filter(k => by.has(k)).concat([...by.keys()].filter(k => !(S.G.formation || []).includes(k) && k !== 'duo' && k !== 'curse'));
  return order.map(k => {
    const ids = by.get(k).sort((a, b) => (RORD[cardData(a).rarity] ?? 2) - (RORD[cardData(b).rarity] ?? 2) || cardData(a).name.localeCompare(cardData(b).name));
    const nm = k === 'duo' ? '듀오' : k === 'curse' ? '저주' : (CHARACTERS[k]?.name || k), col = CHARACTERS[k]?.col || '#c9d2f0';
    // 같은 카드는 한 장만 보이고 뒤에 겹친 장 수만큼 카드 등이 비치며 ×N
    const uniq = [...new Set(ids)], cnt = id => ids.filter(x => x === id).length;
    return `<div class="dkgrp" style="--c:${col}"><h3>${nm} <small>${ids.length}</small></h3><div class="dkgrid">${uniq.map(id => cnt(id) > 1 ? `<span class="dkstack" style="--n:${Math.min(3, cnt(id) - 1)}">${cardHTML(id, true, 'none')}<b class="dkn">×${cnt(id)}</b></span>` : cardHTML(id, true, 'none')).join('')}</div></div>`;
  }).join('');
}
export function deckModal() {
  const G = S.G;
  return `<div class="box dkbox" role="dialog" aria-label="덱"><button type="button" class="mini dkclose" data-close>닫기</button>
    <h2>덱 ${G.deck.length}장 <small>별빛 ✦${G.gold}</small></h2>
    ${deckGroups(G.deck)}
    <h2>도구 ${G.relics.length}개</h2>
    <div class="relicall">${G.relics.map(id => relicBox(id, G.used[id] ? ' (썼다)' : '')).join('')}</div></div>`;
}

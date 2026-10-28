// 보상·휴식·사건·야시장·카드 지우기/복제·보스 도구·달 고르기·결과
import { S } from '../run.js';
import { eventApi, restPct, removePrice, napTime } from '../map.js';
import { TALKS } from '../data/talks.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { DUOS, canUpgrade } from '../data/cards.js';
import { RULES, ACT_NAME, SHOP } from '../data/rules.js';
import { grantRun, P } from '../meta.js';
import { cardHTML, fmt, face, esc, charSrc } from './common.js';
import { artURL } from '../art.js';
import { SUMMON } from '../data/gacha.js';
import { dawnAt } from '../run.js';
import { moonImg } from './sprites.js';
import { EPISODES, BOND_SCENES } from '../data/episodes.js';

const relicBox = (id, extra = '') => { const d = RELICS[id]; return `<span class="rbox t-${d.tier}"><span class="relic t-${d.tier}">${esc(d.name.slice(0, 1))}</span><span><b>${esc(d.name)}</b> <small>${RELIC_TIER_NAME[d.tier]}</small><br>${esc(d.text)}${extra}</span></span>`; };

// 사건·휴식 무대 (docs/11 #3): 배경(그림 bg/<키>.png가 있으면 그것, 없으면 .bg-<키> 임시 그림) + 동료 상반신 + 가운데 글 상자
const SCENE_BG = { 1: ['act1', 'harbor'], 2: ['act2', 'roof'], 3: ['act3', 'dream'] };
function scene(bgKey, bgFile, people, inner) {
  const img = bgFile && artURL(`bg/${bgFile}.png`);
  const port = (p, side) => p ? `<img class="px sport ${side}" src="${charSrc(p, 'normal')}" alt="">` : '';
  return `<div class="scene bg-${bgKey}"><div class="epbg" aria-hidden="true"><i></i>${img ? `<img class="bgimg" src="${img}" alt="">` : ''}</div>
    ${port(people[0], 'l')}${port(people[1], 'r')}<div class="center sbox">${inner}</div></div>`;
}

export function rewardView() {
  const G = S.G, R = G.reward;
  const extra = [R.gold ? `별빛 +${R.gold}` : '', R.bonus ? `모든 동료 체력 +${R.bonus}` : '', R.kind === 'boss' ? `막 보스 격파 · 모든 동료 최대 체력의 ${RULES.bossHealPct * 100}% 회복` : ''].filter(Boolean).join(' · ');
  return `<div class="center"><h2>보상: 카드 한 장${R.kind === 'boss' ? ' (희귀)' : ''}</h2>
    ${extra ? `<p class="note">${extra}</p>` : ''}
    ${R.relic ? `<p class="note">도구를 얻었다</p>${relicBox(R.relic)}` : ''}
    <div class="hand big">${R.cards.map(id => cardHTML(id, true, 'take')).join('')}</div>
    <div class="acts"><button type="button" data-take="">건너뛰기</button></div></div>`;
}
export function restView() {
  const R = RULES.rest, G = S.G;
  const who = G.formation.map(p => {
    const M = G.members[p], gain = Math.min(M.max - M.hp, Math.ceil(M.max * restPct(M.wasDown)));
    return `<span class="mt">${face(p)}<span>${CHARACTERS[p].name} ${M.hp}/${M.max} <b>+${gain}</b>${M.wasDown ? ' (쓰러졌던 동료)' : ''}</span></span>`;
  }).join('');
  const talk = G.restTalk != null ? TALKS[G.restTalk] : null;
  // 대화가 있으면 말하는 둘, 없으면 대열 앞·가운데 둘이 모닥불 곁에
  const pair = talk ? [...new Set(talk.lines.map(([p]) => p))].slice(0, 2) : G.formation.slice(0, 2);
  return scene('rest', null, pair, `<h2>휴식</h2><p class="note">탑의 계단참. 쉬거나, 잠깐 눈을 붙여 시간을 벌거나, 카드를 손질하거나.</p>
    <div class="restwho">${who}</div>
    ${talk ? `<div class="talk">${talk.lines.map(([p, t]) => `<p>${face(p, 'sm')}<b>${CHARACTERS[p].name}</b> ${esc(t)}</p>`).join('')}</div>` : ''}
    <div class="acts">
      <button type="button" class="primary" data-rest="heal">쉬기: 각자 최대 체력의 ${Math.round(restPct(false) * 100)}% (쓰러졌던 동료 ${Math.round(restPct(true) * 100)}%)</button>
      <button type="button" data-rest="nap">낮잠: ${napTime()}분 되찾기</button>
      <button type="button" data-rest="smith" ${G.deck.some(canUpgrade) ? '' : 'disabled'}>손질: 카드 1장 강화</button></div>`);
}
const val = (v, x) => typeof v === 'function' ? v(x) : v;
export function eventView() {
  const G = S.G, e = G.event.def, x = eventApi();
  // 동료 전용 선택지가 있으면 그 동료, 없으면 사건을 함께 보는 동료(event.mate)
  const need = G.event.opts.find(o => o.need)?.need;
  const [bk, bf] = SCENE_BG[Math.min(3, G.act)] || SCENE_BG[1];
  return scene(bf, bk, [need || G.event.mate], `<h2>${e.title}</h2><p class="note evtext">${val(e.text, x)}</p>
    <div class="acts col">${G.event.opts.map((o, i) => `<button type="button" data-opt="${i}" ${o.can && !o.can(x) ? 'disabled' : ''}>${o.need ? `<span class="needtag" style="color:${CHARACTERS[o.need].col}">${CHARACTERS[o.need].name}</span> ` : ''}${val(o.t, x)}</button>`).join('')}</div>`);
}
export function upgradeView() {
  const G = S.G;
  const list = G.deck.map((id, i) => [id, i]).filter(([id]) => canUpgrade(id));
  const more = G.back !== 'shop' && G.smithLeft > 1 ? ` (도라: ${G.smithLeft}장)` : '';
  return `<div class="center"><h2>손질: 강화할 카드를 고르세요${more}</h2><p class="note">위가 지금, 아래가 강화판.</p>
    <div class="hand big scroll">${list.map(([id, i]) => `<span class="pair">${cardHTML(id, true, 'up', i)}${cardHTML(id + '+', true, 'up', i)}</span>`).join('')}</div>
    <div class="acts"><button type="button" data-up="-1">그만두기</button></div></div>`;
}
export function removeView() {
  return `<div class="center"><h2>지울 카드를 고르세요</h2><div class="hand big scroll">${S.G.deck.map((id, i) => cardHTML(id, true, 'rm', i)).join('')}</div>
    <div class="acts"><button type="button" data-rm="-1">그만두기</button></div></div>`;
}
export function dupeView() {
  return `<div class="center"><h2>거울: 복제할 카드를 고르세요</h2><div class="hand big scroll">${S.G.deck.map((id, i) => cardHTML(id, true, 'dupe', i)).join('')}</div></div>`;
}
export function shopView() {
  const G = S.G, sh = G.shop;
  const cards = sh.cards.map((c, i) => `<span class="ware ${c.sold ? 'sold' : ''}">${cardHTML(c.id, !c.sold && G.gold >= c.price, 'buycard', i)}
    <span class="price ${G.gold >= c.price ? '' : 'short'}">${c.sold ? '팔림' : `별빛 ${c.price}${c.sale ? ' <b>반값</b>' : ''}`}</span></span>`).join('');
  const relics = sh.relics.map((r, i) => `<button type="button" class="ware relicware ${r.sold ? 'sold' : ''}" data-buyrelic="${i}" ${r.sold || G.gold < r.price ? 'disabled' : ''}>
    ${relicBox(r.id)}<span class="price">${r.sold ? '팔림' : `별빛 ${r.price}`}</span></button>`).join('');
  return `<div class="shopscr">
    <div class="shophead"><span class="fukuro" aria-hidden="true">梟</span><span><b>후쿠로</b> ${sh.talk}</span>${sh.off ? `<span class="chip" style="color:var(--moon)">할인 ${sh.off}%</span>` : ''}<span class="grow"></span>${sh.special ? `<button type="button" class="mini ${sh.spView ? 'on' : ''}" data-spview>${sh.spView ? '◂ 후쿠로 노점' : `옆 노점: ${sh.special.name} ▸`}</button>` : ''}<span class="gold big">별빛 ${G.gold}</span></div>
    ${sh.spView ? specialRow(sh.special) : `<div class="wares">${cards}</div>`}
    <div class="shoprow">${relics}
      <span class="services">
        <button type="button" data-shop="remove" ${G.gold >= removePrice() && !sh.removed ? '' : 'disabled'}>카드 지우기 · 별빛 ${removePrice()}${sh.removed ? ' (오늘은 끝)' : ''}</button>
        <button type="button" data-shop="upgrade" ${G.gold >= SHOP.upgrade && G.deck.some(canUpgrade) ? '' : 'disabled'}>카드 강화 · 별빛 ${SHOP.upgrade}</button>
        <button type="button" class="primary" data-leave>나간다</button></span>
    </div></div>`;
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
  return `<div class="center"><h2>보스 도구: 하나를 고르세요</h2><p class="note">강하지만 대가가 있다.</p>
    <div class="acts col wide">${G.bossRelics.map(id => `<button type="button" class="relicpick" data-brelic="${id}">${relicBox(id)}</button>`).join('')}
    <button type="button" data-brelic="">고르지 않는다</button></div></div>`;
}
export function moonView() {
  return `<div class="center"><h2>달 조각: 오늘 밤의 달을 고르세요</h2>
    <div class="acts">${Object.entries(MOONS).map(([k, m]) => `<button type="button" class="moonpick ${S.G.moon === k ? 'on' : ''}" data-moon="${k}"><img class="px" src="${moonImg(k)}" alt=""><b>${m.name}</b><small>${m.text}</small></button>`).join('')}</div></div>`;
}

// 결과 화면 진행 막대 (docs/11 #3): 0:00 → 도착(또는 멈춘) 시각. 막 셋 구간과 6:00 눈금, 멈춘 막 표시.
function runBar(G) {
  const end = Math.max(dawnAt(), RULES.collapse, G.clock), pct = m => Math.min(100, m / end * 100).toFixed(1);
  const acts = [1, 2, 3].map(a => `<span class="seg a${a} ${a < G.act || G.won ? 'done' : a === G.act ? 'now' : ''}" style="left:${pct((a - 1) * dawnAt() / 3)}%;width:${pct(dawnAt() / 3)}%">${ACT_NAME[a]}</span>`).join('');
  return `<div class="runbar" aria-label="진행"><div class="track">${acts}<i class="fill ${G.won ? 'won' : ''}" style="width:${pct(G.clock)}%"></i><b class="dawnmark" style="left:${pct(dawnAt())}%" title="해 뜨는 시각"></b><u class="me" style="left:${pct(G.clock)}%">${fmt(G.clock)}</u></div>
    <div class="ticks"><span>00:00</span><span style="left:${pct(dawnAt())}%">${fmt(dawnAt())}</span></div></div>`;
}

const WHY = { down: '모두 쓰러졌다', collapse: '7시. 탑이 무너졌다' };
export function resultView() {
  const G = S.G, R = grantRun(G);
  const mvp = G.party.reduce((a, b) => (G.stats[b].dmg + G.stats[b].block) > (G.stats[a].dmg + G.stats[a].block) ? b : a);
  const mc = CHARACTERS[mvp], st = G.stats[mvp];
  const duos = [...G.duoSet].map(k => `<span class="chip">${DUOS[k]?.name || k}</span>`).join('') || '<span class="note">없음</span>';
  // 새로 열린 에피소드 · 인연 장면 (본부 [에피소드]에서 본다)
  const opened = [...(R.newEps || []).map(e => `${CHARACTERS[e.cid]?.name || e.cid} ${e.n + 1}화 「${EPISODES[e.cid][e.n].title}」`),
    ...(R.newBonds || []).map(k => `인연 장면 「${BOND_SCENES[k].title}」`)];
  const epNote = opened.length ? `<p class="epnew"><b class="newt">새 에피소드</b> ${opened.map(esc).join(' · ')}</p>` : '';
  return `<div class="resultscr">
    <div class="mvp" style="--c:${mc.col}">${face(mvp, 'big')}<span class="nm">MVP · ${mc.name}</span><span class="note">피해 ${st.dmg} · 방어 ${st.block}</span></div>
    <div class="rinfo">
      <h2 style="font-size:20px">${G.won ? '새벽을 넘었다' : WHY[G.why] || '탑에서 떨어졌다'}</h2>
      <p class="clockbig ${G.clock >= RULES.dawn ? 'dawn' : ''}">${fmt(G.clock)}</p>
      <p class="note">${G.won ? `꼭대기에 닿은 시각${G.clock >= RULES.dawn ? ' (해가 뜬 뒤)' : ' (해 뜨기 전)'}` : `${ACT_NAME[G.act]}에서 멈췄다`} · 싸움 ${G.fights}번 · 달 ${MOONS[G.moon].name} · 시드 ${G.seed}</p>
      <p class="note">쓴 듀오 ${duos}</p>
      ${epNote}
      ${runBar(G)}
      <table class="shards">${R.lines.map(([t, v], i) => `<tr style="--i:${i}"><td>${t}</td><td>+${v}</td></tr>`).join('')}<tr class="sum" style="--i:${R.lines.length}"><td>얻은 별 조각</td><td>+<b class="countup" data-to="${R.total}">${R.total}</b></td></tr></table>
      <p class="note">지금 별 조각 <b>${P.shards}</b> · ${P.shards >= SUMMON.tenCost ? '<b class="ok10">10연 소환을 할 수 있다</b>' : `10연까지 ${SUMMON.tenCost - P.shards}`}</p>
      <div class="acts"><button type="button" class="primary" data-home>본부로</button><button type="button" data-view="party">다시 오르기</button></div>
    </div></div>`;
}
export function deckModal() {
  const G = S.G;
  return `<div class="box" role="dialog" aria-label="덱"><h2>도구 ${G.relics.length}개 · 별빛 ${G.gold}</h2>
    <div class="relicall">${G.relics.map(id => relicBox(id, G.used[id] ? ' (썼다)' : '')).join('')}</div>
    <h2>덱 ${G.deck.length}장</h2>
    <div class="hand big">${G.deck.slice().sort().map(id => cardHTML(id, true, 'none')).join('')}</div>
    <button type="button" data-close>닫기</button></div>`;
}

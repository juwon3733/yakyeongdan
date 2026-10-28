// 보상·휴식·사건·야시장·카드 지우기/복제·보스 도구·달 고르기·결과
import { S } from '../run.js';
import { eventApi, restPct, removePrice } from '../map.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { DUOS, canUpgrade } from '../data/cards.js';
import { RULES, ACT_NAME, SHOP } from '../data/rules.js';
import { grantRun, P } from '../meta.js';
import { cardHTML, fmt, face, esc } from './common.js';
import { moonImg } from './sprites.js';

const relicBox = (id, extra = '') => { const d = RELICS[id]; return `<span class="rbox t-${d.tier}"><span class="relic t-${d.tier}">${esc(d.name.slice(0, 1))}</span><span><b>${esc(d.name)}</b> <small>${RELIC_TIER_NAME[d.tier]}</small><br>${esc(d.text)}${extra}</span></span>`; };

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
  return `<div class="center"><h2>휴식</h2><p class="note">탑의 계단참. 쉬거나, 잠깐 눈을 붙여 시간을 벌거나, 카드를 손질하거나.</p>
    <div class="restwho">${who}</div>
    <div class="acts">
      <button type="button" class="primary" data-rest="heal">쉬기: 각자 최대 체력의 ${Math.round(restPct(false) * 100)}% (쓰러졌던 동료 ${Math.round(restPct(true) * 100)}%)</button>
      <button type="button" data-rest="nap">낮잠: ${R.napTime}분 되찾기</button>
      <button type="button" data-rest="smith" ${G.deck.some(canUpgrade) ? '' : 'disabled'}>손질: 카드 1장 강화</button></div></div>`;
}
const val = (v, x) => typeof v === 'function' ? v(x) : v;
export function eventView() {
  const e = S.G.event.def, x = eventApi();
  return `<div class="center"><h2>${e.title}</h2><p class="note evtext">${val(e.text, x)}</p>
    <div class="acts col">${e.opts.map((o, i) => `<button type="button" data-opt="${i}" ${o.can && !o.can(x) ? 'disabled' : ''}>${val(o.t, x)}</button>`).join('')}</div></div>`;
}
export function upgradeView() {
  const G = S.G;
  const list = G.deck.map((id, i) => [id, i]).filter(([id]) => canUpgrade(id));
  return `<div class="center"><h2>손질: 강화할 카드를 고르세요</h2><p class="note">위가 지금, 아래가 강화판.</p>
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
    <div class="shophead"><span class="fukuro" aria-hidden="true">梟</span><span><b>후쿠로</b> ${sh.talk}</span><span class="grow"></span><span class="gold big">별빛 ${G.gold}</span></div>
    <div class="wares">${cards}</div>
    <div class="shoprow">${relics}
      <span class="services">
        <button type="button" data-shop="remove" ${G.gold >= removePrice() && !sh.removed ? '' : 'disabled'}>카드 지우기 · 별빛 ${removePrice()}${sh.removed ? ' (오늘은 끝)' : ''}</button>
        <button type="button" data-shop="upgrade" ${G.gold >= SHOP.upgrade && G.deck.some(canUpgrade) ? '' : 'disabled'}>카드 강화 · 별빛 ${SHOP.upgrade}</button>
        <button type="button" class="primary" data-leave>나간다</button></span>
    </div></div>`;
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

const WHY = { down: '모두 쓰러졌다', collapse: '7시. 탑이 무너졌다' };
export function resultView() {
  const G = S.G, R = grantRun(G);
  const mvp = G.party.reduce((a, b) => (G.stats[b].dmg + G.stats[b].block) > (G.stats[a].dmg + G.stats[a].block) ? b : a);
  const mc = CHARACTERS[mvp], st = G.stats[mvp];
  const duos = [...G.duoSet].map(k => `<span class="chip">${DUOS[k]?.name || k}</span>`).join('') || '<span class="note">없음</span>';
  const lines = R.lines.map(([t, v]) => `<tr><td>${t}</td><td>+${v}</td></tr>`).join('');
  return `<div class="resultscr">
    <div class="mvp" style="--c:${mc.col}">${face(mvp, 'big')}<span class="nm">MVP · ${mc.name}</span><span class="note">피해 ${st.dmg} · 방어 ${st.block}</span></div>
    <div class="rinfo">
      <h2 style="font-size:20px">${G.won ? '새벽을 넘었다' : WHY[G.why] || '탑에서 떨어졌다'}</h2>
      <p class="clockbig ${G.clock >= RULES.dawn ? 'dawn' : ''}">${fmt(G.clock)}</p>
      <p class="note">${G.won ? `꼭대기에 닿은 시각${G.clock >= RULES.dawn ? ' (해가 뜬 뒤)' : ' (해 뜨기 전)'}` : `${ACT_NAME[G.act]}에서 멈췄다`} · 싸움 ${G.fights}번 · 달 ${MOONS[G.moon].name} · 시드 ${G.seed}</p>
      <p class="note">쓴 듀오 ${duos}</p>
      <table class="shards">${lines}<tr class="sum"><td>얻은 별 조각</td><td>+${R.total}</td></tr></table>
      <p class="note">지금 별 조각 <b>${P.shards}</b></p>
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

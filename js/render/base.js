// 본부 · 별 소환 · 소환 결과 · 초심자 ★5 고르기 · 교환소 · 동료 · 도감 · 기록 (docs/05_meta.md, docs/06 「본부」)
import { S } from '../run.js';
import { ROSTER, ROSTER_IDS, byRarity } from '../data/roster.js';
import { CHARACTERS } from '../data/characters.js';
import { SUMMON, STAR_STEPS, EXCHANGE, PICKUP_DAYS } from '../data/gacha.js';
import { CARDS, DUOS, cardData } from '../data/cards.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { FOE } from '../data/enemies.js';
import { AFFIX } from '../data/affixes.js';
import { MOONS } from '../data/moons.js';
import { TALKS } from '../data/talks.js';
import { DEPTH, DEPTH_MAX } from '../data/depth.js';
import { P, nextRate5, epNewCount, pickupNow, starsOf, costumeOpen, wearing, packCards, packsOpen, startUp, sigOpen, sigOf, duoSpecial,
  canExchange, exchangePrice, depthOpen, startPickOpen } from '../meta.js';
import { stars, palOf, fmt, esc, cardHTML, charSrc, fcImg } from './common.js';
import { moonImg } from './sprites.js';
import { REST_LINES, FIRST_LINES } from '../data/hublines.js';
import { artURL, foeArt } from '../art.js';
import { seasonNow } from '../season.js';
import { achTab, historyBlock } from './daily.js';
import { dailyToday, mastery, masteryTitles, backOpen } from '../meta.js';
import { MASTERY_REWARDS, MASTERY_XP } from '../data/mastery.js';
import { endlessMenu, endlessRecords } from './endless.js';

const pct = x => `${Math.round(x * 1000) / 10}%`;
const wallet = () => `<span class="wallet"><b>별 조각 ${P.shards}</b><span class="dust"> · 별가루 ${P.dust}</span></span>`;
const head = (back = 'base', label = '본부') => `<div class="bhead"><button type="button" class="mini" data-view="${back}">‹ ${label}</button>${wallet()}</div>`;
const img = (id, alt) => `<img class="px" src="${charSrc(id, 'stand', alt)}" alt="">`;
// 아직 없는 동료: 같은 그림을 검은 실루엣으로(빈 네모는 깨진 그림처럼 보인다)
const sil = id => `<img class="px sil" src="${charSrc(id, 'stand')}" alt="" aria-hidden="true">`;
const starRing = id => duoSpecial(id) ? 'star5' : '';

// 본부에서 쉬는 셋: 들어올 때마다 가진 동료 중 무작위 셋(같은 방문 동안은 그대로), 하나가 말풍선으로 한 줄.
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
function restTrio(own) {
  if (!S.baseTrio || S.baseTrio.some(k => !P.owned[k]) || S.baseTrio.length < Math.min(3, own.length)) {
    const pool = own.slice(); S.baseTrio = [];
    while (pool.length && S.baseTrio.length < 3) S.baseTrio.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const who = S.baseTrio[Math.floor(Math.random() * S.baseTrio.length)];
    S.restLine = { k: who, i: Math.floor(Math.random() * (REST_LINES[who]?.length || 1)) };
  }
  return S.baseTrio;
}
// 별 조각·별가루가 지난번 본부보다 늘었으면 숫자가 튀어 오른다
function walletBump() {
  const prev = S.walletSeen || { s: P.shards, d: P.dust };
  const ds = P.shards - prev.s, dd = P.dust - prev.d;
  S.walletSeen = { s: P.shards, d: P.dust };
  return `<span class="wallet ${ds > 0 || dd > 0 ? 'bump' : ''}"><b>별 조각 ${P.shards}</b>${ds > 0 ? `<i class="plus">+${ds}</i>` : ''} · 별가루 ${P.dust}${dd > 0 ? `<i class="plus">+${dd}</i>` : ''}</span>`;
}
export const hallTime = () => ls('yk-hall') === 'dawn' ? 'dawn' : 'night';
export const setHallTime = won => ls('yk-hall', won ? 'dawn' : 'night');
// 본부 로비: 왼쪽은 본부 배경(bg/hq.png)과 대표 동료(쉬는 셋 중 성급이 가장 높은 동료) 큰 그림, 오른쪽은 세로 큰 메뉴(css/hub2.css)
const dot = on => on ? '<i class="ndot" aria-label="새 소식"></i>' : '';

export function baseView() {
  const own = ROSTER_IDS.filter(k => P.owned[k]);
  const trio = restTrio(own), L = S.restLine;
  const lead = trio.slice().sort((a, b) => ROSTER[b].rarity - ROSTER[a].rarity)[0];
  const say = k => {
    const lines = REST_LINES[k] || [ROSTER[k].role];
    return L && L.k === k ? `<span class="bubble">${esc(lines[L.i % lines.length])}</span>` : '';
  };
  const side = trio.filter(k => k !== lead).map((k, i) =>
    `<button type="button" class="h2side s${i}" style="--c:${ROSTER[k].col}" data-restline="${k}" aria-label="${ROSTER[k].name}에게 말 걸기">${say(k)}<img class="px" src="${charSrc(k)}" alt="${ROSTER[k].name}"></button>`).join('');
  const leadBtn = lead ? `<button type="button" class="h2lead ${starRing(lead)}" style="--c:${ROSTER[lead].col}" data-restline="${lead}" aria-label="${ROSTER[lead].name}에게 말 걸기">${say(lead)}<img class="px" src="${charSrc(lead)}" alt="${ROSTER[lead].name}">
      <span class="h2name"><b>${ROSTER[lead].name}</b> <i class="stars">${stars(ROSTER[lead].rarity)}</i><small>${esc(ROSTER[lead].role)}</small></span></button>` : '';
  const tm = hallTime();
  const matesNew = own.length > (+ls('yk-mates-seen') || 3);
  const epN = epNewCount();
  // 본부: 왼쪽은 옛 게임식 글자 메뉴(고른 줄 앞에 ▸), 오른쪽 무대에 동료 셋. 둥근 아이콘·칩 묶음은 쓰지 않는다
  const item = (attrs, label, on = false, cls = '') => `<button type="button" class="h3i ${cls}" ${attrs}>${label}${dot(on)}</button>`;
  return `<div class="hub2 hub3 tm-${tm}">
    <div class="h2stage">
      <div class="h2top">${walletBump()}</div>
      <div class="h2cast">${side}${leadBtn}</div>
    </div>
    <nav class="h2menu h3menu" aria-label="본부 메뉴">
      <button type="button" class="h3go" data-view="party">출격</button>
      ${endlessMenu().replace('type="button"', 'type="button" class="h3i"')}
      ${item('data-view="daily"', '매일의 밤', !dailyToday().rec?.won)}
      <i class="h3gap"></i>
      ${seasonNow()?.open ? item('data-view="season"', `시즌 ${seasonNow().no}`, true, 'season') : ''}
      ${item('data-view="summon"', `별 소환${P.pick5 ? ' <b class="newt">★5</b>' : ''}${S.hint === 'summon' ? ' <b class="newt">10연</b>' : ''}`, !!P.pick5, S.hint === 'summon' ? 'hint' : '')}
      ${item('data-view="mates"', '동료', matesNew)}
      ${item('data-view="episodes"', `에피소드${epN ? ` <b class="newt">${epN}</b>` : ''}`, epN)}
      ${item('data-view="exchange"', '교환소', P.dust >= Math.min(EXCHANGE.char[3], EXCHANGE.talk))}
      ${item('data-view="codex"', '도감')}
      ${item('data-view="records"', '기록')}
      <i class="h3gap"></i>
      ${item('data-settings', '설정', false, 'sm')}
      ${item('data-view="title"', '타이틀', false, 'sm')}
    </nav>
  </div>`;
}

export function summonView() {
  const r5 = nextRate5(), pk = pickupNow();
  const days = Math.max(1, Math.ceil((pk.ends - Date.now()) / 86400000));
  const firstTen = !P.firstTen ? '<p class="note"><b>첫 10연</b>: 노엘·레이븐 중 ★4 동료 1명 확정.</p>' : '';
  const beginner = !P.got5 ? `<p class="note">초심자: 처음 ${SUMMON.beginner}번 안에 ★5 동료 확정, <b>처음 얻는 ★5는 직접 고른다</b> (지금 ${P.pulls}번).</p>` : '';
  const choose = P.pick5 ? `<button type="button" class="primary" data-view="pick5">★5 동료 고르기 (${P.pick5})</button>` : '';
  return `<div class="summonscr">
    <div class="ssky" aria-hidden="true" style="--c:${ROSTER[pk.five].col}"><span class="pkglow"></span><img class="pkart" src="${charSrc(pk.five, 'stand')}" alt="">
      <span class="pkname"><i>픽업</i><b>${ROSTER[pk.five].name}</b><small>${stars(5)}</small></span></div>
    <div class="spanel">
      ${head()}
      <div class="sban" style="--c:${ROSTER[pk.five].col}"><span class="sbk">픽업 소환 · ${days}일 남음</span><b>${ROSTER[pk.five].name}</b><span class="stars">${stars(5)}</span>
        <span class="sb4">${pk.four.map(k => `<span style="--c:${ROSTER[k].col}">${img(k)}${ROSTER[k].name}</span>`).join('')}</span>
        ${P.pickGuar ? '<span class="sguar">다음 ★5는 픽업 확정</span>' : ''}</div>
      ${pityBar(r5)}
      <div class="oddsline"><button type="button" class="mini" data-view="odds">확률·규칙</button></div>
      ${firstTen || beginner ? `<details class="fold"><summary>확정 혜택${!P.firstTen ? ' · 첫 10연' : ''}${!P.got5 ? ` · 초심자 ${P.pulls}/${SUMMON.beginner}` : ''}</summary>${firstTen}${beginner}</details>` : ''}${choose}
      <div class="acts sacts">
        <button type="button" class="sbtn" data-summon="1" ${P.shards >= SUMMON.cost ? '' : 'disabled'}><b>1회</b><span class="scost"><i class="shard"></i>${SUMMON.cost}</span></button>
        <button type="button" class="sbtn primary" data-summon="10" ${P.shards >= SUMMON.tenCost ? '' : 'disabled'}><b>10연</b><span class="scost"><i class="shard"></i>${SUMMON.tenCost}</span><small>★4 이상 1 확정</small></button>
      </div>
    </div>
  </div>`;
}

// 확률 한 줄 (등급별 칸) · 천장 진행 막대 (★5 없이 몇 번 / 확정까지, 확률이 오르기 시작하는 곳에 눈금)
const oddsRow = () => `<span class="oc r5"><b>★5</b>${pct(SUMMON.rate5)}</span><span class="oc r4"><b>★4</b>${pct(SUMMON.rate4)}</span><span class="oc r3"><b>★3</b>${pct(1 - SUMMON.rate5 - SUMMON.rate4)}</span><span class="oc ten">10연 ★4↑ 확정</span>`;
function pityBar(r5) {
  const cap = SUMMON.hard - 1, n = Math.min(P.pity5, cap), soft = (SUMMON.softFrom - 1) / cap * 100;
  return `<div class="pity ${n >= SUMMON.softFrom - 1 ? 'hot' : ''}" title="${SUMMON.softFrom}번째부터 ★5 확률이 오르고, ★5 없이 ${cap}번이면 ${SUMMON.hard}번째 확정">
    <span class="plbl">천장</span><span class="pbar"><i style="width:${n / cap * 100}%"></i><u style="left:${soft}%"></u></span>
    <span class="pn"><b>${n}</b>/${cap}</span><span class="pr">다음 ★5 <b>${pct(r5)}</b></span></div>`;
}

// 확률 표시 화면 (모든 확률을 숫자로)
export function oddsView() {
  const pk = pickupNow();
  const c4 = SUMMON.rate4 * SUMMON.char4Share, c3 = (1 - SUMMON.rate5 - SUMMON.rate4) * SUMMON.char3Share;
  const row = (r, list, each) => `<tr><th>${stars(r)}</th><td>${list.map(k => `${ROSTER[k].name}${k === pk.five || pk.four.includes(k) ? '<b class="pkmark">픽업</b>' : ''}`).join(' · ')}</td><td>${each}</td></tr>`;
  const n4 = byRarity(4).length - 2;
  return `<div class="epsel">
    ${head('summon', '별 소환')}
    <h2>소환 확률</h2>
    <div class="oddsline big">${oddsRow()}</div>
    ${pityBar(nextRate5())}
    <details class="fold"><summary>등급별로 나오는 것</summary>
    <table class="odds big">
      <tr><th>등급</th><td>나오는 것</td><td>확률</td></tr>
      ${row(5, byRarity(5), `${pct(SUMMON.rate5)} (픽업 ${ROSTER[pk.five].name} ${pct(SUMMON.rate5 * SUMMON.pickShare5)}, 나머지 셋 각 ${pct(SUMMON.rate5 * (1 - SUMMON.pickShare5) / 3)})`)}
      ${row(4, byRarity(4), `동료 ${pct(c4)} (그중 ${pct(SUMMON.pickShare4)}는 픽업 둘 중 하나, 나머지는 ★4 ${n4 + 2}명 중 하나)`)}
      <tr><th>★4</th><td>동료 의상 · 레전더리 도구 · 카드 묶음</td><td>${pct(SUMMON.rate4 - c4)} (셋 같은 확률)</td></tr>
      ${row(3, byRarity(3), `동료 ${pct(c3)} (${byRarity(3).length}명 같은 확률)`)}
      <tr><th>★3</th><td>레어 도구 · 별가루 10 · 휴식 대화 조각</td><td>${pct(1 - SUMMON.rate5 - SUMMON.rate4 - c3)} (셋 같은 확률)</td></tr>
    </table></details>
    <details class="fold"><summary>천장 · 확정 규칙</summary>
    <ul class="note rules">
      <li>${SUMMON.softFrom}번째 뽑기부터 ★5 확률이 매번 +${pct(SUMMON.softStep)}, ★5 없이 ${SUMMON.hard - 1}번이면 ${SUMMON.hard}번째 확정. 횟수는 픽업이 바뀌어도 이어진다.</li>
      <li>10연은 ★4 이상 1개 확정. 첫 10연은 노엘·레이븐 중 1명 확정.</li>
      <li>동료가 나오면 아직 없는 동료가 ${pct(SUMMON.newFirst)} 확률로 먼저 나온다.</li>
      <li>★5를 픽업이 아닌 동료로 받으면 다음 ★5는 픽업 확정.</li>
      <li>처음 ${SUMMON.beginner}번 안에 ★5 확정, 처음 얻는 ★5는 직접 고른다.</li>
      <li>겹친 동료는 별자리 +1 (최대 ${SUMMON.maxStars}), 꽉 차면 별가루 ${SUMMON.dustFullStars}. 열 것이 없는 물건은 별가루로.</li>
    </ul></details>
  </div>`;
}

// 소환 결과: 별똥(등급 색)이 떨어지고, 누르면 하나씩 펼친다
// 소환된 물건 그림: 도구는 도구 그림, 의상·카드 묶음·휴식 대화는 그 동료 얼굴, 별가루는 별 — 글자 한 칸(임시 티)은 그림이 없을 때만
function itemIco(r, nm) {
  const ic = r.relic && artURL(`icons/relic_${r.relic}.png`);
  if (ic) return `<span class="ico pic"><img class="px" src="${ic}" alt=""></span>`;
  if (r.who) return `<span class="ico who ${r.kind}" style="--c:${ROSTER[r.who].col}"><img class="px" src="${charSrc(r.who, 'normal')}" alt=""></span>`;
  if (r.dust) return '<span class="ico dust" aria-hidden="true"></span>';
  return `<span class="ico">${esc(nm.slice(0, 1))}</span>`;
}
export function revealView() {
  const R = S.reveal, top = Math.max(...R.list.map(r => r.rarity));
  // 처음 그릴 때만 별이 모이는 도입(js/juice.js gachaFx), 이번에 막 펼친 것만 뒤집히는 연출(.fresh) — 다시 그려도 반복되지 않게
  const intro = !R.seen; R.seen = true;
  const was = R.was || [], fresh = R.open.map((o, i) => o && !was[i]); R.was = R.open.slice();
  let fk = 0; const fd = i => fresh[i] ? ` fresh" data-g="${R.list[i].rarity}" style="--fd:${fk++ * 140}ms;` : '" style="';
  const done0 = R.open.every(Boolean);
  // 다 펼치면 등급 높은 것부터 앞에 (data-reveal 번호는 그대로, 보이는 순서만 CSS order로)
  const ord = r => done0 && R.list.length > 1 ? ` order:${(5 - r.rarity) * 2 + (r.kind === 'char' ? 0 : 1)};` : '';
  const items = R.list.map((r, i) => {
    if (!R.open[i]) return `<button type="button" class="drop g${r.rarity}" data-reveal="${i}" style="--d:${i * 90}ms;--x:${(i % 5) * 7 - 14}px" aria-label="펼치기">${artURL(`summon/meteor_${r.rarity}.png`) ? `<img class="met" src="${artURL(`summon/meteor_${r.rarity}.png`)}" alt="">` : ''}<span class="orb"></span><span class="tail"></span><span class="head"></span><span class="spark"></span></button>`;
    if (r.kind === 'choose5') return `<div class="got g5 crack choose${fd(i)}--c:var(--gold);${ord(r)}"><span class="ico">?</span><span class="nm">★5 동료</span><span class="stars">${stars(5)}</span><span class="tag">직접 고른다</span></div>`;
    if (r.kind === 'char') {
      const c = ROSTER[r.id];
      // 겹침: 별자리 칸 5개 중 이번에 찬 칸이 차오른다
      const cells = r.stars ? `<span class="stcells" title="별자리 ${r.stars}">${Array.from({ length: SUMMON.maxStars }, (_, n) => `<i class="${n < r.stars ? 'on' : ''} ${n === r.stars - 1 ? 'fill' : ''}"></i>`).join('')}</span>` : '';
      // 겹친 동료는 별자리 칸이 이미 말해 주므로 글은 빼고 칸에 title로(칸 아래가 잘리던 것)
      const tag = r.isNew ? '<b class="new">NEW</b>' : r.stars ? '' : `별가루 +${r.dust}`;
      return `<div class="got g${r.rarity} ${r.rarity === 5 ? 'crack' : ''} ${r.isNew ? 'isnew' : ''}${fd(i)}--c:${c.col};${ord(r)}">${img(r.id)}
        <span class="nm">${c.name}</span><span class="stars">${stars(r.rarity)}</span>${cells}<span class="tag">${tag}</span></div>`;
    }
    // 물건 이름(「…」)을 크게, 종류(흔한 도구·의상 등)는 아래 작게
    const m = /「(.+?)」/.exec(r.text || ''), nm = m ? m[1] : r.name;
    return `<div class="got g${r.rarity} item${fd(i)}${ord(r)}">${itemIco(r, nm)}<span class="nm">${esc(nm)}</span><span class="stars">${stars(r.rarity)}</span>
      <span class="tag" title="${esc(r.text || '')}">${r.dust ? (/^별가루/.test(nm) ? '교환소에서 쓴다' : `이미 있음 → 별가루 +${r.dust}`) : esc(m ? r.text.replace(m[0], '').trim() || r.name : r.text || '보관함에')}</span></div>`;
  }).join('');
  const done = R.open.every(Boolean);
  const next = P.pick5 ? '<button type="button" class="primary" data-view="pick5">★5 동료 고르기</button>' : '<button type="button" class="primary" data-view="summon">확인</button>';
  // ★5 동료를 펼친 순간: 하늘이 갈라지고 전신 CG(없으면 큰 임시 도트 + 빛)와 이름·첫 대사. 클릭은 가로막지 않고 저절로 사라진다.
  let focus = '';
  const f = R.focus != null ? R.list[R.focus] : null;
  if (f && f.kind === 'char' && f.rarity === 5) {
    const c = ROSTER[f.id], cg = artURL(`cg/star5_${f.id}.png`);
    focus = `<div class="s5focus" style="--c:${c.col}" aria-hidden="true"><span class="rift"></span>
      ${cg ? `<img class="cg" src="${cg}" alt="">` : `<span class="rays"></span><img class="px big" src="${charSrc(f.id, 'stand')}" alt="">`}
      <span class="s5name"><b>${c.name}</b> <i>${stars(5)}</i><small>${c.role}</small></span>
      <span class="s5line">「${esc(FIRST_LINES[f.id] || '')}」</span></div>`;
    R.focus = null;   // 한 번만
  }
  return `<div class="revealscr ${intro ? 'intro' : ''} ${top === 5 && R.open.some((o, i) => o && R.list[i].rarity === 5) ? 'sky5' : ''} ${done ? 'done' : ''}">
    <h2>${R.list.length === 10 ? '10연 소환' : '소환'} </h2>
    <div class="drops n${R.list.length}">${items}</div>
    <div class="acts">${done ? next : '<button type="button" data-revealall>모두 넘기기</button>'}</div>
    ${focus}
  </div>`;
}

// 초심자 ★5 고르기: ★5 동료 중 하나
export function pick5View() {
  const L = byRarity(5).map(k => {
    const r = ROSTER[k], c = CHARACTERS[k];
    return `<button type="button" class="p5" style="--c:${r.col}" data-choose5="${k}">${img(k)}<b>${r.name}</b><span class="stars">${stars(5)}</span>
      <small>${r.role} · 체력 ${c.maxHp}</small><small class="ps"><b>${esc(c.passive.name)}</b> ${esc(c.passive.text)}</small>${P.owned[k] ? '<small class="dim">가진 동료 · 별자리 +1</small>' : ''}</button>`;
  }).join('');
  return `<div class="epsel">${head('summon', '별 소환')}
    <h2>처음 만나는 ★5 · 한 명을 고른다</h2>
    <p class="note">★5 동료 하나를 고른다.</p>
    <div class="p5row">${L}</div></div>`;
}

// 교환소 (§5): 별가루로 직접 사기
// 교환소: 버튼 30여 개를 줄줄이 늘어놓던 표 대신 — 위 탭 셋(동료 · 의상·묶음 · 도구·대화), 아래는 얼굴·그림 칸에 값 보석. 칸을 누르면 바로 바꾼다
export function exchangeView() {
  const tab = ['char', 'gear', 'misc'].includes(S.exTab) ? S.exTab : 'char';
  const tile = (kind, arg, pic, name, sub, cls = '') => {
    const price = exchangePrice(kind, arg), ok = canExchange(kind, arg);
    return `<button type="button" class="extile ${cls}" data-ex="${kind}:${arg ?? ''}" ${ok ? '' : 'disabled'}>${pic}<span class="nm">${name}</span>${sub ? `<small>${sub}</small>` : ''}<b class="pr">${price ?? '-'}</b></button>`;
  };
  const face = k => `<span class="fc" style="--c:${ROSTER[k].col}">${fcImg(k)}</span>`;
  const own = ROSTER_IDS.filter(k => P.owned[k]);
  let body = '';
  if (tab === 'char') body = [5, 4, 3].map(r => `<div class="exgrid">${byRarity(r).map(k =>
    tile('char', k, P.owned[k] ? face(k) : `<span class="fc sil" style="--c:${ROSTER[k].col}">${fcImg(k, 1.15)}</span>`, ROSTER[k].name,
      P.owned[k] ? `${'✦'.repeat(starsOf(k))}${starsOf(k) >= SUMMON.maxStars ? ' 꽉 참' : ''}` : '', `r${r} ${P.owned[k] ? '' : 'new'}`)).join('')}</div>`).join('');
  else if (tab === 'gear') body = `<div class="exgrid">${[
    ...own.filter(k => !costumeOpen(k)).map(k => tile('costume', k, face(k), ROSTER[k].name, '두 번째 의상', 'cos')),
    ...own.filter(k => CHARACTERS[k] && packsOpen(k) < packCards(k).length).map(k => tile('pack', k, face(k), ROSTER[k].name, `카드 묶음 ${packsOpen(k) + 1}`, 'pack')),
  ].join('') || '<p class="note">지금은 바꿀 것이 없다.</p>'}</div>`;
  else body = `<div class="exgrid">${Object.keys(RELICS).filter(k => ['c', 'r'].includes(RELICS[k].tier) && !P.startRelics.includes(k)).map(k => {
    const ic = artURL(`icons/relic_${k}.png`);
    return `<span data-tip="${esc(RELICS[k].text)}">${tile('relic', k, `<span class="fc ic">${ic ? `<img class="px" src="${ic}" alt="">` : esc(RELICS[k].name.slice(0, 1))}</span>`, RELICS[k].name, RELIC_TIER_NAME[RELICS[k].tier], 't-' + RELICS[k].tier)}</span>`;
  }).join('')}${tile('talk', null, '<span class="fc ic talk">…</span>', '휴식 대화', `${P.talksSeen.length}/${TALKS.length}`)}</div>`;
  const tabs = [['char', '동료'], ['gear', '의상·묶음'], ['misc', '도구·대화']].map(([k, l]) => `<button type="button" class="mini ${k === tab ? 'on' : ''}" data-extab="${k}">${l}</button>`).join('');
  return `<div class="epsel exscr">${head()}
    <div class="exhead"><h2>교환소</h2><div class="extabs">${tabs}</div></div>
    ${S.exMsg ? `<p class="exmsg">${esc(S.exMsg)}</p>` : ''}
    <div class="exbody">${body}</div>
  </div>`;
}

// 동료 화면: 목록 + 고른 동료의 별자리·의상·패시브·카드
export function matesView() {
  const sel = S.mate && P.owned[S.mate] ? S.mate : ROSTER_IDS.find(k => P.owned[k]);
  ls('yk-mates-seen', String(Object.keys(P.owned).length));   // 본부 [동료] 새 소식 점 끄기
  const grid = ROSTER_IDS.map(k => {
    const r = ROSTER[k], own = !!P.owned[k];
    return `<button type="button" class="mcell r${r.rarity} ${k === sel ? 'on' : ''} ${own ? '' : 'none'} ${starRing(k)} mx${own ? mastery(k) : 0}" style="--c:${r.col}" ${own ? `data-mate="${k}"` : 'disabled'} title="${esc(r.name)}">
      ${own ? img(k) : sil(k)}<span class="nm">${own ? r.name : '?'}</span>${own ? `<span class="st">${'✦'.repeat(starsOf(k))}</span>` : ''}</button>`;
  }).join('');
  return `<div class="matescr">
    <div class="mleft">${head()}<h2>동료</h2><div class="mgrid">${grid}</div></div>
    ${sel ? `<div class="mart ${starRing(sel)}" style="--c:${ROSTER[sel].col}" aria-hidden="true"><span class="mglow"></span><img class="px" src="${charSrc(sel, 'stand')}" alt="">
      <span class="mplate"><b>${ROSTER[sel].name}</b><span class="stars">${stars(ROSTER[sel].rarity)}</span><small>${esc(ROSTER[sel].role)}</small></span></div>` : ''}
    <div class="mright">${sel ? mateDetail(sel) : ''}</div></div>`;
}
function mateDetail(k) {
  const r = ROSTER[k], c = CHARACTERS[k], s = starsOf(k), st = P.charStats[k] || { runs: 0, wins: 0 };
  const cos = `<div class="cos"><button type="button" class="mini ${!wearing(k) ? 'on' : ''}" data-costume="${k}:0">기본</button>
    <button type="button" class="mini ${wearing(k) ? 'on' : ''}" data-costume="${k}:1" ${costumeOpen(k) ? '' : 'disabled title="별자리 1이나 소환·교환소로 열린다"'}>두 번째 의상</button></div>`;
  const steps = STAR_STEPS.map(x => {
    let extra = '';
    if (x.n === 2) extra = packCards(k).map((pk, i) => `<small class="${i < packsOpen(k) ? '' : 'dim'}">묶음 ${i + 1}: ${pk.map(id => CARDS[id].name).join('·')}${i < packsOpen(k) ? '' : ' (잠김)'}</small>`).join('');
    if (x.n === 3 && c) { const id = c.start.find(cid => cardData(cid).up); if (id) extra = `<small>${cardData(id).name} 강화판으로 시작</small>`; }
    if (x.n === 4) { const sg = sigOf(k); if (sg) extra = `<small>${RELICS[sg].name}: ${esc(RELICS[sg].text)}</small>`; }
    return `<span class="stc ${s >= x.n ? 'on' : ''} ${s + 1 === x.n ? 'next' : ''}" data-tip="${esc(`별자리 ${x.n} · ${x.text}${extra ? `\n${extra.replace(/<[^>]+>/g, ' ').trim()}` : ''}`)}"><b>${x.n}</b></span>`;
  }).join('');
  const start = c ? c.start.map((id, i) => cardHTML(startUp(k) && i === c.start.findIndex(cid => cardData(cid).up) ? id + '+' : id, true, 'none')).join('') : '';
  const pool = c ? Object.keys(CARDS).filter(id => CARDS[id].ch === k && !c.start.includes(id)) : [];
  const locked = new Set(packCards(k).slice(packsOpen(k)).flat());
  return `<div class="mhead ${starRing(k)}" style="--c:${r.col}">${img(k)}<div><h2>${r.name} <span class="stars">${stars(r.rarity)}</span></h2>
      <p class="note">${r.role} · 체력 ${c?.maxHp ?? '-'}${P.titles.includes(k) ? ` · 칭호 ${r.name}의 새벽` : ''}</p>
      ${c ? `<p class="ps"><b>${esc(c.passive.name)}</b></p>${(c.passive.lines || [['', '', c.passive.text]]).map(([k, n, t]) => `<p class="ps ${k}">${k === 'burst' ? '<i class="pstag">폭발</i>' : ''}${n ? `<b>${esc(n)}</b> ` : ''}${esc(t)}</p>`).join('')}` : ''}${cos}</div></div>
    ${masteryBlock(k, r.name)}
    <h3 class="sub">별자리</h3><div class="stcs">${steps}${s < STAR_STEPS.length ? `<span class="stnext">다음: ${STAR_STEPS[s].text}</span>` : ''}</div>
    ${c ? `<h3 class="sub">시작 카드</h3><div class="hand mini">${start}</div>
    <h3 class="sub">보상 카드 ${pool.length - locked.size}/${pool.length}</h3><div class="hand mini scroll">${pool.map(id => locked.has(id) ? `<span class="lockcard" title="카드 묶음이 열리면 나온다">${esc(CARDS[id].name)}<small>잠김</small></span>` : cardHTML(id, true, 'none')).join('')}</div>` : ''}`;
}

// 숙련도: 별 다섯 칸 진행 막대(다음 칸은 점수만큼 차오름) + 지금 단계 보상은 크게, 나머지 단계는 작은 칩
function masteryBlock(k, name) {
  const lv = mastery(k), xp = P.mxp[k] || 0, prev = lv ? MASTERY_XP[lv - 1] : 0, next = MASTERY_XP[lv];
  const frac = next == null ? 1 : Math.max(0, Math.min(1, (xp - prev) / (next - prev)));
  const txt = rw => esc(rw.text.replace(/\{name\}/g, name));
  const bar = MASTERY_REWARDS.map(rw => {
    const st = rw.lv <= lv ? 'on' : rw.lv === lv + 1 ? 'cur' : '';
    return `<span class="mxs ${st}" style="--f:${st === 'on' ? 100 : st === 'cur' ? Math.round(frac * 100) : 0}%" title="${rw.lv}단계 · ${txt(rw)}"><i>★</i></span>`;
  }).join('');
  const now = MASTERY_REWARDS[Math.max(0, lv - 1)], up = lv === 0;
  const chips = MASTERY_REWARDS.filter(rw => rw !== now).map(rw => `<span class="mxchip ${rw.lv <= lv ? 'on' : ''}"><b>${rw.lv}</b>${txt(rw)}</span>`).join('');
  const back = backOpen(k) ? `<button type="button" class="mini ${P.cardBack === k ? 'on' : ''}" data-cardback="${P.cardBack === k ? '' : k}">${P.cardBack === k ? '카드 뒷면 쓰는 중 (끄기)' : '이 카드 뒷면 쓰기'}</button>` : '';
  return `<div class="mxbox">
    <div class="mxtop"><span class="mxlbl">숙련도</span><span class="mxbar">${bar}</span>
      <span class="mxxp">${next != null ? `${xp} / ${next}` : '최고 단계'}</span></div>
    <div class="mxnow ${up ? 'up' : ''}"><small>${up ? '1단계 보상' : `${lv}단계 보상`}</small><b>${txt(now)}</b>${back}</div>
    <div class="mxchips">${chips}</div>
  </div>`;
}

// 도감 (§8): 동료 · 듀오 · 카드 · 적 · 휴식 대화
const TABS = [['mates', '동료'], ['duos', '인연 듀오'], ['cards', '카드'], ['foes', '적'], ['talks', '휴식 대화'], ['ach', '업적']];
export function codexView() {
  const t = S.codexTab || 'mates';
  const tabs = TABS.map(([k, n]) => `<button type="button" class="mini ${t === k ? 'on' : ''}" data-ctab="${k}">${n}</button>`).join('');
  return `<div class="epsel">${head()}<h2>도감</h2><div class="tabs">${tabs}</div><div class="codex">${CODEX[t]()}</div></div>`;
}
const CODEX = {
  ach: achTab,
  mates: () => `<div class="cxfaces">${ROSTER_IDS.map(k => {
    const r = ROSTER[k], own = !!P.owned[k], st = P.charStats[k] || { runs: 0, wins: 0 }, c = CHARACTERS[k];
    const tip = own ? `${r.name} ${'★'.repeat(r.rarity)} · ${r.role}${c?.ds ? `\n${c.ds}` : ''}\n별자리 ${starsOf(k)} · 판 ${st.runs} · 이김 ${st.wins}` : `??? ${'★'.repeat(r.rarity)}`;
    return `<span class="cxf r${r.rarity} ${own ? '' : 'none'}" style="--c:${r.col}" data-tip="${esc(tip)}"><span class="fc">${fcImg(k, own ? 1.9 : 1.15)}</span><small>${own ? r.name : '???'}</small></span>`;
  }).join('')}</div>`,
  duos: () => {
    const ks = Object.keys(DUOS), got = ks.filter(k => P.seenDuos.includes(k)).length;
    return `<p class="note">${got}/${ks.length}</p><div class="dgrid">${ks.map(k => {
      const [a, b] = k.split('+'), seen = P.seenDuos.includes(k);
      return seen ? `<button type="button" class="dcell ${duoSpecial(a) || duoSpecial(b) ? 'sp' : ''}" data-replay="${k}"><b>${esc(DUOS[k].name)}</b><small>${ROSTER[a].name}·${ROSTER[b].name}</small></button>`
        : `<span class="dcell none"><b>?</b><small>${P.owned[a] && P.owned[b] ? `${ROSTER[a].name}·${ROSTER[b].name}` : '???'}</small></span>`;
    }).join('')}</div>`;
  },
  cards: () => {
    const ids = Object.keys(CARDS).filter(id => CHARACTERS[CARDS[id].ch]);
    const rows = ROSTER_IDS.filter(k => CHARACTERS[k]).map(k => {
      const L = ids.filter(id => CARDS[id].ch === k);
      return `<div class="crow"><b style="color:${ROSTER[k].col}">${ROSTER[k].name}</b> <small>본 ${L.filter(id => P.cardsSeen.includes(id)).length}/${L.length} · 쓴 ${L.filter(id => P.cardsUsed.includes(id)).length}</small>
        <span class="cnames">${L.map(id => `<span class="${P.cardsUsed.includes(id) ? 'used' : P.cardsSeen.includes(id) ? 'seen' : 'none'}" title="${P.cardsSeen.includes(id) ? esc(CARDS[id].text.replace(/\{[dbkn]\d\}/g, '…')) : ''}">${P.cardsSeen.includes(id) ? esc(CARDS[id].name) : '?'}</span>`).join('')}</span></div>`;
    }).join('');
    return `<p class="note">${P.cardsSeen.length}/${ids.length}</p>${rows}`;
  },
  foes: () => {
    const ks = Object.keys(FOE).filter(k => !k.startsWith('tut_'));   // 튜토리얼 적은 도감에 없음
    return `<p class="note">만난 적 ${P.foesSeen.length} · 이긴 적 ${P.foesBeaten.length} / ${ks.length}</p><div class="cxfoes">${ks.map(k => {
      const seen = P.foesSeen.includes(k), beat = P.foesBeaten.includes(k);
      const u = foeArt({ key: k });
      return `<span class="cxfoe ${seen ? '' : 'none'} ${beat ? 'beat' : ''}" data-tip="${esc(seen ? `${FOE[k].name} · 체력 ${FOE[k].hp}${beat ? ' · 이김' : ''}` : '아직 못 만난 적')}">${u ? `<img class="px" src="${u}" alt="">` : '<i></i>'}<small>${seen ? esc(FOE[k].name) : '???'}</small></span>`;
    }).join('')}</div>
    <p class="note">속성 ${(P.affixSeen || []).length}/${Object.keys(AFFIX).length}</p>
    <div class="axlist">${Object.entries(AFFIX).map(([k, a]) => { const seen = (P.affixSeen || []).includes(k); return `<div class="axi ${seen ? '' : 'unseen'}" style="--ax:${a.col}"><b>${seen ? a.pre : '???'}</b><p>${seen ? esc(a.text) : ''}</p></div>`; }).join('')}</div>`;
  },
  talks: () => {
    const L = P.talksSeen.slice().sort((a, b) => a - b).filter(i => TALKS[i]);
    return `<p class="note">${L.length}/${TALKS.length}</p>
      <div class="tlist">${L.map(i => `<div class="talk">${TALKS[i].lines.map(([p, t]) => `<p><b style="color:${ROSTER[p]?.col}">${ROSTER[p]?.name || p}</b> ${esc(t)}</p>`).join('')}</div>`).join('') || '<p class="note">아직 없다.</p>'}</div>`;
  },
};

// 기록 (§9)
// 기록: 글 줄 목록 대신 — 위에 큰 숫자 넷(판·이긴 판·가장 빠른 도착·최고의 한 턴), 가운데 달 넷 승수(달 그림), 아래 빠른 조합과 최근 판
export function recordsView() {
  const big = (n, l, cls = '') => `<div class="rbig ${cls}"><b>${n}</b><small>${l}</small></div>`;
  const combos = Object.entries(P.rec.combo).sort((a, b) => a[1] - b[1]).slice(0, 6)
    .map(([k, v]) => `<div class="rcombo"><span class="fcs">${k.split('+').map(id => ROSTER[id] ? `<img class="px" src="${charSrc(id, 'normal')}" alt="${ROSTER[id].name}">` : '').join('')}</span><b>${fmt(v)}</b></div>`).join('');
  const moons = Object.keys(MOONS).map(m => `<div class="rmoon"><img class="px" src="${moonImg(m)}" alt=""><b>${P.rec.moons[m] || 0}</b><small>${MOONS[m].name}</small></div>`).join('');
  return `<div class="epsel recscr">${head()}<h2>기록</h2>
    <div class="rbigs">${big(P.runs, '판')}${big(P.wins, '이긴 판', 'gold')}${big(P.best != null ? fmt(P.best) : '—', '가장 빠른 도착')}${big(P.life.bestTurn, '최고의 한 턴')}</div>
    <div class="rmid">
      <div class="rmoons">${moons}</div>
      <div class="rcombos">${combos ? `<h3 class="sub">빠른 조합</h3>${combos}` : ''}</div>
      ${depthOpen() ? big(`${P.rec.depthBest}/${DEPTH_MAX}`, '밤의 깊이', 'sm') : ''}
    </div>
    ${endlessRecords()}
    ${historyBlock()}</div>`;
}

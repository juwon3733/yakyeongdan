// 본부 · 별 소환 · 소환 결과 · 초심자 ★5 고르기 · 교환소 · 동료 · 도감 · 기록 (docs/05_meta.md, docs/06 「본부」)
import { S } from '../run.js';
import { ROSTER, ROSTER_IDS, byRarity } from '../data/roster.js';
import { CHARACTERS } from '../data/characters.js';
import { SUMMON, STAR_STEPS, EXCHANGE, PICKUP_DAYS } from '../data/gacha.js';
import { CARDS, DUOS, cardData } from '../data/cards.js';
import { RELICS, RELIC_TIER_NAME } from '../data/relics.js';
import { FOE } from '../data/enemies.js';
import { MOONS } from '../data/moons.js';
import { TALKS } from '../data/talks.js';
import { DEPTH, DEPTH_MAX } from '../data/depth.js';
import { P, nextRate5, epNewCount, pickupNow, starsOf, costumeOpen, wearing, packCards, packsOpen, startUp, sigOpen, sigOf, duoSpecial,
  canExchange, exchangePrice, depthOpen, startPickOpen } from '../meta.js';
import { stars, palOf, fmt, esc, cardHTML, charSrc } from './common.js';

const pct = x => `${Math.round(x * 1000) / 10}%`;
const wallet = () => `<span class="wallet"><b>별 조각 ${P.shards}</b> · 별가루 ${P.dust}</span>`;
const head = (back = 'base', label = '본부') => `<div class="bhead"><button type="button" class="mini" data-view="${back}">‹ ${label}</button>${wallet()}</div>`;
const img = (id, alt) => `<img class="px" src="${charSrc(id, 'stand', alt)}" alt="">`;
const starRing = id => duoSpecial(id) ? 'star5' : '';

export function baseView() {
  const own = ROSTER_IDS.filter(k => P.owned[k]);
  const rest3 = own.slice(-3).map((k, i) => `<img class="px rest${i}" src="${charSrc(k)}" alt="${ROSTER[k].name}">`).join('');
  const titles = P.titles.length ? `<p class="note small">칭호 ${P.titles.map(c => `「${esc(ROSTER[c]?.name || c)}의 새벽」`).join(' ')}</p>` : '';
  return `<div class="basescr">
    <div class="hall"><span class="hallwin" aria-hidden="true"></span><div class="resting">${rest3}</div>
      <p class="note">야경단 본부 · 등대 아래. 해가 뜨면 모두 여기서 잠든다.</p></div>
    <div class="bmenu">
      <div class="bhead"><button type="button" class="mini" data-view="title">‹ 타이틀</button>${wallet()}<button type="button" class="mini" data-settings>설정</button></div>
      <button type="button" class="primary ${S.hint === 'summon' ? 'hint' : ''}" data-view="summon">별 소환${P.pick5 ? ' <b class="newt">★5 고르기</b>' : ''}${S.hint === 'summon' ? ' <b class="newt">여기서 10연</b>' : ''}</button>
      <button type="button" data-view="exchange">교환소</button>
      <button type="button" data-view="mates">동료 <small>${own.length}/${ROSTER_IDS.length}</small></button>
      <button type="button" data-view="episodes">에피소드${epNewCount() ? ` <b class="newt">NEW ${epNewCount()}</b>` : ''}</button>
      <button type="button" data-view="codex">도감</button>
      <button type="button" data-view="records">기록</button>
      <button type="button" data-view="party">밤 오르기</button>
      <p class="note small">판 ${P.runs} · 이긴 판 ${P.wins}${P.best != null ? ` · 가장 빠른 도착 ${fmt(P.best)}` : ''}${depthOpen() ? ` · 밤의 깊이 최고 ${P.rec.depthBest}` : ''}</p>
      ${titles}
    </div>
  </div>`;
}

export function summonView() {
  const r5 = nextRate5(), pk = pickupNow();
  const days = Math.max(1, Math.ceil((pk.ends - Date.now()) / 86400000));
  const pickup = `<div class="pickup"><span class="chip" style="color:var(--gold)">픽업 · ${days}일 남음</span>
    <span class="pk5" style="--c:${ROSTER[pk.five].col}">${img(pk.five)}<b>${ROSTER[pk.five].name}</b> ★5</span>
    ${pk.four.map(k => `<span class="pk4" style="--c:${ROSTER[k].col}">${img(k)}${ROSTER[k].name}</span>`).join('')}
    <span class="note small">★5의 ${pct(SUMMON.pickShare5)}가 픽업${P.pickGuar ? ' · <b>다음 ★5는 픽업 확정</b>' : ''}. ${PICKUP_DAYS}일마다 바뀐다.</span></div>`;
  const firstTen = !P.firstTen ? '<p class="note"><b>첫 10연</b>: 노엘·레이븐 중 ★4 동료 1명 확정.</p>' : '';
  const beginner = !P.got5 ? `<p class="note">초심자: 처음 ${SUMMON.beginner}번 안에 ★5 동료 확정, <b>처음 얻는 ★5는 4명 중 직접 고른다</b> (지금 ${P.pulls}번).</p>` : '';
  const choose = P.pick5 ? `<button type="button" class="primary" data-view="pick5">★5 동료 고르기 (${P.pick5})</button>` : '';
  return `<div class="summonscr">
    <div class="ssky" aria-hidden="true"><span class="sstar s1"></span><span class="sstar s2"></span><span class="sstar s3"></span></div>
    <div class="spanel">
      ${head()}
      <h2>별 소환</h2>
      ${pickup}
      <p class="note">★5 없이 ${P.pity5}번 · 다음 ★5 확률 <b>${pct(r5)}</b> (40번째부터 오르고 ${SUMMON.hard}번째 확정). 10연은 ★4 이상 1개 확정. <button type="button" class="mini" data-view="odds">확률 보기</button></p>
      ${firstTen}${beginner}${choose}
      <div class="acts">
        <button type="button" data-summon="1" ${P.shards >= SUMMON.cost ? '' : 'disabled'}>1회 · 별 조각 ${SUMMON.cost}</button>
        <button type="button" class="primary" data-summon="10" ${P.shards >= SUMMON.tenCost ? '' : 'disabled'}>10연 · 별 조각 ${SUMMON.tenCost}</button>
      </div>
      <p class="note small">별 조각은 판을 하면 얻는다. 현금은 쓰지 않는다.</p>
    </div>
  </div>`;
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
    <table class="odds big">
      <tr><th>등급</th><td>나오는 것</td><td>확률</td></tr>
      ${row(5, byRarity(5), `${pct(SUMMON.rate5)} (픽업 ${ROSTER[pk.five].name} ${pct(SUMMON.rate5 * SUMMON.pickShare5)}, 나머지 셋 각 ${pct(SUMMON.rate5 * (1 - SUMMON.pickShare5) / 3)})`)}
      ${row(4, byRarity(4), `동료 ${pct(c4)} (그중 ${pct(SUMMON.pickShare4)}는 픽업 둘 중 하나, 나머지는 ★4 ${n4 + 2}명 중 하나)`)}
      <tr><th>★4</th><td>동료 의상 · 희귀 도구 · 카드 묶음</td><td>${pct(SUMMON.rate4 - c4)} (셋 같은 확률)</td></tr>
      ${row(3, byRarity(3), `동료 ${pct(c3)} (${byRarity(3).length}명 같은 확률)`)}
      <tr><th>★3</th><td>흔한 도구 · 별가루 10 · 휴식 대화 조각</td><td>${pct(1 - SUMMON.rate5 - SUMMON.rate4 - c3)} (셋 같은 확률)</td></tr>
    </table>
    <ul class="note rules">
      <li>${SUMMON.softFrom}번째 뽑기부터 ★5 확률이 매번 +${pct(SUMMON.softStep)}, ★5 없이 ${SUMMON.hard - 1}번이면 ${SUMMON.hard}번째 확정. 횟수는 픽업이 바뀌어도 이어진다.</li>
      <li>10연은 ★4 이상 1개 확정. 첫 10연은 노엘·레이븐 중 1명 확정.</li>
      <li>동료가 나오면 아직 없는 동료가 ${pct(SUMMON.newFirst)} 확률로 먼저 나온다.</li>
      <li>★5를 픽업이 아닌 동료로 받으면 다음 ★5는 픽업 확정.</li>
      <li>처음 ${SUMMON.beginner}번 안에 ★5 확정, 처음 얻는 ★5는 직접 고른다.</li>
      <li>겹친 동료는 별자리 +1 (최대 ${SUMMON.maxStars}), 꽉 차면 별가루 ${SUMMON.dustFullStars}. 열 것이 없는 물건은 별가루로.</li>
    </ul>
  </div>`;
}

// 소환 결과: 별똥(등급 색)이 떨어지고, 누르면 하나씩 펼친다
export function revealView() {
  const R = S.reveal, top = Math.max(...R.list.map(r => r.rarity));
  const items = R.list.map((r, i) => {
    if (!R.open[i]) return `<button type="button" class="drop g${r.rarity}" data-reveal="${i}" style="--d:${i * 60}ms" aria-label="펼치기"><span class="tail"></span><span class="head"></span></button>`;
    if (r.kind === 'choose5') return `<div class="got g5 crack choose" style="--c:var(--gold)"><span class="ico">?</span><span class="nm">★5 동료</span><span class="stars">${stars(5)}</span><span class="tag">직접 고른다</span></div>`;
    if (r.kind === 'char') {
      const c = ROSTER[r.id];
      const tag = r.isNew ? '<b class="new">NEW</b>' : r.stars ? `별자리 ${r.stars}` : `별가루 +${r.dust}`;
      return `<div class="got g${r.rarity} ${r.rarity === 5 ? 'crack' : ''}" style="--c:${c.col}">${img(r.id)}
        <span class="nm">${c.name}</span><span class="stars">${stars(r.rarity)}</span><span class="tag">${tag}</span></div>`;
    }
    // 물건 이름(「…」)을 크게, 종류(흔한 도구·의상 등)는 아래 작게
    const m = /「(.+?)」/.exec(r.text || ''), nm = m ? m[1] : r.name;
    return `<div class="got g${r.rarity} item"><span class="ico">${esc(nm.slice(0, 1))}</span><span class="nm">${esc(nm)}</span><span class="stars">${stars(r.rarity)}</span>
      <span class="tag" title="${esc(r.text || '')}">${r.dust ? (/^별가루/.test(nm) ? '교환소에서 쓴다' : `이미 있음 → 별가루 +${r.dust}`) : esc(m ? r.text.replace(m[0], '').trim() || r.name : r.text || '보관함에')}</span></div>`;
  }).join('');
  const done = R.open.every(Boolean);
  const next = P.pick5 ? '<button type="button" class="primary" data-view="pick5">★5 동료 고르기</button>' : '<button type="button" class="primary" data-view="summon">확인</button>';
  return `<div class="revealscr ${top === 5 && R.open.some((o, i) => o && R.list[i].rarity === 5) ? 'sky5' : ''}">
    <h2>${R.list.length === 10 ? '10연 소환' : '소환'} ${top === 5 ? '· 하늘이 갈라진다' : ''}</h2>
    <div class="drops n${R.list.length}">${items}</div>
    <div class="acts">${done ? next : '<button type="button" data-revealall>모두 넘기기</button>'}</div>
  </div>`;
}

// 초심자 ★5 고르기: 4명 중 하나
export function pick5View() {
  const L = byRarity(5).map(k => {
    const r = ROSTER[k], c = CHARACTERS[k];
    return `<button type="button" class="p5" style="--c:${r.col}" data-choose5="${k}">${img(k)}<b>${r.name}</b><span class="stars">${stars(5)}</span>
      <small>${r.role} · 체력 ${c.maxHp}</small><small class="ps"><b>${esc(c.passive.name)}</b> ${esc(c.passive.text)}</small>${P.owned[k] ? '<small class="dim">가진 동료 · 별자리 +1</small>' : ''}</button>`;
  }).join('');
  return `<div class="epsel">${head('summon', '별 소환')}
    <h2>처음 만나는 ★5 · 한 명을 고른다</h2>
    <p class="note">하늘이 갈라졌다. 누가 내려올지 직접 고르세요.</p>
    <div class="p5row">${L}</div></div>`;
}

// 교환소 (§5): 별가루로 직접 사기
export function exchangeView() {
  const btn = (kind, arg, label) => {
    const price = exchangePrice(kind, arg), ok = canExchange(kind, arg);
    return `<button type="button" class="exb" data-ex="${kind}:${arg ?? ''}" ${ok ? '' : 'disabled'}><span>${label}</span><b>${price ?? '-'}</b></button>`;
  };
  const chars = [5, 4, 3].map(r => `<div class="exrow"><span class="exh">${stars(r)} 동료 · ${EXCHANGE.char[r]}</span>${byRarity(r).map(k =>
    btn('char', k, `${ROSTER[k].name}${P.owned[k] ? ` <small>별자리 ${starsOf(k)}${starsOf(k) >= SUMMON.maxStars ? ' (꽉 참)' : ''}</small>` : ' <small>새로</small>'}`)).join('')}</div>`).join('');
  const own = ROSTER_IDS.filter(k => P.owned[k]);
  const costumes = own.filter(k => !costumeOpen(k)).map(k => btn('costume', k, `${ROSTER[k].name} 두 번째 의상`)).join('') || '<span class="note small">모든 동료의 의상이 열렸다</span>';
  const packs = own.filter(k => CHARACTERS[k] && packsOpen(k) < packCards(k).length).map(k => btn('pack', k, `${ROSTER[k].name} 묶음 ${packsOpen(k) + 1}`)).join('') || '<span class="note small">열 카드 묶음이 없다</span>';
  const relics = Object.keys(RELICS).filter(k => ['c', 'r'].includes(RELICS[k].tier) && !P.startRelics.includes(k))
    .map(k => `<span title="${esc(RELICS[k].text)}">${btn('relic', k, `${RELICS[k].name} <small>${RELIC_TIER_NAME[RELICS[k].tier]}</small>`)}</span>`).join('') || '<span class="note small">모두 열었다</span>';
  return `<div class="epsel">${head()}
    <h2>교환소 <small class="note">별가루로 직접 고른다. 운이 계속 나쁠 때의 안전망.</small></h2>
    ${S.exMsg ? `<p class="exmsg">${esc(S.exMsg)}</p>` : ''}
    ${chars}
    <div class="exrow"><span class="exh">의상 · ${EXCHANGE.costume}</span>${costumes}</div>
    <div class="exrow"><span class="exh">카드 묶음 · ${EXCHANGE.pack}</span>${packs}</div>
    <div class="exrow"><span class="exh">시작 도구 · 흔함 ${EXCHANGE.relic.c} · 희귀 ${EXCHANGE.relic.r}</span>${relics}</div>
    <div class="exrow"><span class="exh">휴식 대화 조각 · ${EXCHANGE.talk}</span>${btn('talk', null, `무작위 대화 하나 (${P.talksSeen.length}/${TALKS.length})`)}</div>
  </div>`;
}

// 동료 화면: 목록 + 고른 동료의 별자리·의상·패시브·카드
export function matesView() {
  const sel = S.mate && P.owned[S.mate] ? S.mate : ROSTER_IDS.find(k => P.owned[k]);
  const grid = ROSTER_IDS.map(k => {
    const r = ROSTER[k], own = !!P.owned[k];
    return `<button type="button" class="mcell r${r.rarity} ${k === sel ? 'on' : ''} ${own ? '' : 'none'} ${starRing(k)}" style="--c:${r.col}" ${own ? `data-mate="${k}"` : 'disabled'} title="${esc(r.name)}">
      ${own ? img(k) : '<span class="sil"></span>'}<span class="nm">${own ? r.name : '?'}</span>${own ? `<span class="st">${'✦'.repeat(starsOf(k))}</span>` : ''}</button>`;
  }).join('');
  return `<div class="matescr">
    <div class="mleft">${head()}<h2>동료</h2><div class="mgrid">${grid}</div></div>
    <div class="mright">${sel ? mateDetail(sel) : ''}</div></div>`;
}
function mateDetail(k) {
  const r = ROSTER[k], c = CHARACTERS[k], s = starsOf(k), st = P.charStats[k] || { runs: 0, wins: 0 };
  const cos = `<div class="cos"><button type="button" class="mini ${!wearing(k) ? 'on' : ''}" data-costume="${k}:0">기본</button>
    <button type="button" class="mini ${wearing(k) ? 'on' : ''}" data-costume="${k}:1" ${costumeOpen(k) ? '' : 'disabled title="별자리 1이나 소환·교환소로 열린다"'}>두 번째 의상</button></div>`;
  const steps = STAR_STEPS.map(x => {
    let extra = '';
    if (x.n === 2) extra = packCards(k).map((pk, i) => `<small class="${i < packsOpen(k) ? '' : 'dim'}">묶음 ${i + 1}: ${pk.map(id => CARDS[id].name).join('·')}${i < packsOpen(k) ? '' : ' (잠김)'}</small>`).join('');
    if (x.n === 3 && c) { const id = c.start.find(cid => cardData(cid).up); if (id) extra = `<small>「${cardData(id).name}」이(가) 강화판으로</small>`; }
    if (x.n === 4) { const sg = sigOf(k); if (sg) extra = `<small>「${RELICS[sg].name}」 ${esc(RELICS[sg].text)}</small>`; }
    return `<li class="${s >= x.n ? 'on' : ''}"><b>${x.n}</b> ${x.text}${extra}</li>`;
  }).join('');
  const start = c ? c.start.map((id, i) => cardHTML(startUp(k) && i === c.start.findIndex(cid => cardData(cid).up) ? id + '+' : id, true, 'none')).join('') : '';
  const pool = c ? Object.keys(CARDS).filter(id => CARDS[id].ch === k && !c.start.includes(id)) : [];
  const locked = new Set(packCards(k).slice(packsOpen(k)).flat());
  return `<div class="mhead ${starRing(k)}" style="--c:${r.col}">${img(k)}<div><h2>${r.name} <span class="stars">${stars(r.rarity)}</span></h2>
      <p class="note">${r.role} · 체력 ${c?.maxHp ?? '-'} · 별자리 ${s}/${SUMMON.maxStars} · 판 ${st.runs} · 이긴 판 ${st.wins}${P.titles.includes(k) ? ` · 칭호 「${r.name}의 새벽」` : ''}</p>
      ${c ? `<p class="ps"><b>${esc(c.passive.name)}</b></p>${(c.passive.lines || [['', '', c.passive.text]]).map(([k, n, t]) => `<p class="ps">${{ trait: '①', keyword: '②', burst: '③' }[k] || ''} ${n ? `<b>「${esc(n)}」</b> ` : ''}${esc(t)}</p>`).join('')}` : ''}${cos}</div></div>
    <ul class="steps">${steps}</ul>
    ${c ? `<h3 class="sub">시작 카드</h3><div class="hand mini">${start}</div>
    <h3 class="sub">보상 카드 ${pool.length - locked.size}/${pool.length}</h3><div class="hand mini scroll">${pool.map(id => locked.has(id) ? `<span class="lockcard" title="카드 묶음이 열리면 나온다">${esc(CARDS[id].name)}<small>잠김</small></span>` : cardHTML(id, true, 'none')).join('')}</div>` : ''}`;
}

// 도감 (§8): 동료 · 듀오 · 카드 · 적 · 휴식 대화
const TABS = [['mates', '동료'], ['duos', '인연 듀오'], ['cards', '카드'], ['foes', '적'], ['talks', '휴식 대화']];
export function codexView() {
  const t = S.codexTab || 'mates';
  const tabs = TABS.map(([k, n]) => `<button type="button" class="mini ${t === k ? 'on' : ''}" data-ctab="${k}">${n}</button>`).join('');
  return `<div class="epsel">${head()}<h2>도감</h2><div class="tabs">${tabs}</div><div class="codex">${CODEX[t]()}</div></div>`;
}
const CODEX = {
  mates: () => `<div class="cgrid">${ROSTER_IDS.map(k => {
    const r = ROSTER[k], own = !!P.owned[k], st = P.charStats[k] || { runs: 0, wins: 0 }, c = CHARACTERS[k];
    return `<div class="centry ${own ? '' : 'none'} ${starRing(k)}" style="--c:${r.col}">${own ? img(k) : '<span class="sil"></span>'}
      <b>${own ? r.name : '???'}</b><small>${stars(r.rarity)} ${own ? r.role : ''}</small>${own && c ? `<small class="dim">${esc(c.ds || '')}</small><small>별자리 ${starsOf(k)} · 판 ${st.runs} · 승 ${st.wins}</small>` : ''}</div>`;
  }).join('')}</div>`,
  duos: () => {
    const ks = Object.keys(DUOS), got = ks.filter(k => P.seenDuos.includes(k)).length;
    return `<p class="note">찾은 인연 듀오 ${got}/${ks.length}. 누르면 컷인을 다시 본다.</p><div class="dgrid">${ks.map(k => {
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
    return `<p class="note">본 카드 ${P.cardsSeen.length} · 쓴 카드 ${P.cardsUsed.length} / ${ids.length}. 굵은 글자는 쓴 카드.</p>${rows}`;
  },
  foes: () => {
    const ks = Object.keys(FOE).filter(k => !k.startsWith('tut_'));   // 튜토리얼 적은 도감에 없음
    return `<p class="note">만난 적 ${P.foesSeen.length} · 이긴 적 ${P.foesBeaten.length} / ${ks.length}</p><div class="cgrid foesg">${ks.map(k => {
      const seen = P.foesSeen.includes(k), beat = P.foesBeaten.includes(k);
      return `<div class="centry ${seen ? '' : 'none'}"><b>${seen ? esc(FOE[k].name) : '???'}</b><small>${seen ? `체력 ${FOE[k].hp}${beat ? ' · 이김' : ''}` : ''}</small></div>`;
    }).join('')}</div>`;
  },
  talks: () => {
    const L = P.talksSeen.slice().sort((a, b) => a - b).filter(i => TALKS[i]);
    return `<p class="note">본 휴식 대화 ${L.length}/${TALKS.length}. 휴식 칸·에피소드 2화·「휴식 대화 조각」으로 열린다.</p>
      <div class="tlist">${L.map(i => `<div class="talk">${TALKS[i].lines.map(([p, t]) => `<p><b style="color:${ROSTER[p]?.col}">${ROSTER[p]?.name || p}</b> ${esc(t)}</p>`).join('')}</div>`).join('') || '<p class="note">아직 없다.</p>'}</div>`;
  },
};

// 기록 (§9)
export function recordsView() {
  const combos = Object.entries(P.rec.combo).sort((a, b) => a[1] - b[1]).slice(0, 12)
    .map(([k, v]) => `<tr><td>${k.split('+').map(id => ROSTER[id]?.name || id).join(' · ')}</td><td>${fmt(v)}</td></tr>`).join('') || '<tr><td class="note">아직 이긴 판이 없다</td><td></td></tr>';
  const moons = Object.keys(MOONS).map(m => `<tr><td>${MOONS[m].name}</td><td>${P.rec.moons[m] || 0}승</td></tr>`).join('');
  const depth = depthOpen()
    ? `<p class="note">최고 단계 <b>${P.rec.depthBest}</b> / ${DEPTH_MAX}. 다음 단계: ${P.rec.depthBest < DEPTH_MAX ? esc(DEPTH[P.rec.depthBest + 1].text) : '다 깼다'}</p>`
    : '<p class="note">「새벽」을 한 번 이기면 밤 오르기에서 고를 수 있다.</p>';
  return `<div class="epsel">${head()}<h2>기록</h2>
    <div class="recs">
      <div><h3 class="sub">조합별 가장 빠른 도착</h3><table class="odds big">${combos}</table></div>
      <div><h3 class="sub">달별 승리</h3><table class="odds big">${moons}</table>
        <h3 class="sub">밤의 깊이</h3>${depth}
        <p class="note small">판 ${P.runs} · 이긴 판 ${P.wins}${P.best != null ? ` · 가장 빠른 도착 ${fmt(P.best)}` : ''}${startPickOpen() ? '' : ' · 첫 판을 끝내면 시작 도구 고르기가 열린다'}</p></div>
    </div></div>`;
}

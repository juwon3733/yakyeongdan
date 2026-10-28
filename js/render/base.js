// 본부 · 별 소환 · 소환 결과 (docs/05_meta.md, docs/06_art_ui_sound.md 「본부」)
import { S } from '../run.js';
import { ROSTER, ROSTER_IDS } from '../data/roster.js';
import { SUMMON } from '../data/gacha.js';
import { P, nextRate5 } from '../meta.js';
import { sprite } from './sprites.js';
import { stars, palOf, fmt } from './common.js';

const pct = x => `${Math.round(x * 1000) / 10}%`;
const wallet = () => `<span class="wallet"><b>별 조각 ${P.shards}</b> · 별가루 ${P.dust}</span>`;

export function baseView() {
  const own = ROSTER_IDS.filter(k => P.owned[k]);
  const rest3 = own.slice(0, 3).map((k, i) => `<img class="px rest${i}" src="${sprite(palOf(k), ROSTER[k].long)}" alt="${ROSTER[k].name}">`).join('');
  const soon = (t) => `<button type="button" disabled title="M5에서">${t} <small>준비 중</small></button>`;
  return `<div class="basescr">
    <div class="hall"><span class="hallwin" aria-hidden="true"></span><div class="resting">${rest3}</div>
      <p class="note">야경단 본부 · 등대 아래. 해가 뜨면 모두 여기서 잠든다.</p></div>
    <div class="bmenu">
      <div class="bhead"><button type="button" class="mini" data-view="title">‹ 타이틀</button>${wallet()}</div>
      <button type="button" class="primary" data-view="summon">별 소환</button>
      ${soon('교환소')}${soon('동료')}${soon('에피소드')}${soon('도감')}
      <button type="button" data-view="party">밤 오르기</button>
      <p class="note small">동료 ${own.length}/${ROSTER_IDS.length} · 판 ${P.runs} · 이긴 판 ${P.wins}${P.best != null ? ` · 가장 빠른 도착 ${fmt(P.best)}` : ''}</p>
    </div>
  </div>`;
}

export function summonView() {
  const r5 = nextRate5();
  const odds = `<table class="odds"><tr><th>★5</th><td>${pct(SUMMON.rate5)}</td><td>동료 (시온·루나리아·아카네·엘레오노르)</td></tr>
    <tr><th>★4</th><td>${pct(SUMMON.rate4)}</td><td>절반 ★4 동료, 절반 의상·희귀 도구·카드 묶음</td></tr>
    <tr><th>★3</th><td>${pct(1 - SUMMON.rate5 - SUMMON.rate4)}</td><td>${pct(SUMMON.char3Share)} ★3 동료, 나머지 흔한 도구·별가루·대화 조각</td></tr></table>`;
  const firstTen = !P.firstTen ? '<p class="note"><b>첫 10연</b>: 노엘·레이븐 중 ★4 동료 1명 확정.</p>' : '';
  const beginner = !P.got5 ? `<p class="note">초심자: 처음 ${SUMMON.beginner}번 안에 ★5 동료 확정 (지금 ${P.pulls}번).</p>` : '';
  return `<div class="summonscr">
    <div class="ssky" aria-hidden="true"><span class="sstar s1"></span><span class="sstar s2"></span><span class="sstar s3"></span></div>
    <div class="spanel">
      <div class="bhead"><button type="button" class="mini" data-view="base">‹ 본부</button>${wallet()}</div>
      <h2>별 소환</h2>
      ${odds}
      <p class="note">★5 없이 ${P.pity5}번 · 다음 ★5 확률 <b>${pct(r5)}</b> (40번째부터 오르고 ${SUMMON.hard}번째 확정). 10연은 ★4 이상 1개 확정. 아직 없는 동료가 먼저 나온다(${pct(SUMMON.newFirst)}).</p>
      ${firstTen}${beginner}
      <div class="acts">
        <button type="button" data-summon="1" ${P.shards >= SUMMON.cost ? '' : 'disabled'}>1회 · 별 조각 ${SUMMON.cost}</button>
        <button type="button" class="primary" data-summon="10" ${P.shards >= SUMMON.tenCost ? '' : 'disabled'}>10연 · 별 조각 ${SUMMON.tenCost}</button>
      </div>
      <p class="note small">별 조각은 판을 하면 얻는다. 현금은 쓰지 않는다.</p>
    </div>
  </div>`;
}

// 소환 결과: 별똥(등급 색)이 떨어지고, 누르면 하나씩 펼친다
export function revealView() {
  const R = S.reveal, top = Math.max(...R.list.map(r => r.rarity));
  const items = R.list.map((r, i) => {
    if (!R.open[i]) return `<button type="button" class="drop g${r.rarity}" data-reveal="${i}" style="--d:${i * 60}ms" aria-label="펼치기"><span class="tail"></span><span class="head"></span></button>`;
    if (r.kind === 'char') {
      const c = ROSTER[r.id];
      const tag = r.isNew ? '<b class="new">NEW</b>' : r.stars ? `별자리 ${r.stars}` : `별가루 +${r.dust}`;
      return `<div class="got g${r.rarity} ${r.rarity === 5 ? 'crack' : ''}" style="--c:${c.col}"><img class="px" src="${sprite(palOf(r.id), c.long)}" alt="">
        <span class="nm">${c.name}</span><span class="stars">${stars(r.rarity)}</span><span class="tag">${tag}</span></div>`;
    }
    return `<div class="got g${r.rarity} item"><span class="ico">${r.name.slice(0, 1)}</span><span class="nm">${r.name}</span><span class="stars">${stars(r.rarity)}</span>
      <span class="tag">${r.dust ? `별가루 +${r.dust}` : '보관함에'}</span></div>`;
  }).join('');
  const done = R.open.every(Boolean);
  return `<div class="revealscr ${top === 5 && R.open.some((o, i) => o && R.list[i].rarity === 5) ? 'sky5' : ''}">
    <h2>${R.list.length === 10 ? '10연 소환' : '소환'} ${top === 5 ? '· 하늘이 갈라진다' : ''}</h2>
    <div class="drops n${R.list.length}">${items}</div>
    <div class="acts">${done ? '<button type="button" class="primary" data-view="summon">확인</button>' : '<button type="button" data-revealall>모두 넘기기</button>'}</div>
  </div>`;
}

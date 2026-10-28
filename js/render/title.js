import { S } from '../run.js';
import { CHARACTERS } from '../data/characters.js';
import { ROSTER, ROSTER_IDS } from '../data/roster.js';
import { DUOS, duoKey } from '../data/cards.js';
import { P, owns, duoSpecial, depthOpen, depthMax, startPickOpen, startRelicChoices } from '../meta.js';
import { RELICS } from '../data/relics.js';
import { DEPTH } from '../data/depth.js';
import { sprite } from './sprites.js';
import { stars, palOf, esc } from './common.js';

// 타이틀: 키아트 자리(그림 없으면 밤하늘·탑) + 왼쪽 아래 메뉴
export function titleView() {
  const three = ['iris', 'brick', 'marta'].map(k => `<img class="px" src="${sprite(palOf(k), ROSTER[k].long)}" alt="">`).join('');
  return `<div class="titlescr">
    <div class="sky" aria-hidden="true"><span class="tower"></span><span class="moonbig"></span></div>
    <div class="trio" aria-hidden="true">${three}</div>
    <div class="tmenu">
      <h1>야경단</h1>
      <p class="note">0시에 솟는 탑을 <b>6시 해 뜨기 전에</b> 오른다</p>
      <button type="button" class="primary" data-view="party">밤 오르기</button>
      <button type="button" data-view="base">본부</button>
      <button type="button" data-settings>설정</button>
      <span class="note small">별 조각 <b>${P.shards}</b> · 동료 ${Object.keys(P.owned).length}/${ROSTER_IDS.length}${S.dev ? ' · <span class="dev">개발판</span>' : ''}</span>
    </div>
  </div>`;
}

// 고른 동료 사이 인연 (듀오가 있는 짝). 찾은 듀오는 금색.
function bondsOf(picked) {
  const out = [];
  for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) {
    const k = duoKey(picked[i], picked[j]), d = DUOS[k]; if (!d) continue;
    const seen = P.seenDuos?.includes(k);
    out.push(`<span class="bond ${seen ? 'seen' : ''}" title="${esc(seen ? d.text.replace(/\{[dbkn]\d\}/g, '…') : '아직 못 찾은 듀오')}">${ROSTER[picked[i]].name}<i>━</i>${ROSTER[picked[j]].name} 「${seen ? esc(d.name) : '?'}」</span>`);
  }
  return picked.length > 1 ? `<div class="bonds"><span class="note small">인연</span>${out.join('') || '<span class="note small">이 셋 사이엔 인연이 없다 (연계만 찬다)</span>'}</div>` : '';
}

// 밤의 깊이(「새벽」을 한 번 이기면) · 시작 도구 고르기(판을 한 번 끝내면)
function runSetup() {
  let out = '';
  if (depthOpen()) {
    const d = Math.min(S.depth || 0, depthMax());
    out += `<div class="setup"><span class="note small">밤의 깊이</span><span class="depthsel">${Array.from({ length: depthMax() + 1 }, (_, n) =>
      `<button type="button" class="mini ${n === d ? 'on' : ''}" data-depth="${n}" title="${n ? esc(DEPTH.slice(1, n + 1).map(x => x.text).join(' / ')) : '보통'}">${n}</button>`).join('')}</span>
      ${d ? `<span class="note small">${esc(DEPTH[d].text)}${d > 1 ? ` 외 ${d - 1}개` : ''}</span>` : ''}</div>`;
  }
  if (startPickOpen()) {
    const L = startRelicChoices(), cur = L.includes(S.startRelic) ? S.startRelic : L[0];
    out += `<div class="setup"><span class="note small">시작 도구</span><span class="srsel">${L.map(k =>
      `<button type="button" class="mini ${k === cur ? 'on' : ''}" data-srelic="${k}" title="${esc(RELICS[k].text)}">${esc(RELICS[k].name)}</button>`).join('')}</span></div>`;
  }
  return out;
}

// 파티 고르기: 가진 동료만 (개발판은 구현된 동료 전부). 아직 구현 안 된 동료는 「준비 중」.
export function partyView() {
  const can = k => !!CHARACTERS[k] && (S.dev || owns(k));
  const mates = ROSTER_IDS.filter(k => owns(k) || (S.dev && CHARACTERS[k])).map(k => {
    const r = ROSTER[k], c = CHARACTERS[k], on = S.picked.includes(k), ok = can(k);
    return `<button type="button" class="mate r${r.rarity} ${on ? 'on' : ''} ${ok ? '' : 'locked'} ${duoSpecial(k) ? 'star5' : ''}" style="--c:${r.col}" ${ok ? `data-pick="${k}" aria-pressed="${on}"` : 'disabled'} title="${c ? esc(`${c.passive.name}: ${c.passive.text}`) : ''}">
      <img class="px" src="${sprite(palOf(k), r.long)}" alt=""><span class="tx"><span class="nm">${r.name}</span> <span class="stars">${stars(r.rarity)}</span>
      <span class="rl">${r.role}${c ? ` · 체력 ${c.maxHp}` : ''}</span>
      <span class="ps">${c ? `<b>${c.passive.name}</b> ${c.passive.text}` : '준비 중 (다음 업데이트에서 싸울 수 있다)'}</span></span></button>`;
  }).join('');
  const chosen = [0, 1, 2].map(i => {
    const k = S.picked[i], r = k && ROSTER[k];
    return r ? `<span class="chosen" style="--c:${r.col}"><img class="px" src="${sprite(palOf(k), r.long)}" alt=""><span>${r.name}</span></span>` : '<span class="chosen empty">?</span>';
  }).join('');
  return `<div class="title">
    <div class="tleft">
      <div class="thead"><button type="button" class="mini" data-view="title">‹ 타이틀</button><h2>동료 셋을 고른다</h2>${S.dev ? '<span class="dev">개발판: 구현된 동료 전부</span>' : ''}</div>
      <div class="pick">${mates}</div>
    </div>
    <div class="tright">
      <h2>동료 셋 (${S.picked.length}/3)</h2>
      <div class="chosenrow">${chosen}</div>
      ${runSetup()}
      <button type="button" class="primary go" data-start ${S.picked.length === 3 ? '' : 'disabled'}>출발</button>
      ${bondsOf(S.picked)}
      ${S.picked.length ? `<div class="chosenps">${S.picked.map(k => { const r = ROSTER[k], c = CHARACTERS[k]; return c ? `<span style="--c:${r.col}"><b>${r.name} · ${esc(c.passive.name)}</b> ${esc(c.passive.text)}</span>` : ''; }).join('')}</div>` : ''}
      <p class="note">대열은 지도에서 바꿀 수 있다. 처음엔 체력이 높은 동료가 앞에 선다.</p>
      <p class="note small"><b>연계</b>: 서로 다른 동료 카드를 번갈아 쓰면 칸이 차고 공격이 세진다. 2칸 이상에서 인연 있는 둘을 이어 쓰면 <b>듀오 카드</b>.</p>
    </div>
  </div>`;
}

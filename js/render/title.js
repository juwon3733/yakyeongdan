import { S } from '../run.js';
import { CHARACTERS } from '../data/characters.js';
import { ROSTER, ROSTER_IDS } from '../data/roster.js';
import { DUOS, duoKey } from '../data/cards.js';
import { P, owns, duoSpecial, depthOpen, depthMax, startPickOpen, startRelicChoices } from '../meta.js';
import { RELICS } from '../data/relics.js';
import { DEPTH } from '../data/depth.js';
import { stars, palOf, esc, charSrc } from './common.js';
import { artURL } from '../art.js';
import { ENDLESS } from '../data/endless.js';

// 타이틀: 키아트 그림(title/key.png)이 있으면 그림, 없으면 살아 있는 밤 항구(별·달·탑 꼭대기 빛·등불·파도·동료 셋 실루엣)
const rnd = (n => () => (n = (n * 1103515245 + 12345) >>> 0) / 4294967296)(7);
const STARS = Array.from({ length: 46 }, () => [rnd() * 100, rnd() * 58, rnd() < .2 ? 2 : 1, Math.floor(rnd() * 8)]);
const LAMPS = [[40, 0], [46, 1], [53, 2], [61, 0], [68, 1], [90, 2], [96, 0]];
export function titleView() {
  const key = artURL('title/key_px.png') || artURL('title/key.png');   // 도트 키아트가 들어오면 그걸 먼저
  const three = ['iris', 'brick', 'marta'].map((k, i) => `<img class="px sil s${i}" src="${charSrc(k)}" alt="">`).join('');
  const scene = key ? `<img class="keyart" src="${key}" alt="">` : `<div class="harbor" aria-hidden="true">
      ${STARS.map(([x, y, z, d]) => `<i class="tw d${d}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${z}px;height:${z}px"></i>`).join('')}
      <span class="moonbig"></span>
      <span class="tower"><span class="beam"></span><span class="lamp"></span></span>
      <span class="town"></span>
      ${LAMPS.map(([x, d]) => `<i class="lantern d${d}" style="left:${x}%"></i>`).join('')}
      <span class="sea"><span class="wave w1"></span><span class="wave w2"></span></span>
      <div class="trio">${three}</div>
    </div>`;
  const first = !P.runs;
  return `<div class="titlescr ${key ? 'hasart' : ''}">
    ${scene}
    <div class="tmenu">
      <h1><span>야</span><span>경</span><span>단</span></h1>
      <p class="note">0시에 솟는 탑을 <b>6시 해 뜨기 전에</b> 오른다</p>
      <button type="button" class="primary ${first ? 'firstgo' : ''}" data-view="base">시작</button>
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
      <img class="px" src="${charSrc(k)}" alt=""><span class="tx"><span class="nm">${r.name}</span> <span class="stars">${stars(r.rarity)}</span>
      <span class="rl">${r.role}${c ? ` · 체력 ${c.maxHp}` : ''}</span>
      <span class="ps" ${c ? `title="${c.passive.name}: ${c.passive.text}"` : ''}>${c ? `<b>${c.passive.name}</b> ${c.passive.short}` : '준비 중 (다음 업데이트에서 싸울 수 있다)'}</span></span></button>`;
  }).join('');
  // 고른 셋: 전투처럼 대열로 크게 선다(왼쪽 뒤 → 오른쪽 앞, 처음엔 체력이 높은 동료가 앞). 인연이 있는 동료는 빛난다.
  const bonded = new Set();
  S.picked.forEach(a => S.picked.forEach(b => { if (a !== b && DUOS[duoKey(a, b)]) { bonded.add(a); bonded.add(b); } }));
  const order = S.picked.slice().sort((a, b) => (CHARACTERS[a]?.maxHp || 0) - (CHARACTERS[b]?.maxHp || 0));
  const slots = ['뒤', '가운데', '앞'];
  const chosen = [0, 1, 2].map(i => {
    const k = order[i - (3 - order.length)], r = k && ROSTER[k];
    return r ? `<span class="chosen r${r.rarity} ${bonded.has(k) ? 'bonded' : ''} ${duoSpecial(k) ? 'star5' : ''}" style="--c:${r.col}"><small>${slots[i]}</small><img class="px" src="${charSrc(k)}" alt=""><span>${r.name} <i class="stars">${stars(r.rarity)}</i></span></span>`
      : `<span class="chosen empty"><small>${slots[i]}</small>?</span>`;
  }).join('');
  return `<div class="title partyscr">
    <div class="tleft">
      <div class="thead"><button type="button" class="mini" data-view="base">‹ 본부</button><h2>${S.mode === 'endless' ? '끝없는 탑 · 동료 셋' : '동료 셋을 고른다'}</h2>${S.dev ? '<span class="dev">개발판: 구현된 동료 전부</span>' : ''}</div>
      <div class="pick">${mates}</div>
    </div>
    <div class="tright">
      <h2>동료 셋 (${S.picked.length}/3)</h2>
      <div class="chosenrow formation">${chosen}</div>
      ${S.mode === 'endless' ? `<p class="note endnote">끝없는 탑에 바로 오른다. 동료마다 희귀 카드 1장 · 도구 ${ENDLESS.freshRelics}개 · 별빛 ${ENDLESS.freshGold}을 들고 시작. 탑은 무너지지 않지만 층마다 적이 강해지고 규칙이 쌓인다.</p>` : runSetup()}
      <button type="button" class="primary go" data-start ${S.picked.length === 3 ? '' : 'disabled'}>${S.mode === 'endless' ? '끝없는 탑 오르기' : '출발'}</button>
      ${bondsOf(S.picked)}
      ${S.picked.length ? `<div class="chosenps">${S.picked.map(k => { const r = ROSTER[k], c = CHARACTERS[k]; return c ? `<span style="--c:${r.col}"><b>${r.name} · ${esc(c.passive.name)}</b> ${esc(c.passive.text)}</span>` : ''; }).join('')}</div>` : ''}
      <p class="note">대열은 지도에서 바꿀 수 있다. 처음엔 체력이 높은 동료가 앞에 선다.</p>
      <p class="note small"><b>연계</b>: 서로 다른 동료 카드를 번갈아 쓰면 칸이 차고 공격이 세진다. 2칸 이상에서 인연 있는 둘을 이어 쓰면 <b>듀오 카드</b>.</p>
    </div>
  </div>`;
}

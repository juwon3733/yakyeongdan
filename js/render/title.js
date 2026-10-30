import { S } from '../run.js';
import { CHARACTERS } from '../data/characters.js';
import { ROSTER, ROSTER_IDS, ROLE_KIND, ROLE_KINDS } from '../data/roster.js';
import { DUOS, duoKey } from '../data/cards.js';
import { P, owns, duoSpecial, depthOpen, depthMax, startPickOpen, startRelicChoices } from '../meta.js';
import { RELICS } from '../data/relics.js';
import { DEPTH } from '../data/depth.js';
import { stars, palOf, esc, charSrc } from './common.js';
import { artURL, battleArt } from '../art.js';
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
      <h1>${artURL('ui/logo.png') ? `<img class="px tlogo" src="${artURL('ui/logo.png')}" alt="야경단">` : '<span>야</span><span>경</span><span>단</span>'}</h1>
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

// 역할 아이콘: 8×8 도트 (공격 칼 · 방어 방패 · 회복 십자 · 지원 별)
const ROLE_DOTS = {
  atk: ['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.##...', '#...#...'],
  def: ['.######.', '########', '##.##.##', '########', '.######.', '.######.', '..####..', '...##...'],
  heal: ['..####..', '..####..', '########', '########', '########', '########', '..####..', '..####..'],
  sup: ['...##...', '...##...', '.######.', '########', '.######.', '..####..', '.##..##.', '.#....#.'],
};
const ROLE_COL = { atk: '#ef6352', def: '#7ab0d8', heal: '#7ad08a', sup: '#e0b84a' };
const roleIcon = Object.fromEntries(Object.entries(ROLE_DOTS).map(([k, rows]) => {
  const r = rows.flatMap((row, y) => [...row].map((ch, x) => ch === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '')).join('');
  return [k, `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="${ROLE_COL[k]}">${r}</svg>`)}`];
}));

// 파티 무대: 고른 셋이 전투 스프라이트로 대열대로(뒤·가운데·앞) 선다. 새로 고른 동료는 빛 기둥과 함께, 뺀 동료는 흐려지며 사라진다.
let lastStage = [];   // 바로 전에 그린 무대 [뒤, 가운데, 앞] — 다시 그릴 때 누가 들어오고 나갔는지 본다
function partyStage(order, bonded) {
  const slots = ['뒤', '가운데', '앞'];
  const now = [0, 1, 2].map(i => order[i - (3 - order.length)] || null);
  const html = now.map((k, i) => {
    const was = lastStage[i], gone = was && was !== k && !now.includes(was) ? was : null;
    const ghost = gone ? `<img class="px spr ghost" src="${battleArt(gone, 'idle') || charSrc(gone)}" alt="">` : '';
    if (!k) return `<div class="pslot empty s${i}"><span class="spot">?</span>${ghost}<span class="plate" aria-hidden="true"><i class="rk"></i></span><small class="pos">${slots[i]}</small></div>`;
    const r = ROSTER[k], kind = ROLE_KIND[k] || 'sup', fresh = !lastStage.includes(k);
    return `<div class="pslot s${i} r${r.rarity} ${fresh ? 'in' : ''} ${bonded.has(k) ? 'bonded' : ''}" style="--c:${r.col}">
      ${fresh ? '<span class="beam" aria-hidden="true"></span>' : ''}${ghost}<img class="px spr" src="${battleArt(k, 'idle') || charSrc(k)}" alt="">
      <span class="plate" data-tip="${esc(CHARACTERS[k] ? `${CHARACTERS[k].passive.name}: ${CHARACTERS[k].passive.text}` : r.role)}"><img class="rk" src="${roleIcon[kind]}" alt="${ROLE_KINDS[kind]}" title="${ROLE_KINDS[kind]}">${r.name}</span><small class="pos">${slots[i]}</small></div>`;
  }).join('');
  lastStage = now;
  return `<div class="pstage">${html}</div>`;
}

// 파티 고르기: 가진 동료만 (개발판은 구현된 동료 전부). 아직 구현 안 된 동료는 「준비 중」.
export function partyView() {
  // 출격 준비: 정보 상자를 격자로 늘어놓은 화면 대신 — 가운데 무대에 고른 셋이 크게 서고, 아래 줄에 동료 얼굴을 한 줄로.
  // 동료 설명(패시브)은 얼굴에 커서를 대면(data-tip), 고른 셋의 것은 무대 아래에 한 줄씩.
  const can = k => !!CHARACTERS[k] && (S.dev || owns(k));
  const mates = ROSTER_IDS.filter(k => owns(k) || (S.dev && CHARACTERS[k])).map(k => {
    const r = ROSTER[k], c = CHARACTERS[k], on = S.picked.includes(k), ok = can(k);
    const tip = c ? `${r.name} ${'★'.repeat(r.rarity)} · ${r.role} · 체력 ${c.maxHp}\n${c.passive.name}: ${c.passive.text}` : `${r.name} · 준비 중`;
    return `<button type="button" class="mate r${r.rarity} ${on ? 'on' : ''} ${ok ? '' : 'locked'} ${duoSpecial(k) ? 'star5' : ''}" style="--c:${r.col}" ${ok ? `data-pick="${k}" aria-pressed="${on}"` : 'disabled'} data-tip="${esc(tip)}" aria-label="${r.name}">
      <span class="fc"><img class="px" src="${charSrc(k, 'normal')}" alt=""></span><span class="nm">${r.name}</span></button>`;
  }).join('');
  const bonded = new Set();
  S.picked.forEach(a => S.picked.forEach(b => { if (a !== b && DUOS[duoKey(a, b)]) { bonded.add(a); bonded.add(b); } }));
  const order = S.picked.slice().sort((a, b) => (CHARACTERS[a]?.maxHp || 0) - (CHARACTERS[b]?.maxHp || 0));
  // 패시브 글은 이름표에 커서를 대면(무대 아래 글 벽은 뺐다)
  const ps = S.picked.length ? '' : '<p class="note pempty">아래에서 동료 셋을 고른다. 처음엔 체력이 높은 동료가 앞에 선다.</p>';
  return `<div class="title partyscr p2">
    <div class="thead"><button type="button" class="mini" data-view="base">‹ 본부</button><h2>${S.mode === 'endless' ? '끝없는 탑' : '출격 준비'}</h2>${S.dev ? '<span class="dev">개발판</span>' : ''}</div>
    <div class="pmain">
      ${partyStage(order, bonded)}
      ${ps}
    </div>
    <div class="pside">
      ${S.mode === 'endless' ? `<p class="note endnote">동료마다 레전더리 카드 1장 · 도구 ${ENDLESS.freshRelics}개 · 별빛 ${ENDLESS.freshGold}을 들고 시작. 층마다 적이 강해지고 규칙이 쌓인다.</p>` : runSetup()}
      ${bondsOf(S.picked)}
      <button type="button" class="primary go" data-start ${S.picked.length === 3 ? '' : 'disabled'}>${S.mode === 'endless' ? '오르기' : '출발'} <small>${S.picked.length}/3</small></button>
    </div>
    <div class="pick">${mates}</div>
  </div>`;
}

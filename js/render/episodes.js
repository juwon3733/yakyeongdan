// 에피소드 목록 · 에피소드 재생 화면 (docs/06_art_ui_sound.md 「에피소드」): 배경 전면 + 상반신 좌우 + 아래 대화창
import { S } from '../run.js';
import { P, epOpen, epKey } from '../meta.js';
import { epLine, epFight } from '../episodes.js';
import { EPISODES, BOND_SCENES, EP_COND, EP_REWARD, EP_EXTRA, CAST, EP_BG } from '../data/episodes.js';
import { ROSTER } from '../data/roster.js';
import { CHARACTERS } from '../data/characters.js';
import { FOE } from '../data/enemies.js';
import { sprite } from './sprites.js';
import { esc, palOf, charSrc } from './common.js';

// 말하는 사람 (명단 → 조연 → 이름만)
export function who(id) {
  const r = ROSTER[id] || CAST[id];
  if (!r) return { name: id, col: '#9a97bb', img: '' };
  if (ROSTER[id]) return { name: r.name, col: r.col, img: charSrc(id, 'normal') };
  const pal = r.pal || palOf(id), long = r.long ?? CHARACTERS[id]?.long;
  return { name: r.name, col: r.col, img: pal ? sprite(pal, long) : '' };
}
const condText = (cid, n) => {
  const c = EP_COND[n], g = P.epProg[cid];
  return n === 0 ? `${c.text} (${Math.min(1, g?.runs || 0)}/1)` : c.text;
};

export function episodesView() {
  // 안 본 화가 있는 동료 → 가진 동료 → 아직 없는 동료 순 (원래 순서 안에서)
  const rank = cid => EPISODES[cid].some((_, n) => epOpen(cid, n) && !P.epSeen[epKey(cid, n)]) ? 0 : P.owned[cid] ? 1 : 2;
  const ids = Object.keys(EPISODES).map((k, i) => [k, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(x => x[0]);
  const rows = ids.map(cid => {
    const w = who(cid), owned = !!P.owned[cid];
    const eps = EPISODES[cid].map((ep, n) => {
      const open = epOpen(cid, n), seen = !!P.epSeen[epKey(cid, n)];
      if (!open) return `<button type="button" class="epslot lock" disabled title="${esc(condText(cid, n))}"><b>${n + 1}화</b><small>${esc(condText(cid, n))}</small></button>`;
      return `<button type="button" class="epslot ${seen ? 'seen' : 'new'}" data-ep="${cid}:${n}"><b>${n + 1}화 · ${esc(ep.title)}</b>
        <small>${seen ? '다시 보기' : `<span class="newt">NEW</span> 처음 보면 별 조각 +${EP_REWARD[n]}`}</small></button>`;
    }).join('');
    return `<div class="eprow ${owned ? '' : 'notown'}" style="--c:${w.col}">
      <span class="face"><img class="px" src="${w.img}" alt=""></span><span class="nm">${esc(w.name)}${owned ? '' : '<small>아직 없는 동료</small>'}</span>${eps}</div>`;
  }).join('');
  const bonds = P.bondOpen.length ? P.bondOpen.map(k => {
    const b = BOND_SCENES[k]; if (!b) return '';
    const [a, c] = k.split('+'), seen = P.bondSeen.includes(k);
    return `<button type="button" class="epslot bond ${seen ? 'seen' : 'new'}" data-bond="${k}"><b>${esc(who(a).name)} · ${esc(who(c).name)}</b><small>${esc(b.title)}${seen ? '' : ' <span class="newt">NEW</span>'}</small></button>`;
  }).join('') : '<p class="note">인연 듀오를 처음 쓴 판이 끝나면 두 사람의 짧은 장면이 열린다.</p>';
  return `<div class="epsel">
    <div class="bhead"><button type="button" class="mini" data-view="base">‹ 본부</button><span class="wallet"><b>별 조각 ${P.shards}</b></span></div>
    <h2>에피소드</h2>
    <p class="note small">그 동료를 데리고 판을 하면 열린다. 1화: 판 1번 끝내기 · 2화: 2막 보스 격파 · 3화: 「새벽」 격파</p>
    <div class="eplist">${rows}</div>
    <h2>인연 장면</h2>
    <div class="bondlist">${bonds}</div>
    <p class="note small">나머지 동료의 에피소드는 준비 중.</p>
  </div>`;
}

// 재생 화면
export function epView() {
  const E = S.ep, line = epLine();
  const fig = (id, side) => {
    if (!id) return '';
    const w = who(id), on = line && line[0] === id;
    return `<div class="epfig ${side} ${on ? 'on' : ''}" style="--c:${w.col}">${w.img ? `<img class="px" src="${w.img}" alt="${esc(w.name)}">` : ''}</div>`;
  };
  const head = E.kind === 'ep' ? `${esc(who(E.cid).name)} 에피소드 ${E.n + 1}화 · ${esc(E.title)}` : `인연 장면 · ${esc(E.title)}`;
  let box;
  if (E.phase === 'read' && line) {
    const [id, text] = line, w = id ? who(id) : null;
    box = `<button type="button" class="epbox ${id ? '' : 'narr'}" data-epnext>${w ? `<span class="who" style="color:${w.col}">${esc(w.name)}</span>` : ''}
      <span class="tx">${esc(text)}</span><span class="more" aria-hidden="true">▼</span></button>`;
  } else if (E.phase === 'fight') {
    const f = epFight(), foes = f.foes.map(k => FOE[k]?.name || k).join(' · '), party = f.party.map(k => who(k).name).join(' · ');
    box = `<div class="epbox act"><span class="who" style="color:var(--rose)">특별 전투</span>
      <span class="tx">${esc(party)} ↔ ${esc(foes)}</span>
      <span class="btns"><button type="button" class="primary" data-epfight>싸운다</button></span></div>`;
  } else if (E.phase === 'lost') {
    box = `<div class="epbox act"><span class="tx">${esc(E.lose)}</span>
      <span class="btns"><button type="button" class="primary" data-epfight>다시 싸우기</button><button type="button" data-epskipfight>이야기만 이어 보기</button></span></div>`;
  } else {
    const extra = E.extra?.length ? ` · ${E.extra.join(' · ')}` : '';
    box = `<div class="epbox act"><span class="who" style="color:var(--gold)">끝</span>
      <span class="tx">${E.reward ? `처음 다 봤다. 별 조각 +${E.reward}${esc(extra)}` : '다시 본 이야기.'}</span>
      <span class="btns"><button type="button" class="primary" data-view="episodes">에피소드 목록</button></span></div>`;
  }
  return `<div class="epscr bg-${E.bg}">
    <div class="epbg" aria-hidden="true"><i></i><span class="place">${esc(EP_BG[E.bg] || '')}</span></div>
    ${fig(E.left, 'L')}${fig(E.right, 'R')}
    <div class="eptop"><span class="ttl">${head}</span><span class="grow"></span>
      ${E.phase === 'read' ? `<button type="button" class="mini ${E.auto ? 'on' : ''}" data-epauto aria-pressed="${E.auto}">자동</button><button type="button" class="mini" data-epskip>빨리</button>` : ''}
      <button type="button" class="mini" data-eplog>기록</button><button type="button" class="mini" data-view="episodes">나가기</button></div>
    ${box}
  </div>`;
}

export function epLogModal() {
  const E = S.ep;
  const rows = E.log.map(([id, t]) => id ? `<p><b style="color:${who(id).col}">${esc(who(id).name)}</b> ${esc(t)}</p>` : `<p class="narr">${esc(t)}</p>`).join('');
  return `<div class="box eplog" role="dialog" aria-label="대사 기록"><h2>기록</h2><div class="loglines">${rows}</div><button type="button" data-close>닫기</button></div>`;
}

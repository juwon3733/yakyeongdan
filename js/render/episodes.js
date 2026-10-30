// 에피소드 목록 · 에피소드 재생 화면 (docs/06_art_ui_sound.md 「에피소드」): 배경 전면 + 상반신 좌우 + 아래 대화창
import { S } from '../run.js';
import { P, epOpen, epKey } from '../meta.js';
import { epLine, epFight, TYPE_MS } from '../episodes.js';
import { calmNow } from '../settings.js';
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
const condText = (cid, n) => EP_COND[n].text.replace(/[「」]/g, '');

export function episodesView() {
  // 안 본 화가 있는 동료 → 가진 동료 → 아직 없는 동료 순 (원래 순서 안에서)
  const hasNew = cid => EPISODES[cid].some((_, n) => epOpen(cid, n) && !P.epSeen[epKey(cid, n)]);
  const rank = cid => hasNew(cid) ? 0 : P.owned[cid] ? 1 : 2;
  const ids = Object.keys(EPISODES).map((k, i) => [k, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(x => x[0]);
  const sel = EPISODES[S.epSel] ? S.epSel : ids[0];
  // 왼쪽: 동료 얼굴 칸 격자. 한 화도 안 열렸으면 어둡게 + 자물쇠, 아래 점 셋 = 1~3화 (본 화 · 새 화 · 잠김)
  const grid = ids.map(cid => {
    const w = who(cid), lock = !epOpen(cid, 0);
    const pips = EPISODES[cid].map((_, n) => `<i class="${!epOpen(cid, n) ? '' : P.epSeen[epKey(cid, n)] ? 'seen' : 'new'}"></i>`).join('');
    return `<button type="button" class="epface ${lock ? 'lock' : ''} ${P.owned[cid] ? '' : 'notown'} ${cid === sel ? 'on' : ''}" style="--c:${w.col}" data-epsel="${cid}" title="${esc(w.name)}">
      <span class="pic"><img class="px" src="${w.img}" alt=""></span>${lock ? '<span class="lk" aria-label="잠김"></span>' : ''}${hasNew(cid) ? '<span class="newt">NEW</span>' : ''}
      <span class="nm">${esc(w.name)}</span><span class="pips">${pips}</span></button>`;
  }).join('');
  // 오른쪽: 고른 동료의 1~3화
  const w = who(sel);
  const eps = EPISODES[sel].map((ep, n) => {
    const open = epOpen(sel, n), seen = !!P.epSeen[epKey(sel, n)];
    if (!open) return `<button type="button" class="epslot lock" disabled><b>${n + 1}화 · ???</b><small>${esc(condText(sel, n))}</small></button>`;
    return `<button type="button" class="epslot ${seen ? 'seen' : 'new'}" data-ep="${sel}:${n}"><b>${n + 1}화 · ${esc(ep.title)}</b>
      <small>${seen ? '다시 보기' : `<span class="newt">NEW</span> 처음 보면 별 조각 +${EP_REWARD[n]}`}</small></button>`;
  }).join('');
  const bonds = P.bondOpen.length ? P.bondOpen.map(k => {
    const b = BOND_SCENES[k]; if (!b) return '';
    const [a, c] = k.split('+'), seen = P.bondSeen.includes(k);
    return `<button type="button" class="epslot bond ${seen ? 'seen' : 'new'}" data-bond="${k}"><b>${esc(who(a).name)} · ${esc(who(c).name)}</b><small>${esc(b.title)}${seen ? '' : ' <span class="newt">NEW</span>'}</small></button>`;
  }).join('') : '';
  return `<div class="epsel epgrid">
    <div class="bhead"><button type="button" class="mini" data-view="base">‹ 본부</button><span class="wallet"><b>별 조각 ${P.shards}</b></span></div>
    <div class="epcols">
      <div class="epleft"><h2>에피소드</h2><div class="epfaces">${grid}</div></div>
      <div class="epright" style="--c:${w.col}">${ROSTER[sel] ? `<img class="px epbig" src="${charSrc(sel, 'stand')}" alt="" aria-hidden="true">` : ''}
        <div class="ephead"><span class="pic"><img class="px" src="${w.img}" alt=""></span><div><h3>${esc(w.name)}</h3>${P.owned[sel] ? '' : '<small class="note">아직 없는 동료</small>'}</div></div>
        <div class="epeps">${eps}</div>
        ${bonds ? `<h3 class="sub">인연 장면</h3><div class="bondlist">${bonds}</div>` : ''}
      </div>
    </div>
  </div>`;
}

// 재생 화면
// 감정 표시: 대본 줄의 세 번째 칸 ('surprise' 놀람 · 'sad' 슬픔 · 'laugh' 웃음)
const EMO = { surprise: 'surprise', 놀람: 'surprise', sad: 'sad', 슬픔: 'sad', laugh: 'laugh', 웃음: 'laugh' };
// 대사를 글자 하나씩 (CSS 지연). 다시 그려도 처음부터 다시 치지 않게 한 줄에 한 번만.
function typed(text, fresh) {
  if (!fresh) return esc(text);
  return [...text].map((ch, k) => `<i style="animation-delay:${k * TYPE_MS}ms">${esc(ch)}</i>`).join('');
}
export function epView() {
  const E = S.ep, line = epLine();
  const calm = calmNow();
  const fresh = !calm && E.phase === 'read' && !!line && E.drawn !== E.i && E.full !== E.i;   // 이 줄을 처음 그린다
  const emo = line && EMO[line[2]];
  const fig = (id, side) => {
    if (!id) return '';
    const w = who(id), on = line && line[0] === id;
    const cls = [side, on ? 'on' : '', on && fresh ? 'talk' : '', on && emo ? `emo-${emo}` : ''].join(' ');
    return `<div class="epfig ${cls}" style="--c:${w.col}">${w.img ? `<img class="px" src="${w.img}" alt="${esc(w.name)}">` : ''}</div>`;
  };
  const head = E.kind === 'ep' ? `${esc(who(E.cid).name)} 에피소드 ${E.n + 1}화 · ${esc(E.title)}` : `인연 장면 · ${esc(E.title)}`;
  let box;
  if (E.phase === 'read' && line) {
    const [id, text] = line, w = id ? who(id) : null;
    box = `<button type="button" class="epbox ${id ? '' : 'narr'} ${fresh ? 'typing' : ''}" data-epnext>${w ? `<span class="who" style="--c:${w.col}">${esc(w.name)}</span>` : ''}
      <span class="tx" aria-label="${esc(text)}">${typed(text, fresh)}</span><span class="more" aria-hidden="true">▼</span></button>`;
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
  // 배경 전환(바로 앞 줄에서 바뀌었으면 이전 배경이 디더로 사라진다) · 화면 효과 줄 명령
  const swap = fresh && E.bgPrev && E.bgAt === E.i - 1;
  const fxOn = !calm && E.fx && E.fxAt === E.i - 1 && E.fxDone !== E.fxAt ? E.fx : '';   // 한 번만 (특별 전투 앞에서도)
  if (fxOn) E.fxDone = E.fxAt;
  const shake = fxOn === 'shake' && !document.getElementById('stage')?.classList.contains('noshake');
  if (line) { if (fresh) E.typing = true; E.drawn = E.i; }
  return `<div class="epscr bg-${E.bg} ${shake ? 'fx-shake' : ''}">
    <div class="epbg" aria-hidden="true"><i></i><span class="place">${esc(EP_BG[E.bg] || '')}</span></div>
    ${swap ? `<div class="epprev bg-${E.bgPrev}" aria-hidden="true"><div class="epbg"><i></i></div></div>` : ''}
    ${fxOn && fxOn !== 'shake' ? `<div class="epfx fx-${fxOn}" aria-hidden="true"></div>` : ''}
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

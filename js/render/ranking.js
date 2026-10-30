// 시즌 랭킹 화면 (시즌 화면 [랭킹] → S.view = 'ranking'): 위에 판 탭 넷, 1~3위 큰 칸(금·은·동 + 파티 얼굴), 4위부터 줄, 맨 아래 내 순위.
// 자료는 js/ranking.js fetchBoard (지금은 가짜). 불러오면 'yk:render' 사건으로 다시 그린다 (js/main.js)
import { S } from '../run.js';
import { seasonNow } from '../season.js';
import { BOARDS, fetchBoard } from '../ranking.js';
import { esc, face } from './common.js';

const R = { board: 'daily', key: '', status: 'load', data: null };
export const setRankBoard = b => { if (BOARDS.some(x => x.id === b)) R.board = b; };

function load(season) {
  const key = `${R.board}:${season}`;
  if (R.key === key) return;
  R.key = key; R.status = 'load'; R.data = null;
  fetchBoard(R.board, season).then(d => { if (R.key !== key) return; R.data = d; R.status = 'ok'; },
    () => { if (R.key !== key) return; R.status = 'err'; })
    .finally(() => { if (R.key === key && S.view === 'ranking') window.dispatchEvent(new Event('yk:render')); });
}

const party = ids => `<span class="rkp">${ids.map(id => face(id)).join('')}</span>`;

export function rankingView() {
  const s = seasonNow(), season = s?.id || 'none';
  load(season);
  const B = BOARDS.find(x => x.id === R.board);
  const head = `<div class="bhead"><button type="button" class="mini" data-view="season" data-keep>‹ 시즌</button><b class="rkt">시즌 랭킹${s ? ` · ${esc(s.name)}` : ''}</b></div>`;
  const tabs = `<div class="rktabs" role="tablist">${BOARDS.map(b => `<button type="button" role="tab" class="${b.id === R.board ? 'on' : ''}" aria-selected="${b.id === R.board}" data-rankboard="${b.id}">${b.name}</button>`).join('')}</div>`;
  let body;
  if (R.status === 'load') body = `<p class="rkmsg">불러오는 중</p>`;
  else if (R.status === 'err' || !R.data) body = `<p class="rkmsg err">온라인에 연결되지 않았다</p>`;
  else {
    const rows = R.data.rows, sc = n => `${n.toLocaleString('ko-KR')}${B.unit}`;
    const top = rows.slice(0, 3).map(r => `<div class="rktop m${r.rank}"><i class="rkn">${r.rank}</i><b>${esc(r.name)}</b><span class="rks">${sc(r.score)}</span>${party(r.party)}</div>`).join('');
    const list = rows.slice(3).map(r => `<div class="rkrow"><i class="rkn">${r.rank}</i><b>${esc(r.name)}</b>${party(r.party)}<span class="rks">${sc(r.score)}</span></div>`).join('');
    const me = R.data.me;
    body = `<div class="rktops">${top}</div><div class="rklist">${list}</div>
      <div class="rkrow me"><i class="rkn">${me.rank}</i><b>나</b><span class="rkp"></span><span class="rks">${sc(me.score)}</span></div>`;
  }
  return `<div class="seasonscr rankscr" style="--c:${s?.col || '#8fa8ff'}">${head}${tabs}<div class="rkbody">${body}</div></div>`;
}

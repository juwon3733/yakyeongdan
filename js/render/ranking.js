// 랭킹 화면 (js/ranking.js): 탭 넷 · 1~3위 큰 칸(금·은·동) · 4위부터 줄 · 맨 아래 내 순위
import { S } from '../run.js';
import { BOARDS } from '../ranking.js';
import { seasonNow } from '../season.js';
import { esc, face } from './common.js';
import { CHARACTERS } from '../data/characters.js';

export function rankingView() {
  const R = S.rank || { board: 'daily', state: 'loading' }, s = seasonNow();
  const tabs = BOARDS.map(b => `<button type="button" class="rtab ${b.id === R.board ? 'on' : ''}" data-rankboard="${b.id}">${b.name}</button>`).join('');
  const head = `<div class="bhead"><button type="button" class="mini" data-view="season" data-keep>‹ 시즌</button><b class="rkt">랭킹${s?.open ? ` · 시즌 ${s.no} ${esc(s.name)}` : ''}</b></div>`;
  let body;
  if (R.state === 'loading') body = '<p class="rkmsg">불러오는 중…</p>';
  else if (!R.data?.online) {
    const me = R.data?.me;
    body = `<div class="rkoff"><p class="rkmsg">온라인에 연결되지 않았다. 연결되면 다른 야경단의 기록이 여기 올라온다.</p>
      <div class="rkme solo"><small>내 기록</small><b>${me ? esc(me.text) : '아직 기록 없음'}</b></div></div>`;
  } else {
    const rows = R.data.rows, top = rows.slice(0, 3), rest = rows.slice(3);
    const pod = top.map(r => `<div class="rkpod p${r.rank}"><i class="rkn">${r.rank}</i><span class="rkf">${(r.party || []).filter(id => CHARACTERS[id]).map(id => face(id)).join('')}</span><b>${esc(r.name)}</b><small>${esc(r.text)}</small></div>`).join('');
    const list = rest.map(r => `<li><i>${r.rank}</i><b>${esc(r.name)}</b><span class="rkf">${(r.party || []).filter(id => CHARACTERS[id]).map(id => face(id)).join('')}</span><small>${esc(r.text)}</small></li>`).join('');
    const me = R.data.me;
    body = `<div class="rkpods">${pod}</div><ol class="rklist">${list}</ol>
      <div class="rkme"><i>${me?.rank ?? '-'}</i><b>${R.data.login === false ? '로그인하면 순위에 오른다(설정 → 온라인 계정)' : '나'}</b><small>${me ? esc(me.text) : '기록 없음'}</small></div>`;
  }
  return `<div class="rankscr" style="--c:${s?.col || '#9fb4ff'}">${head}<div class="rtabs">${tabs}</div><div class="rkbody">${body}</div></div>`;
}

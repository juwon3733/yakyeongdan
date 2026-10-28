import { S } from '../run.js';
import { CHARACTERS, STARTER_OWNED, PREVIEW } from '../data/characters.js';
import { sprite } from './sprites.js';
import { stars } from './common.js';

// 파티 고르기: 왼쪽 동료 격자, 오른쪽 고른 셋과 출발
export function titleView() {
  const owned = S.dev ? Object.keys(CHARACTERS) : STARTER_OWNED;
  const mates = Object.entries(CHARACTERS).map(([k, c]) => {
    const has = owned.includes(k), on = S.picked.includes(k);
    return `<button type="button" class="mate r${c.rarity} ${on ? 'on' : ''} ${has ? '' : 'locked'}" style="--c:${c.col}" ${has ? `data-pick="${k}" aria-pressed="${on}"` : 'disabled'}>
      <img class="px" src="${sprite(c.pal, c.long)}" alt=""><span class="tx"><span class="nm">${c.name}</span> <span class="stars">${stars(c.rarity)}</span>
      <span class="rl">${c.role} · 체력 ${c.maxHp}</span>
      <span class="ps">${has ? `<b>${c.passive.name}</b> ${c.passive.text}` : '별 소환으로 얻는 동료'}</span></span></button>`;
  }).join('') + PREVIEW.map(c => `<button type="button" class="mate r${c.rarity} locked" style="--c:${c.col}" disabled>
      <img class="px" src="${sprite(c.pal, c.long)}" alt=""><span class="tx"><span class="nm">${c.name}</span> <span class="stars">${stars(c.rarity)}</span>
      <span class="rl">${c.role}</span><span class="ps">준비 중</span></span></button>`).join('');
  const chosen = [0, 1, 2].map(i => {
    const k = S.picked[i], c = k && CHARACTERS[k];
    return c ? `<span class="chosen" style="--c:${c.col}"><img class="px" src="${sprite(c.pal, c.long)}" alt=""><span>${c.name}</span></span>` : '<span class="chosen empty">?</span>';
  }).join('');
  return `<div class="title">
    <div class="tleft">
      <div class="thead"><h1>야경단</h1><span class="note">0시에 솟는 탑을 <b>6시 해 뜨기 전에</b> 오른다 · 그림은 임시</span>${S.dev ? '<span class="dev">개발판</span>' : ''}</div>
      <div class="pick">${mates}</div>
    </div>
    <div class="tright">
      <h2>동료 셋 (${S.picked.length}/3)</h2>
      <div class="chosenrow">${chosen}</div>
      <p class="note">대열은 지도에서 바꿀 수 있다. 처음엔 체력이 높은 동료가 앞에 선다.</p>
      <button type="button" class="primary go" data-start ${S.picked.length === 3 ? '' : 'disabled'}>출발</button>
      <p class="note small"><b>연계</b>: 서로 다른 동료 카드를 번갈아 쓰면 칸이 차고 공격이 세진다. 2칸 이상에서 인연 있는 둘을 이어 쓰면 <b>듀오 카드</b>.</p>
    </div>
  </div>`;
}

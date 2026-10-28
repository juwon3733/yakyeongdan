import { S } from '../run.js';
import { CHARACTERS, STARTER_OWNED, PREVIEW } from '../data/characters.js';
import { sprite } from './sprites.js';
import { stars } from './common.js';

export function titleView() {
  const owned = S.dev ? Object.keys(CHARACTERS) : STARTER_OWNED;
  const mates = Object.entries(CHARACTERS).map(([k, c]) => {
    const has = owned.includes(k), on = S.picked.includes(k);
    return `<button type="button" class="mate ${on ? 'on' : ''} ${has ? '' : 'locked'}" style="--c:${c.col}" ${has ? `data-pick="${k}" aria-pressed="${on}"` : 'disabled'}>
      <img class="px" src="${sprite(c.pal, c.long)}" alt=""><span><span class="nm">${c.name}</span> <span class="stars">${stars(c.rarity)}</span><br><span class="rl">${c.role}</span>
      <span class="ds" style="display:block">${has ? c.ds : '별 소환으로 얻는 동료 (아직 없음)'}</span>
      <span class="ps"><b>${c.passive.name}</b> ${c.passive.text}</span></span></button>`;
  }).join('') + PREVIEW.map(c => `<button type="button" class="mate locked" style="--c:${c.col}" disabled>
      <img class="px" src="${sprite(c.pal, c.long)}" alt=""><span><span class="nm">${c.name}</span> <span class="stars">${stars(c.rarity)}</span><br><span class="rl">${c.role}</span>
      <span class="ds" style="display:block">준비 중</span></span></button>`).join('');
  return `${S.dev ? '<span class="dev">개발판: 동료 전부 고를 수 있음</span>' : ''}
    <p class="note">매일 밤 0시, 바다 위로 탑이 솟는다. <b>6시 해 뜨기 전에</b> 꼭대기의 「새벽」을 쓰러뜨려야 한다. 칸을 지날 때마다, 시간 카드를 쓸 때마다 밤이 줄어든다.</p>
    <h2>동료 셋을 고르세요 (${S.picked.length}/3)</h2>
    <div class="pick">${mates}</div>
    <div class="acts"><button type="button" class="primary" data-start ${S.picked.length === 3 ? '' : 'disabled'}>출발</button></div>
    <p class="note"><b>연계</b>: 한 턴에 서로 다른 사람의 카드를 번갈아 쓰면 연계 칸이 차고, 공격에 칸 수만큼 피해가 더해집니다. 연계가 2칸 이상일 때 인연이 있는 두 사람 카드를 이어 쓰면 그 짝만의 <b>듀오 카드</b>가 손에 생깁니다. 같은 사람 카드를 연달아 쓰면 연계가 끊깁니다.</p>`;
}

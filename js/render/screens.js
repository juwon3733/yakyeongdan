// 보상·휴식·사건·카드 지우기·결과
import { S } from '../run.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RULES, ACT_NAME } from '../data/rules.js';
import { cardHTML, fmt, face } from './common.js';

export function rewardView() {
  const G = S.G;
  return `<div class="center"><h2>보상: 카드 한 장</h2>
    ${G.reward.bonus ? `<p class="note">강적을 쓰러뜨려 모든 동료 체력 +${G.reward.bonus}.</p>` : ''}
    <div class="hand big">${G.reward.cards.map(id => cardHTML(id, true, 'take')).join('')}</div>
    <div class="acts"><button type="button" data-take="">건너뛰기</button></div></div>`;
}
export function restView() {
  const R = RULES.rest, G = S.G;
  const who = G.formation.map(p => {
    const M = G.members[p], gain = Math.min(M.max - M.hp, Math.ceil(M.max * (M.wasDown ? R.downHealPct : R.healPct)));
    return `<span class="mt">${face(p)}<span>${CHARACTERS[p].name} ${M.hp}/${M.max} <b>+${gain}</b>${M.wasDown ? ' (쓰러졌던 동료)' : ''}</span></span>`;
  }).join('');
  return `<div class="center"><h2>휴식</h2><p class="note">탑의 계단참. 쉬거나, 잠깐 눈을 붙여 시간을 벌거나.</p>
    <div class="restwho">${who}</div>
    <div class="acts">
      <button type="button" class="primary" data-rest="heal">쉬기: 각자 최대 체력의 ${R.healPct * 100}% (쓰러졌던 동료 ${R.downHealPct * 100}%)</button>
      <button type="button" data-rest="nap">낮잠: ${R.napTime}분 되찾기</button></div></div>`;
}
export function eventView() {
  const e = S.G.event;
  return `<div class="center"><h2>${e.title}</h2><p class="note">${e.text}</p>
    <div class="acts col">${e.opts.map((o, i) => `<button type="button" data-opt="${i}">${o.t}</button>`).join('')}</div></div>`;
}
export function removeView() {
  return `<div class="center"><h2>지울 카드를 고르세요</h2><div class="hand big scroll">${S.G.deck.map((id, i) => cardHTML(id, true, 'rm', i)).join('')}</div></div>`;
}
export function resultView() {
  const G = S.G;
  const shards = (G.act - (G.won ? 0 : 1)) * 10 + G.fights * 2 + G.duos;
  return `<div class="center result"><h2 style="font-size:26px">${G.won ? '새벽을 넘었다' : '탑에서 떨어졌다'}</h2>
    <p class="note">${G.won ? `꼭대기에 닿은 시각 <b>${fmt(G.clock)}</b>${G.clock >= RULES.dawn ? ' (해가 뜬 뒤)' : ' (해 뜨기 전)'}.` : `${ACT_NAME[G.act]}에서 모두 쓰러졌다. 시각 <b>${fmt(G.clock)}</b>.`}</p>
    <p class="note">싸움 ${G.fights}번 · 듀오 카드 ${G.duos}번 · 달 ${MOONS[G.moon].name} · 시드 ${G.seed}</p>
    <p class="note">얻은 별 조각 <b>${shards}</b> (별 소환은 M5에서)</p>
    <div class="acts"><button type="button" class="primary" data-again>다시 하기</button></div></div>`;
}
export function deckModal() {
  const G = S.G;
  return `<div class="box" role="dialog" aria-label="덱"><h2>덱 ${G.deck.length}장</h2>
    <div class="hand big">${G.deck.slice().sort().map(id => cardHTML(id, true, 'none')).join('')}</div>
    <button type="button" data-close>닫기</button></div>`;
}

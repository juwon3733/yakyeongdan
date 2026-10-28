// 보상·휴식·사건·카드 지우기·결과
import { S } from '../run.js';
import { MOONS } from '../data/moons.js';
import { RULES, ACT_NAME } from '../data/rules.js';
import { cardHTML, fmt } from './common.js';

export function rewardView() {
  const G = S.G;
  return `<h2>보상: 카드 한 장</h2>
    ${G.reward.bonus ? `<p class="note">강적을 쓰러뜨려 체력 +${G.reward.bonus}.</p>` : ''}
    <div class="hand">${G.reward.cards.map(id => cardHTML(id, true, 'take')).join('')}</div>
    <div class="acts"><button type="button" data-take="">건너뛰기</button></div>`;
}
export function restView() {
  const R = RULES.rest;
  return `<h2>휴식</h2><p class="note">탑의 계단참. 얼마나 쉴지 정하세요.</p>
    <div class="acts" style="flex-direction:column">
      <button type="button" class="primary" data-rest="long">푹 쉰다: 체력 +${R.long}</button>
      <button type="button" data-rest="short">선잠만 잔다: 체력 +${R.short}, ${R.shortTime}분 돌려받기</button></div>`;
}
export function eventView() {
  const e = S.G.event;
  return `<h2>${e.title}</h2><p class="note">${e.text}</p>
    <div class="acts" style="flex-direction:column">${e.opts.map((o, i) => `<button type="button" data-opt="${i}">${o.t}</button>`).join('')}</div>`;
}
export function removeView() {
  return `<h2>지울 카드를 고르세요</h2><div class="hand">${S.G.deck.map((id, i) => cardHTML(id, true, 'rm', i)).join('')}</div>`;
}
export function resultView() {
  const G = S.G;
  const shards = (G.act - (G.won ? 0 : 1)) * 10 + G.fights * 2 + G.duos;
  return `<h2 style="font-size:28px">${G.won ? '새벽을 넘었다' : '탑에서 떨어졌다'}</h2>
    <p class="note">${G.won ? `꼭대기에 닿은 시각 <b>${fmt(G.clock)}</b>${G.clock >= RULES.dawn ? ' (해가 뜬 뒤)' : ' (해 뜨기 전)'}.` : `${ACT_NAME[G.act]}에서 쓰러졌다. 시각 <b>${fmt(G.clock)}</b>.`}</p>
    <p class="note">싸움 ${G.fights}번 · 듀오 카드 ${G.duos}번 · 달 ${MOONS[G.moon].name} · 시드 ${G.seed}</p>
    <p class="note">얻은 별 조각 <b>${shards}</b> (별 소환은 M5에서)</p>
    <div class="acts"><button type="button" class="primary" data-again>다시 하기</button></div>`;
}
export function deckModal() {
  const G = S.G;
  return `<div class="box" role="dialog" aria-label="덱"><h2>덱 ${G.deck.length}장</h2>
    <div class="hand">${G.deck.slice().sort().map(id => cardHTML(id, true, 'none')).join('')}</div>
    <button type="button" data-close>닫기</button></div>`;
}

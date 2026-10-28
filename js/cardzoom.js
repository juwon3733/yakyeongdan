// 카드 확대 보기: 카드를 길게 누르거나(0.45초) 오른쪽 클릭하면 크게 보여 준다. 아무 데나 누르면 닫힌다.
// 길게 누른 뒤의 click은 삼켜서 카드가 쓰이지 않게 한다(끌기는 8px 넘게 움직여야 시작하므로 겹치지 않는다).
import { cardHTML, esc } from './render/common.js';
import { cardData } from './data/cards.js';
import { RARITY_NAME } from './data/rules.js';

const stage = document.getElementById('stage');
const box = document.createElement('div');
box.id = 'cardzoom'; box.hidden = true;
stage.append(box);

let press = null, swallow = false;
export function openZoom(cid) {
  const d = cardData(cid); if (!d) return;
  const html = cardHTML(cid, true, 'none').replace('class="card ', 'class="card zoom ');
  const kw = d.exhaust ? '<li><b>소멸</b> 쓰면 이번 전투에서 사라진다.</li>' : '';
  const tm = d.time ? '<li><b>시간 카드</b> 에너지 대신 밤 시계를 앞당겨 쓴다.</li>' : '';
  box.innerHTML = `${html}<div class="zinfo"><b>${esc(d.name)}</b><span class="note small">${esc(RARITY_NAME[d.rarity] || (d.ch === 'duo' ? '인연 듀오' : ''))}</span>
    ${kw || tm ? `<ul>${kw}${tm}</ul>` : ''}<span class="note small">아무 데나 누르면 닫힌다.</span></div>`;
  box.hidden = false;
}
export const closeZoom = () => { box.hidden = true; box.innerHTML = ''; };

box.addEventListener('pointerdown', e => { e.stopPropagation(); closeZoom(); swallow = true; });
addEventListener('contextmenu', e => {
  const el = e.target.closest?.('.card[data-cid]');
  if (!el || el.closest('#cardzoom')) return;
  e.preventDefault();
  openZoom(el.dataset.cid);
});
addEventListener('pointerdown', e => {
  const el = e.target.closest?.('.card[data-cid]');
  if (!el || e.button > 0 || el.closest('#cardzoom')) return;
  clearTimeout(press?.t);
  press = { x: e.clientX, y: e.clientY, id: e.pointerId, t: setTimeout(() => { press = null; swallow = true; openZoom(el.dataset.cid); }, 450) };
}, true);
addEventListener('pointermove', e => {
  if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.t); press = null; }
}, true);
// 길게 누른 뒤 손을 떼도 click이 안 오는 기기가 있어, 뗀 뒤 잠깐만 삼킨다
const cancel = () => { if (press) { clearTimeout(press.t); press = null; } if (swallow) setTimeout(() => { swallow = false; }, 350); };
addEventListener('pointerup', cancel, true);
addEventListener('pointercancel', cancel, true);
addEventListener('click', e => { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) { closeZoom(); e.stopPropagation(); } }, true);

// 연출: 듀오 컷인
import { CHARACTERS } from './data/characters.js';
import { DUOS } from './data/cards.js';
import { sprite } from './render/sprites.js';

const cutEl = document.getElementById('cut');
let cutTimer = null;
export function showCut(k) {
  const [a, b] = k.split('+'), A = CHARACTERS[a], B = CHARACTERS[b];
  cutEl.innerHTML = `<div class="band"><img class="px" src="${sprite(A.pal, A.long)}" alt=""><img class="px" src="${sprite(B.pal, B.long)}" alt="">
    <div class="tx"><span>${A.name} + ${B.name} · 듀오 카드가 손에 들어왔다</span><b>${DUOS[k].name}</b></div></div>`;
  cutEl.hidden = false;
  clearTimeout(cutTimer); cutTimer = setTimeout(() => { cutEl.hidden = true; }, 1300);
}
cutEl.addEventListener('click', () => { cutEl.hidden = true; });

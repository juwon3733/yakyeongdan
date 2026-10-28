// 연출: 듀오 컷인, 보스 2단계 띠
import { CHARACTERS } from './data/characters.js';
import { DUOS, BOND } from './data/cards.js';
import { sprite } from './render/sprites.js';

const cutEl = document.getElementById('cut');
let cutTimer = null;
function show(html, ms = 1300) {
  cutEl.innerHTML = html;
  cutEl.hidden = false;
  clearTimeout(cutTimer); cutTimer = setTimeout(() => { cutEl.hidden = true; }, ms);
}
// k = 'a+b'. bond면 인연의 실 「합동」
export function showCut(k, bond = false) {
  const [a, b] = k.split('+'), A = CHARACTERS[a], B = CHARACTERS[b];
  show(`<div class="band"><img class="px" src="${sprite(A.pal, A.long)}" alt=""><img class="px" src="${sprite(B.pal, B.long)}" alt="">
    <div class="tx"><span>${A.name} + ${B.name} · ${bond ? '인연의 실 · ' : ''}듀오 카드가 손에 들어왔다</span><b>${bond ? BOND.name : DUOS[k].name}</b></div></div>`);
}
// 보스 2단계 (갑옷 벗기, 해가 뜬다)
export function showPhase(name, text) {
  show(`<div class="band phase"><div class="tx"><span>${name}</span><b>${text}</b></div></div>`, 1800);
}
cutEl.addEventListener('click', () => { cutEl.hidden = true; });

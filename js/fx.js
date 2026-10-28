// 연출: 듀오 컷인, 보스 2단계 띠
import { CHARACTERS } from './data/characters.js';
import { DUOS, BOND } from './data/cards.js';
import { sprite } from './render/sprites.js';
import { palOf } from './render/common.js';
import { duoSpecial } from './meta.js';

const cutEl = document.getElementById('cut');
let cutTimer = null;
function show(html, ms = 1300) {
  cutEl.innerHTML = html;
  cutEl.hidden = false;
  clearTimeout(cutTimer); cutTimer = setTimeout(() => { cutEl.hidden = true; }, ms);
}
// k = 'a+b'. bond면 인연의 실 「합동」
// 별자리 5인 동료가 낀 듀오는 특별판 (docs/05 §4). replay = 도감에서 다시 보기
export function showCut(k, bond = false, replay = false) {
  const [a, b] = k.split('+'), A = CHARACTERS[a], B = CHARACTERS[b];
  const sp = !bond && (duoSpecial(a) || duoSpecial(b));
  show(`<div class="band ${sp ? 'sp' : ''}"><img class="px" src="${sprite(palOf(a), A.long)}" alt=""><img class="px" src="${sprite(palOf(b), B.long)}" alt="">
    <div class="tx"><span>${A.name} + ${B.name} · ${bond ? '인연의 실 · ' : ''}${replay ? '인연 듀오' : '듀오 카드가 손에 들어왔다'}${sp ? ' · <i>별자리 특별판</i>' : ''}</span><b>${bond ? BOND.name : DUOS[k].name}</b></div></div>`, sp ? 1700 : 1300);
}
// 보스 2단계 (갑옷 벗기, 해가 뜬다)
export function showPhase(name, text) {
  show(`<div class="band phase"><div class="tx"><span>${name}</span><b>${text}</b></div></div>`, 1800);
}
cutEl.addEventListener('click', () => { cutEl.hidden = true; });

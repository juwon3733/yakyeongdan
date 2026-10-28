// 연출: 듀오 컷인, 보스 2단계 띠
import { CHARACTERS } from './data/characters.js';
import { DUOS, BOND } from './data/cards.js';
import { charSrc } from './render/common.js';
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
// 연출 (docs/06): 비스듬한 띠에 두 사람이 좌우에서 밀려 들어와 겹치고, 듀오 이름이 찍힌다.
export function showCut(k, bond = false, replay = false) {
  const [a, b] = k.split('+'), A = CHARACTERS[a], B = CHARACTERS[b];
  const sp = !bond && (duoSpecial(a) || duoSpecial(b));
  show(`<div class="duocut ${sp ? 'sp' : ''}" style="--ca:${A.col};--cb:${B.col}">
      <i class="stripe"></i><i class="stripe s2"></i>
      <img class="px l" src="${charSrc(a)}" alt=""><img class="px r" src="${charSrc(b)}" alt="">
      <div class="tx"><span>${A.name} + ${B.name} · ${bond ? '인연의 실 · ' : ''}${replay ? '인연 듀오' : '듀오 카드가 손에 들어왔다'}${sp ? ' · <i>별자리 특별판</i>' : ''}</span><b>${bond ? BOND.name : DUOS[k].name}</b></div></div>`, sp ? 1700 : 1350);
}
// 보스 2단계 (갑옷 벗기, 해가 뜬다)
export function showPhase(name, text) {
  show(`<div class="bossband phase"><i class="stripe"></i><div class="tx"><span>${name}</span><b>${text}</b></div></div>`, 1700);
}
// 보스 등장 띠
export function showBoss(name, line = '') {
  show(`<div class="bossband"><i class="stripe"></i><div class="tx"><span>보스</span><b>${name}</b>${line ? `<small>${line}</small>` : ''}</div></div>`, 1400);
}
cutEl.addEventListener('click', () => { cutEl.hidden = true; });

// 동료가 맞으면 판을 짧게 흔든다 (설정 「화면 흔들림 끔」·애니메이션 줄이기면 #stage.noshake라 안 흔들린다)
const stageEl = document.getElementById('stage');
let shakeTimer = null;
export function shake() {
  if (!stageEl || stageEl.classList.contains('noshake')) return;
  stageEl.classList.remove('shake'); void stageEl.offsetWidth;
  stageEl.classList.add('shake');
  clearTimeout(shakeTimer); shakeTimer = setTimeout(() => stageEl.classList.remove('shake'), 260);
}

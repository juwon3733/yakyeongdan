// 입력과 화면 전환. 규칙은 run/map/combat, 그리기는 render/.
import { S, newRun } from './run.js';
import { goNode, takeReward, rest, chooseOpt, removeCard, pickSlot } from './map.js';
import { playCard, endTurn, swapInCombat, needsAlly, usable } from './combat.js';
import { render as draw } from './render/index.js';
import { deckModal } from './render/screens.js';
import { showCut } from './fx.js';

const qs = new URLSearchParams(location.search);
S.dev = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:' || qs.has('dev');
if (S.dev) window.__yk = { S };   // 개발판: 점검 도구(tools/smoke.mjs)가 상태를 들여다본다
const seedParam = qs.has('seed') ? Number(qs.get('seed')) >>> 0 : undefined;

const stage = document.getElementById('stage');
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const render = () => draw(app);

// 논리 640×360을 창에 맞춰 키운다. 2배 이상 들어가면 정수배, 그보다 작으면 맞춤 배율.
const W = 640, H = 360;
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.setProperty('--s', s >= 2 ? Math.floor(s) : Math.max(s, .5));
}
addEventListener('resize', fit);
fit();

function play(uid, ally) {
  const r = playCard(uid, ally);
  if (r.duo) showCut(r.duo);
}

app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset, C = S.C;
  if (D.pick) {
    const k = D.pick;
    S.picked = S.picked.includes(k) ? S.picked.filter(x => x !== k) : S.picked.length < 3 ? [...S.picked, k] : S.picked;
  }
  else if ('start' in D) newRun(S.picked.slice(), seedParam);
  else if (D.node) { const [r, i] = D.node.split(',').map(Number); goNode(r, i); }
  // 카드: 누르면 고르고, 대상(적 또는 동료)을 누르면 쓴다. 적을 치는 카드는 한 번 더 눌러도 쓴다.
  else if (D.play) {
    const uid = +D.play, inst = C.hand.find(h => h.uid === uid);
    if (!inst || !usable(inst)) return;
    if (C.pending === uid && !needsAlly(inst)) play(uid);
    else C.pending = uid;
  }
  else if ('foe' in D) {
    const inst = C.hand.find(h => h.uid === C.pending);
    if (inst && !needsAlly(inst)) play(C.pending);
  }
  else if (D.ally) {
    const inst = C.hand.find(h => h.uid === C.pending);
    if (inst && needsAlly(inst)) play(C.pending, D.ally);
  }
  else if (D.swap !== undefined) swapInCombat(+D.swap);
  else if (D.slot !== undefined) pickSlot(+D.slot);
  else if ('end' in D) endTurn();
  else if ('take' in D) takeReward(D.take);
  else if (D.rest) rest(D.rest);
  else if (D.opt) chooseOpt(+D.opt);
  else if (D.rm !== undefined) removeCard(+D.rm);
  else if ('deck' in D) { modal.innerHTML = deckModal(); modal.hidden = false; return; }
  else if ('again' in D) { S.G = null; S.picked = []; }
  else return;
  render();
});
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) modal.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape' && S.C?.pending) { S.C.pending = null; render(); } });

render();

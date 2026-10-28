// 입력과 화면 전환. 규칙은 run/map/combat, 그리기는 render/.
import { S, newRun } from './run.js';
import { goNode, takeReward, rest, chooseOpt, removeCard } from './map.js';
import { playCard, endTurn } from './combat.js';
import { render as draw } from './render/index.js';
import { deckModal } from './render/screens.js';
import { showCut } from './fx.js';

const qs = new URLSearchParams(location.search);
S.dev = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:' || qs.has('dev');
const seedParam = qs.has('seed') ? Number(qs.get('seed')) >>> 0 : undefined;

const app = document.getElementById('app');
const modal = document.getElementById('modal');
const render = () => draw(app);

app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset;
  if (D.pick) {
    const k = D.pick;
    S.picked = S.picked.includes(k) ? S.picked.filter(x => x !== k) : S.picked.length < 3 ? [...S.picked, k] : S.picked;
  }
  else if ('start' in D) newRun(S.picked.slice(), seedParam);
  else if (D.node) { const [r, i] = D.node.split(',').map(Number); goNode(r, i); }
  else if (D.play) { const { duo } = playCard(+D.play); if (duo) showCut(duo); }
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

render();

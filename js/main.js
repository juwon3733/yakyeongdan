// 입력과 화면 전환. 규칙은 run/map/combat/meta, 그리기는 render/.
import { S, newRun, checkCollapse } from './run.js';
import { goNode, takeReward, rest, chooseOpt, removeCard, pickSlot, upgradeCard, dupeCard, shopBuy, leaveShop, pickBossRelic, pickMoon, useRelic } from './map.js';
import { playCard, endTurn, swapInCombat, targetOf, usable, startCombat, livingFoes, devWin, pickCombatMoon } from './combat.js';
import { summon, P, resetProfile, save, choose5, exchange, setCostume, runOptions, loadRaw } from './meta.js';
import { temperPick } from './effects.js';
import { render as draw } from './render/index.js';
import { deckModal } from './render/screens.js';
import { showCut, showPhase, shake } from './fx.js';
import { sfx, applyVolumes } from './audio.js';
import { SET, applySettings, setOption } from './settings.js';
import { startTutorial, skipTutorial, finishTutorial, tutorialPending } from './tutorial.js';
import { settingsModal } from './render/settings.js';
import { openEp, openBond, epNext, epSkip, epStartFight, epFightDone, epSkipFight } from './episodes.js';
import { epLogModal } from './render/episodes.js';

const qs = new URLSearchParams(location.search);
// 처음 켜면 타이틀 전에 튜토리얼 들어가기 화면 (주소에 ?notut 이면 건너뜀: 점검 도구용)
if (qs.has('notut')) { P.tutDone = true; save(); }
if (tutorialPending()) S.view = 'tutintro';
S.ui = true;   // 화면에서 하는 판: 담금질 등을 직접 고른다 (시뮬레이션은 자동)
S.dev = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:' || qs.has('dev');
// 개발판: 점검 도구(tools/smoke.mjs)가 상태를 들여다보고, 원하는 적과 바로 싸우고, 전투를 바로 이길 수 있다
if (S.dev) window.__yk = {
  S, P: () => P, render: () => render(), fight: (ids, kind = 'fight') => { startCombat(ids, kind); render(); },
  win: () => { if (S.C) { devWin(); after(); render(); } }, reset: () => { resetProfile(); render(); },
  shards: n => { P.shards += n; save(); render(); },
  // 에피소드: 동료의 3화를 모두 연다 / 바로 재생
  epUnlock: cid => { P.epProg[cid] = { runs: 1, act2: true, dawn: true }; save(); render(); },
  ep: (cid, n) => { openEp(cid, n); render(); },
  // 판 바깥: 별가루·별자리·이긴 판 수 바꾸기, 예전 저장(v1) 이어받기 흉내
  dust: n => { P.dust += n; save(); render(); },
  stars: (id, n) => { P.owned[id] = { stars: n }; save(); render(); },
  wins: n => { P.wins = n; P.runs = Math.max(P.runs, n); save(); render(); },
  loadV1: obj => { loadRaw(obj); render(); return P; },
};
const seedParam = qs.has('seed') ? Number(qs.get('seed')) >>> 0 : undefined;

const stage = document.getElementById('stage');
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const render = () => draw(app);

// 논리 640×360을 창에 맞춰 키운다. 2배 이상 들어가면 정수배, 그보다 작으면 맞춤 배율.
// 폰처럼 16:9보다 옆으로 긴 화면(2:1 등)이면 판 폭을 최대 800까지 늘려 남는 옆자리를 쓴다(높이 360은 그대로).
const W = 640, H = 360, W_MAX = 800;
function fit() {
  const w = Math.round(Math.min(W_MAX, Math.max(W, H * innerWidth / innerHeight)));
  stage.style.width = `${w}px`;
  const s = Math.min(innerWidth / w, innerHeight / H);
  const k = s >= 2 ? Math.floor(s) : Math.max(s, .5);
  stage.style.setProperty('--s', k);
  applySettings(k);   // 작은 화면이면 글자 크게(설정 「자동」)
}
addEventListener('resize', fit);
fit();

// 동료 체력 합: 행동 전후로 비교해 맞았으면 화면을 흔든다 (설정에서 끔)
const partyHp = () => S.G && S.C ? S.G.party.reduce((t, p) => t + S.G.members[p].hp, 0) : null;
function play(uid, pick) {
  const r = playCard(uid, pick);
  if (r.duo) showCut(r.duo);
  else if (r.bond) showCut(r.bond, true);
}
// 행동 뒤: 7시 붕괴, 쌓인 연출 띄우기
function after() {
  if (S.G?.screen === 'epdone') epFightDone();   // 에피소드 특별 전투가 끝남
  checkCollapse();
  const fx = S.fxq.splice(0);
  for (const f of fx) if (f.kind === 'phase') showPhase(f.name, f.text);
}

app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset, C = S.C, hp0 = partyHp();
  if ('settings' in D) { S.wipeArm = false; openSettings(); return; }
  // 첫 실행 튜토리얼
  if ('tutstart' in D) { startTutorial(); render(); return; }
  if ('tutskip' in D) { skipTutorial(); render(); return; }
  if ('tutfinish' in D) { finishTutorial(); render(); return; }
  if (D.view) {
    if (D.view === 'summon') S.hint = null;
    S.view = D.view;
    if (D.view === 'party') { S.G = null; S.C = null; S.picked = S.picked.filter(k => k && P.owned[k] || S.dev); }
    if (D.view === 'exchange') S.exMsg = '';
  }
  else if (D.pick) {
    const k = D.pick;
    S.picked = S.picked.includes(k) ? S.picked.filter(x => x !== k) : S.picked.length < 3 ? [...S.picked, k] : S.picked;
  }
  else if ('start' in D) newRun(S.picked.slice(), seedParam, runOptions(S.picked, S.depth || 0, S.startRelic));
  else if (D.depth !== undefined) S.depth = +D.depth;
  else if (D.srelic) S.startRelic = D.srelic;
  // 판 바깥: 초심자 ★5 · 교환소 · 동료 · 도감
  else if (D.choose5) { const r = choose5(D.choose5); if (r) { S.reveal = { list: [r], open: [true] }; S.view = 'reveal'; sfx('star'); } }
  else if (D.ex) { const [k, a] = D.ex.split(':'); S.exMsg = exchange(k, a || null) || ''; }
  else if (D.mate) S.mate = D.mate;
  else if (D.costume) { const [k, on] = D.costume.split(':'); setCostume(k, on === '1'); }
  else if (D.ctab) S.codexTab = D.ctab;
  else if (D.replay) { showCut(D.replay, false, true); return; }
  else if ('home' in D) { S.G = null; S.C = null; S.view = 'base'; }
  // 에피소드
  else if (D.ep) { const [cid, n] = D.ep.split(':'); openEp(cid, +n); }
  else if (D.bond) openBond(D.bond);
  else if ('epnext' in D) epNext();
  else if ('epskip' in D) epSkip();
  else if ('epauto' in D) S.ep.auto = !S.ep.auto;
  else if ('epfight' in D) epStartFight();
  else if ('epskipfight' in D) epSkipFight();
  else if ('eplog' in D) { modal.innerHTML = epLogModal(); modal.hidden = false; return; }
  // 별 소환
  else if (D.summon) {
    const list = summon(+D.summon); if (!list) return;
    S.reveal = { list, open: list.map(() => false) }; S.view = 'reveal';
  }
  else if (D.reveal !== undefined) { S.reveal.open[+D.reveal] = true; sfx('star', { rate: [1, 1, 1, .9, 1.1, 1.25][S.reveal.list[+D.reveal].rarity] }); }
  else if ('revealall' in D) { S.reveal.open = S.reveal.open.map(() => true); sfx('star'); }
  // 판
  else if (D.node) { const [r, i] = D.node.split(',').map(Number); goNode(r, i); }
  // 카드: 누르면 고르고, 대상(적 또는 동료)을 누르면 쓴다. 적을 치는 카드는 한 번 더 눌러도 쓴다.
  // 담금질 고르기 (도라): 고르는 동안 다른 카드·턴 끝은 막힌다
  else if (D.temper) temperPick(+D.temper);
  else if ('temperauto' in D) temperPick(null);
  else if (C?.choose) return;
  // 세바스·예약: 고른 카드를 턴 끝에 남기기
  else if ('keepmark' in D) {
    const u = C.pending; if (u == null) return;
    C.keepMark ||= [];
    C.keepMark = C.keepMark.includes(u) ? C.keepMark.filter(x => x !== u) : [...C.keepMark, u];
  }
  else if (D.play) {
    const uid = +D.play, inst = C.hand.find(h => h.uid === uid);
    if (!inst || !usable(inst)) return;
    const tk = targetOf(inst), once = tk === 'none' || tk === 'all' || (tk === 'foe' && livingFoes().length === 1);
    if (C.pending === uid && once) play(uid);
    else C.pending = uid;
  }
  else if (D.foe !== undefined) {
    const inst = C.hand.find(h => h.uid === C.pending); if (!inst) return;
    const tk = targetOf(inst);
    if (tk === 'foe') play(C.pending, { foe: +D.foe });
    else if (tk !== 'ally') play(C.pending);
  }
  else if (D.ally) {
    const inst = C.hand.find(h => h.uid === C.pending);
    if (inst && targetOf(inst) === 'ally') play(C.pending, { ally: D.ally });
  }
  else if (D.swap !== undefined) swapInCombat(+D.swap);
  else if (D.slot !== undefined) pickSlot(+D.slot);
  else if ('end' in D) endTurn();
  else if ('hg' in D) C.payEnergy = !C.payEnergy;
  else if (D.relic) useRelic(D.relic);
  else if ('take' in D) takeReward(D.take);
  else if (D.brelic !== undefined) pickBossRelic(D.brelic);
  else if (D.moon) pickMoon(D.moon);
  else if (D.cmoon) pickCombatMoon(D.cmoon);
  else if (D.rest) rest(D.rest);
  else if (D.opt) chooseOpt(+D.opt);
  else if (D.rm !== undefined) removeCard(+D.rm);
  else if (D.up !== undefined) upgradeCard(+D.up);
  else if (D.dupe !== undefined) dupeCard(+D.dupe);
  else if (D.buycard !== undefined) shopBuy('card', +D.buycard);
  else if (D.buyrelic !== undefined) shopBuy('relic', +D.buyrelic);
  else if (D.shop) shopBuy(D.shop);
  else if ('leave' in D) leaveShop();
  else if ('deck' in D) { modal.innerHTML = deckModal(); modal.hidden = false; return; }
  else return;
  after();
  render();
  const hp1 = partyHp();
  if (hp0 != null && hp1 != null && hp1 < hp0) shake();
});
// ---------- 카드 끌어 놓기: 손패 카드를 적·동료 위(대상 없는 카드는 손패 위쪽 아무 데나)에 놓으면 쓴다 ----------
// 누르기 방식(카드 → 대상)은 그대로. 8px 넘게 움직였을 때만 끌기로 보고, 그 뒤의 click은 무시한다.
let drag = null, eatClick = false;
app.addEventListener('pointerdown', e => {
  const cardEl = e.target.closest('.hand .card[data-play]');
  if (!cardEl || e.button > 0 || !S.C || S.C.choose) return;
  const uid = +cardEl.dataset.play, inst = S.C.hand.find(h => h.uid === uid);
  if (!inst || !usable(inst)) return;
  drag = { uid, el: cardEl, x: e.clientX, y: e.clientY, ghost: null, id: e.pointerId };
});
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    const r = drag.el.getBoundingClientRect(), g = drag.el.cloneNode(true);
    g.classList.add('dragghost'); g.removeAttribute('data-play');
    g.style.width = `${drag.el.offsetWidth}px`; g.style.height = `${drag.el.offsetHeight}px`;
    g.style.transform = `scale(${r.width / drag.el.offsetWidth})`;
    document.body.append(g); drag.ghost = g; drag.el.classList.add('dragging');
    S.C.pending = drag.uid; markTargets(true);
  }
  drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`;
  const over = dropAt(e.clientX, e.clientY, drag.uid);
  document.querySelectorAll('.dropover').forEach(x => x.classList.remove('dropover'));
  over?.el?.classList.add('dropover');
});
// 놓을 곳: 적 / 동료 / (대상 없는 카드) 손패 위쪽 판
function dropAt(x, y, uid) {
  const C = S.C; if (!C) return null;
  const inst = C.hand.find(h => h.uid === uid); if (!inst) return null;
  const tk = targetOf(inst), el = document.elementFromPoint(x, y);
  const foe = el?.closest('.foe[data-foe]'), ally = el?.closest('.pm[data-ally]');
  if (tk === 'foe' && foe) return { el: foe, pick: { foe: +foe.dataset.foe } };
  if (tk === 'ally' && ally && !ally.classList.contains('down')) return { el: ally, pick: { ally: ally.dataset.ally } };
  if ((tk === 'none' || tk === 'all' || (tk === 'foe' && livingFoes().length === 1)) && el?.closest('.field')) return { el: el.closest('.field'), pick: undefined };
  return null;
}
function markTargets(on) { app.classList.toggle('dragmode', on); }
function endDrag(e, cancel) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  document.querySelectorAll('.dropover').forEach(x => x.classList.remove('dropover'));
  markTargets(false);
  if (!d.ghost) return;   // 끌지 않았으면 보통 click
  d.ghost.remove(); d.el.classList.remove('dragging');
  eatClick = true; setTimeout(() => { eatClick = false; }, 0);
  const tgt = cancel ? null : dropAt(e.clientX, e.clientY, d.uid);
  if (!tgt) { render(); return; }
  const hp0 = partyHp();
  play(d.uid, tgt.pick);
  after(); render();
  const hp1 = partyHp(); if (hp0 != null && hp1 != null && hp1 < hp0) shake();
}
addEventListener('pointerup', e => endDrag(e, false));
addEventListener('pointercancel', e => endDrag(e, true));
app.addEventListener('click', e => { if (eatClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

// 설정 창
function openSettings() { modal.innerHTML = settingsModal(); modal.hidden = false; modal.dataset.kind = 'settings'; }
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-close]')) { modal.hidden = true; S.wipeArm = false; delete modal.dataset.kind; return; }
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset;
  if (D.set) {
    const [k, raw] = D.set.split(':');
    setOption(k, raw === 'true' ? true : raw === 'false' ? false : raw === 'null' ? null : raw);
  } else if ('tutreplay' in D) { modal.hidden = true; delete modal.dataset.kind; startTutorial(); render(); return; }
  else if ('wipe' in D) {
    if (!S.wipeArm) S.wipeArm = true;
    else { S.wipeArm = false; resetProfile(); S.G = null; S.C = null; S.view = 'tutintro'; modal.hidden = true; delete modal.dataset.kind; render(); return; }
  } else return;
  openSettings();
});
modal.addEventListener('input', e => {
  const r = e.target.closest('input[data-vol]'); if (!r) return;
  SET[r.dataset.vol] = +r.value;
  setOption(r.dataset.vol, +r.value);
  const o = document.getElementById(`out-${r.dataset.vol}`); if (o) o.textContent = `${Math.round(+r.value * 100)}%`;
  applyVolumes();
});
addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.C?.pending) { S.C.pending = null; render(); }
  // 에피소드: 스페이스·엔터로 다음 줄
  else if (S.view === 'ep' && S.ep?.phase === 'read' && modal.hidden && (e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) { e.preventDefault(); epNext(); render(); }
});
// 에피소드 [자동]: 1.8초마다 다음 줄
setInterval(() => { if (S.view === 'ep' && S.ep?.auto && S.ep.phase === 'read' && modal.hidden) { epNext(); render(); } }, 1800);

render();

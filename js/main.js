// 입력과 화면 전환. 규칙은 run/map/combat/meta, 그리기는 render/.
import { S, newRun, checkCollapse } from './run.js';
import { goNode, reachable, takeReward, rest, chooseOpt, removeCard, pickSlot, upgradeCard, dupeCard, shopBuy, specialBuy, leaveShop, pickBossRelic, pickMoon, useRelic } from './map.js';
import { playCard, endTurn, swapInCombat, targetOf, usable, startCombat, livingFoes, targetableFoes, devWin, pickCombatMoon, applyAffix } from './combat.js';
import { summon, P, resetProfile, save, choose5, exchange, setCostume, runOptions, loadRaw, exportSave, readSave, importSave, dailyToday, setCardBack } from './meta.js';
import { bootDone, syncWake, insets, toggleFullscreen, toast } from './pwa.js';
import { temperPick } from './effects.js';
import { render as draw } from './render/index.js';
import { deckModal } from './render/screens.js';
import { keepSlots } from './render/combat.js';
import { showCut, hideCut } from './fx.js';
import { beforeRender, afterRender, skipFx } from './juice.js';
import { sfx, applyVolumes } from './audio.js';
import { SET, applySettings, setOption, calmNow, saveSettings } from './settings.js';
import { startTutorial, skipTutorial, finishTutorial, tutorialPending } from './tutorial.js';
import { settingsModal } from './render/settings.js';
import { openEp, openBond, epAdvance, epTyping, epSkip, epStartFight, epFightDone, epSkipFight } from './episodes.js';
import { epLogModal } from './render/episodes.js';
import { artReady } from './art.js';
import './cardzoom.js';
import { setHallTime } from './render/base.js';
import { enterEndless } from './endless.js';

const qs = new URLSearchParams(location.search);
// 처음 켜면 타이틀 전에 튜토리얼 들어가기 화면 (주소에 ?notut 이면 건너뜀: 점검 도구용)
if (qs.has('notut')) { P.tutDone = true; save(); }
if (tutorialPending()) S.view = 'tutintro';
S.ui = true;   // 화면에서 하는 판: 담금질 등을 직접 고른다 (시뮬레이션은 자동)
S.dev = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:' || qs.has('dev');
// 개발판: 점검 도구(tools/smoke.mjs)가 상태를 들여다보고, 원하는 적과 바로 싸우고, 전투를 바로 이길 수 있다
if (S.dev) window.__yk = {
  S, P: () => P, render: () => render(), fight: (ids, kind = 'fight') => { startCombat(ids, kind); render(); },
  // 속성 붙은 적과 바로 싸우기: axFight(['anchor'], ['split', 'hidden'])
  axFight: (ids, axes, kind = 'fight') => { startCombat(ids, kind); for (const f of S.C.all) f.affixes.length && (f.affixes = [], f.ax = null, f.name = f.baseName); for (const k of axes) applyAffix(S.C.all[0], k); render(); },
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
  // 지금 층의 갈 수 있는 칸 하나를 원하는 종류로 바꿔 들어간다 (rest·event·shop·fight·elite)
  node: kind => {
    const G = S.G; if (!G || !kind) return false;
    const r = G.row, row = G.map.rows[r]; if (!row) return false;
    if (r > 0 && !reachable(r).length) G.took[r - 1] = Math.max(0, G.map.edges[r - 1].findIndex(e => e.length));   // 개발 치트로 칸을 건너뛰었으면 이어 준다
    const i = reachable(r).find(j => j < row.length); if (i == null) return false;
    G.screen = 'map'; row[i] = kind; goNode(r, i); render(); return G.screen;
  },
};
const seedParam = qs.has('seed') ? Number(qs.get('seed')) >>> 0 : undefined;

const stage = document.getElementById('stage');
const app = document.getElementById('app');
const modal = document.getElementById('modal');
// 그리기 전후로 연출 층(js/juice.js)이 카드·체력 막대 자리를 재고, 엔진이 쌓은 연출 사건을 순서대로 보여 준다
// 전투 중에는 화면이 꺼지지 않게 (js/pwa.js, 지원하는 기기만)
const render = () => { beforeRender(); const fx = S.fxq.splice(0); draw(app); afterRender(fx); if (tipFor && !tipFor.isConnected) hideTip(); syncWake(!!S.C); };

// 논리 640×360을 창에 맞춰 키운다. 2배 이상 들어가면 정수배, 그보다 작으면 맞춤 배율.
// 폰처럼 16:9보다 옆으로 긴 화면(2:1 등)이면 판 폭을 최대 800까지 늘려 남는 옆자리를 쓴다(높이 360은 그대로).
const W = 640, H = 360, W_MAX = 800;
// 노치·둥근 모서리(safe-area)는 빼고 남은 자리 한가운데에 둔다.
function fit() {
  const a = insets(), aw = Math.max(1, innerWidth - a.l - a.r), ah = Math.max(1, innerHeight - a.t - a.b);
  const w = Math.round(Math.min(W_MAX, Math.max(W, H * aw / ah)));
  stage.style.width = `${w}px`;
  stage.style.left = `${a.l + aw / 2}px`; stage.style.top = `${a.t + ah / 2}px`;
  const s = Math.min(aw / w, ah / H);
  const k = s >= 2 ? Math.floor(s) : Math.max(s, .5);
  stage.style.setProperty('--s', k);
  // 그림 파일 축소·확대 방식: 전투 동료(논리 높이 150)가 원본 384의 1.5배 넘게 커지면 계단, 아니면 부드럽게 (css/game.css)
  stage.dataset.art = 150 * k >= 384 * 1.5 ? 'px' : 'smooth';
  applySettings(k);   // 작은 화면이면 글자 크게(설정 「자동」)
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 120));

// 키워드 도움말: data-tip이 있는 것에 마우스를 올리거나 손가락을 대면 뜬다 (js/data/keywords.js)
const tipEl = document.getElementById('tip');
var tipFor = null;   // var: render()가 이 줄보다 먼저 불려도 되게
function showTip(el) {
  const t = el.dataset.tip; if (!t) return hideTip();
  tipFor = el; tipEl.textContent = t; tipEl.hidden = false;
  const s = parseFloat(getComputedStyle(stage).getPropertyValue('--s')) || 1;
  tipEl.style.setProperty('--ts', Math.max(1, s));
  placeTip(el);
  // 손패 카드는 커지며 올라오므로(슬레이 더 스파이어식) 다 커진 뒤 카드 옆에 다시 놓는다
  if (el.closest('.bottom .hand')) setTimeout(() => { if (tipFor === el) placeTip(el); }, 170);
}
function placeTip(el) {
  const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x, y;
  if (el.closest('.bottom .hand')) {
    x = r.right + 6 + w <= innerWidth - 4 ? r.right + 6 : Math.max(4, r.left - w - 6);
    y = Math.min(Math.max(4, r.top), innerHeight - h - 4);
  } else {
    x = Math.min(Math.max(4, r.left + r.width / 2 - w / 2), innerWidth - w - 4);
    y = r.top - h - 6; if (y < 4) y = Math.min(innerHeight - h - 4, r.bottom + 6);
  }
  tipEl.style.left = `${x}px`; tipEl.style.top = `${y}px`;
}
function hideTip() { tipFor = null; tipEl.hidden = true; }
// 소환 결과를 펼칠 때: ★5는 징글, 겹친 동료(별자리 +1)는 별자리 종, 나머지는 별똥
function revealSound(r) {
  if (!r) return;
  if (r.rarity >= 5) sfx('fanfare5');
  else if (r.stars) sfx('constel');
  else sfx('star', { rate: [1, 1, 1, .9, 1.1, 1.25][r.rarity] || 1 });
}
// title이 붙은 것(도구·달·밤의 깊이 버튼 등)도 같은 도움말로 띄운다 (손가락으로도 보이게)
stage.addEventListener('pointerover', e => {
  const el = e.target.closest('[data-tip],[title]');
  if (el && !el.dataset.tip && el.title) { el.dataset.tip = el.title; el.removeAttribute('title'); }
  if (el && el !== tipFor) showTip(el); else if (!el) hideTip();
});
stage.addEventListener('pointerleave', hideTip);
addEventListener('pointerdown', e => { if (!e.target.closest('[data-tip],[title]')) hideTip(); });
addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
// 누르면 넘기기 (docs/11 #1): 판 위를 누르면 남은 연출(배너·적 행동·띠)을 바로 끝낸다. 누른 것(카드·버튼)은 그대로 처리된다.
// 손패 카드를 누를 때는 넘기지 않는다 (남은 연출이 카드를 옮기면 누른 자리 아래 카드가 바뀔 수 있다)
stage.addEventListener('pointerdown', e => { if (modal.hidden && !e.target.closest?.('.hand .card')) { skipFx(); hideCut(); } }, true);
fit();

// 듀오 컷인: 카드가 날아가 맞은 뒤에 띄운다 (애니메이션 줄이기면 바로)
function play(uid, pick) {
  const r = playCard(uid, pick);
  const k = r.duo || r.bond; if (!k || !S.C) return;   // 이 카드로 전투가 끝났으면 컷인 없이
  const cut = () => showCut(k, !r.duo);
  if (calmNow()) cut(); else setTimeout(cut, 380);
}
// 행동 뒤: 7시 붕괴, 에피소드 특별 전투 끝 (흔들림·보스 띠 등 연출은 render()의 js/juice.js가)
function after() {
  if (S.G?.screen === 'epdone') epFightDone();   // 에피소드 특별 전투가 끝남
  checkCollapse();
}

app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset, C = S.C;
  if ('settings' in D) { S.wipeArm = false; openSettings(); return; }
  // 첫 실행 튜토리얼
  if ('tutstart' in D) { startTutorial(); render(); return; }
  if ('tutskip' in D) { skipTutorial(); render(); return; }
  if ('tutfinish' in D) { finishTutorial(); render(); return; }
  if (D.view) {
    if (D.view === 'summon') S.hint = null;
    S.view = D.view;
    if (D.view === 'party') S.mode = D.mode || null;   // 끝없는 탑: 동료 고르기 → 바로 탑 위로
    if (D.view === 'party') { S.G = null; S.C = null; S.picked = S.picked.filter(k => k && P.owned[k] || S.dev); }
    if (D.view === 'exchange') S.exMsg = '';
  }
  else if (D.pick) {
    const k = D.pick;
    S.picked = S.picked.includes(k) ? S.picked.filter(x => x !== k) : S.picked.length < 3 ? [...S.picked, k] : S.picked;
  }
  else if ('start' in D) {
    if (S.mode === 'endless') { newRun(S.picked.slice(), seedParam, runOptions(S.picked, 0)); enterEndless(true); }
    else newRun(S.picked.slice(), seedParam, runOptions(S.picked, S.depth || 0, S.startRelic));
  }
  // 「새벽」을 깬 결과 화면에서 [더 오르기]: 같은 판 그대로 끝없는 탑으로 (그 판 보상은 이미 받음)
  else if ('endless' in D) { if (S.G?.won && !S.G.endless) enterEndless(false); }
  else if (D.depth !== undefined) S.depth = +D.depth;
  else if (D.srelic) S.startRelic = D.srelic;
  // 매일의 밤: 후보 여섯 중 셋 → 오늘의 시드로 판, 규칙은 S.G.mods (js/relics.js가 도구처럼 더한다)
  else if (D.dpick) {
    const k = D.dpick, L = S.dpicked || [];
    S.dpicked = L.includes(k) ? L.filter(x => x !== k) : L.length < 3 ? [...L, k] : L;
  }
  else if ('dailystart' in D) {
    const T = dailyToday(), party = (S.dpicked || []).filter(k => T.cands.includes(k));
    if (party.length !== 3) return;
    newRun(party, T.seed, runOptions(party, 0));
    S.G.daily = { key: T.key, rule: T.rule }; S.G.mods = T.rule.mods;
  }
  else if (D.cardback !== undefined) setCardBack(D.cardback || null);
  // 판 바깥: 초심자 ★5 · 교환소 · 동료 · 도감
  else if (D.choose5) { const r = choose5(D.choose5); if (r) { S.reveal = { list: [r], open: [true], focus: 0 }; S.view = 'reveal'; sfx('fanfare5'); } }
  else if (D.ex) { const [k, a] = D.ex.split(':'); S.exMsg = exchange(k, a || null) || ''; }
  else if (D.mate) S.mate = D.mate;
  else if (D.costume) { const [k, on] = D.costume.split(':'); setCostume(k, on === '1'); }
  else if (D.ctab) S.codexTab = D.ctab;
  else if (D.replay) { showCut(D.replay, false, true); return; }
  else if ('home' in D) { setHallTime(!!S.G?.won); S.G = null; S.C = null; S.view = 'base'; S.baseTrio = null; }
  else if (D.restline) {   // 본부: 쉬는 동료에게 말 걸기 → 다음 대사
    const L = S.restLine?.k === D.restline ? S.restLine.i + 1 : Math.floor(Math.random() * 3);
    S.restLine = { k: D.restline, i: L }; sfx('select');
  }
  // 에피소드
  else if (D.ep) { const [cid, n] = D.ep.split(':'); openEp(cid, +n); }
  else if (D.bond) openBond(D.bond);
  else if ('epnext' in D) epAdvance();
  else if ('epskip' in D) epSkip();
  else if ('epauto' in D) S.ep.auto = !S.ep.auto;
  else if ('epfight' in D) epStartFight();
  else if ('epskipfight' in D) epSkipFight();
  else if ('eplog' in D) { modal.innerHTML = epLogModal(); modal.hidden = false; return; }
  // 별 소환
  else if (D.summon) {
    const list = summon(+D.summon); if (!list) return;
    S.reveal = { list, open: list.map(() => false) }; S.view = 'reveal';
    // 별똥이 떨어져 닿는 순간에 맞춰 소리 (가장 높은 등급 별똥이 마지막에 한 번 더)
    if (!calmNow()) {
      const top = Math.max(...list.map(r => r.rarity));
      setTimeout(() => sfx('star', { rate: .9 }), 420);
      if (top >= 4) setTimeout(() => sfx('star', { rate: top === 5 ? 1.25 : 1.1 }), 420 + list.length * 70);
    }
  }
  else if (D.reveal !== undefined) {
    const i = +D.reveal, r = S.reveal.list[i];
    S.reveal.open[i] = true; revealSound(r);
    if (r.kind === 'char' && r.rarity === 5) S.reveal.focus = i;   // ★5 등장 연출
  }
  else if ('revealall' in D) {
    S.reveal.open = S.reveal.open.map(() => true);
    const top = S.reveal.list.reduce((a, r) => (r.rarity > a.rarity ? r : a), S.reveal.list[0]); revealSound(top);
    const i5 = S.reveal.list.findIndex(r => r.kind === 'char' && r.rarity === 5);
    if (i5 >= 0) S.reveal.focus = i5;
  }
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
    const tk = targetOf(inst), once = tk === 'none' || tk === 'all' || (tk === 'foe' && targetableFoes().length === 1);
    // 빠른 사용(설정, 기본 켬): 대상이 하나뿐이면 한 번 눌러 바로 쓴다 (적 1마리, 대상 없는 카드, 서 있는 동료가 한 명뿐인 동료 카드)
    const standing = tk === 'ally' ? S.G.party.filter(p => !S.G.members[p].down) : [];
    const quick = SET.quick && (once || standing.length === 1) && !keepSlots();
    if (quick) play(uid, standing.length === 1 ? { ally: standing[0] } : undefined);
    else if (C.pending === uid && once) play(uid);
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
  else if (D.buysp !== undefined) specialBuy(+D.buysp);
  else if (D.spview !== undefined) { const sh = S.G.shop; if (sh) sh.spView = !sh.spView; }
  else if (D.shop) shopBuy(D.shop);
  else if ('leave' in D) leaveShop();
  else if ('deck' in D) { modal.innerHTML = deckModal(); modal.hidden = false; return; }
  else return;
  after();
  render();
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
  if ((tk === 'none' || tk === 'all' || (tk === 'foe' && targetableFoes().length === 1)) && el?.closest('.field')) return { el: el.closest('.field'), pick: undefined };
  return null;
}
function markTargets(on) { app.classList.toggle('dragmode', on); }
function endDrag(e, cancel) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  document.querySelectorAll('.dropover').forEach(x => x.classList.remove('dropover'));
  markTargets(false);
  if (!d.ghost) return;   // 끌지 않았으면 보통 click
  S.drop = { uid: d.uid, r: d.ghost.getBoundingClientRect() };   // 연출: 놓은 자리에서 대상으로 날아간다
  d.ghost.remove(); d.el.classList.remove('dragging');
  eatClick = true; setTimeout(() => { eatClick = false; }, 0);
  const tgt = cancel ? null : dropAt(e.clientX, e.clientY, d.uid);
  if (!tgt) { S.drop = null; render(); return; }
  play(d.uid, tgt.pick);
  after(); render();
}
addEventListener('pointerup', e => endDrag(e, false));
addEventListener('pointercancel', e => endDrag(e, true));
app.addEventListener('click', e => { if (eatClick) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

// 설정 창
function openSettings() {
  modal.innerHTML = settingsModal(); modal.hidden = false; modal.dataset.kind = 'settings';
  if (S.backup) modal.querySelector('.backup')?.scrollIntoView({ block: 'nearest' });   // 작은 화면: 백업 칸이 아래에 가려지지 않게
}
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-close]')) { modal.hidden = true; S.wipeArm = false; S.backup = null; delete modal.dataset.kind; return; }
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset;
  // 전체 화면 · 저장 백업 (js/pwa.js · js/meta.js)
  if ('fs' in D) { toggleFullscreen().then(() => { if (!modal.hidden) openSettings(); }); return; }
  if ('bexport' in D) { S.backup = S.backup?.mode === 'export' ? null : { mode: 'export', code: exportSave(SET) }; openSettings(); document.getElementById('backup-code')?.select(); return; }
  if ('bimport' in D) { S.backup = S.backup?.mode === 'import' ? null : { mode: 'import', text: '', arm: false }; openSettings(); document.getElementById('backup-in')?.focus(); return; }
  if ('bcopy' in D) {
    const B = S.backup, ta = document.getElementById('backup-code');
    const done = ok => { B.msg = ok ? '복사했어요. 새 기기의 설정 → 불러오기에 붙여 넣으세요.' : '복사가 막혀 있어요. 코드를 길게 눌러 전부 선택해 복사해 주세요.'; B.err = !ok; openSettings(); document.getElementById('backup-code')?.select(); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(B.code).then(() => done(true), () => { ta?.select(); done(document.execCommand?.('copy')); });
    else { ta?.select(); done(document.execCommand?.('copy')); }
    return;
  }
  if ('bapply' in D) {
    const B = S.backup;
    if (!B.arm) { const r = readSave(B.text); B.arm = r.ok; B.err = !r.ok; B.msg = r.ok ? `읽었어요 (${new Date(r.data.t).toLocaleString('ko-KR')} 저장). 한 번 더 누르면 지금 저장 대신 이걸 쓴다.` : r.err; openSettings(); return; }
    const r = importSave(B.text);
    if (!r.ok) { B.arm = false; B.err = true; B.msg = r.err; openSettings(); return; }
    if (r.settings) { Object.assign(SET, r.settings); saveSettings(); applySettings(); applyVolumes(); }
    S.backup = null; S.G = null; S.C = null; S.view = P.tutDone ? 'title' : 'tutintro';
    modal.hidden = true; delete modal.dataset.kind; render();
    toast('저장을 불러왔어요', null, null, 4000);
    return;
  }
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
  // 불러오기 칸: 다시 그려도 붙여 넣은 글이 남게 (붙여 넣으면 확인 단계는 처음부터)
  if (e.target.matches?.('textarea[data-bin]') && S.backup) { S.backup.text = e.target.value; if (S.backup.arm) { S.backup.arm = false; S.backup.msg = ''; openSettings(); const t = document.getElementById('backup-in'); t?.focus(); t?.setSelectionRange(t.value.length, t.value.length); } return; }
  const r = e.target.closest('input[data-vol]'); if (!r) return;
  SET[r.dataset.vol] = +r.value;
  setOption(r.dataset.vol, +r.value);
  const o = document.getElementById(`out-${r.dataset.vol}`); if (o) o.textContent = `${Math.round(+r.value * 100)}%`;
  applyVolumes();
});
addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.C?.pending) { S.C.pending = null; render(); }
  // 에피소드: 스페이스·엔터로 다음 줄
  else if (S.view === 'ep' && S.ep?.phase === 'read' && modal.hidden && (e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) { e.preventDefault(); epAdvance(); render(); }
});
// 에피소드 [자동]: 1.8초마다 다음 줄
setInterval(() => { if (S.view === 'ep' && S.ep?.auto && S.ep.phase === 'read' && modal.hidden && !epTyping()) { epAdvance(); render(); } }, 1800);

render();
bootDone();   // 첫 로딩 화면: 소리를 미리 받고 걷는다 (js/pwa.js)
// 그림 목록(assets/art.json)이 오면, 그림이 하나라도 있을 때만 다시 그린다 (없으면 임시 도트 그대로)
artReady.then(n => { if (n) render(); });

// 입력과 화면 전환. 규칙은 run/map/combat/meta, 그리기는 render/.
import { S, newRun, checkCollapse } from './run.js';
import { goNode, reachable, takeReward, rest, chooseOpt, removeCard, pickSlot, upgradeCard, dupeCard, shopBuy, specialBuy, leaveShop, pickBossRelic, pickMoon, useRelic } from './map.js';
import { playCard, endTurn, swapInCombat, targetOf, usable, startCombat, livingFoes, targetableFoes, devWin, pickCombatMoon, applyAffix } from './combat.js';
import { endlessOpen, learnTalent, resetTalents, summon, P, resetProfile, save, choose5, exchange, setCostume, runOptions, loadRaw, exportSave, readSave, importSave, dailyToday, setCardBack } from './meta.js';
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
import { seasonIntroModal, seasonScroll } from './render/season.js';
import { dawnBreakModal } from './render/endless.js';
import { fetchBoard, reportScores } from './ranking.js';
import { signIn, signUp, signOut, pushSave, pullSave } from './net.js';
import { artReady, hasArt } from './art.js';
import { seasonNow, seasonOn, startSeasonBoss, seasonBossDone, claimPass } from './season.js';
import './cardzoom.js';
import { CARDS } from './data/cards.js';
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
  // 연출 점검: 그 동료의 레전더리 공격 카드 id (tools 캡처용)
  legend: id => { const of = (r, atk) => Object.keys(CARDS).find(k => CARDS[k].ch === id && CARDS[k].rarity === r && (!atk || CARDS[k].atk)); return of('r', 1) || of('r') || of('u', 1) || of('u'); },
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
const render = () => { beforeRender(); const fx = S.fxq.splice(0); draw(app); afterRender(fx); if (tipFor && !tipFor.isConnected) hideTip(); syncWake(!!S.C); seasonScroll(app); seasonIntro(); dawnBreak(); };
// 「새벽」을 넘으면 결과 화면 위에 「계속 오르기」 창(판은 기본으로 이어진다). 매일의 밤은 「새벽」에서 끝
function dawnBreak() {
  const G = S.G;
  if (S.view !== 'run' || G?.screen !== 'result' || !G.won || G.endless || G.daily || G.tutorial || G.breakShown || !modal.hidden || !endlessOpen() || (qs.has('notut') && !qs.has('dawnbreak'))) return;   // 점검 도구(?notut)는 ?dawnbreak일 때만
  G.breakShown = true;
  setTimeout(() => { if (S.G === G && G.screen === 'result' && modal.hidden) { modal.innerHTML = dawnBreakModal(G); modal.hidden = false; modal.dataset.kind = 'dawn'; } }, 1400);
}
// 랭킹: 불러오는 동안 「불러오는 중」, 다 오면 다시 그린다(늦게 온 다른 탭 결과는 버림)
function loadRank(board) {
  S.rank = { board, state: 'loading' };
  fetchBoard(board).then(data => { if (S.rank?.board !== board) return; S.rank = { board, state: 'ok', data }; if (S.view === 'ranking') render(); })
    .catch(() => { if (S.rank?.board === board) { S.rank = { board, state: 'ok', data: { online: false, me: null } }; if (S.view === 'ranking') render(); } });
}
// 시즌 첫 소개: 시즌이 열린 뒤 본부에 처음 왔을 때 한 번 (?notut 테스트판은 ?sintro 일 때만)
function seasonIntro() {
  const s = seasonNow();
  if (S.view !== 'base' || !s?.open || P.seasonIntro === s.id || !modal.hidden || (qs.has('notut') && !qs.has('sintro'))) return;
  P.seasonIntro = s.id; save();
  modal.innerHTML = seasonIntroModal(); modal.hidden = false; modal.dataset.kind = 'sintro';
}

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
  const t = el.dataset.tip; if (!t || document.body.classList.contains('nohov')) return hideTip();
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
    y = Math.min(Math.max(4, r.bottom - h), innerHeight - h - 4);   // 카드 아래 끝에 맞춘다(위 동료를 가리지 않게)
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
// 연출 넘기기로 쓴 누르기는 그 아래 단추를 누르지 않는다 — [턴 끝]을 연달아 누르면 적 차례 연출을 넘긴 그 클릭이 새 턴까지 끝내 버리던 것
let skippedAt = -1e9, endAt = -1e9, endC = null;
stage.addEventListener('pointerdown', e => { if (modal.hidden && !e.target.closest?.('.hand .card')) { if (skipFx()) skippedAt = performance.now(); hideCut(); } }, true);
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
  if (S.G?.screen === 'sbdone') seasonBossDone();   // 시즌 보스 판이 끝남
  checkCollapse();
}

// 지도에서 칸을 고르면: 맨 앞 동료 표지가 길을 따라 0.4초에 미끄러져 가고, 칸이 한 번 번쩍인 뒤 넘어간다.
// 걸리는 시간(ms)을 돌려준다. 애니메이션 줄이기(점검 도구 포함)면 0 → 바로 넘어감.
const MAP_SLIDE = 640, MAP_FLASH = 220;   // 탑 지도: 계단을 꺾어 오르므로 조금 길게
let mapGo = null;
function mapMove(b, r, i) {
  if (calmNow()) return 0;
  const grid = b.closest('.mapgrid'), tok = grid?.querySelector('.maptok'); if (!tok) return 0;
  const path = grid.querySelector(`[data-to="${r},${i}"]`);
  path?.setAttribute('class', 'trail go');   // 고른 계단이 금색으로
  grid.classList.add('going');
  // 계단 꺾인 점을 차례로 밟아 오른다(탑 지도: 발 자리 = 칸 아래 가운데)
  const pts = (path?.getAttribute('d') || '').match(/[MVH]-?[\d.]+(?: -?[\d.]+)?/g) || [];
  let px = parseFloat(tok.style.left), py = parseFloat(tok.style.top); const kf = [{ left: `${px}px`, top: `${py}px` }];
  for (const c of pts.slice(1)) { const v = parseFloat(c.slice(1)); if (c[0] === 'V') py = v; else px = v; kf.push({ left: `${px}px`, top: `${py}px` }); }
  const x = parseFloat(b.style.left) + b.offsetWidth / 2, y = parseFloat(b.style.top) + b.offsetHeight;
  kf.push({ left: `${x}px`, top: `${y}px` });
  tok.animate(kf, { duration: MAP_SLIDE, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' });
  setTimeout(() => { b.classList.add('flash'); tok.classList.add('arrive'); sfx('select'); }, MAP_SLIDE);
  return MAP_SLIDE + MAP_FLASH;
}

app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (mapGo) return;   // 지도 표지가 가는 중: 다른 누르기는 받지 않는다
  const D = b.dataset, C = S.C;
  if ('settings' in D) { S.wipeArm = false; openSettings(); return; }
  // 첫 실행 튜토리얼
  if ('tutstart' in D) { startTutorial(); render(); return; }
  if ('tutskip' in D) { skipTutorial(); render(); return; }
  if ('tutfinish' in D) { finishTutorial(); render(); return; }
  if (D.view) {
    if (D.view === 'summon') S.hint = null;
    if (D.view === 'ranking') loadRank(S.rank?.board || 'daily');
    S.view = D.view;
    if (D.view === 'party') S.mode = D.mode || null;   // 끝없는 탑: 동료 고르기 → 바로 탑 위로
    if (D.tier !== undefined) S.sTier = +D.tier;   // 시즌 보스 난이도
    if (D.view === 'season') S.seasonOut = S.seasonOut && D.keep !== undefined ? S.seasonOut : null;
    if (D.view === 'party') { S.G = null; S.C = null; S.picked = S.picked.filter(k => k && P.owned[k] || S.dev); }
    if (D.view === 'exchange') S.exMsg = '';
  }
  else if (D.pick) {
    const k = D.pick;
    S.picked = S.picked.includes(k) ? S.picked.filter(x => x !== k) : S.picked.length < 3 ? [...S.picked, k] : S.picked;
  }
  else if ('start' in D) {
    if (S.mode === 'season') { if (!startSeasonBoss(S.picked.slice(), S.sTier || 0)) return; }
    else if (S.mode === 'endless') { newRun(S.picked.slice(), seedParam, runOptions(S.picked, 0)); enterEndless(true); }
    else newRun(S.picked.slice(), seedParam, runOptions(S.picked, S.depth || 0, S.startRelic));
    if (S.G && seasonOn()) S.G.seasonRule = seasonNow().rule.id;   // 시즌 동안 밤 오르기에도 시즌 규칙
  }
  // 「새벽」을 깬 결과 화면에서 [더 오르기]: 같은 판 그대로 끝없는 탑으로 (그 판 보상은 이미 받음)
  else if ('endless' in D) { if (S.G?.won && !S.G.endless) enterEndless(false); }
  else if ('talent' in D) { const [id, k] = D.talent.split(':'); if (learnTalent(id, k)) { sfx('get'); S.talentFx = k; } else sfx('click', { vol: .5 }); }
  else if ('talreset' in D) resetTalents(D.talreset);
  else if ('rankboard' in D) loadRank(D.rankboard);
  else if ('claimpass' in D) { const n = claimPass(); S.seasonMsg = n ? `시즌 패스 보상: 별 조각 +${n}` : ''; if (n) sfx('pass_claim'); }
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
    newRun(party, T.seed, runOptions(party, 0, undefined, { noGrow: true }));   // 매일의 밤은 모두 같은 조건(성장 없음)
    S.G.daily = { key: T.key, rule: T.rule }; S.G.mods = T.rule.mods;
    if (seasonOn()) S.G.seasonRule = seasonNow().rule.id;
  }
  else if (D.cardback !== undefined) setCardBack(D.cardback || null);
  // 판 바깥: 초심자 ★5 · 교환소 · 동료 · 도감
  else if (D.choose5) { const r = choose5(D.choose5); if (r) { S.reveal = { list: [r], open: [true], focus: 0 }; S.view = 'reveal'; sfx('fanfare5'); } }
  else if (D.ex) { const [k, a] = D.ex.split(':'); S.exMsg = exchange(k, a || null) || ''; }
  else if (D.mate) S.mate = D.mate;
  else if (D.costume) { const [k, on] = D.costume.split(':'); setCostume(k, on === '1'); }
  else if (D.ctab) S.codexTab = D.ctab;
  else if (D.cfoe) S.codexFoe = S.codexFoe === D.cfoe ? null : D.cfoe;
  else if (D.extab) { S.exTab = D.extab; S.exMsg = ''; }
  else if (D.replay) { showCut(D.replay, false, true); return; }
  else if ('home' in D) { setHallTime(!!S.G?.won); S.G = null; S.C = null; S.view = 'base'; S.baseTrio = null; }
  else if (D.restline) {   // 본부: 쉬는 동료에게 말 걸기 → 다음 대사
    const L = S.restLine?.k === D.restline ? S.restLine.i + 1 : Math.floor(Math.random() * 3);
    S.restLine = { k: D.restline, i: L }; sfx('select');
  }
  // 에피소드
  else if (D.ep) { const [cid, n] = D.ep.split(':'); openEp(cid, +n); }
  else if (D.epsel) S.epSel = D.epsel;
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
  else if (D.node) {
    const [r, i] = D.node.split(',').map(Number), ms = mapMove(b, r, i);
    if (ms) {
      mapGo = setTimeout(() => { mapGo = null; if (S.G?.screen !== 'map' || S.G.row !== r) return; goNode(r, i); after(); render(); }, ms);
      return;
    }
    goNode(r, i);
  }
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
  else if ('end' in D) {
    const t = performance.now();
    if (S.C === endC && (t - endAt < 700 || (t - skippedAt < 600 && skippedAt - endAt < 8000))) return;   // 방금 턴을 끝낸 직후, 또는 적 차례 연출을 넘긴 그 클릭(내 카드 연출을 넘긴 클릭은 그대로 턴 끝)
    endAt = t; endC = S.C; endTurn();
  }
  else if ('hg' in D) C.payEnergy = !C.payEnergy;
  else if (D.relic) useRelic(D.relic);
  else if ('take' in D) {
    // 고른 카드가 위 띠 덱 단추로 날아간 뒤에 넘어간다(뚝 끊기지 않게)
    const deck = document.querySelector('.topbar [data-deck]');
    if (D.take && deck && !calmNow() && !mapGo) {
      // 판(#stage) 안 논리 좌표로 옮겨 그 안에 띄운다(판 배율·글꼴 그대로)
      const sr = stage.getBoundingClientRect(), z = sr.width / stage.offsetWidth || 1;
      const L = el => { const x = el.getBoundingClientRect(); return { x: (x.left - sr.left) / z, y: (x.top - sr.top) / z, w: x.width / z }; };
      const r = L(b), q = L(deck), g = b.cloneNode(true);
      Object.assign(g.style, { position: 'absolute', left: `${r.x}px`, top: `${r.y}px`, width: `${b.offsetWidth}px`, height: `${b.offsetHeight}px`, margin: 0, zIndex: 80, pointerEvents: 'none', transformOrigin: '0 0', transition: 'none' });
      g.style.setProperty('--ah', getComputedStyle(b).getPropertyValue('--ah')); g.classList.add('jfly2');
      stage.append(g); b.style.visibility = 'hidden';
      app.querySelectorAll('.hand.big .card').forEach(c => { if (c !== b) c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(16px)' }], { duration: 200, fill: 'forwards' }); });
      g.animate([{ transform: 'none' }, { transform: 'translateY(-20px) scale(1.06)', offset: .25 }, { transform: `translate(${q.x - r.x}px,${q.y - r.y}px) scale(${q.w / b.offsetWidth})`, opacity: .5 }],
        { duration: 420, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { g.remove(); deck.animate([{ transform: 'scale(1.3)', filter: 'brightness(2)' }, { transform: 'none', filter: 'none' }], { duration: 220 }); };
      sfx('card');
      const id = D.take; mapGo = setTimeout(() => { mapGo = null; takeReward(id); after(); render(); }, 440);
      return;
    }
    takeReward(D.take);
  }
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
  if (drag.aim) { aimOver(e); return; }
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    // 끌면 카드는 손패에 들린 채, 쓰는 동료 → 대상(커서)으로 화살표(js/juice.js aimArrow). 모든 적 카드는 적마다, 대상 없는 카드는 자기 발밑 고리.
    // 놓을 때 대상 위면 그 대상, 대상 없는 카드는 판 아무 데나. 카드 그림이 커서를 따라다니며 노란 테두리를 띄우던 것 대신
    drag.aim = true; drag.el.classList.add('sel'); S.C.pending = drag.uid; aimOver(e); return;
    const r = drag.el.getBoundingClientRect(), g = drag.el.cloneNode(true);
    g.classList.add('dragghost'); g.removeAttribute('data-play');
    g.style.width = `${drag.el.offsetWidth}px`; g.style.height = `${drag.el.offsetHeight}px`;
    g.style.transform = `scale(${r.width / drag.el.offsetWidth})`;
    document.body.append(g); drag.ghost = g; drag.el.classList.add('dragging');
    S.C.pending = drag.uid; markTargets(true);
  }
  drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`;
});
// 화살표 끌기: 손패 카드 위를 지나 판으로 나가면 화살표가 커서를 따라가고, 대상 위에서는 대상에 붙는다
function aimOver(e) { document.body.classList.add('aiming'); }
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
  markTargets(false);
  if (d.aim) {
    document.body.classList.remove('aiming');
    eatClick = true; setTimeout(() => { eatClick = false; }, 0);
    const tgt = cancel ? null : dropAt(e.clientX, e.clientY, d.uid);
    if (!tgt) { S.C.pending = null; render(); return; }
    play(d.uid, tgt.pick); after(); render(); return;
  }
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
const closeModal = () => { modal.hidden = true; S.wipeArm = false; S.backup = null; delete modal.dataset.kind; };
// Esc로도 닫는다(덱 보기·설정 등)
addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-close]')) { closeModal(); return; }
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const D = b.dataset;
  if ('endless' in D) { closeModal(); if (S.G?.won && !S.G.endless) { enterEndless(false); render(); } return; }
  if ('sintro' in D) { closeModal(); S.view = D.sintro; if (D.sintro === 'summon') S.hint = null; render(); return; }
  // 전체 화면 · 저장 백업 (js/pwa.js · js/meta.js)
  if ('fs' in D) { toggleFullscreen().then(() => { if (!modal.hidden) openSettings(); }); return; }
  if ('bexport' in D) { S.backup = S.backup?.mode === 'export' ? null : { mode: 'export', code: exportSave(SET) }; openSettings(); document.getElementById('backup-code')?.select(); return; }
  if ('bimport' in D) { S.backup = S.backup?.mode === 'import' ? null : { mode: 'import', text: '', arm: false }; openSettings(); document.getElementById('backup-in')?.focus(); return; }
  if ('bcopy' in D) {
    const B = S.backup, ta = document.getElementById('backup-code');
    const done = ok => { B.msg = ok ? '복사했다. 새 기기의 설정 → 불러오기에 붙여 넣는다.' : '복사가 막혀 있다. 코드를 길게 눌러 전부 골라 복사한다.'; B.err = !ok; openSettings(); document.getElementById('backup-code')?.select(); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(B.code).then(() => done(true), () => { ta?.select(); done(document.execCommand?.('copy')); });
    else { ta?.select(); done(document.execCommand?.('copy')); }
    return;
  }
  // 온라인 계정 (js/net.js)
  if ('netin' in D || 'netup' in D) {
    const id = document.getElementById('net-id')?.value.trim() || '', pw = document.getElementById('net-pw')?.value || '';
    S.net = { id, busy: true }; openSettings();
    ('netup' in D ? signUp(id, pw) : signIn(id, pw))
      .then(u => { S.net = { msg: `${u.name}(으)로 접속했다.` }; reportScores(); })
      .catch(e => { S.net = { id, err: true, msg: String(e.message || e) }; })
      .finally(() => { if (!modal.hidden && modal.dataset.kind === 'settings') openSettings(); });
    return;
  }
  if ('netout' in D) { signOut(); S.net = { msg: '로그아웃했다.' }; openSettings(); return; }
  if ('netpush' in D) {
    S.net = { busy: true }; openSettings();
    pushSave(exportSave(SET)).then(() => { S.net = { msg: '서버에 저장했다.' }; }).catch(e => { S.net = { err: true, msg: String(e.message || e) }; })
      .finally(() => { if (!modal.hidden) openSettings(); });
    return;
  }
  if ('netpull' in D) {
    if (!S.net?.pullArm) { S.net = { pullArm: true, msg: '서버 저장을 받으면 이 기기 저장을 덮어쓴다.' }; openSettings(); return; }
    S.net = { busy: true }; openSettings();
    pullSave().then(row => {
      if (!row) { S.net = { err: true, msg: '서버에 저장이 없다.' }; return; }
      const r = importSave(row.data); if (!r.ok) { S.net = { err: true, msg: r.err }; return; }
      if (r.settings) { Object.assign(SET, r.settings); saveSettings(); applySettings(); applyVolumes(); }
      S.net = null; S.G = null; S.C = null; S.view = 'title'; modal.hidden = true; delete modal.dataset.kind; render();
    }).catch(e => { S.net = { err: true, msg: String(e.message || e) }; }).finally(() => { if (!modal.hidden) openSettings(); });
    return;
  }
  if ('bapply' in D) {
    const B = S.backup;
    if (!B.arm) { const r = readSave(B.text); B.arm = r.ok; B.err = !r.ok; B.msg = r.ok ? `읽었다 (${new Date(r.data.t).toLocaleString('ko-KR')} 저장). 한 번 더 누르면 지금 저장 대신 이걸 쓴다.` : r.err; openSettings(); return; }
    const r = importSave(B.text);
    if (!r.ok) { B.arm = false; B.err = true; B.msg = r.err; openSettings(); return; }
    if (r.settings) { Object.assign(SET, r.settings); saveSettings(); applySettings(); applyVolumes(); }
    S.backup = null; S.G = null; S.C = null; S.view = P.tutDone ? 'title' : 'tutintro';
    modal.hidden = true; delete modal.dataset.kind; render();
    toast('저장을 불러왔다', null, null, 4000);
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
// UI 키트 틀·단추(assets/ui/frame·btn…)는 GPT 시트에서 칸 한쪽으로 쏠려 잘려 9칸 늘이기에 쓰면 모서리가 깨진다 → 켜지 않고 css/frame.css 도트 틀을 쓴다. 로고·아이콘 조각만 쓴다
artReady.then(n => { if (n) render(); });

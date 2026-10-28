// 손맛·연출: 엔진이 쌓은 연출 사건(run.js pushFx)을 화면이 다시 그려진 뒤 순서대로 보여 준다.
// 판(#stage) 위에 연출 층(#fx) 하나: 반 해상도 캔버스(입자·궤적, 도트처럼 굵게) + DOM(숫자·배너·날아가는 카드, transform 위주).
// 화면은 매번 innerHTML로 새로 그려지므로 그리기 직전(beforeRender)에 카드·체력 막대·적 자리를 재 두고, 그린 뒤(afterRender) 맞춰 움직인다.
// 설정: 애니메이션 줄이기면 소리만, 화면 흔들림 끔이면 밀림·흔들림 없이.
import { S, dawnAt } from './run.js';
import { CHARACTERS } from './data/characters.js';
import { ACT_NAME } from './data/rules.js';
import { calmNow, SET } from './settings.js';
import { sfx } from './audio.js';
import { showPhase, showBoss, shake } from './fx.js';

const stage = document.getElementById('stage');
let layer = null, cv = null, g = null, sky = null;
function ensure() {
  if (layer || !stage) return;
  layer = document.createElement('div'); layer.id = 'fx';
  sky = document.createElement('div'); sky.className = 'sky';
  cv = document.createElement('canvas'); g = cv.getContext('2d');
  layer.append(sky, cv);
  stage.insertBefore(layer, document.getElementById('cut'));
  S.fxDriven = true;   // 전투 효과음은 연출 시간에 맞춰 여기서 낸다 (audio.js가 겹쳐 내지 않음)
}
// 캔버스는 판의 반 해상도 (1칸 = 논리 2px)
function sizeCanvas() {
  const w = Math.ceil(stage.offsetWidth / 2), h = Math.ceil(stage.offsetHeight / 2);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
}
// 화면 위치 → 판 안 논리 좌표
function rel(el) {
  const sr = stage.getBoundingClientRect(), k = sr.width / stage.offsetWidth || 1, r = el.getBoundingClientRect();
  const x = (r.left - sr.left) / k, y = (r.top - sr.top) / k, w = r.width / k, h = r.height / k;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
const app = () => document.getElementById('app');
// 지금 보이는 판(전투가 끝나 화면이 바뀌었으면 얼려 둔 전투 화면)
let frozen = null;
const root = () => frozen || app();
// 얼려 둔 화면은 data-*를 지우고 자리 표시만 data-jfi·data-jally로 남긴다 (클릭·점검 도구가 헷갈리지 않게)
const foeEl = i => frozen ? frozen.querySelector(`[data-jfi="${i}"]`) : app()?.querySelector(`[data-fi="${i}"]`);
const allyEl = id => frozen ? frozen.querySelector(`[data-jally="${id}"]`) : app()?.querySelector(`[data-ally="${id}"]`);
const rnd = (a, b) => a + Math.random() * (b - a);
const timers = new Set();
function at(ms, fn) { const t = setTimeout(() => { timers.delete(t); try { fn(); } catch (e) { /* 연출 때문에 게임이 멈추면 안 된다 */ } }, ms); timers.add(t); }

// ---------- 그리기 직전: 재 두기 ----------
let pre = null;
const shown = { seed: null, act: null };   // 지난번 그린 판·막 (막이 바뀌면 올라가는 장면)
export function beforeRender() {
  ensure(); if (!layer) return;
  if (frozen) { frozen.remove(); frozen = null; }   // 얼려 둔 화면은 다음 그리기까지만
  const C = S.C, G = S.G, A = app();
  // 상태는 이미 바뀐 뒤라, 「직전에 보이던 것」은 화면(DOM)과 지난번 그리기에서 읽는다
  pre = { hand: new Map(), bars: new Map(), foes: new Map(), chain: A ? A.querySelectorAll('.topbar .chain i.on').length : 0,
    act: shown.act, seed: shown.seed, screen: A?.dataset.screen, combatDom: A?.dataset.screen === 'combat' };
  if (!A) return;
  A.querySelectorAll('.bottom .hand .card[data-play]').forEach(el => pre.hand.set(+el.dataset.play, { r: rel(el), html: el.outerHTML, w: el.offsetWidth, h: el.offsetHeight }));
  A.querySelectorAll('[data-ally] .hpbar i').forEach(el => pre.bars.set('a:' + el.closest('[data-ally]').dataset.ally, parseFloat(el.style.width) || 0));
  A.querySelectorAll('[data-fi] .foehp i').forEach(el => pre.bars.set('f:' + el.closest('[data-fi]').dataset.fi, parseFloat(el.style.width) || 0));
  A.querySelectorAll('.foe[data-fi]').forEach(el => pre.foes.set(+el.dataset.fi, { r: rel(el), html: el.outerHTML, w: el.offsetWidth, h: el.offsetHeight }));
  // 전투가 끝나 다른 화면으로 넘어가면 마지막 전투 화면을 잠깐 얼려 두고 그 위에서 마무리 연출
  if (pre.combatDom && !S.C && S.fxq.length) {
    frozen = A.cloneNode(true); frozen.removeAttribute('id'); frozen.className = 'frozen'; frozen.inert = true;
    for (const el of [frozen, ...frozen.querySelectorAll('*')]) {
      for (const at of [...el.attributes]) if (at.name.startsWith('data-') && at.name !== 'data-screen') {
        if (at.name === 'data-fi' || at.name === 'data-ally') el.setAttribute('data-j' + at.name.slice(5), at.value);
        el.removeAttribute(at.name);
      }
      el.classList?.remove('tg', 'sel', 'jdraw');
    }
    layer.insertBefore(frozen, cv);
  }
}

// ---------- 그린 뒤: 사건을 시간 순서로 ----------
export function afterRender(events = []) {
  ensure(); if (!layer) return;
  sizeCanvas();
  setSky();
  fanHand();
  const P = pre; pre = null;
  if (calmNow()) {   // 애니메이션 줄이기: 소리만
    for (const e of events) { soundOf(e); if (e.kind === 'phase') showPhase(e.name, e.text); }
    if (S.G && S.view === 'run') { shown.seed = S.G.seed; shown.act = S.G.act; }
    dropFrozen(0);
    return;
  }
  let t = 0, turnT = null, foePhase = false, played = null;
  const barT = new Map();
  const mark = (k, ms) => { if (!barT.has(k)) barT.set(k, ms); };
  for (const e of events) {
    switch (e.kind) {
      case 'combat':
        if (e.boss) { at(t, () => { showBoss(e.boss, e.line); sfx('dawn', { vol: .6 }); }); t += 1100; }
        break;
      case 'play':
        played = e;
        flyCard(e, P, t); t += 170; break;
      case 'hitFoe': { const s = t; at(s, () => hitFoe(e, P)); mark('f:' + e.i, s); t += foePhase ? 90 : 75; break; }
      case 'kill': { const s = t + 40; at(s, () => killFoe(e, P)); t += 160; break; }
      case 'block': at(t, () => blockGain(e)); t += 50; break;
      case 'heal': at(t, () => healFx(e)); mark('a:' + e.id, t); t += 60; break;
      case 'time': at(t, () => clockFx(e, false)); t += 140; break;
      case 'rewind': at(t, () => clockFx(e, true)); t += 140; break;
      case 'phase': at(t, () => { showPhase(e.name, e.text); sfx('dawn', { vol: .5 }); }); t += 900; break;
      case 'foeTurn':
        foePhase = true;
        discardHand(P, e.keep || [], t);
        t += 220; { const s = t; at(s, () => banner('적의 차례', 'foe')); } t += 420; break;
      case 'tick': { const s = t; at(s, () => tickFx(e)); mark('f:' + e.i, s); t += 200; break; }
      case 'foeAct': { t += 80; const s = t; at(s, () => foeActFx(e)); t += e.t === 'atk' || e.t === 'mix' ? 150 : 260; break; }
      case 'hurt': { const s = t; at(s, () => hurtFx(e)); mark('a:' + e.id, s); t += 160; break; }
      case 'turn':
        if (foePhase) t += 120;
        { const s = t, n = e.n; at(s, () => { banner(n === 1 ? '전투 시작' : `${n}턴 · 내 차례`, 'me'); sfx('turn'); }); }
        turnT = t + 180; t += 200; break;
    }
  }
  tweenBars(P, barT);
  drawIn(P, turnT ?? (played ? 120 : 0));
  chainPop(P);
  // 화면 넘어감: 전투 → 보상(승리), 막이 바뀜(올라가는 장면)
  const G = S.G;
  if (P && G && P.screen === 'combat' && G.screen === 'reward') { at(t + 120, () => { banner('승리', 'win'); sfx('win'); }); dealReward(t + 420); }
  if (G && S.view === 'run' && G.screen === 'map' && !G.tutorial && P && (P.seed !== G.seed || P.act !== G.act)) at(P.seed !== G.seed ? 0 : t + 200, () => climb(G.act));
  if (G && S.view === 'run') { shown.seed = G.seed; shown.act = G.act; }
  dropFrozen(frozen ? t + 650 : 0);
}
function dropFrozen(ms) {
  if (!frozen) return;
  const f = frozen;
  at(ms, () => { if (frozen === f) frozen = null; f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'steps(4)' }).onfinish = () => f.remove(); });
}

// ---------- 효과음 (애니메이션 줄이기: 바로) ----------
function soundOf(e) {
  const k = e.kind;
  if (k === 'hitFoe') sfx(e.dmg ? styleSound(styleOf(e)) : 'block');
  else if (k === 'kill') sfx('foe_down');
  else if (k === 'hurt') sfx(e.down ? 'down' : e.dmg ? 'hurt' : 'block');
  else if (k === 'block') sfx('block', { vol: .7 });
  else if (k === 'tick') sfx(e.what === 'poison' ? 'poison' : 'hit', { vol: .6 });
  else if (k === 'heal') sfx('heal', { vol: .7 });
  else if (k === 'time' || k === 'rewind') sfx('clock', { rate: k === 'rewind' ? .8 : 1 });
  else if (k === 'turn') sfx('turn');
}

// ---------- 위 띠 하늘: 5시부터 따뜻하게, 여명(6시)이면 붉게 ----------
function setSky() {
  const G = S.G, on = !!(G && S.view === 'run' && !G.tutorial && !G.episode);
  const c = on ? G.clock : 0, d = on ? dawnAt() : 360;
  sky.classList.toggle('late', on && c >= d - 60 && c < d);
  sky.classList.toggle('dawn', on && c >= d);
}

// ---------- 손패: 부채꼴, 뽑을 때 덱에서 날아옴 ----------
function fanHand() {
  const cards = [...(app()?.querySelectorAll('.bottom .hand .card') || [])], n = cards.length, mid = (n - 1) / 2;
  cards.forEach((el, k) => {
    const d = k - mid;
    el.style.setProperty('--fr', `${(d * 2.6).toFixed(1)}deg`);
    el.style.setProperty('--fy', `${(d * d * 1.4).toFixed(1)}px`);
  });
}
function drawIn(P, base) {
  if (!P || !S.C) return;
  const A = app(), deck = A.querySelector('.endcol .note') || A.querySelector('.endcol');
  const cards = [...A.querySelectorAll('.bottom .hand .card[data-play]')].filter(el => !P.hand.has(+el.dataset.play));
  if (!cards.length || !deck) return;
  const dr = rel(deck);
  cards.forEach((el, k) => {
    const r = rel(el);
    el.style.setProperty('--dx', `${Math.round(dr.cx - r.cx)}px`);
    el.style.setProperty('--dy', `${Math.round(dr.cy - r.cy)}px`);
    el.style.setProperty('--dl', `${base + k * 70}ms`);
    el.classList.add('jdraw');
    at(base + k * 70, () => sfx('card', { vol: .35, rate: 1.2 + k * .05 }));
    at(base + k * 70 + 320, () => el.classList.remove('jdraw'));
  });
}
// 카드를 쓰면: 손에서 대상 쪽으로 날아가 터진다
function flyCard(e, P, t0) {
  let c = P?.hand.get(e.uid); if (!c) return;
  // 끌어 놓았으면 놓은 자리에서 출발
  if (S.drop?.uid === e.uid) {
    const sr = stage.getBoundingClientRect(), k = sr.width / stage.offsetWidth || 1, d = S.drop.r;
    const cx = (d.left + d.width / 2 - sr.left) / k, cy = (d.top + d.height / 2 - sr.top) / k;
    c = { ...c, r: { ...c.r, cx, cy } };
  }
  S.drop = null;
  const ghost = cloneAt(c, 'jfly');
  let tgt = e.foe != null ? foeEl(e.foe) : e.ally ? allyEl(e.ally) : e.target === 'all' ? root()?.querySelector('.foes')
    : e.actor ? allyEl(e.actor) : root()?.querySelector('.field');
  const to = tgt ? rel(tgt) : { cx: c.r.cx, cy: c.r.cy - 80 };
  const dx = to.cx - c.r.cx, dy = to.cy - c.r.cy;
  ghost.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${dx * .35}px,${dy * .35 - 18}px) scale(1.08) rotate(${dx > 0 ? -6 : 6}deg)`, opacity: 1, offset: .4 },
    { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(${dx > 0 ? 14 : -14}deg)`, opacity: .2 },
  ], { duration: 190, delay: t0, easing: 'steps(7)', fill: 'backwards' }).onfinish = () => ghost.remove();
  const col = colOf(e.actor || e.a || e.ch);
  at(t0 + 180, () => { ring(to.cx, to.cy, col, 6, 22, 9); if (!e.atk) sparks(to.cx, to.cy, col, 8, 1.4); });
}
function cloneAt(c, cls) {
  const wrap = document.createElement('div');
  wrap.className = `jghost ${cls}`;
  wrap.innerHTML = c.html;
  const el = wrap.firstElementChild;
  for (const x of [el, ...el.querySelectorAll('*')]) for (const at of [...x.attributes]) if (at.name.startsWith('data-')) x.removeAttribute(at.name);
  el.classList.remove('sel', 'jdraw', 'tg');
  wrap.inert = true;
  el.style.width = `${c.w}px`; el.style.height = `${c.h}px`;
  wrap.style.left = `${c.r.cx - c.w / 2}px`; wrap.style.top = `${c.r.cy - c.h / 2}px`;
  wrap.style.width = `${c.w}px`; wrap.style.height = `${c.h}px`;
  layer.insertBefore(wrap, cv.nextSibling);
  return wrap;
}
// 턴 끝: 남은 손패가 버린 더미로
function discardHand(P, keep, t0) {
  if (!P) return;
  const pile = app()?.querySelector('.endcol .note'); if (!pile) return;
  const pr = rel(pile);
  let k = 0;
  for (const [uid, c] of P.hand) {
    if (keep.includes(uid)) continue;
    const ghost = cloneAt(c, 'jdisc'), d = k++;
    ghost.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${pr.cx - c.r.cx}px,${pr.cy - c.r.cy}px) scale(.25) rotate(${30 + d * 8}deg)`, opacity: 0 },
    ], { duration: 240, delay: t0 + d * 40, easing: 'steps(6)', fill: 'backwards' }).onfinish = () => ghost.remove();
  }
}
// 연계 칸이 찰 때 톡 튀어 오른다
function chainPop(P) {
  if (!P || !S.C) return;
  const pips = app()?.querySelectorAll('.topbar .chain i') || [];
  for (let k = P.chain; k < S.C.chain && k < pips.length; k++) { pips[k].classList.add('jpop'); if (S.C.chain >= pips.length) pips[k].classList.add('full'); }
}
// 체력 막대: 예전 길이에서 줄어들고, 흰 잔상이 늦게 따라온다
function tweenBars(P, barT) {
  if (!P) return;
  for (const [k, w0] of P.bars) {
    const [kind, id] = k.split(':');
    const host = kind === 'a' ? app()?.querySelector(`[data-ally="${id}"] .hpbar`) : app()?.querySelector(`[data-fi="${id}"] .foehp`);
    const bar = host?.querySelector('i'); if (!bar) continue;
    const w1 = parseFloat(bar.style.width) || 0;
    if (Math.abs(w1 - w0) < .5) continue;
    const d = barT.get(k) ?? 0;
    bar.animate([{ width: `${w0}%` }, { width: `${w1}%` }], { duration: 260, delay: d, easing: 'steps(5)', fill: 'backwards' });
    if (w1 < w0) {
      const lag = document.createElement('b'); lag.className = 'lag'; lag.style.width = `${w0}%`;
      host.insertBefore(lag, bar);
      lag.animate([{ width: `${w0}%` }, { width: `${w0}%`, offset: .5 }, { width: `${w1}%` }], { duration: 700, delay: d, easing: 'steps(8)', fill: 'forwards' }).onfinish = () => lag.remove();
    }
  }
}

// ---------- 타격 ----------
const STYLE = { iris: 'slash', akane: 'slash', laila: 'slash', mimimomo: 'slash', sebas: 'slash', brick: 'boom', mariana: 'boom', fukuro: 'boom',
  sion: 'star', raven: 'mist', marta: 'impact', zeno: 'impact', gordon: 'impact', dora: 'impact', finn: 'impact', sigrun: 'pierce',
  noel: 'magic', lunaria: 'magic', eleonore: 'magic', tomori: 'magic' };
const styleOf = e => e.counter ? 'impact' : e.slash ? 'slash' : e.gun ? 'boom' : STYLE[e.actor] || 'impact';
const styleSound = s => ({ slash: 'slash', boom: 'cannon', star: 'spirit', mist: 'poison', magic: 'mana' })[s] || 'hit';
const colOf = id => CHARACTERS[id]?.col || '#ece8f6';

function hitFoe(e, P) {
  const el = foeEl(e.i) || null;
  const r = el ? rel(el) : P?.foes.get(e.i)?.r; if (!r) return;
  const img = el?.querySelector('img'), ir = img ? rel(img) : r;
  const x = ir.cx, y = ir.cy, col = colOf(e.actor), st = styleOf(e);
  if (st === 'slash') slashFx(x, y, col);
  else if (st === 'boom') { const from = e.actor && allyEl(e.actor); if (from) tracer(rel(from).cx, rel(from).y + 20, x, y, '#ffd890'); boomFx(x, y); }
  else if (st === 'star') { const from = allyEl('sion'); if (from) starTrail(rel(from).cx, rel(from).y + 14, x, y, col); sparks(x, y, '#fff6c8', 10, 1.6); }
  else if (st === 'mist') { mistFx(x, y); sparks(x, y, '#c8ffb0', 6, 1.2); }
  else if (st === 'pierce') { tracer(x - 40, y - 50, x + 6, y + 6, '#f0f4ff'); sparks(x, y, '#ffffff', 10, 2); }
  else if (st === 'magic') { ring(x, y, col, 4, 24, 12); sparks(x, y, col, 12, 1.8); }
  else impactFx(x, y, col);
  if (e.blocked) shieldBreak(x, y - 6, e.dmg === 0);
  if (el) pulse(el, SET.shake ? 'jhitF' : 'jflash', 240);
  if (e.dmg > 0) num(x, ir.y + 6, String(e.dmg), e.crit ? 'crit' : '', e.dmg);
  else if (e.blocked) num(x, ir.y + 6, '막음', 'blk', 8);
  if (e.bleed) at(110, () => num(x + 14, ir.y + 16, String(e.bleed), 'bleed', e.bleed));
  sfx(e.dmg ? styleSound(st) : 'block');
}
function killFoe(e, P) {
  const c = P?.foes.get(e.i); if (!c) return;
  const ghost = cloneAt(c, 'jdie');
  ghost.firstElementChild.classList.remove('tg');
  ghost.animate([
    { filter: 'brightness(1)', transform: 'none', opacity: 1 },
    { filter: 'brightness(4)', transform: 'translateX(4px)', opacity: 1, offset: .15 },
    { filter: 'brightness(2.5) grayscale(1)', transform: 'translateY(4px) scaleY(.9)', opacity: .8, offset: .5 },
    { filter: 'brightness(1) grayscale(1)', transform: 'translateY(14px) scaleY(.2)', opacity: 0 },
  ], { duration: 560, easing: 'steps(9)' }).onfinish = () => ghost.remove();
  const img = ghost.querySelector('img'), r = img ? rel(img) : c.r;
  for (let k = 0; k < 26; k++) add({ k: 'dot', x: rnd(r.x, r.x + r.w), y: rnd(r.y, r.y + r.h), vx: rnd(-.6, .6), vy: rnd(-1.6, -.2), g: .05, life: rnd(18, 34), col: k % 3 ? '#ece8f6' : '#8a86b8', s: 1 });
  ring(r.cx, r.cy, '#ffffff', 6, 40, 14);
  sfx('foe_down');
  if (e.boss) shake();
}
function hurtFx(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector('img'), r = img ? rel(img) : rel(el), x = r.cx, y = r.cy;
  if (e.blocked) shieldBreak(x, y - 4, e.dmg === 0);
  if (e.dmg > 0) {
    impactFx(x, y, '#ff6a7a');
    pulse(el, SET.shake ? 'jhitA' : 'jflash', 240);
    num(x, r.y + 4, String(e.dmg), 'hurt', e.dmg);
    if (e.dmg >= 10) shake();
  } else num(x, r.y + 4, '막음', 'blk', 8);
  if (e.down) {
    at(160, () => { pulse(el, 'jdown', 600); num(x, r.y + 18, '쓰러짐', 'down', 12); for (let k = 0; k < 14; k++) add({ k: 'dot', x: rnd(r.x, r.x + r.w), y: r.y + r.h, vx: rnd(-1, 1), vy: rnd(-1, -.2), g: .06, life: 22, col: '#6a6688', s: 1 }); });
    sfx('down');
  } else sfx(e.dmg ? 'hurt' : 'block');
}
function foeActFx(e) {
  const el = foeEl(e.i); if (!el) return;
  const img = el.querySelector('img'), r = img ? rel(img) : rel(el);
  if (e.t === 'atk' || e.t === 'mix') { pulse(el, SET.shake ? 'jlunge' : 'jflash', 260); pulse(el.querySelector('.intent'), 'jfire', 300); }
  else if (e.t === 'blk') { shieldIcon(r.cx, r.cy - 4, '#c9d2f0'); sfx('block', { vol: .6 }); }
  else if (e.t === 'buf') { for (let k = 0; k < 14; k++) add({ k: 'dot', x: rnd(r.x, r.x + r.w), y: r.y + r.h, vx: 0, vy: rnd(-1.4, -.6), g: 0, life: 24, col: '#ff7a6a', s: 1 }); num(r.cx, r.y, `힘 +${e.v}`, 'buf', 10); sfx('mana', { rate: .7 }); }
  else if (e.t === 'deb' || e.t === 'curse') { ring(r.cx, r.cy, '#b48ae8', 6, 30, 12); sfx('poison', { rate: .8 }); }
  else if (e.t === 'time') { /* 'time' 사건이 시계를 보여 준다 */ }
}
function tickFx(e) {
  const el = foeEl(e.i); if (!el) return;
  const img = el.querySelector('img'), r = img ? rel(img) : rel(el);
  if (e.what === 'poison') { mistFx(r.cx, r.cy); num(r.cx, r.y + 8, String(e.dmg), 'poison', e.dmg); sfx('poison', { vol: .6 }); }
  else { flames(r.cx, r.cy + 10); num(r.cx, r.y + 8, String(e.dmg), 'burn', e.dmg); sfx('hit', { vol: .5, rate: 1.3 }); }
  pulse(el, 'jflash', 200);
}
function blockGain(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector('img'), r = img ? rel(img) : rel(el);
  shieldIcon(r.cx, r.cy, '#c9d2f0');
  num(r.cx + 12, r.y + 10, `+${e.n}`, 'blkup', 9);
  sfx('block', { vol: .6 });
}
function healFx(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector('img'), r = img ? rel(img) : rel(el);
  for (let k = 0; k < 10; k++) add({ k: 'dot', x: rnd(r.x + 4, r.x + r.w - 4), y: rnd(r.cy, r.y + r.h), vx: 0, vy: rnd(-1.2, -.5), g: 0, life: 26, col: k % 2 ? '#9af0a0' : '#e8ffe8', s: 1 });
  num(r.cx, r.y + 8, `+${e.n}`, 'heal', 10);
  sfx('heal', { vol: .7 });
}
// 시간 카드: 위 띠 시계에서 바늘이 한 바퀴, 화면이 살짝 밝아진다(새벽이 가까워짐). 되돌리기는 거꾸로, 푸르게.
function clockFx(e, back) {
  const ck = document.querySelector('#app .topbar .clock');
  const r = ck ? rel(ck) : { cx: 40, cy: 15 };
  const d = document.createElement('div');
  d.className = `jclock ${back ? 'back' : ''}`;
  d.style.left = `${r.cx}px`; d.style.top = `${r.cy + 36}px`;
  d.innerHTML = '<i></i><b></b><span>' + (back ? `−${e.m}분` : `+${e.m}분`) + '</span>';
  layer.append(d);
  d.querySelector('i').animate([{ transform: 'rotate(0)' }, { transform: `rotate(${back ? -360 : 360}deg)` }], { duration: 520, easing: 'steps(12)' });
  d.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .15 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .8 }, { opacity: 0, transform: 'translate(-50%,-60%) scale(1)' }],
    { duration: 760, easing: 'steps(10)' }).onfinish = () => d.remove();
  const w = document.createElement('div'); w.className = `jwarm ${back ? 'back' : ''}`; layer.append(w);
  w.animate([{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: 600, easing: 'steps(6)' }).onfinish = () => w.remove();
  if (ck) pulse(ck, 'jtick', 500);
  sfx('clock', { rate: back ? .8 : 1 });
  if (e.dawn) at(300, () => banner('해가 뜬다', 'dawn'));
}

// ---------- 배너·장면 ----------
function banner(text, cls) {
  const b = document.createElement('div');
  b.className = `jbanner ${cls}`; b.innerHTML = `<span>${text}</span>`;
  layer.append(b);
  b.animate([
    { transform: 'translate(-50%,-50%) scaleY(0)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scaleY(1)', opacity: 1, offset: .15 },
    { transform: 'translate(-50%,-50%) scaleY(1)', opacity: 1, offset: .75 },
    { transform: 'translate(-50%,-50%) scaleY(0)', opacity: 0 },
  ], { duration: cls === 'win' ? 900 : 640, easing: 'steps(10)' }).onfinish = () => b.remove();
  b.querySelector('span').animate([{ transform: 'translateX(-30px)' }, { transform: 'translateX(0)', offset: .2 }, { transform: 'translateX(8px)' }], { duration: cls === 'win' ? 900 : 640, easing: 'steps(10)' });
}
// 보상 카드가 한 장씩 내려앉는다
function dealReward(t0) {
  const cards = app()?.querySelectorAll('[data-screen="reward"] .hand.big .card') || [];
  cards.forEach((el, k) => {
    el.animate([{ transform: 'translateY(-40px) rotate(-8deg) scale(.6)', opacity: 0 }, { transform: 'translateY(4px) rotate(1deg) scale(1.03)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }],
      { duration: 320, delay: t0 + k * 110, easing: 'steps(8)', fill: 'backwards' });
    at(t0 + k * 110, () => sfx('card', { vol: .5, rate: .9 + k * .1 }));
  });
  const gold = app()?.querySelector('[data-screen="reward"] .center > .note');
  if (gold) gold.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t0, easing: 'steps(4)', fill: 'backwards' });
}
// 막이 바뀌면: 탑을 올라가는 짧은 장면
function climb(act) {
  const d = document.createElement('div');
  d.className = `jclimb a${act}`;
  d.innerHTML = `<i class="tw"></i><i class="st"></i><b>${ACT_NAME[act] || ''}</b>`;
  layer.append(d);
  d.querySelector('.tw').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(160px)' }], { duration: 1400, easing: 'steps(20)' });
  d.querySelector('.st').animate([{ backgroundPositionY: '0px' }, { backgroundPositionY: '90px' }], { duration: 1400, easing: 'steps(20)' });
  d.querySelector('b').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none', offset: .3 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 1400, easing: 'steps(12)' });
  d.animate([{ opacity: 1 }, { opacity: 1, offset: .82 }, { opacity: 0 }], { duration: 1500, easing: 'steps(6)' }).onfinish = () => d.remove();
  sfx('move');
}

// ---------- DOM 작은 것 ----------
function pulse(el, cls, ms) {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
// 튀어 오르는 숫자: 크기는 피해량에 비례
function num(x, y, text, cls, v = 6) {
  const el = document.createElement('div');
  el.className = `jnum ${cls}`; el.textContent = text;
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  el.style.fontSize = `${Math.round(Math.min(26, 11 + Math.sqrt(Math.max(1, v)) * 2.4))}px`;
  layer.append(el);
  el.animate([
    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
    { transform: 'translate(-50%,-110%) scale(1.35)', opacity: 1, offset: .16 },
    { transform: 'translate(-50%,-120%) scale(1)', opacity: 1, offset: .55 },
    { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 },
  ], { duration: 900, easing: 'steps(14)' }).onfinish = () => el.remove();
}

// ---------- 캔버스 입자 (반 해상도, 도트처럼 굵게) ----------
const parts = [];
let raf = 0;
function add(p) { p.age = 0; parts.push(p); if (!raf) raf = requestAnimationFrame(loop); }
function loop() {
  g.clearRect(0, 0, cv.width, cv.height);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.age++;
    if (p.age > p.life) { parts.splice(i, 1); continue; }
    draw(p);
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) g.clearRect(0, 0, cv.width, cv.height);
}
const px = (x, y, s = 1) => g.fillRect(Math.round(x / 2), Math.round(y / 2), s, s);
function draw(p) {
  const f = p.age / p.life;
  if (p.k === 'dot') {
    p.x += p.vx; p.y += p.vy; p.vy += p.g || 0;
    if (f > .7 && (p.age & 1)) return;   // 사라질 때 깜빡깜빡
    g.fillStyle = p.col; px(p.x, p.y, p.s || 1);
  } else if (p.k === 'ring') {
    const r = p.r0 + (p.r1 - p.r0) * Math.min(1, f * 1.4), n = Math.max(10, Math.round(r * 1.2));
    g.fillStyle = p.col;
    for (let k = 0; k < n; k++) if ((k + p.age) % 2 || f < .4) { const a = k / n * Math.PI * 2; px(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
  } else if (p.k === 'arc') {   // 베기 궤적: 처음 몇 칸에 걸쳐 그어지고 끝부터 사라진다
    const shown = Math.min(1, p.age / 4), tail = Math.max(0, (f - .45) / .55);
    for (let s = tail; s <= shown; s += .025) {
      const a = p.a0 + (p.a1 - p.a0) * s, w = Math.sin(s * Math.PI) * p.w;
      for (let j = 0; j <= w; j += 1.5) { g.fillStyle = j < 1.5 ? '#ffffff' : p.col; px(p.x + Math.cos(a) * (p.r - j), p.y + Math.sin(a) * (p.r - j) * p.flat); }
    }
  } else if (p.k === 'line') {   // 포탄·창·별의 꼬리
    const head = Math.min(1, p.age / p.speed), tail = Math.max(0, head - .35);
    for (let s = tail; s <= head; s += .02) { g.fillStyle = s > head - .05 ? '#ffffff' : p.col; px(p.x0 + (p.x1 - p.x0) * s, p.y0 + (p.y1 - p.y0) * s, p.s || 1); }
  } else if (p.k === 'icon') {   // 방패 도트
    const pop = f < .2 ? .6 + f * 2 : 1, dy = -f * 8;
    if (f > .7 && (p.age & 1)) return;
    g.fillStyle = p.col;
    for (let y = 0; y < SHIELD.length; y++) for (let x = 0; x < SHIELD[y].length; x++) if (SHIELD[y][x] !== '.') {
      g.fillStyle = SHIELD[y][x] === 'o' ? '#141018' : SHIELD[y][x] === 'w' ? '#ffffff' : p.col;
      g.fillRect(Math.round(p.x / 2 + (x - 4) * pop), Math.round((p.y + dy) / 2 + (y - 5) * pop), 1, 1);
    }
  } else if (p.k === 'blob') {   // 독 안개·불꽃: 디더 덩어리
    p.x += p.vx; p.y += p.vy;
    const r = p.r * (f < .3 ? f / .3 : 1);
    g.fillStyle = p.col;
    for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= r * r && ((x + y) / 2 + p.age) % 2 === 0 && Math.random() > f * .9) px(p.x + x, p.y + y);
  }
}
const SHIELD = ['.oooooo.', 'ocwwccco', 'ocwccc.o', 'occcccco', 'occcccco', '.occcco.', '.occcco.', '..occo..', '...oo...'];

function ring(x, y, col, r0, r1, life) { add({ k: 'ring', x, y, col, r0, r1, life }); }
function sparks(x, y, col, n = 8, sp = 1.5) {
  for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = rnd(.5, 1) * sp * 2; add({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .04, life: rnd(12, 22), col: k % 3 ? col : '#ffffff', s: 1 }); }
}
function slashFx(x, y, col) {
  const a0 = rnd(-2.7, -2.3);
  add({ k: 'arc', x: x + 4, y: y + 2, r: rnd(18, 24), a0, a1: a0 + 2.6, w: 6, flat: .55, col, life: 12 });
  sparks(x, y, '#ffffff', 6, 1.4);
}
function boomFx(x, y) {
  add({ k: 'blob', x, y, vx: 0, vy: 0, r: 10, col: '#ffd060', life: 8 });
  ring(x, y, '#ffb050', 4, 30, 12);
  sparks(x, y, '#ff9a4a', 16, 2.4);
}
function impactFx(x, y, col) { ring(x, y, col, 3, 18, 9); sparks(x, y, col, 10, 1.8); }
function tracer(x0, y0, x1, y1, col) { add({ k: 'line', x0, y0, x1, y1, col, speed: 6, life: 10, s: 1 }); }
function starTrail(x0, y0, x1, y1, col) { add({ k: 'line', x0, y0, x1, y1, col, speed: 9, life: 14, s: 2 }); }
function mistFx(x, y) { for (let k = 0; k < 3; k++) add({ k: 'blob', x: x + rnd(-10, 10), y: y + rnd(-6, 8), vx: rnd(-.2, .2), vy: rnd(-.5, -.2), r: rnd(7, 11), col: k % 2 ? '#7ad05a' : '#b4f07a', life: 26 }); }
function flames(x, y) { for (let k = 0; k < 12; k++) add({ k: 'dot', x: x + rnd(-10, 10), y: y + rnd(-2, 6), vx: rnd(-.2, .2), vy: rnd(-1.6, -.8), g: 0, life: rnd(14, 22), col: k % 3 ? '#ff9a4a' : '#ffe060', s: 2 }); }
function shieldBreak(x, y, held) {
  if (held) { add({ k: 'icon', x, y, col: '#c9d2f0', life: 18 }); sparks(x, y, '#c9d2f0', 6, 1.2); return; }
  for (let k = 0; k < 12; k++) { const a = rnd(-Math.PI, 0); add({ k: 'dot', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: Math.cos(a) * rnd(1, 2.6), vy: Math.sin(a) * rnd(1, 2.6), g: .12, life: 22, col: k % 2 ? '#c9d2f0' : '#6a78b8', s: 2 }); }
}
function shieldIcon(x, y, col) { add({ k: 'icon', x, y, col, life: 24 }); }

// 화면이 바뀌면(판 밖으로 나가면) 남은 연출 정리
export function clearFx() {
  for (const t of timers) clearTimeout(t); timers.clear();
  parts.length = 0;
  layer?.querySelectorAll('.jghost,.jnum,.jbanner,.jclock,.jwarm,.jclimb').forEach(x => x.remove());
}

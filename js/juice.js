// 손맛·연출: 엔진이 쌓은 연출 사건(run.js pushFx)을 화면이 다시 그려진 뒤 순서대로 보여 준다.
// 판(#stage) 위에 연출 층(#fx) 하나: 반 해상도 캔버스(입자·궤적, 도트처럼 굵게) + DOM(숫자·배너·날아가는 카드, transform 위주).
// 화면은 매번 innerHTML로 새로 그려지므로 그리기 직전(beforeRender)에 카드·체력 막대·적 자리를 재 두고, 그린 뒤(afterRender) 맞춰 움직인다.
// 설정: 애니메이션 줄이기면 소리만, 화면 흔들림 끔이면 밀림·흔들림 없이.
import { S, dawnAt } from './run.js';
import { CHARACTERS } from './data/characters.js';
import { ACT_NAME } from './data/rules.js';
import { calmNow, SET } from './settings.js';
import { sfx as sfxRaw, hasSfx, HIT_SFX, CUTIN_SFX } from './audio.js';
import { FOE } from './data/enemies.js';
// 누르면 넘기기(skipFx)로 남은 연출을 한꺼번에 돌릴 때는 효과음을 겹쳐 내지 않는다
let hush = false;
const sfx = (...a) => { if (!hush) sfxRaw(...a); };
import { showPhase, showBoss, shake, showBurst } from './fx.js';
import { battleArt, FRAMES, charArt, fxFrames, artURL } from './art.js';
import { cardData } from './data/cards.js';
import { actorOf } from './combat.js';

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
// 무대 좌표 상자. 전투 스프라이트(data-b가 붙은 그림)는 투명 여백을 뺀 몸 상자 — 숫자·이펙트·돌진이 허공이 아니라 몸에 붙게
function rel(el, full) {
  const sr = stage.getBoundingClientRect(), k = sr.width / stage.offsetWidth || 1, r = el.getBoundingClientRect();
  let x = (r.left - sr.left) / k, y = (r.top - sr.top) / k, w = r.width / k, h = r.height / k;
  const b = !full && el.dataset?.b;
  if (b) { const [bx, by, bw, bh] = b.split(' ').map(Number); x += w * bx; y += h * by; w *= bw; h *= bh; }
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
// ---------- 몸 영역: 그림마다 불투명한 부분의 상자(0~1 비율)를 한 번 재 둔다 ----------
// 동료는 몸 키를 모두 ALLY_H로 맞추고(시트마다 그려진 크기가 달라도 같은 키), 적은 지금 크기 그대로.
// 그림 칸의 여백은 음수 여백으로 레이아웃에서 빼서, 자리(발 줄·가운데)는 몸 기준이 된다
const BOX = new Map(), ALLY_H = 88;
function bodyBox(src) {
  if (!src || src.startsWith('data:')) return null;
  const b = BOX.get(src); if (b) return b === 'wait' ? null : b;
  BOX.set(src, 'wait');
  const im = new Image();
  im.onload = () => {
    const W = 96, H = Math.max(1, Math.round(96 * im.naturalHeight / im.naturalWidth)), c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, W, H);
    let d; try { d = g.getImageData(0, 0, W, H).data; } catch { BOX.delete(src); return; }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    BOX.set(src, x1 < 0 ? { x: 0, y: 0, w: 1, h: 1, ar: im.naturalWidth / im.naturalHeight } :
      { x: x0 / W, y: y0 / H, w: (x1 - x0 + 1) / W, h: (y1 - y0 + 1) / H, ar: im.naturalWidth / im.naturalHeight });
    fitSprites();
  };
  im.onerror = () => BOX.delete(src);
  im.src = src;
  return null;
}
function fitSprites() {
  const A = app(); if (!A) return;
  for (const img of A.querySelectorAll('.pm[data-ally] > img:not(.jxfade), .foe[data-fi] > img')) {
    const id = img.parentElement.dataset.ally, key = id ? battleArt(id, 'idle') : (img.dataset.src0 ||= img.getAttribute('src'));
    if (!key || img.dataset.bk === key) continue;
    const b = bodyBox(key); if (!b) continue;
    let iw, ih;
    if (id) { ih = Math.round(ALLY_H / b.h); iw = Math.round(ih * b.ar); }
    else {   // 적: css 칸 안에 들어가던(contain) 크기 그대로
      img.style.cssText = ''; const cw = img.offsetWidth, ch = img.offsetHeight; if (!cw || !ch) continue;
      const k = Math.min(cw, ch * b.ar); iw = Math.round(k); ih = Math.round(k / b.ar);
    }
    Object.assign(img.style, { width: `${iw}px`, height: `${ih}px`, objectFit: 'fill',
      margin: `${-Math.round(ih * b.y)}px ${-Math.round(iw * (1 - b.x - b.w))}px ${-Math.round(ih * (1 - b.y - b.h))}px ${-Math.round(iw * b.x)}px` });
    img.style.setProperty('--ft', `${Math.round((b.y + b.h) * 1000) / 10 - 1}%`);   // 발 높이(발밑 그림자·대상 빛)
    img.dataset.b = `${b.x} ${b.y} ${b.w} ${b.h}`; img.dataset.bk = key;
  }
}
const app = () => document.getElementById('app');
// 지금 보이는 판(전투가 끝나 화면이 바뀌었으면 얼려 둔 전투 화면)
let frozen = null;
const root = () => frozen || app();
// 얼려 둔 화면은 data-*를 지우고 자리 표시만 data-jfi·data-jally로 남긴다 (클릭·점검 도구가 헷갈리지 않게)
const foeEl = i => frozen ? frozen.querySelector(`[data-jfi="${i}"]`) : app()?.querySelector(`[data-fi="${i}"]`);
const allyEl = id => frozen ? frozen.querySelector(`[data-jally="${id}"]`) : app()?.querySelector(`[data-ally="${id}"]`);
const rnd = (a, b) => a + Math.random() * (b - a);
const timers = new Map();   // 타이머 → { when, fn } (누르면 넘기기 때 남은 것을 순서대로 바로 돌린다)
function at(ms, fn) {
  const run = () => { timers.delete(t); try { fn(); } catch (e) { /* 연출 때문에 게임이 멈추면 안 된다 */ } };
  const t = setTimeout(run, ms); timers.set(t, { when: performance.now() + ms, run });
}
// 누르면 넘기기 (docs/11 #1): 기다리는 연출(배너·적 행동·보상 내려앉기)을 지금 다 돌리고, 움직이는 연출은 끝 상태로
export function skipFx() {
  if (!layer || !timers.size) return false;
  const left = [...timers.entries()].sort((a, b) => a[1].when - b[1].when);
  hush = true;
  for (const [t, x] of left) { clearTimeout(t); x.run(); }
  hush = false;
  // 연출 층과 기다리는 등장 연출(보상 카드 등)만 끝 상태로 (손패 카드는 그대로 두어야 누른 자리 아래 카드가 바뀌지 않는다)
  const anims = [...layer.getAnimations({ subtree: true }), ...tracked];
  tracked.clear();
  for (const a of anims) { try { if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish(); } catch (e) { /* 끝낼 수 없는 연출 */ } }
  layer.querySelectorAll('.jbanner,.jclimb,.jclock,.jwarm,.jstop,.jbig,.jstolen').forEach(x => x.remove());
  freeze = 0;
  return left.length > 0;
}
export const fxBusy = () => timers.size > 0;
// 누르면 넘기기 때 끝 상태로 보낼 화면 쪽 연출 (지연이 긴 등장 연출)
const tracked = new Set();
function track(a) { tracked.add(a); a.onfinish = () => tracked.delete(a); return a; }

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
// 장면 대화 창 글이 한 글자씩 찍힌다(옛 게임 대화 창처럼). 선택지는 글이 다 나온 뒤 차례로 올라온다. 누르면 바로 끝까지.
let typedFor = '', typeTimer = null;
function typeScene() {
  const box = app()?.querySelector('.scene .sbody'); if (!box) { typedFor = ''; return; }
  const key = box.textContent; if (key === typedFor) return; typedFor = key;
  const p = box.querySelector(':scope > .note'); const acts = [...box.querySelectorAll(':scope > .acts button, :scope > .restwho, :scope > .talk')];
  if (!p || calmNow()) return;
  const full = p.innerHTML, text = p.textContent; if (!text) return;
  // 글자 수만큼 드러낸다(태그는 지키려고 글자마다 span으로 감싸지 않고, 보이는 길이만 clip)
  p.style.visibility = 'hidden';
  const ghost = p.cloneNode(false); ghost.style.visibility = 'visible'; ghost.textContent = ''; ghost.className = p.className + ' jtype';
  p.after(ghost); Object.assign(ghost.style, { position: 'absolute', left: `${p.offsetLeft}px`, top: `${p.offsetTop}px`, width: `${p.offsetWidth}px`, margin: '0' });
  for (const a of acts) a.style.opacity = '0';
  let i = 0; clearInterval(typeTimer);
  const done = () => { clearInterval(typeTimer); typeTimer = null; ghost.remove(); p.style.visibility = ''; p.innerHTML = full;
    acts.forEach((a, k) => { a.style.opacity = ''; a.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, delay: k * 60, easing: 'steps(3)', fill: 'backwards' }); });
    box.removeEventListener('pointerdown', skip, true); };
  const skip = e => { if (typeTimer) { e.stopPropagation(); e.preventDefault(); done(); } };
  box.addEventListener('pointerdown', skip, true);
  typeTimer = setInterval(() => { i = Math.min(text.length, i + 1); ghost.textContent = text.slice(0, i); if (i % 3 === 0) sfx('ui_hover', { vol: .25, rate: 1.6 }); if (i >= text.length) done(); }, 22);
}
export function afterRender(events = []) {
  ensure(); if (!layer) return;
  typeScene();
  sizeCanvas();
  fitSprites();
  charLayers();
  setSky();
  fanHand();
  gachaFx();
  ambient();
  if (pre && pre.screen && A0() && pre.screen !== A0().dataset.screen && !(pre.screen === 'combat' && A0().dataset.screen === 'reward')) screenWipe();
  const P = pre; pre = null;
  if (calmNow()) {   // 애니메이션 줄이기: 소리만
    for (const e of events) { soundOf(e); if (e.kind === 'phase') showPhase(e.name, e.text); if (e.kind === 'burst') showBurst(e.who, e.name); }
    setCounter(S.C ? S.C.dmgTurn : 0, false);
    if (S.G && S.view === 'run') { shown.seed = S.G.seed; shown.act = S.G.act; }
    dropFrozen(0);
    return;
  }
  let t = 0, turnT = null, foePhase = false, played = null, foeBack = 0;
  const barT = new Map();
  const mark = (k, ms) => { if (!barT.has(k)) barT.set(k, ms); };
  for (const e of events) {
    switch (e.kind) {
      case 'combat':
        acc = 0; stopped = 0; at(t, () => setCounter(0, false));
        preloadPoses();
        at(t, () => enterFx());
        if (e.boss) { at(t, () => { showBoss(e.boss, e.line, root()?.querySelector('.foe.boss > img')?.getAttribute('src') || ''); sfx('dawn', { vol: .6 }); }); at(t + 420, () => shake()); t += 1600; }
        break;
      case 'play': {
        played = e;
        // 필살(희귀 카드·듀오): 스킬 컷인을 먼저 띄우고 그다음 기술 (카오스 제로 나이트메어식 연출)
        const sp = isSpecial(e);
        if (sp) { at(t, () => skillCut(e)); t += 760; }
        // 카드를 낸 뒤 커서 아래로 밀려온 다음 카드가 크게 튀어 오르지 않게(커서를 움직이면 다시)
        document.body.classList.add('nohov');
        at(t, () => actFx(e, sp));
        // ★5 전용 필살은 공중에 떴다 내리찍는 등 길어서, 적중(아래 hitFoe)을 그 내리찍는 순간에 맞춰 늦춘다
        flyCard(e, P, t); t += 170 + (sp ? sigLead(e) : 0); break;
      }
      case 'hitFoe': { const s = t; at(s, () => hitFoe(e, P)); mark('f:' + e.i, s); t += foePhase ? 90 : 75; if (!e.counter) t = addDmg((e.dmg || 0) + (e.bleed || 0), s, t); break; }
      case 'kill': { const s = t + 40; at(s, () => killFoe(e, P)); t += 160; break; }
      case 'block': at(t, () => blockGain(e)); t += 50; break;
      case 'heal': at(t, () => healFx(e)); mark('a:' + e.id, t); t += 60; break;
      case 'time': at(t, () => clockFx(e, false)); t += 140; break;
      case 'rewind': at(t, () => clockFx(e, true)); t += 140; break;
      case 'phase': at(t, () => { showPhase(e.name, e.text); sfx('dawn', { vol: .5 }); }); t += 900; break;
      // 패시브 ③ 폭발 (docs/12_signature.md): 이름 띠 0.6초 + 폭발 효과음
      case 'burst': at(t, () => awaken(e.who, e.name)); t += 520; break;   // 폭발 각성: 멈칫 + 이름 띠 + 이번 턴 내내 몸이 빛남
      case 'foeTurn':
        foePhase = true;
        discardHand(P, e.keep || [], t);
        t += 220; { const s = t; at(s, () => banner('적의 차례', 'foe')); } t += 420; break;
      case 'tick': { const s = t; at(s, () => tickFx(e)); mark('f:' + e.i, s); t += 200; t = addDmg(e.dmg || 0, s, t); break; }
      // 적 쪽 연출 (짝 잃음·도전 반격·회복·부르기·훔치기·노림 바꾸기)
      case 'rage': at(t, () => rageFx(e)); t += 220; break;
      case 'veil': at(t, () => veilFx(e)); t += 240; break;
      case 'stagger': at(t, () => staggerFx(e)); t += 200; break;
      case 'duel': at(t, () => duelFx(e)); t += 160; break;
      case 'mend': at(t, () => mendFx(e)); t += 200; break;
      case 'affix': at(t, () => affixFx(e)); t += e.ax === 'haste' ? 160 : 220; break;
      case 'summon': at(t, () => summonFx(e)); t += 260; break;
      case 'steal': at(t, () => stealFx(e)); t += 240; break;
      case 'retarget': at(t, () => retargetFx(e)); t += 220; break;
      case 'foeAct': {
        // 노린 동료: 사건에 없으면 이 행동 뒤에 이어지는 첫 피격(hurt)에서 찾는다
        if ((e.t === 'atk' || e.t === 'mix') && e.target == null && e.aim == null) {
          for (let j = events.indexOf(e) + 1; j < events.length; j++) {
            const x = events[j]; if (x.kind === 'foeAct' || x.kind === 'turn') break;
            if (x.kind === 'hurt') { e.aim = x.id; break; }
          }
        }
        // 앞 적이 돌진에서 돌아온 뒤에 다음 적 (적 차례가 한 명씩 또렷하게)
        t = Math.max(t, foeBack) + 80;
        if ((e.t === 'atk' || e.t === 'mix') && !calmNow()) {
          // 예고(의도가 불타며 들썩, 몸을 웅크림) → 돌진, 맞는 순간에 피격이 오게
          { const s = t; at(s, () => foeWindup(e)); } t += 240;
          { const s = t; at(s, () => foeActFx(e)); } t += 150; foeBack = t + 430;
        } else { const s = t; at(s, () => foeActFx(e)); t += e.t === 'atk' || e.t === 'mix' ? 150 : 260; }
        break; }
      case 'hurt': { const s = t; at(s, () => hurtFx(e)); mark('a:' + e.id, s); t += 160; break; }
      case 'turn':
        if (foePhase) t = Math.max(t, foeBack) + 120;
        acc = 0; stopped = 0; { const s = t; at(s, () => setCounter(0, true)); }
        { const s = t, n = e.n; at(s, () => { banner(n === 1 ? '전투 시작' : `${n}턴`, 'me'); sfx('turn'); }); }
        turnT = t + 180; t += 200; break;
    }
  }
  arrowSvg = null; layer.querySelector('.jarrow')?.remove(); aimArrow(null);
  tweenBars(P, barT);
  drawIn(P, turnT ?? (played ? 120 : 0));
  chainPop(P);
  // 화면 넘어감: 전투 → 보상(승리), 막이 바뀜(올라가는 장면)
  const G = S.G;
  if (P && G && P.screen === 'combat' && G.screen === 'reward') { at(t + 120, () => { banner('승리', 'win'); sfx('win'); winPose(); }); dealReward(t + 420); }
  if (G && G.screen === 'result' && P && P.screen !== 'result') countUp(frozen ? t + 650 : 0);
  if (G && S.view === 'run' && G.screen === 'map' && !G.tutorial && P && (P.seed !== G.seed || P.act !== G.act)) {
    const t0 = P.seed !== G.seed ? 0 : t + 200;
    at(t0, () => climb(G.act));
    if (!G.endless && G.row === 0) at(t0 + 1350, () => actBand(G.act));   // 올라가는 장면이 걷힐 즈음 지도 위로 막 이름 띠
  }
  if (G && S.view === 'run') { shown.seed = G.seed; shown.act = G.act; }
  if (!S.C) at(frozen ? t + 650 : 0, () => setCounter(0, false));
  dropFrozen(frozen ? t + 650 : 0);
}
function dropFrozen(ms) {
  if (!frozen) return;
  const f = frozen;
  at(ms, () => { if (frozen === f) frozen = null; f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => f.remove(); });
}

// ---------- 효과음 (애니메이션 줄이기: 바로) ----------
function soundOf(e) {
  const k = e.kind;
  if (k === 'hitFoe') sfx(e.dmg ? atkSound(e) : 'block');
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
  // 카드는 쓰는 동료 머리 위로 날아가 빛으로 흩어진다(그 동료가 기술을 펼친다) — 대상 쪽 연출은 동료 동작·이펙트가 맡는다
  const caster = e.actor ? allyEl(e.actor)?.querySelector(':scope > img') : null;
  const tgt = caster || (e.foe != null ? foeEl(e.foe) : root()?.querySelector('.field'));
  const r = tgt ? rel(tgt) : null, to = r ? { cx: r.cx, cy: caster ? r.y + 6 : r.cy } : { cx: c.r.cx, cy: c.r.cy - 80 };
  const dx = to.cx - c.r.cx, dy = to.cy - c.r.cy;
  ghost.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1, filter: 'none' },
    { transform: `translate(${dx * .5}px,${dy * .55 - 14}px) scale(.9) rotate(${dx > 0 ? -4 : 4}deg)`, opacity: 1, offset: .45 },
    { transform: `translate(${dx}px,${dy}px) scale(.55) rotate(0)`, opacity: 1, filter: 'brightness(2.2)', offset: .8 },
    { transform: `translate(${dx}px,${dy - 4}px) scale(.62)`, opacity: 0, filter: 'brightness(3)' },
  ], { duration: 240, delay: t0, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'backwards' }).onfinish = () => ghost.remove();
  const col = colOf(e.actor || e.a || e.ch);
  at(t0 + 200, () => {
    ring(to.cx, to.cy, col, 4, 20, 10);
    // 흩어지는 빛 조각이 동료 쪽으로 쏟아진다
    for (let k = 0; k < 16; k++) add({ k: 'dot', x: to.cx + rnd(-10, 10), y: to.cy + rnd(-12, 4), vx: rnd(-1.2, 1.2), vy: rnd(-.6, 1.4), g: .05, life: rnd(12, 22), col: k % 3 ? col : '#ffffff', s: k % 4 ? 1 : 2 });
  });
}
// 동료 모션: 카드를 쓴 동료는 공격·스킬·방어, 맞은 동료는 피격. 전투 스프라이트(sprites/<id>_<frame>.png)가 있으면
// 그 동작 칸으로 잠깐 바꿔 끼우고, 없으면 움직임만. 칸은 섞지 않고 바로 바꾼다(도트가 흐물거리지 않게). 가만히 있을 때는 css 1px 위아래만.
const busy = new WeakSet();
const PRE = new Map();   // 미리 받은 그림(버려지지 않게 붙들어 둠)
function preloadPoses() {
  for (const id of S.G?.party || []) { for (const k of FRAMES) { const u = battleArt(id, k); if (u) new Image().src = u; } bodyBox(battleArt(id, 'idle')); }
  // 이펙트 프레임도 미리 받아 둔다(재생 중에 그림을 바꿀 때 받다 끊기지 않게)
  for (const n of [...(S.G?.party || []).flatMap(id => [`${id}_atk`, `${id}_skill`, `${id}_aura`, `${id}_pet_idle`, `${id}_pet_atk`, `${id}_proj`]), 'slash', 'explode', 'pierce', 'magic']) for (const u of fxFrames(n)) if (!PRE.has(u)) { const im = new Image(); im.src = u; PRE.set(u, im); }
}
// 칸 바꾸기: 전 칸을 위에 잠깐 겹쳐 두고 흐리게 사라지게(교차 페이드). 동작 칸으로 들어갈 때는 바로(빠른 동작이 또렷하게), 돌아올 때·숨쉬기는 부드럽게
function swapSrc(img, url, fade) {
  const was = img.getAttribute('src');
  if (was === url) return;
  if (fade && img.parentElement && !calmNow()) {
    const g = img.cloneNode(); g.className = 'px jxfade'; g.removeAttribute('alt');
    // 레이아웃 좌표(offsetLeft/Top)로 놓아 부모의 transform(입체 배치)·크기 보정과 상관없이 같은 자리에
    Object.assign(g.style, { left: `${img.offsetLeft}px`, top: `${img.offsetTop}px`, width: `${img.offsetWidth}px`, height: `${img.offsetHeight}px`, margin: '0' });
    img.after(g);
    g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, easing: 'ease-out' }).onfinish = () => g.remove();
  }
  img.src = url;
}
function pose(id, kind, ms) {
  const img = allyEl(id)?.querySelector(':scope > img'), u = battleArt(id, kind);
  if (!img || !u) return false;
  const was = img.getAttribute('src');
  swapSrc(img, u, 0); busy.add(img);
  setTimeout(() => { busy.delete(img); if (img.isConnected && img.getAttribute('src') === u) swapSrc(img, was, 0); }, ms);
  return true;
}
// 승리: 살아 있는 동료가 승리 동작
function winPose() {
  for (const id of S.G?.party || []) if (!S.G.members[id]?.down) pose(id, 'win', 1400);
}
// ---------- 대상 화살표 (슬레이 더 스파이어식): 손패 카드에 마우스를 대거나 고르면 쓰는 동료 → 대상으로 화살표 ----------
// 대상을 고르는 카드는 커서를 따라가다 고를 수 있는 대상 위에서 붙고, 모든 적 카드는 적마다, 대상 없는 카드는 쓰는 동료 자신을 감싼다.
const SVGNS = 'http://www.w3.org/2000/svg';
let arrowSvg = null, pt = null;
function toStage(e) { const sr = stage.getBoundingClientRect(), k = sr.width / stage.offsetWidth || 1; return { x: (e.clientX - sr.left) / k, y: (e.clientY - sr.top) / k }; }
if (stage) {
  stage.addEventListener('pointermove', e => { pt = toStage(e); if (e.movementX || e.movementY) document.body.classList.remove('nohov'); aimArrow(e.target); }, { passive: true });
  stage.addEventListener('pointerleave', () => { pt = null; aimArrow(null); });
}
function aimArrow(over) {
  ensure(); if (!layer) return;
  if (!arrowSvg) { arrowSvg = document.createElementNS(SVGNS, 'svg'); arrowSvg.setAttribute('class', 'jarrow'); layer.append(arrowSvg); }
  arrowSvg.innerHTML = '';
  root()?.querySelectorAll('.jaimed').forEach(x => x.classList.remove('jaimed'));
  const C = S.C, A = app();
  if (!C || !A || calmNow() || A.dataset.screen !== 'combat') return;
  const card = A.querySelector('.bottom .hand .card.sel') || (over && over.closest?.('.bottom .hand .card[data-play]'));
  if (!card || card.classList.contains('no')) return;
  const inst = C.hand.find(h => String(h.uid) === card.dataset.play); if (!inst) return;
  const d = cardData(inst.id), who = actorOf(d), from = who && allyEl(who)?.querySelector(':scope > img'); if (!from) return;
  const col = colOf(who), a = rel(from), x0 = a.cx, y0 = a.y + a.h * .35;
  const foes = [...A.querySelectorAll('.foe[data-foe]')], allies = [...A.querySelectorAll('.pm[data-ally]:not(.down)')];
  const want = d.target === 'ally' ? allies : d.target === 'foe' ? foes : d.target === 'all' ? foes : [];
  const hov = over?.closest?.(d.target === 'ally' ? '.pm[data-ally]' : '.foe[data-foe]');
  let tgts = [];
  if (hov && want.includes(hov)) tgts = [hov];
  else if (d.target === 'all') tgts = foes;
  else if (want.length === 1) tgts = want;
  if (tgts.length) for (const t of tgts) { t.classList.add('jaimed'); const r = rel(t.querySelector(':scope > img') || t); arrow(x0, y0, r.cx, r.y + r.h * .45, col); }
  else if (want.length && card.classList.contains('sel') && pt) arrow(x0, y0, pt.x, pt.y, col);
  else if (!want.length) { from.closest('[data-ally]')?.classList.add('jaimed'); selfRing(a, col); }
}
function arrow(x0, y0, x1, y1, col) {
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.max(30, Math.abs(x1 - x0) * .35);
  const p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', `M${x0},${y0} Q${mx},${my} ${x1},${y1}`); p.setAttribute('class', 'line'); p.style.setProperty('--c', col);
  // 끝 화살촉: 곡선의 마지막 방향
  const ang = Math.atan2(y1 - my, x1 - mx), h = document.createElementNS(SVGNS, 'path'), L = 9, W = .5;
  h.setAttribute('d', `M${x1},${y1} L${x1 - L * Math.cos(ang - W)},${y1 - L * Math.sin(ang - W)} L${x1 - L * Math.cos(ang + W)},${y1 - L * Math.sin(ang + W)}Z`);
  h.setAttribute('class', 'head'); h.style.setProperty('--c', col);
  arrowSvg.append(p, h);
}
function selfRing(a, col) {
  const e = document.createElementNS(SVGNS, 'ellipse');
  e.setAttribute('cx', a.cx); e.setAttribute('cy', a.y + a.h - 3); e.setAttribute('rx', a.w * .42); e.setAttribute('ry', 5);
  e.setAttribute('class', 'self'); e.style.setProperty('--c', col); arrowSvg.append(e);
}

// 카드마다 모션: 슬레이 더 스파이어처럼 짧고 또렷하게, 기술 종류마다 자세 + 움직임: 근접 베기·원거리 사격·휩쓸기·필살·방어·회복·시간·뽑기·시전
const RANGED = new Set(['boom', 'star', 'magic']);
export function motionOf(d, actor) {
  if (!d) return 'cast';
  const t = String(d.text || '');
  if (d.time) return 'time';
  if (d.atk && d.target === 'all') return 'sweep';
  if (d.atk && d.exhaust) return 'finisher';
  if (d.atk) return RANGED.has(STYLE[actor]) ? 'shot' : 'slash';
  if (/방어/.test(t)) return 'guard';
  if (/회복/.test(t)) return 'heal';
  if (/뽑|카드 \d장/.test(t)) return 'draw';
  return 'cast';
}
// 모션 → [움직임 class, 시간, 바꿔 끼울 자세 그림]
const MOTION = {
  slash: ['jatk', 400, 'attack'], shot: ['jshot', 400, 'attack'], sweep: ['jsweep', 500, 'attack'], finisher: ['jfin', 620, 'attack'],
  guard: ['jguard', 470, 'guard'], heal: ['jheal', 570, 'skill'], time: ['jtime', 570, 'skill'], draw: ['jdraw2', 380, 'skill'], cast: ['jcast', 520, 'skill'],
};
// 오라는 상황에 맞게: 기술을 쓰면 확 커지며 밝아지고(필살은 화면을 덮을 만큼), 맞으면 흔들리며 꺼질 듯 깜빡
function auraFlare(id, k = 1.5, ms = 600) {
  const el = allyEl(id)?.querySelector(':scope > .jaura'); if (!el || calmNow()) return;
  el.animate([{ scale: '1', opacity: .55 }, { scale: String(k), opacity: 1, offset: .25 }, { scale: String(1 + (k - 1) * .6), opacity: .9, offset: .7 }, { scale: '1', opacity: .55 }],
    { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' });
}
function auraHurt(id) {
  const el = allyEl(id)?.querySelector(':scope > .jaura'); if (!el || calmNow()) return;
  el.animate([{ opacity: .1, translate: '-3px 0' }, { opacity: .7, translate: '2px 0', offset: .3 }, { opacity: .2, offset: .55 }, { opacity: .55, translate: '0 0' }], { duration: 360 });
}
function actFx(e, special = false) {
  const d = cardData(e.id);
  const who = e.ch === 'duo' ? [e.a, e.b] : [e.actor || e.ch];
  if (e.ch === 'duo' && special && !calmNow() && allyEl(e.a) && allyEl(e.b)) { duoFx(e, d); return; }   // 인연 듀오: 둘이 함께 움직이는 합동기
  for (const [n, id] of who.entries()) {
    const img = allyEl(id)?.querySelector(':scope > img'); if (!img) continue;
    const m = e.ch === 'duo' ? (e.atk ? 'finisher' : 'cast') : motionOf(d, id);
    auraFlare(id, special ? 2.6 : m === 'finisher' ? 2 : m === 'guard' ? 1.25 : 1.5, special ? 1100 : 650);
    const [cls, ms, p] = MOTION[m];
    const col = colOf(id), r = rel(img);
    if (special && SIG[id] && e.ch !== 'duo' && d?.atk && !calmNow()) { SIG[id](id, img, e); continue; }   // 전용 필살은 공격 카드만
    if ((m === 'slash' || m === 'sweep' || m === 'finisher') && !calmNow()) {
      // 근접: 적 앞까지 돌진 → 베고 → 돌아옴, 잔상
      const dur = dash(id, img, e, m, n * 70);
      poseSeq(id, [['windup', Math.round(dur * .12)], ['attack', Math.round(dur * .7)]]);
      petAttack(id, e, n * 70);
      if (SET.shake) camera(id, e, m === 'finisher' || special ? 1.1 : 1.05, dur);
    } else {
      pulse(img, SET.shake || !/atk|shot|sweep|fin/.test(cls) ? cls : 'jflash', ms);
      pose(id, p, ms - 40) || (p === 'guard' && pose(id, 'skill', ms - 40));
      if (m === 'shot') { muzzle(r, col); if (SET.shake) camera(id, e, 1.04, 420); projectile(id, e, r); petAttack(id, e, 0); }
      else if (m === 'cast' || m === 'time') petAttack(id, e, 120);
      else if (m === 'guard') { guardFx(r, col); }
      else if (m === 'heal') { circle(r, '#9af0b0', 26); rise(r, '#c8ffd0', 18); }
      else { circle(r, col, special ? 34 : 26); rise(r, col, special ? 26 : 14); if (special && SET.shake) camera(id, e, 1.08, 600); }
    }
    if (!/slash|sweep|finisher|shot/.test(m)) playFx(`${id}_skill`, r.cx, r.cy, special ? 140 : 110, 80);
    if (special || m === 'finisher') dim(special ? 900 : 600);
  }
}
// 공용 이펙트(불꽃색으로 그려짐)를 그 동료 색으로 물들인다: 색상만 돌리고, 흰빛 도는 색이면 채도를 낮춘다
const FX_BASE_HUE = 20;
function tintTo(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || ''); if (!m) return '';
  const [r, g, b] = m.slice(1).map(v => parseInt(v, 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < .12) return 'saturate(.25) brightness(1.15)';
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
  return `hue-rotate(${Math.round(h - FX_BASE_HUE)}deg)`;
}
// 그림 이펙트 재생: 프레임을 차례로 바꾸고 마지막에 사라진다. 그림이 없으면 아무것도 안 함(코드 입자만)
const FX_OF = { slash: 'slash', boom: 'explode', pierce: 'pierce', star: 'magic', magic: 'magic', mist: 'magic', impact: 'explode' };
function playFx(name, x, y, size = 72, step = 55, behind = false, tint = '') {
  const fr = fxFrames(name); if (!fr.length || !layer) return false;
  const el = document.createElement('img'); el.className = 'px jfx' + (behind ? ' back' : ''); el.alt = '';
  Object.assign(el.style, { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px` });
  if (tint) el.style.filter = tint;
  el.src = fr[0]; layer.insertBefore(el, cv.nextSibling);
  fr.forEach((u, i) => { if (i) at(i * step, () => { el.src = u; }); });
  el.animate([{ opacity: 1 }, { opacity: 1, offset: .7 }, { opacity: 0 }],
    { duration: fr.length * step + 120, easing: 'ease-out' }).onfinish = () => el.remove();
  return true;
}
const isSpecial = e => !calmNow() && (e.ch === 'duo' || cardData(e.id)?.rarity === 'r');
// 돌진: 그림만 적 앞까지 갔다가 돌아온다. 맞히는 순간(카드가 날아간 뒤 ≈170ms)에 도착
const moving = new Set();
function dash(id, img, e, m, delay = 0) {
  const tgt = e.foe != null ? foeEl(e.foe)?.querySelector(':scope > img') : root()?.querySelector('.foes');
  const a = rel(img), b = tgt ? rel(tgt) : { x: a.x + 160, cx: a.cx + 160 };
  const dx = Math.round(Math.max(20, tgt ? b.x - (a.x + a.w) + 10 : b.cx - a.cx));   // 상대 몸 바로 앞에서 멈춤(조금만 겹침)
  const dur = m === 'finisher' ? 820 : m === 'sweep' ? 700 : 600, up = m === 'finisher' ? -26 : 0;
  const host = img.closest('[data-ally]'); if (host) host.style.zIndex = 5;
  // 예비(뒤로 웅크림) → 튀어 나감(몸이 앞으로 늘어남) → 도착하며 꾹 눌림 → 베고 버팀 → 뒤로 뛰어 돌아와 착지·출렁
  const an = img.animate([
    { offset: 0, transform: 'none', easing: 'cubic-bezier(.5,0,.75,.4)' },
    { offset: .12, transform: `translate(-9px,${m === 'finisher' ? 4 : 2}px)`, easing: 'cubic-bezier(.2,.9,.3,1)' },
    { offset: .26, transform: `translate(${dx}px,${up / 3}px)`, easing: 'cubic-bezier(.2,.9,.3,1)' },
    { offset: .34, transform: `translate(${dx + 4}px,1px)`, easing: 'ease-out' },
    { offset: .6, transform: `translate(${dx + 6}px,0)`, easing: 'cubic-bezier(.4,0,.6,1)' },
    { offset: .8, transform: `translate(${Math.round(dx * .25)}px,-10px)`, easing: 'cubic-bezier(.5,0,.75,.4)' },
    { offset: .88, transform: 'translate(0,2px)', easing: 'ease-out' },
    { offset: .95, transform: 'translate(0,-1px)', easing: 'ease-out' },
    { offset: 1, transform: 'none' },
  ], { duration: dur, delay });
  moving.add(an);
  an.onfinish = an.oncancel = () => { moving.delete(an); if (host) host.style.zIndex = ''; };
  // 잔상: 출발~도착 사이에 1장
  at(delay + dur * .2, () => afterimage(img, colOf(id)));
  return dur + delay;
}
// 적 돌진: 노린 동료 앞까지 왼쪽으로 갔다가 돌아온다. 첫 피격(≈150ms 뒤)에 도착, 잔상
function foeDash(img, id) {
  const tgt = id ? allyEl(id)?.querySelector(':scope > img') || allyEl(id) : null;
  const a = rel(img), b = tgt ? rel(tgt) : { x: a.x - 160, w: 0 };
  const dx = Math.round(Math.min(-20, b.x + b.w - 10 - a.x));   // 노린 동료 바로 앞에서 멈춤
  const dur = 560, host = img.closest('[data-fi],[data-jfi]');
  if (host) host.style.zIndex = 5;
  const an = img.animate([
    { transform: 'none' },
    { transform: 'translate(8px,0)', offset: .1 },
    { transform: `translate(${Math.round(dx * .6)}px,0)`, offset: .2 },
    { transform: `translate(${dx}px,0)`, offset: .27 },
    { transform: `translate(${dx - 6}px,0)`, offset: .6 },
    { transform: `translate(${Math.round(dx * .3)}px,-6px)`, offset: .85 },
    { transform: 'none' },
  ], { duration: dur, easing: 'cubic-bezier(.3,.7,.3,1)' });
  moving.add(an);
  an.onfinish = an.oncancel = () => { moving.delete(an); if (host) host.style.zIndex = ''; };
  at(dur * .18, () => afterimage(img, '#ff6a7a'));
}
function afterimage(img, col) {
  if (!img.isConnected) return;
  const r = rel(img, true), g2 = document.createElement('img');
  g2.src = img.currentSrc || img.src; g2.className = 'px jafter';
  Object.assign(g2.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, '--c': col });
  layer.insertBefore(g2, cv);
  g2.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' }).onfinish = () => g2.remove();
}
// 적 공격 때 카메라: 적과 노린 동료 사이로 살짝
function foeCamera(fel, id) {
  const field = root()?.querySelector('.field'), a = id && allyEl(id); if (!field || !a) return;
  const f = rel(field), r = rel(a), q = rel(fel);
  field.style.transformOrigin = `${(r.cx + q.cx) / 2 - f.x}px ${r.cy - f.y}px`;
  field.animate([{ transform: 'none' }, { transform: 'scale(1.04)', offset: .3 }, { transform: 'scale(1.04)', offset: .6 }, { transform: 'none' }],
    { duration: 560, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => { field.style.transformOrigin = ''; };
}
// 카메라: 판이 동료와 대상 사이로 살짝 다가갔다 돌아온다
function camera(id, e, k, ms) {
  const field = root()?.querySelector('.field'), a = allyEl(id); if (!field || !a) return;
  const tgt = e.foe != null ? foeEl(e.foe) : root()?.querySelector('.foes');
  const f = rel(field), r = rel(a), t = tgt ? rel(tgt) : r;
  field.style.transformOrigin = `${(r.cx + t.cx) / 2 - f.x}px ${r.cy - f.y}px`;
  field.animate([{ transform: 'none' }, { transform: `scale(${k})`, offset: .3 }, { transform: `scale(${k})`, offset: .7 }, { transform: 'none' }],
    { duration: ms, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => { field.style.transformOrigin = ''; };
}
// 암전: 판 가장자리를 어둡게 (기술에 눈이 가게)
function dim(ms) {
  const d = document.createElement('div'); d.className = 'jdim'; layer.insertBefore(d, layer.firstChild?.nextSibling || null);
  d.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: ms, easing: 'ease-in-out' }).onfinish = () => d.remove();
}
// 발밑 마법진 + 솟는 빛
function circle(r, col, rad) {
  const x = r.cx, y = r.y + r.h - 4;
  add({ k: 'oval', x, y, r0: 4, r1: rad, col, life: 22 });
  add({ k: 'oval', x, y, r0: 2, r1: rad * .6, col: '#ffffff', life: 16 });
}
function rise(r, col, n) {
  for (let k = 0; k < n; k++) add({ k: 'dot', x: r.cx + rnd(-r.w * .4, r.w * .4), y: r.y + r.h - rnd(0, 10), vx: 0, vy: rnd(-2.2, -1), g: 0, life: rnd(16, 28), col: k % 3 ? col : '#ffffff', s: k % 4 ? 1 : 2 });
}
function guardFx(r, col) {
  shieldIcon(r.x + r.w * .8, r.cy - 6, '#c9d2f0');
  add({ k: 'oval', x: r.cx, y: r.y + r.h - 4, r0: 6, r1: 24, col: '#c9d2f0', life: 18 });
  for (let k = 0; k < 10; k++) add({ k: 'dot', x: r.x + r.w * .85, y: r.y + rnd(r.h * .2, r.h * .9), vx: rnd(.2, .8), vy: 0, g: 0, life: 12, col: k % 2 ? col : '#ffffff', s: 1 });
}
function muzzle(r, col) {
  const x = r.x + r.w * .9, y = r.cy - 4;
  add({ k: 'blob', x, y, vx: 0, vy: 0, r: 6, col: '#fff2b0', life: 6 });
  sparks(x, y, col, 8, 1.6);
}
// 필살 컷인: 비스듬한 띠에 동료 일러스트가 밀려 들어오고 카드 이름이 찍힌다
function skillCut(e) {
  const d = cardData(e.id), ids = e.ch === 'duo' ? [e.a, e.b] : [e.actor || e.ch];
  const c = CHARACTERS[ids[0]], el = document.createElement('div');
  el.className = 'jskillcut'; el.style.setProperty('--c', c?.col || '#fff');
  // 그림: 인연 듀오 컷인(cutins/duo_a_b) → 동료 컷인(cutins/<id>_cutin) → 없으면 서 있는 그림을 띠 옆에
  const wide = ids.length > 1 ? artURL(`cutins/duo_${ids[0]}_${ids[1]}.png`) || artURL(`cutins/duo_${ids[1]}_${ids[0]}.png`) : charArt(ids[0], 'cutin');
  const who = wide ? `<img class="art" src="${wide}" alt="">`
    : ids.map((id, i) => [i, charArt(id, 'stand') || battleArt(id, 'skill')]).filter(([, u]) => u).map(([i, u]) => `<img class="px who w${i}" src="${u}" alt="">`).join('');
  el.innerHTML = `<i class="band"></i>${who}<i class="lines"></i><i class="edge"></i>
    <div class="tx"><span>${ids.map(id => CHARACTERS[id]?.name).join(' + ')}</span><b>${d?.name || ''}</b></div>`;
  layer.append(el);
  sfx(hasSfx(CUTIN_SFX) ? CUTIN_SFX : 'burst', { vol: .8 });
  // 한 박자: 띠가 그어짐(0.12초) → 버팀 → 잘려 나감(0.62초~) → 흰 번쩍과 함께 기술(js afterRender가 0.76초 뒤 actFx)
  el.animate([{ opacity: 0 }, { opacity: 1, offset: .05 }, { opacity: 1, offset: .9 }, { opacity: 0 }], { duration: 780 }).onfinish = () => el.remove();
  at(700, () => { flash(); if (SET.shake) shake(); });
}
// 필살: 판이 그 동료 쪽으로 살짝 다가감 (다키스트 던전식 확대)
function zoomIn(id, ms) {
  const field = root()?.querySelector('.field'), el = allyEl(id); if (!field || !el) return;
  const f = rel(field), r = rel(el);
  field.animate([{ transform: 'none' }, { transform: 'scale(1.06)', offset: .35 }, { transform: 'scale(1.06)', offset: .7 }, { transform: 'none' }],
    { duration: ms + 200, easing: 'ease-in-out' });
  field.style.transformOrigin = `${r.cx - f.x}px ${r.cy - f.y}px`;
  setTimeout(() => { field.style.transformOrigin = ''; }, ms + 220);
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
    ], { duration: 240, delay: t0 + d * 40, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'backwards' }).onfinish = () => ghost.remove();
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
    bar.animate([{ width: `${w0}%` }, { width: `${w1}%` }], { duration: 260, delay: d, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'backwards' });
    if (w1 < w0) {
      const lag = document.createElement('b'); lag.className = 'lag'; lag.style.width = `${w0}%`;
      host.insertBefore(lag, bar);
      lag.animate([{ width: `${w0}%` }, { width: `${w0}%`, offset: .5 }, { width: `${w1}%` }], { duration: 700, delay: d, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'forwards' }).onfinish = () => lag.remove();
    }
  }
}

// ---------- 타격 ----------
const STYLE = { iris: 'slash', akane: 'slash', laila: 'slash', mimimomo: 'slash', sebas: 'slash', brick: 'boom', mariana: 'boom', fukuro: 'boom',
  sion: 'star', raven: 'mist', marta: 'impact', zeno: 'impact', gordon: 'impact', dora: 'impact', finn: 'impact', sigrun: 'pierce',
  noel: 'magic', lunaria: 'magic', eleonore: 'magic', tomori: 'magic', nerea: 'magic', bertha: 'impact' };
const styleOf = e => e.counter ? 'impact' : e.slash ? 'slash' : e.gun ? 'boom' : STYLE[e.actor] || 'impact';
const styleSound = s => ({ slash: 'slash', boom: 'cannon', star: 'spirit', mist: 'poison', magic: 'mana' })[s] || 'hit';
// 동료별 공격음(sfx_atk_<id>, tools/compose/sfx.py) → 없으면 공격 갈래 공용 소리
const atkSound = e => e.actor && hasSfx(`atk_${e.actor}`) ? `atk_${e.actor}` : styleSound(styleOf(e));
const colOf = id => CHARACTERS[id]?.col || '#ece8f6';

function hitFoe(e, P) {
  // 맞는 순간 아주 짧게 멈춤(히트스톱): 돌진 중인 동료·입자
  if (e.dmg > 0 && !calmNow()) {
    const ms = e.dmg >= 15 || e.crit ? 90 : 50;
    for (const a of moving) { a.pause(); setTimeout(() => { try { a.play(); } catch (_) {} }, ms); }
    freeze = Math.max(freeze, performance.now() + ms);
    if (e.dmg >= 15 || e.crit) flash();
  }
  const el = foeEl(e.i) || null;
  const r = el ? rel(el) : P?.foes.get(e.i)?.r; if (!r) return;
  const img = el?.querySelector(':scope > img'), ir = img ? rel(img) : r;
  const x = ir.cx, y = ir.cy, col = colOf(e.actor), st = styleOf(e);
  if (S.C?.all?.[e.i]?.thorns && e.dmg && e.actor) {
    at(60, () => sfx('thorns', { vol: .7 }));
    // 가시: 적에게서 친 동료 쪽으로 가시가 튄다
    const a = allyEl(e.actor);
    if (a) { const ar = rel(a.querySelector(':scope > img') || a); for (let k = 0; k < 3; k++) at(k * 40, () => add({ k: 'line', x0: x, y0: y + rnd(-10, 10), x1: ar.cx + rnd(-8, 8), y1: ar.cy + rnd(-12, 12), col: '#c0d0ff', speed: 7, life: 9, s: 1, nohead: true })); }   // 가시 셋이 차례로(겹쳐 흰 덩어리로 보이던 것)
    ring(x, y, '#c0d0ff', 10, 24, 8);
  }
  // 그림 이펙트: 그 동료 시그니처 공격 이펙트 → 없으면 공용(베기·폭발·찌르기·마법). 코드 입자는 그 위에 계속 얹는다
  const big = e.dmg >= 15 || e.crit;
  const own = e.actor && fxFrames(`${e.actor}_atk`).length;
  playFx(own ? `${e.actor}_atk` : FX_OF[st] || 'explode', x, y, big ? 96 : 72, 55, false, own ? '' : tintTo(col));
  if (st === 'slash') slashFx(x, y, col);
  else if (st === 'boom') { const from = e.actor && allyEl(e.actor); if (from) tracer(rel(from).cx, rel(from).y + 20, x, y, '#ffd890'); boomFx(x, y); }
  else if (st === 'star') { const from = allyEl('sion'); if (from) starTrail(rel(from).cx, rel(from).y + 14, x, y, col); sparks(x, y, '#fff6c8', 10, 1.6); }
  else if (st === 'mist') { mistFx(x, y); sparks(x, y, '#c8ffb0', 6, 1.2); }
  else if (st === 'pierce') { tracer(x - 40, y - 50, x + 6, y + 6, '#f0f4ff'); sparks(x, y, '#ffffff', 10, 2); }
  else if (st === 'magic') { ring(x, y, col, 4, 24, 12); sparks(x, y, col, 12, 1.8); }
  else impactFx(x, y, col);
  if (e.blocked) shieldBreak(x, y - 6, e.dmg === 0);
  if (el) pulse(el.querySelector(':scope > img') || el, SET.shake ? 'jhitF' : 'jflash', 380);
  if (img && e.dmg > 0) foePose(img, 'hurt', 360);
  if (e.dmg > 0) num(x, ir.y + ir.h * .25, String(e.dmg), e.crit ? 'crit' : '', e.dmg);
  else if (e.blocked) num(x, ir.y + ir.h * .25, '막음', 'blk', 8);
  if (e.bleed) at(110, () => num(x + 14, ir.y + ir.h * .25 + 10, String(e.bleed), 'bleed', e.bleed));
  sfx(e.dmg ? atkSound(e) : 'block');
  // 맞는 적의 재질 소리(js/data/enemies.js hitSound)를 공격음 위에 살짝 겹친다
  const hs = e.dmg && HIT_SFX[FOE[S.C?.all?.[e.i]?.key]?.hitSound];
  if (hs && hasSfx(hs)) at(30, () => sfx(hs, { vol: big ? .9 : .65 }));
}
function killFoe(e, P) {
  const c = P?.foes.get(e.i); if (!c) return;
  const ghost = cloneAt(c, 'jdie');
  ghost.firstElementChild.classList.remove('tg');
  const last = !S.C || S.C.all.every(f => f.dead);
  // 흰 번쩍 → 뒤로 튕겨 휘청 → 몸이 도트 조각으로 부서져 흩어짐. 마지막 적은 느리게(슬로 모션)
  const dur = last ? 1100 : 700;
  ghost.animate([
    { offset: 0, filter: 'brightness(5)', transform: 'none', opacity: 1 },
    { offset: .12, filter: 'brightness(3)', transform: 'translate(8px,-3px)', opacity: 1 },
    { offset: .32, filter: 'brightness(1.6)', transform: 'translate(10px,0)', opacity: 1 },
    { offset: .55, filter: 'brightness(2.5) gray', transform: 'translate(10px,2px)', opacity: .6 },
    { offset: 1, filter: 'brightness(3) gray', transform: 'translate(12px,4px)', opacity: 0 },
  ], { duration: dur, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => ghost.remove();
  const img = ghost.querySelector('.foe > img'), r = img ? rel(img) : c.r;
  at(dur * .35, () => shatter(img, r, last ? 120 : 70));
  ring(r.cx, r.cy, '#ffffff', 6, 44, 14);
  sfx('foe_down');
  if (e.boss) shake();
  if (last && !calmNow()) { dim(dur + 200); slowmo(dur); }
}
// 그림에서 색을 뽑아 그 자리에서 도트 조각으로 흩어지게
function shatter(img, r, n) {
  let px = null;
  try {
    if (img?.complete && img.naturalWidth) {
      const k = document.createElement('canvas'), w = 48, h = Math.round(48 * img.naturalHeight / img.naturalWidth);
      k.width = w; k.height = h; const g2 = k.getContext('2d'); g2.drawImage(img, 0, 0, w, h);
      const d = g2.getImageData(0, 0, w, h).data; px = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (d[i + 3] > 128) px.push([x / w, y / h, `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`]); }
    }
  } catch (_) { px = null; }
  for (let k = 0; k < n; k++) {
    const p = px?.length ? px[(Math.random() * px.length) | 0] : [Math.random(), Math.random(), k % 3 ? '#ece8f6' : '#8a86b8'];
    const x = r.x + p[0] * r.w, y = r.y + p[1] * r.h, a = Math.atan2(y - r.cy, x - r.cx);
    add({ k: 'dot', x, y, vx: Math.cos(a) * rnd(.4, 1.8) + .6, vy: Math.sin(a) * rnd(.4, 1.6) - rnd(.6, 1.6), g: .06, life: rnd(20, 40), col: p[2], s: k % 5 ? 1 : 2 });
  }
}
// 마지막 일격: 잠깐 모든 연출을 느리게
function slowmo(ms) {
  const anims = layer.getAnimations({ subtree: true }).concat(root()?.getAnimations?.({ subtree: true }) || []);
  for (const a of anims) { try { a.playbackRate = .35; } catch (_) {} }
  setTimeout(() => { for (const a of anims) { try { a.playbackRate = 1; } catch (_) {} } }, ms * .6);
}
function hurtFx(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector(':scope > img'), r = img ? rel(img) : rel(el), x = r.cx, y = r.cy;
  if (e.blocked) shieldBreak(x, y - 4, e.dmg === 0);
  if (e.dmg > 0) {
    impactFx(x, y, '#ff6a7a');
    { const im = el.querySelector(':scope > img'), busyMove = im && [...moving].some(a => a.effect?.target === im);   // 돌진·필살 중엔 밀려나지 않고 번쩍만
      pulse(im || el, SET.shake && !busyMove ? 'jhitA' : 'jflash', 380); }
    if (!e.down) { pose(e.id, 'hurt', 380); auraHurt(e.id); }
    num(x, r.y + r.h * .25, String(e.dmg), 'hurt', e.dmg);
    if (e.dmg >= 10) { shake(); redEdge(); }
  } else num(x, r.y + r.h * .25, '막음', 'blk', 8);
  if (e.down) {
    at(160, () => { pulse(el.querySelector(':scope > img') || el, 'jdown', 820); num(x, r.y + 18, '쓰러짐', 'down', 12); for (let k = 0; k < 14; k++) add({ k: 'dot', x: rnd(r.x, r.x + r.w), y: r.y + r.h, vx: rnd(-1, 1), vy: rnd(-1, -.2), g: .06, life: 22, col: '#6a6688', s: 1 }); });
    sfx('down');
  } else sfx(e.dmg ? 'hurt' : 'block');
}
// 전투 시작: 동료는 왼쪽에서 뛰어 들어와 착지, 적은 안개 속에서 흐릿하게 떠올라 또렷해진다
function enterFx() {
  if (calmNow()) return;
  const A = app(); if (!A) return;
  [...A.querySelectorAll('.pm[data-ally] > img')].reverse().forEach((img, k) => {
    img.animate([
      { offset: 0, transform: 'translate(-140px,0)', opacity: 0, easing: 'cubic-bezier(.2,.7,.3,1)' },
      { offset: .55, transform: 'translate(6px,-6px)', opacity: 1, easing: 'ease-out' },
      { offset: .72, transform: 'translate(0,1px)', easing: 'ease-out' },
      { offset: .86, transform: 'none' }, { offset: 1, transform: 'none' },
    ], { duration: 620, delay: k * 90, fill: 'backwards' });
  });
  A.querySelectorAll('.foe[data-fi] > img').forEach((img, k) => {
    img.animate([
      { transform: 'translateY(8px)', opacity: 0, filter: 'blur(3px) brightness(.4)' },
      { transform: 'translateY(-2px)', opacity: .9, filter: 'blur(1px) brightness(.8)', offset: .6 },
      { transform: 'none', opacity: 1, filter: 'none' },
    ], { duration: 700, delay: 150 + k * 110, easing: 'ease-out', fill: 'backwards' });
    const r = rel(img);
    at(150 + k * 110, () => { for (let j = 0; j < 3; j++) add({ k: 'blob', x: r.cx + rnd(-14, 14), y: r.y + r.h - rnd(4, 18), vx: rnd(-.4, .4), vy: rnd(-.3, -.1), r: rnd(8, 12), col: '#8a86b8', life: 30 }); });
  });
}
// 적 공격 예고: 의도 글자가 커지며 불타고, 몸을 뒤로 웅크린다. 노린 동료 발밑에 붉은 표시
function foeWindup(e) {
  const el = foeEl(e.i); if (!el) return;
  const img = el.querySelector(':scope > img');
  pulse(el.querySelector('.intent'), 'jfire', 300);
  if (img) img.animate([{ transform: 'none', filter: 'none' }, { transform: 'translate(6px,2px)', filter: 'brightness(1.5)' }],
    { duration: 240, easing: 'ease-in', fill: 'none' });
  const id = e.target ?? e.aim, a = id && allyEl(id)?.querySelector(':scope > img');
  if (a) { const r = rel(a); add({ k: 'oval', x: r.cx, y: r.y + r.h - 3, r0: r.w * .5, r1: r.w * .3, col: '#ff4a6a', life: 14 }); }
  sfx('turn', { vol: .3, rate: .7 });
}
function foeActFx(e) {
  const el = foeEl(e.i); if (!el) return;
  const img = el.querySelector(':scope > img'), r = img ? rel(img) : rel(el);
  if (e.t === 'atk' || e.t === 'mix') {
    if (img && SET.shake && !calmNow()) { foeDash(img, e.target ?? e.aim); foeCamera(el, e.target ?? e.aim); }
    if (img) foePose(img, 'attack', 520);
    else pulse(img || el, SET.shake ? 'jlunge' : 'jflash', 400);
    pulse(el.querySelector('.intent'), 'jfire', 300);
  }
  else if (e.t === 'blk') { shieldIcon(r.cx, r.cy - 4, '#c9d2f0'); sfx('block', { vol: .6 }); }
  else if (e.t === 'buf') { for (let k = 0; k < 14; k++) add({ k: 'dot', x: rnd(r.x, r.x + r.w), y: r.y + r.h, vx: 0, vy: rnd(-1.4, -.6), g: 0, life: 24, col: '#ff7a6a', s: 1 }); num(r.cx, r.y, `힘 +${e.v}`, 'buf', 10); sfx('mana', { rate: .7 }); }
  else if (e.t === 'deb' || e.t === 'curse') { ring(r.cx, r.cy, '#b48ae8', 6, 30, 12); sfx('poison', { rate: .8 }); }
  else if (e.t === 'time') { /* 'time' 사건이 시계를 보여 준다 */ }
  else if (e.t === 'aoe') { pulse(img || el, SET.shake ? 'jlunge' : 'jflash', 400); ring(r.cx, r.cy, '#ff9a6a', 8, 44, 14); }
  else if (e.t === 'boom') { boomFx(r.cx, r.cy); sfx('boom'); }
  else if (e.t === 'gblk') { for (const f of document.querySelectorAll('.foe:not(.gone)')) { const q = rel(f); shieldIcon(q.cx, q.cy - 4, '#c9d2f0'); } sfx('block', { vol: .6 }); }
  else if (e.t === 'mend') { ring(r.cx, r.cy, '#7dff9a', 6, 28, 12); sfx('foe_heal', { vol: .7 }); }
  else if (e.t === 'sum' || e.t === 'aim') { ring(r.cx, r.cy, '#f0d040', 6, 30, 12); sfx(e.t === 'sum' ? 'summon' : 'retarget', { vol: .7 }); }
  else if (e.t === 'steal') { ring(r.cx, r.cy, '#b48ae8', 6, 30, 12); sfx('steal'); }
}
function tickFx(e) {
  const el = foeEl(e.i); if (!el) return;
  const img = el.querySelector(':scope > img'), r = img ? rel(img) : rel(el);
  if (e.what === 'poison') { mistFx(r.cx, r.cy); num(r.cx, r.y + 8, String(e.dmg), 'poison', e.dmg); sfx('poison', { vol: .6 }); }
  else { flames(r.cx, r.cy + 10); num(r.cx, r.y + 8, String(e.dmg), 'burn', e.dmg); sfx('hit', { vol: .5, rate: 1.3 }); }
  pulse(el, 'jflash', 200);
}
function blockGain(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector(':scope > img'), r = img ? rel(img) : rel(el);
  shieldIcon(r.cx, r.cy, '#c9d2f0');
  num(r.cx + 12, r.y + 10, `+${e.n}`, 'blkup', 9);
  sfx('block', { vol: .6 });
}
function healFx(e) {
  const el = allyEl(e.id); if (!el) return;
  const img = el.querySelector(':scope > img'), r = img ? rel(img) : rel(el);
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
  d.querySelector('i').animate([{ transform: 'rotate(0)' }, { transform: `rotate(${back ? -360 : 360}deg)` }], { duration: 520, easing: 'cubic-bezier(.25,.8,.35,1)' });
  d.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .15 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .8 }, { opacity: 0, transform: 'translate(-50%,-60%) scale(1)' }],
    { duration: 760, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => d.remove();
  const w = document.createElement('div'); w.className = `jwarm ${back ? 'back' : ''}`; layer.append(w);
  w.animate([{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => w.remove();
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
  ], { duration: cls === 'win' ? 900 : 640, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => b.remove();
  b.querySelector('span').animate([{ transform: 'translateX(-30px)' }, { transform: 'translateX(0)', offset: .2 }, { transform: 'translateX(8px)' }], { duration: cls === 'win' ? 900 : 640, easing: 'cubic-bezier(.25,.8,.35,1)' });
}
// 보상 카드가 한 장씩 내려앉는다
function dealReward(t0) {
  const cards = app()?.querySelectorAll('[data-screen="reward"] .hand.big .card') || [];
  cards.forEach((el, k) => {
    track(el.animate([{ transform: 'translateY(-40px) rotate(-8deg) scale(.6)', opacity: 0 }, { transform: 'translateY(4px) rotate(1deg) scale(1.03)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }],
      { duration: 320, delay: t0 + k * 110, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'backwards' }));
    at(t0 + k * 110, () => sfx('card', { vol: .5, rate: .9 + k * .1 }));
    // 뒷면으로 내려앉자마자 한 장씩 뒤집힌다 (docs/11 #3). 「승리」 띠는 위쪽(css .jbanner.win)이라 카드를 안 가린다
    el.classList.add('cardback');
    const tf = t0 + k * 110 + 300;   // 내려앉자마자 뒤집힘(빈 뒷면이 오래 보이지 않게)
    at(tf, () => { if (!hush) el.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 90, easing: 'cubic-bezier(.25,.8,.35,1)' }); });
    at(tf + 90, () => { el.classList.remove('cardback'); if (!hush) el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 110, easing: 'cubic-bezier(.25,.8,.35,1)' }); sfx('flip', { vol: .7, rate: 1 + k * .08 }); });
  });
  const gold = app()?.querySelector('[data-screen="reward"] .center > .note');
  if (gold) track(gold.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t0, easing: 'cubic-bezier(.25,.8,.35,1)', fill: 'backwards' }));
}
// 결과 화면: 얻은 별 조각이 0부터 올라간다 (별 조각 줄이 하나씩 나온 뒤)
function countUp(t0) {
  const el = app()?.querySelector('.countup'); if (!el) return;
  const to = +el.dataset.to || 0, rows = app().querySelectorAll('table.shards tr').length, start = t0 + 400 + rows * 120;
  el.textContent = '0';
  const n = 10;
  for (let k = 1; k <= n; k++) at(start + k * 50, () => { el.textContent = String(Math.round(to * k / n)); if (k === n) sfx('star', { vol: .5 }); });
}
// 막이 바뀌면: 탑을 올라가는 짧은 장면
// 막이 바뀜: 지도와 같은 돌벽 탑을 카메라가 타고 올라간다 — 난간이 아래로 지나가고, 맨 앞 동료가 가운데서 오르며, 막 이름 띠가 찍힌다
function climb(act) {
  const G = S.G, lead = G?.formation?.find(p => !G.members[p]?.down) || G?.formation?.[0];
  const spr = lead && battleArt(lead, 'idle'), sky = artURL(`bg/map${act}.png`);
  const d = document.createElement('div');
  d.className = `jclimb a${act}`;
  if (sky) d.style.setProperty('--sky', `url("${new URL(sky, location.href).href}")`);   // CSS 변수 주소는 CSS 파일 기준이라 절대 주소로
  d.innerHTML = `<i class="sk"></i><i class="tw"><i class="lg"></i></i>${spr ? `<img class="px who" src="${spr}" alt="">` : ''}<b>${act <= 3 ? `<small>${act}막</small>` : ''}${(ACT_NAME[act] || '').replace(/^\d+막\s*·\s*/, '')}</b>`;
  layer.append(d);
  const E = 'cubic-bezier(.3,.1,.3,1)';
  d.querySelector('.tw').animate([{ backgroundPositionY: '0px' }, { backgroundPositionY: '192px' }], { duration: 1500, easing: E });
  d.querySelector('.lg').animate([{ backgroundPositionY: '0px' }, { backgroundPositionY: '192px' }], { duration: 1500, easing: E });
  d.querySelector('.sk').animate([{ backgroundPositionY: '100%' }, { backgroundPositionY: '30%' }], { duration: 1500, easing: E });
  d.querySelector('b').animate([{ opacity: 0, transform: 'scaleX(.2)' }, { opacity: 0, transform: 'scaleX(.2)', offset: .25 }, { opacity: 1, transform: 'none', offset: .38 }, { opacity: 1, offset: .85 }, { opacity: 0 }], { duration: 1500, easing: 'steps(12)' });
  d.animate([{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .86 }, { opacity: 0 }], { duration: 1600 }).onfinish = () => d.remove();
  sfx('move');
}

// 막의 1층 지도: 「1막 · 항구층」 띠가 위에서 내려왔다 올라간다 (0.9초, css/screens.css .mapact)
function actBand(act) {
  const w = app()?.querySelector('.mapwrap'); if (!w || !ACT_NAME[act]) return;
  const d = document.createElement('div');
  d.className = 'mapact'; d.innerHTML = `<b>${ACT_NAME[act]}</b>`;
  d.addEventListener('animationend', () => d.remove());
  w.append(d);
}

// ---------- 터지는 턴: 한 턴 누적 피해 + 100/200을 넘는 순간 히트스톱 ----------
let acc = 0, stopped = 0, ctr = null;
const STOPS = [100, 200];
// 사건 시간표에 피해를 더하고, 문턱을 넘으면 그 자리에서 잠깐 멈춘다. 새 시간(t)을 돌려준다.
function addDmg(n, s, t) {
  if (!n) return t;
  acc += n; const v = acc;
  at(s, () => setCounter(v, true));
  for (const lv of STOPS) if (v >= lv && stopped < lv) { stopped = lv; const at0 = t; at(at0, () => hitStop(lv, v)); t += lv >= 200 ? 320 : 260; }
  return t;
}
function setCounter(v, anim) {
  if (!layer) return;
  const on = v > 0 && !!S.C;
  if (!ctr) { ctr = document.createElement('div'); ctr.className = 'jdmg'; ctr.innerHTML = '<small>이번 턴</small><b></b>'; }
  if (!on) { ctr.remove(); return; }
  if (!ctr.isConnected) layer.append(ctr);
  const b = ctr.querySelector('b'), old = +b.textContent || 0;
  b.textContent = v;
  ctr.className = `jdmg ${v >= 200 ? 'l3' : v >= 100 ? 'l2' : v >= 50 ? 'l1' : ''}`;
  if (anim && v > old) { void ctr.offsetWidth; ctr.classList.add('bump'); }
}
// 0.2~0.3초: 연출 층을 멈추고 화면을 하얗게, 큰 숫자. 흔들림 끔이면 흔들지 않는다.
function hitStop(lv, v) {
  const anims = layer.getAnimations({ subtree: true }).filter(a => a.playState === 'running');
  for (const a of anims) a.pause();
  freeze = performance.now() + (lv >= 200 ? 260 : 190);
  const w = document.createElement('div'); w.className = 'jstop'; layer.append(w);
  w.animate([{ opacity: 0 }, { opacity: .85, offset: .15 }, { opacity: 0 }], { duration: lv >= 200 ? 300 : 220, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => w.remove();
  const big = document.createElement('div'); big.className = 'jbig';
  const who = S.C ? [...S.C.burstTurn][0] : null;
  if (who) big.style.setProperty('--c', colOf(who));
  big.innerHTML = `${lv}+<small>${lv >= 200 ? '대폭발 턴' : '터지는 턴'}</small>`;
  layer.append(big);
  big.animate([
    { transform: 'translate(-50%,-50%) scale(2.2)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(.95)', opacity: 1, offset: .12 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .7 },
    { transform: 'translate(-50%,-60%) scale(1)', opacity: 0 },
  ], { duration: 1000, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => big.remove();
  if (SET.shake) shake();
  sfx('cannon', { rate: lv >= 200 ? .55 : .7, vol: .9 }); sfx('burst', { vol: .7 });
  setTimeout(() => { for (const a of anims) { try { a.play(); } catch (e) { /* 끝난 연출 */ } } }, lv >= 200 ? 260 : 190);
}
let freeze = 0;

// ---------- 적 쪽 연출 ----------
const foeR = i => { const el = foeEl(i); if (!el) return null; const img = el.querySelector(':scope > img'); return { el, r: img ? rel(img) : rel(el) }; };
// 안개 마녀 여왕: 장막이 걷힘 (흰 안개가 흩어지고 「취약」)
function veilFx(e) {
  const q = foeR(e.i); if (!q) return;
  pulse(q.el, 'jrage', 400);
  for (let k = 0; k < 24; k++) add({ k: 'dot', x: rnd(q.r.x, q.r.x + q.r.w), y: rnd(q.r.y, q.r.y + q.r.h), vx: rnd(-1.6, 1.6), vy: rnd(-1, .4), g: 0, life: rnd(16, 26), col: k % 3 ? '#e8e4f4' : '#b6ff9a', s: 2 });
  ring(q.r.cx, q.r.cy, '#e8e4f4', 6, 48, 16);
  num(q.r.cx, q.r.y, '장막이 걷혔다', 'buf', 12);
  sfx('flip', { rate: .7 });
}
// 폭풍 고래: 터지는 턴에 비틀거림
function staggerFx(e) {
  const q = foeR(e.i); if (!q) return;
  pulse(q.el, 'jrage', 500);
  ring(q.r.cx, q.r.cy, '#ffe680', 10, 56, 18);
  num(q.r.cx, q.r.y, '비틀!', 'buf', 15);
  sfx('hit', { rate: .6 });
}
function rageFx(e) {
  const q = foeR(e.i); if (!q) return;
  pulse(q.el, 'jrage', 500);
  for (let k = 0; k < 18; k++) add({ k: 'dot', x: rnd(q.r.x, q.r.x + q.r.w), y: q.r.y + q.r.h, vx: rnd(-.3, .3), vy: rnd(-2, -.8), g: 0, life: rnd(18, 28), col: k % 2 ? '#ff5a3a' : '#ffb060', s: 2 });
  ring(q.r.cx, q.r.cy, '#ff5a3a', 8, 40, 14);
  num(q.r.cx, q.r.y, `힘 +${e.v}`, 'buf', 14);
  sfx('mana', { rate: .55 });
}
function duelFx(e) {
  const q = foeR(e.i), a = allyEl(e.id); if (!q || !a) return;
  const ar = rel(a.querySelector(':scope > img') || a);
  tracer(q.r.cx, q.r.cy, ar.cx, ar.cy, '#e8f0ff'); slashFx(ar.cx, ar.cy, '#c9d2f0');
  num(q.r.cx, q.r.y - 4, '도전!', 'buf', 9);
  sfx('slash', { rate: .8 });
}
// 적 속성 (js/data/affixes.js): 흡혈·재생은 초록 회복, 수호는 다른 적에게 방패 고리, 가속은 붉은 불티, 시간 도둑은 금빛 시계
function affixFx(e) {
  const q = foeR(e.i); if (!q) return;
  if (e.ax === 'vamp' || e.ax === 'regen') {
    const col = e.ax === 'vamp' ? '#e05a7a' : '#7dff9a';
    for (let k = 0; k < 12; k++) add({ k: 'dot', x: rnd(q.r.x + 4, q.r.x + q.r.w - 4), y: rnd(q.r.cy, q.r.y + q.r.h), vx: 0, vy: rnd(-1.4, -.5), g: 0, life: 24, col: k % 2 ? col : '#ffe8e8', s: 1 });
    ring(q.r.cx, q.r.cy, col, 6, 28, 12);
    num(q.r.cx, q.r.y + 6, `+${e.v}`, 'heal', 10);
    sfx(e.ax === 'vamp' ? 'foe_heal' : 'heal', { vol: .6 });
  } else if (e.ax === 'guard') {
    ring(q.r.cx, q.r.cy, '#e0c060', 6, 30, 12);
    for (const j of e.to || []) { const t = foeR(j); if (!t) continue; add({ k: 'line', x0: q.r.cx, y0: q.r.cy, x1: t.r.cx, y1: t.r.cy, col: '#e0c060', speed: 6, life: 12, s: 1 }); ring(t.r.cx, t.r.cy, '#e0c060', 10, 26, 14); num(t.r.cx, t.r.y + 6, `방어 +${e.v}`, 'buf', 9); }
    sfx('block', { vol: .6 });
  } else if (e.ax === 'haste') {
    for (let k = 0; k < 10; k++) add({ k: 'dot', x: rnd(q.r.x, q.r.x + q.r.w), y: q.r.y + q.r.h, vx: rnd(-.3, .3), vy: rnd(-1.8, -.7), g: 0, life: rnd(14, 22), col: k % 2 ? '#ff8a5a' : '#ffd0a0', s: 2 });
    num(q.r.cx, q.r.y, `힘 +${e.v}`, 'buf', 10);
  } else if (e.ax === 'thief') {
    ring(q.r.cx, q.r.cy, '#f0d040', 4, 34, 14); sparks(q.r.cx, q.r.cy, '#f0d040', 10, 1.4);
    num(q.r.cx, q.r.y, `+${e.v}분`, 'buf', 11);
    sfx('clock', { rate: 1.2, vol: .6 });
  }
}
function mendFx(e) {
  const q = foeR(e.i), t = foeR(e.to); if (!q) return;
  const tr = t ? t.r : q.r;
  if (t && e.to !== e.i) add({ k: 'line', x0: q.r.cx, y0: q.r.cy, x1: tr.cx, y1: tr.cy, col: '#7dff9a', speed: 5, life: 16, s: 2 });
  for (let k = 0; k < 14; k++) add({ k: 'dot', x: rnd(tr.x + 4, tr.x + tr.w - 4), y: rnd(tr.cy, tr.y + tr.h), vx: 0, vy: rnd(-1.3, -.5), g: 0, life: 26, col: k % 2 ? '#7dff9a' : '#e8ffe8', s: 1 });
  ring(tr.cx, tr.cy, '#7dff9a', 6, 30, 12);
  num(tr.cx, tr.y + 6, `+${e.v}`, 'heal', 10);
}
function summonFx(e) {
  const q = foeR(e.i); if (q) { ring(q.r.cx, q.r.cy, '#f0d040', 4, 34, 14); sparks(q.r.cx, q.r.cy, '#f0d040', 12, 1.6); }
  const t = foeEl(e.to); if (!t) return;
  const tr = rel(t.querySelector(':scope > img') || t);
  pulse(t, 'jsummon', 450);
  for (let k = 0; k < 3; k++) ring(tr.cx, tr.y + tr.h - 4, k ? '#b48ae8' : '#f0d040', 2 + k * 6, 30 + k * 8, 16 + k * 4);
  if (q) add({ k: 'line', x0: q.r.cx, y0: q.r.y, x1: tr.cx, y1: tr.cy, col: '#f0d040', speed: 7, life: 12, s: 1 });
}
function stealFx(e) {
  const q = foeR(e.i), pile = app()?.querySelector('.endcol .note'); if (!q) return;
  const from = pile ? rel(pile) : { cx: q.r.cx - 120, cy: q.r.cy + 120 };
  const c = document.createElement('div'); c.className = 'jstolen';
  c.style.left = `${from.cx - 8}px`; c.style.top = `${from.cy - 11}px`; layer.append(c);
  c.animate([
    { transform: 'translate(0,0) rotate(0)', opacity: 1 },
    { transform: `translate(${(q.r.cx - from.cx) * .5}px,${(q.r.cy - from.cy) * .5 - 30}px) rotate(180deg)`, opacity: 1, offset: .5 },
    { transform: `translate(${q.r.cx - from.cx}px,${q.r.cy - from.cy}px) rotate(360deg) scale(.4)`, opacity: 0 },
  ], { duration: 420, easing: 'cubic-bezier(.25,.8,.35,1)' }).onfinish = () => c.remove();
  setTimeout(() => { ring(q.r.cx, q.r.cy, '#b48ae8', 4, 24, 10); num(q.r.cx, q.r.y, '훔침', 'buf', 8); }, 400);
}
function retargetFx(e) {
  const q = foeR(e.i); if (!q) return;
  ring(q.r.cx, q.r.cy, '#f0d040', 6, 26, 10);
  const a = e.to && allyEl(e.to); if (!a) return;
  const ar = rel(a.querySelector(':scope > img') || a);
  add({ k: 'line', x0: q.r.cx, y0: q.r.cy, x1: ar.cx, y1: ar.cy, col: '#ff6a7a', speed: 8, life: 18, s: 1 });
  setTimeout(() => { pulse(a, 'jflash', 260); ring(ar.cx, ar.cy, '#ff6a7a', 4, 20, 10); }, 120);
}

// ---------- DOM 작은 것 ----------
function pulse(el, cls, ms) {
  if (!el) return;
  // 캐릭터·적 그림의 동작은 WAAPI로(가만히 숨쉬기 CSS 애니메이션과 겹쳐 돌아 끊기지 않게) — 예비 동작·오버슈트·여운이 있는 키프레임
  if (KF[cls] && el.tagName === 'IMG') {
    el.getAnimations().forEach(a => { if (a.id === 'jmove') a.cancel(); });
    const an = el.animate(KF[cls](), { duration: ms, easing: 'linear', fill: cls === 'jdown' ? 'forwards' : 'none' }); an.id = 'jmove';
    return;
  }
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
// 몸 동작 키프레임: 발끝 기준. E = 구간마다 부드러운 감속(살짝 넘쳤다 돌아오는 느낌은 키프레임으로)
const E = 'cubic-bezier(.25,.8,.35,1)', IN = 'cubic-bezier(.5,0,.75,.4)';
const f = (o, t, extra = {}) => ({ offset: o, transform: t, easing: E, ...extra });
const GLOW = c => `brightness(1.35) drop-shadow(0 0 6px ${c})`;
const KF = {
  // 맞음: 번쩍 → 뒤로 꺾이며 밀림 → 앞으로 살짝 튕김 → 잦아듦(스프링)
  jhitA: () => [f(0, 'none', { filter: 'brightness(3) sepia(1) hue-rotate(-40deg)' }), f(.1, 'translate(-15px,1px)', { filter: 'brightness(1.8)' }),
    f(.32, 'translate(5px,0)', { filter: 'none' }), f(.52, 'translate(-2px,0)'), f(.72, 'translate(1px,0)'), f(1, 'none')],
  jhitF: () => [f(0, 'none', { filter: 'brightness(3.2)' }), f(.1, 'translate(15px,1px)', { filter: 'brightness(1.8)' }),
    f(.32, 'translate(-5px,0)', { filter: 'none' }), f(.52, 'translate(2px,0)'), f(.72, 'translate(-1px,0)'), f(1, 'none')],
  // 시전: 웅크렸다(예비) → 솟아오르며 빛 → 내려와 살짝 눌림 → 제자리
  jcast: () => [f(0, 'none'), f(.22, 'translateY(2px)', { easing: IN }), f(.48, 'translateY(-11px)', { filter: GLOW('var(--c)') }),
    f(.74, 'translateY(1px)', { filter: 'none' }), f(.88, 'translateY(-1px)'), f(1, 'none')],
  jheal: () => [f(0, 'none'), f(.2, 'translateY(1px)', { easing: IN }), f(.5, 'translateY(-9px)', { filter: GLOW('#b8ffc8') }),
    f(.75, 'translateY(-6px)', { filter: GLOW('#b8ffc8') }), f(.9, 'translateY(1px)', { filter: 'none' }), f(1, 'none')],
  jtime: () => [f(0, 'none'), f(.2, 'translateY(-2px)', { filter: GLOW('#ffe7a0') }), f(.45, 'translateY(-6px)'), f(.7, 'translateY(-1px)', { filter: 'none' }), f(.85, 'none'), f(1, 'none')],
  jdraw2: () => [f(0, 'none'), f(.2, 'translateY(1px)', { easing: IN }), f(.45, 'translateY(-9px)'), f(.7, 'translateY(1px)'), f(.85, 'translateY(-1px)'), f(1, 'none')],
  // 방어: 몸을 낮추고 버팀 → 살짝 밀렸다 → 단단히 서기
  jguard: () => [f(0, 'none'), f(.18, 'translate(-3px,3px)', { easing: IN, filter: 'brightness(1.3) drop-shadow(0 0 5px #c9d2f0)' }),
    f(.5, 'translate(-1px,2px)', { filter: 'drop-shadow(0 0 4px #c9d2f0)' }), f(.75, 'translate(0,-1px)', { filter: 'none' }), f(1, 'none')],
  // 원거리: 겨눔 → 쏘는 반동으로 뒤로 → 되돌아옴
  jshot: () => [f(0, 'none'), f(.15, 'translate(3px,0)', { easing: IN }), f(.3, 'translate(-13px,0)', { filter: 'brightness(1.6)' }),
    f(.55, 'translate(3px,0)', { filter: 'none' }), f(.78, 'translate(-1px,0)'), f(1, 'none')],
  jatk: () => [f(0, 'none'), f(.22, 'translate(-7px,1px)', { easing: IN }), f(.42, 'translate(22px,0)'),
    f(.65, 'translate(10px,0)'), f(.85, 'translate(-2px,0)'), f(1, 'none')],
  jsweep: () => [f(0, 'none'), f(.22, 'translate(-9px,1px)', { easing: IN }), f(.48, 'translate(26px,0)'),
    f(.7, 'translate(10px,0)'), f(.86, 'translate(-2px,0)'), f(1, 'none')],
  jfin: () => [f(0, 'none'), f(.22, 'translate(-6px,4px)', { easing: IN }), f(.48, 'translate(18px,-28px)', { filter: GLOW('var(--c)') }),
    f(.64, 'translate(30px,3px)', { filter: 'none' }), f(.82, 'translate(8px,-2px)'), f(1, 'none')],
  jlunge: () => [f(0, 'none'), f(.22, 'translate(7px,1px)', { easing: IN }), f(.42, 'translate(-24px,0)'),
    f(.65, 'translate(-9px,0)'), f(.85, 'translate(2px,0)'), f(1, 'none')],
  // 쓰러짐: 휘청 → 무릎 꺾임 → 바닥에 닿으며 살짝 튐 → 잿빛
  jdown: () => [f(0, 'none', { filter: 'brightness(2)' }), f(.2, 'translate(-6px,0)', { filter: 'none' }), f(.45, 'translate(3px,2px)'),
    f(.7, 'translate(0,4px)', { filter: 'gray' }), f(.85, 'translate(0,2px)'), f(1, 'translate(0,3px)', { filter: 'gray' })],
  jflash: () => [{ filter: 'brightness(3)' }, { filter: 'none' }],
};
// 튀어 오르는 숫자(슬레이 더 스파이어식): 튀어 올랐다 옆으로 살짝 떨어지며 사라짐.
// 치명타·15 이상 피해는 크게 + 흔들림(.big), 막힌 건 회색 「막음」(.blk). 움직임은 css .jnum 키프레임.
function num(x, y, text, cls = '', v = 6) {
  if (!layer) return;
  const dmg = /^\d+$/.test(text);
  const big = cls === 'crit' || (dmg && v >= 15 && cls !== 'heal' && cls !== 'blkup');
  const el = document.createElement('div');
  el.className = `jnum ${cls}${big ? ' big' : ''}`;
  const inner = document.createElement('span');
  inner.textContent = text;
  el.append(inner);
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  const size = Math.round(Math.min(26, 11 + Math.sqrt(Math.max(1, v)) * 2.4));
  el.style.fontSize = `${cls === 'blk' ? 11 : big ? Math.min(34, size + 8) : size}px`;
  el.style.setProperty('--dx', `${Math.round((Math.random() < .5 ? -1 : 1) * (6 + Math.random() * 12))}px`);
  layer.append(el);
  let done = false;
  const kill = () => { if (!done) { done = true; el.remove(); } };
  el.addEventListener('animationend', e => { if (e.target === el) kill(); });
  setTimeout(kill, big ? 1400 : 1100); // 애니메이션이 안 돌 때 대비
}

// ---------- 캔버스 입자 (반 해상도, 도트처럼 굵게) ----------
const parts = [];
let raf = 0;
function add(p) { p.age = 0; parts.push(p); if (!raf) raf = requestAnimationFrame(loop); }
function loop() {
  if (performance.now() < freeze) { raf = requestAnimationFrame(loop); return; }   // 히트스톱: 입자도 잠깐 멈춤
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
  } else if (p.k === 'oval') {   // 발밑 마법진: 납작한 고리 + 안쪽 점선
    const r = p.r0 + (p.r1 - p.r0) * Math.min(1, f * 1.6), n = Math.max(12, Math.round(r * 1.4));
    if (f > .75 && (p.age & 1)) return;
    g.fillStyle = p.col;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + p.age * .05; px(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .3); if (k % 3 === 0) px(p.x + Math.cos(-a) * r * .7, p.y + Math.sin(-a) * r * .21); }
  } else if (p.k === 'arc') {   // 베기 궤적: 처음 몇 칸에 걸쳐 그어지고 끝부터 사라진다
    const shown = Math.min(1, p.age / 4), tail = Math.max(0, (f - .45) / .55);
    for (let s = tail; s <= shown; s += .025) {
      const a = p.a0 + (p.a1 - p.a0) * s, w = Math.sin(s * Math.PI) * p.w;
      for (let j = 0; j <= w; j += 1.5) { g.fillStyle = j < 1.5 ? '#ffffff' : p.col; px(p.x + Math.cos(a) * (p.r - j), p.y + Math.sin(a) * (p.r - j) * p.flat); }
    }
  } else if (p.k === 'line') {   // 포탄·창·별의 꼬리: 끊긴 점(「????!!!」처럼 보이던 것) 대신 이어진 줄 — 머리는 흰 2칸, 꼬리는 색이 가늘어진다
    const head = Math.min(1, p.age / p.speed), tail = Math.max(0, head - .35);
    const len = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) / 2, step = 1 / Math.max(8, len);
    if (f > .8 && (p.age & 1)) return;
    for (let s = tail; s <= head; s += step) {
      const k = (s - tail) / Math.max(.001, head - tail), hd = k > .85 && !p.nohead, w = hd ? 2 : (p.s || 1);
      g.fillStyle = hd ? '#ffffff' : p.col;
      g.fillRect(Math.round((p.x0 + (p.x1 - p.x0) * s) / 2), Math.round((p.y0 + (p.y1 - p.y0) * s - Math.sin(s * Math.PI) * (p.arc || 0)) / 2) - (w > 1 ? 1 : 0), 1, w);
    }
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
// 불티: 1px 가루를 잔뜩 뿌리면 지저분해서, 개수는 줄이고 2px로 또렷하게
function sparks(x, y, col, n = 8, sp = 1.5) {
  n = Math.ceil(n * .6);
  for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = rnd(.5, 1) * sp * 2; add({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .04, life: rnd(12, 22), col: k % 3 ? col : '#ffffff', s: 2 }); }
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
function redEdge() {
  const w = document.createElement('div'); w.className = 'jred'; layer.append(w);
  w.animate([{ opacity: .9 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = () => w.remove();
}
function flash() {
  const w = document.createElement('div'); w.className = 'jflashw'; layer.append(w);
  w.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 140, easing: 'ease-out' }).onfinish = () => w.remove();
}
function impactFx(x, y, col) { ring(x, y, col, 3, 18, 9); sparks(x, y, col, 10, 1.8); }
// 포탄: 뒷줄에서 쏘면 앞 동료들 몸을 꿰뚫고 지나가 보이던 것 → 동료들 머리 위로 낮게 휘어 날아간다
function tracer(x0, y0, x1, y1, col) { add({ k: 'line', x0, y0, x1, y1, col, speed: 7, life: 11, s: 1, arc: Math.min(70, Math.abs(x1 - x0) * .18) }); }
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
  for (const t of timers.keys()) clearTimeout(t); timers.clear();
  parts.length = 0;
  layer?.querySelectorAll('.jghost,.jnum,.jbanner,.jclock,.jwarm,.jclimb').forEach(x => x.remove());
}

// ---------- 별 소환 (js/render/base.js revealView) ----------
// 처음: 화면 가운데로 별빛이 빨려 들며 차오름 → 가장 높은 희귀도 색으로 번쩍 → 별똥별이 칸마다 떨어짐(css .intro .drop)
// 펼칠 때: 막 펼친 카드(.fresh)마다 빛 고리·불티, ★4 보라 반짝, ★5 금빛 기둥
const GACHA_COL = { 3: '#cfe0ff', 4: '#c08aff', 5: '#ffd860' };
const gsfx = (name, alt, o) => sfx(hasSfx(name) ? name : alt, o);
function gachaFx() {
  const A = app(); if (!A || A.dataset.screen !== 'reveal' || calmNow()) return;
  const R = S.reveal; if (!R) return;
  const scr = A.querySelector('.revealscr.intro');
  if (scr) {
    const top = Math.max(...R.list.map(r => r.rarity)), col = GACHA_COL[top];
    const W = stage.offsetWidth, H = stage.offsetHeight, cx = W / 2, cy = H * .42;
    gsfx('summon_charge', 'summon', { vol: .8 });
    for (let k = 0; k < 70; k++) {   // 가장자리에서 가운데로 빨려 드는 별빛
      const a = Math.random() * Math.PI * 2, d = rnd(140, 320), life = Math.round(rnd(26, 44)), t = rnd(0, 520);
      at(t, () => add({ k: 'dot', x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * .7, vx: -Math.cos(a) * d / life, vy: -Math.sin(a) * d * .7 / life, g: 0, life, col: k % 4 ? '#ffffff' : col, s: k % 3 ? 2 : 1 }));
    }
    for (let k = 0; k < 4; k++) at(k * 220, () => ring(cx, cy, k === 3 ? col : '#9fb4ff', 70 - k * 8, 6, 26));
    const core = document.createElement('div'); core.className = 'gcore'; core.style.setProperty('--c', col);
    layer.append(core);
    core.animate([{ transform: 'translate(-50%,-50%) scale(.1)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }],
      { duration: 1100, easing: 'cubic-bezier(.5,0,.75,.4)' }).onfinish = () => core.remove();
    at(1000, () => {
      flash(); ring(cx, cy, col, 8, 150, 22); sparks(cx, cy, col, 30, 3);
      gsfx('summon_drop', 'star', { vol: .8 });
      if (top === 5) { shake(); for (let k = 0; k < 3; k++) at(k * 120, () => ring(cx, cy, '#fff6c8', 10, 110 + k * 30, 20)); }
    });
  }
  // 막 펼친 카드
  for (const el of A.querySelectorAll('.revealscr .got.fresh')) {
    const g = +el.dataset.g || 3, col = GACHA_COL[g], d = parseFloat(getComputedStyle(el).getPropertyValue('--fd')) || 0;
    at(d + 40, () => {
      if (!el.isConnected) return;
      const r = rel(el);
      ring(r.cx, r.cy, col, 6, g === 5 ? 90 : g === 4 ? 60 : 40, 18);
      sparks(r.cx, r.cy, col, g === 5 ? 34 : g === 4 ? 20 : 10, g === 5 ? 3 : 2);
      if (g >= 4) for (let k = 0; k < (g === 5 ? 18 : 8); k++) add({ k: 'dot', x: r.cx + rnd(-r.w / 2, r.w / 2), y: r.y + r.h, vx: 0, vy: rnd(-3, -1.2), g: 0, life: rnd(18, 34), col: k % 2 ? col : '#ffffff', s: 2 });
      gsfx(`summon_r${g}`, g === 3 ? 'flip' : 'star', { vol: g === 3 ? .5 : .8 });
    });
  }
}

// ---------- 캐릭터 층 (docs/BATTLE_PLAN.md 4단계) ----------
// 그림이 있을 때만 켜진다: 준비 자세(sprites/<id>_windup), 적 공격·피격 자세(enemies/<적>_attack|_hurt),
// ★5 오라(fx/<id>_aura_1..6, 몸 뒤에서 반복), 동반자(fx/<id>_pet_idle_1..3 떠다님 / _pet_atk_1..3 공격 때 따로 돌진),
// 원거리 투사체(fx/<id>_proj_1..3, 쏜 동료 → 대상으로 날아감)
function poseSeq(id, seq) {
  const img = allyEl(id)?.querySelector(':scope > img'), idle = battleArt(id, 'idle');
  if (!img || !idle) return;
  const steps = seq.filter(([k]) => battleArt(id, k)); if (!steps.length) return;
  busy.add(img);
  let t = 0;
  for (const [k, ms] of steps) { const u = battleArt(id, k); setTimeout(() => { if (img.isConnected) swapSrc(img, u, 0); }, t); t += ms; }
  setTimeout(() => { busy.delete(img); if (img.isConnected && steps.some(([k]) => img.getAttribute('src') === battleArt(id, k))) swapSrc(img, idle, 0); }, t);
}
function foePose(img, kind, ms) {
  const base = img.dataset.src0 || img.getAttribute('src') || '';
  const m = /^assets\/(enemies\/.+)\.png$/.exec(base); if (!m) return;
  const u = artURL(`${m[1]}_${kind}.png`); if (!u) return;
  img.dataset.src0 = base; img.src = u;
  setTimeout(() => { if (img.isConnected && img.getAttribute('src') === u) img.src = base; }, ms);
}
// 몸 상자를 .pm 안 좌표로(오라·동반자를 그 자리에 붙인다)
function bodyIn(img) {
  const [bx, by, bw, bh] = (img.dataset.b || '0 0 1 1').split(' ').map(Number);
  const x = img.offsetLeft + img.offsetWidth * bx, y = img.offsetTop + img.offsetHeight * by, w = img.offsetWidth * bw, h = img.offsetHeight * bh;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
const AURA_AT = { akane: ['feet', 1.1], nerea: ['feet', .9], sion: ['back', 1.1, -.1], eleonore: ['back', 1.2, -.1], lunaria: ['head', .8, -.15] };
function charLayers() {
  const A = app(); if (!A || A.dataset.screen !== 'combat') return;
  for (const pm of A.querySelectorAll('.pm[data-ally]')) {
    const id = pm.dataset.ally, img = pm.querySelector(':scope > img'); if (!img || !img.dataset.b) continue;
    const b = bodyIn(img), down = pm.classList.contains('down'), M = S.G?.members?.[id];
    pm.classList.toggle('lowhp', !!M && !M.down && M.hp / M.max < .3);   // 위기: 오라가 불안하게 깜빡
    pm.classList.toggle('awaken', !!S.C?.burstTurn?.has(id) && !down);   // 폭발 각성한 턴: 몸이 빛나고 불티가 오른다
    const aura = fxFrames(`${id}_aura`);
    if (aura.length && !down && !pm.querySelector(':scope > .jaura')) {
      const el = document.createElement('img'); el.className = 'jaura'; el.alt = ''; el.dataset.fx = `${id}_aura`; el.src = aura[0];
      // 자리는 동료마다(발밑 불꽃·물방울, 등 뒤 별자리판·시계, 머리 위 초승달). 크기·밝기는 상황마다(auraFlare·css .jaura)
      const [where, k, dx = 0] = AURA_AT[id] || ['back', .8], sz = Math.round(b.h * k);
      const cy = where === 'feet' ? b.y + b.h - sz * .42 : where === 'head' ? b.y + b.h * .08 : b.y + b.h * .32;
      Object.assign(el.style, { left: `${Math.round(b.cx + b.w * dx - sz / 2)}px`, top: `${Math.round(cy - sz / 2)}px`, width: `${sz}px`, height: `${sz}px` });
      img.before(el);
    }
    const pet = fxFrames(`${id}_pet_idle`);
    if (pet.length && !down && !pm.querySelector(':scope > .jpet')) {
      const el = document.createElement('img'); el.className = 'jpet'; el.alt = ''; el.dataset.fx = `${id}_pet_idle`; el.src = pet[0];
      const sz = Math.round(b.h * .62);
      Object.assign(el.style, { left: `${Math.round(b.x - sz * .55)}px`, top: `${Math.round(b.y - sz * .25)}px`, width: `${sz}px`, height: `${sz}px` });
      img.before(el);
    }
  }
}
// 오라·동반자 프레임 돌리기(전투 화면에서만, 공격 중인 동반자는 건너뜀)
let layerTick = 0;
setInterval(() => {
  const A = app(); if (!A || A.dataset.screen !== 'combat' || calmNow()) return;
  layerTick++;
  for (const el of A.querySelectorAll('.jaura, .jpet:not(.atk)')) { const fr = fxFrames(el.dataset.fx); if (fr.length) el.src = fr[layerTick % fr.length]; }
  if (layerTick % 2) for (const pm of A.querySelectorAll('.pm.awaken')) { const im = pm.querySelector(':scope > img'); if (!im) continue; const r = rel(im), c = colOf(pm.dataset.ally);
    for (let k = 0; k < 2; k++) add({ k: 'dot', x: r.x + rnd(r.w * .15, r.w * .85), y: r.y + r.h - rnd(0, r.h * .3), vx: 0, vy: rnd(-1.6, -.8), g: 0, life: rnd(16, 26), col: k ? c : '#ffffff', s: 2 }); }
}, 120);
function petAttack(id, e, delay = 0) {
  const pet = allyEl(id)?.querySelector(':scope > .jpet'); if (!pet || calmNow()) return;
  const atk = fxFrames(`${id}_pet_atk`); if (!atk.length) return;
  const tgt = e.foe != null ? foeEl(e.foe)?.querySelector(':scope > img') : root()?.querySelector('.foe[data-fi] > img');
  const a = rel(pet), b = tgt ? rel(tgt) : { cx: a.cx + 200, cy: a.cy };
  const dx = Math.round(b.cx - a.cx - a.w * .3), dy = Math.round(b.cy - a.cy), dur = 620;
  at(delay, () => {
    if (!pet.isConnected) return;
    pet.classList.add('atk'); pet.src = atk[0];
    const sfxName = hasSfx(`pet_${id === 'nerea' ? 'whale' : 'spirit'}`) ? `pet_${id === 'nerea' ? 'whale' : 'spirit'}` : null;
    if (sfxName) sfx(sfxName, { vol: .7 });
    pet.animate([
      { transform: 'none', offset: 0 },
      { transform: 'translate(-8px,4px)', offset: .15, easing: 'cubic-bezier(.5,0,.75,.4)' },
      { transform: `translate(${dx}px,${dy}px)`, offset: .45, easing: 'cubic-bezier(.2,.9,.3,1)' },
      { transform: `translate(${dx + 6}px,${dy}px)`, offset: .6 },
      { transform: 'none', offset: 1, easing: 'cubic-bezier(.4,0,.6,1)' },
    ], { duration: dur });
    atk.forEach((u, i) => at(i * Math.round(dur * .2), () => { pet.src = u; }));
    at(Math.round(dur * .45), () => { const r = rel(pet); ring(r.cx, r.cy, colOf(id), 6, 40, 14); sparks(r.cx, r.cy, '#ffffff', 14, 2.4); });
    at(dur, () => pet.classList.remove('atk'));
  });
}
function projectile(id, e, from) {
  const fr = fxFrames(`${id}_proj`); if (!fr.length || !layer) return;
  const tgt = e.foe != null ? foeEl(e.foe)?.querySelector(':scope > img') : root()?.querySelector('.foe[data-fi] > img'); if (!tgt) return;
  const b = rel(tgt), x0 = from.x + from.w * .8, y0 = from.y + from.h * .4, sz = 48;
  const el = document.createElement('img'); el.className = 'px jfx'; el.alt = ''; el.src = fr[0];
  Object.assign(el.style, { left: `${Math.round(x0 - sz / 2)}px`, top: `${Math.round(y0 - sz / 2)}px`, width: `${sz}px`, height: `${sz}px` });
  if (hasSfx('proj_fly')) sfx('proj_fly', { vol: .6 });
  at(40, () => {
    layer.insertBefore(el, cv.nextSibling);
    const an = el.animate([{ transform: 'none' }, { transform: `translate(${Math.round(b.cx - x0)}px,${Math.round(b.cy - y0)}px)` }], { duration: 170, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' });
    let k = 0; const iv = setInterval(() => { el.src = fr[++k % fr.length]; }, 45);
    an.onfinish = () => { clearInterval(iv); el.remove(); };
  });
}

// ---------- 화면 넘김·배경 움직임 (docs/QUALITY_PLAN.md 3) ----------
const A0 = () => document.getElementById('app');
// 화면이 바뀌면 밤하늘 막이 비스듬히 걷힌다(0.38초, 누름은 막지 않음)
function screenWipe() {
  if (calmNow() || !layer) return;
  const w = document.createElement('div'); w.className = 'jwipe';
  layer.append(w);
  w.animate([{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }, { clipPath: 'polygon(100% 0,115% 0,115% 100%,85% 100%)' }],
    { duration: 380, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).onfinish = () => w.remove();
}
// 배경이 있는 화면(본부·출격 준비·소환·지도·타이틀)에 떠오르는 먼지·불티와 등불 깜빡임 — css #fx .jamb
const AMB = new Set(['base', 'party', 'summon', 'reveal', 'map', 'title', 'mates', 'episodes', 'rest', 'event', 'shop', 'codex', 'records', 'exchange', 'daily', 'odds', 'result']);
let amb = null;
function ambient() {
  if (!layer) return;
  const scr = A0()?.dataset.screen, on = AMB.has(scr) && !calmNow();
  if (on && !amb) { amb = document.createElement('div'); amb.className = 'jamb'; amb.innerHTML = '<i class="d1"></i><i class="d2"></i><i class="glow"></i>'; layer.prepend(amb); }
  if (amb) { amb.hidden = !on; amb.dataset.scr = scr || ''; }
}

// ---------- ★5 전용 필살 연출 (희귀 카드) — 동료마다 다른 순서. sigLead = 카드를 낸 뒤 적중까지 더 기다릴 시간 ----------
const SIG_LEAD = { akane: 560, sion: 380, lunaria: 320, eleonore: 460, nerea: 420,
  iris: 380, noel: 360, raven: 360, mimimomo: 320, sebas: 340, mariana: 380, tomori: 320, sigrun: 520, zeno: 420, bertha: 320 };
function sigLead(e) {
  if (calmNow()) return 0;
  if (e.ch === 'duo') return cardData(e.id)?.atk ? DUO_LEAD : 0;
  const id = e.actor || e.ch; return SIG[id] && cardData(e.id)?.atk ? SIG_LEAD[id] || 0 : 0;
}
const sigTarget = e => (e.foe != null ? foeEl(e.foe) : null)?.querySelector(':scope > img') || root()?.querySelector('.foe[data-fi] > img');
// 판을 한 점으로 확대했다 돌아옴(무대 좌표 x, y)
function zoomAt(x, y, k, ms, hold = .5) {
  const field = root()?.querySelector('.field'); if (!field) return;
  const f = rel(field);
  field.style.transformOrigin = `${x - f.x}px ${y - f.y}px`;
  field.animate([{ transform: 'none' }, { transform: `scale(${k})`, offset: .3, easing: 'cubic-bezier(.2,.9,.3,1)' }, { transform: `scale(${k})`, offset: .3 + hold * .6 }, { transform: 'none' }],
    { duration: ms, easing: 'cubic-bezier(.5,0,.75,.4)' }).onfinish = () => { field.style.transformOrigin = ''; };
}
const SIG = {
  // 아카네: 웅크림 → 공중으로 솟음 → 공중에서 멈칫(줌인, 불꽃이 모임) → 적 발밑으로 내리찍음 → 땅이 갈라지며 불기둥·폭발
  akane(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return;
    const a = rel(img), b = rel(tgt), host = img.closest('[data-ally]'); if (host) host.style.zIndex = 6;
    const dx = Math.round(b.cx - a.cx - a.w * .15), up = -78, ground = Math.round((b.y + b.h) - (a.y + a.h));
    const T = 1180, hit = 730;   // 적중 = 170 + SIG_LEAD.akane
    poseSeq(id, [['windup', 200], ['skill', 360], ['attack', 560]]);
    auraFlare(id, 2.8, 900);
    dim(T);
    add({ k: 'oval', x: a.cx, y: a.y + a.h - 2, r0: 4, r1: a.w * .8, col: '#ff8a4a', life: 16 });   // 뛰어오를 때 발밑 먼지 고리
    for (let k = 0; k < 10; k++) add({ k: 'dot', x: a.cx + rnd(-a.w / 2, a.w / 2), y: a.y + a.h, vx: rnd(-1.2, 1.2), vy: rnd(-1.5, -.4), g: .08, life: 18, col: '#b08a6a', s: 2 });
    const an = img.animate([
      { offset: 0, transform: 'none' },
      { offset: .12, transform: 'translate(0,5px)', easing: 'cubic-bezier(.2,.9,.3,1)' },
      { offset: .3, transform: `translate(${Math.round(dx * .35)}px,${up}px)`, easing: 'cubic-bezier(.25,.8,.35,1)' },
      { offset: .52, transform: `translate(${Math.round(dx * .4)}px,${up - 8}px)`, easing: 'cubic-bezier(.7,0,.95,.3)' },
      { offset: .62, transform: `translate(${dx}px,${ground}px)`, easing: 'ease-out' },
      { offset: .82, transform: `translate(${dx}px,${ground}px)`, easing: 'cubic-bezier(.4,0,.6,1)' },
      { offset: .93, transform: `translate(${Math.round(dx * .15)}px,-10px)`, easing: 'ease-in' },
      { offset: 1, transform: 'none' },
    ], { duration: T });
    an.startTime = document.timeline.currentTime;   // 그림 바꿔 끼우느라 첫 프레임이 늦어도 시계에 맞춰 시작(착지 = 적중 순간)
    moving.add(an); an.onfinish = an.oncancel = () => { moving.delete(an); if (host) host.style.zIndex = ''; };
    // 공중에서 줌인 + 불꽃이 몸으로 모임
    at(T * .3, () => {
      const r = rel(img); zoomAt(r.cx, r.cy, 1.28, 520, .55);
      for (let k = 0; k < 26; k++) { const ang = Math.random() * Math.PI * 2, d = rnd(40, 70); add({ k: 'dot', x: r.cx + Math.cos(ang) * d, y: r.cy + Math.sin(ang) * d, vx: -Math.cos(ang) * d / 14, vy: -Math.sin(ang) * d / 14, g: 0, life: 14, col: k % 3 ? '#ff6a3a' : '#ffe08a', s: 2 }); }
      ring(r.cx, r.cy, '#ff9a4a', 50, 8, 14);
      if (hasSfx('windup')) sfx('windup', { vol: .8 });
    });
    // 내리찍는 궤적
    at(T * .53, () => { const r = rel(img); for (let k = 0; k < 4; k++) add({ k: 'line', x0: r.cx + k * 4, y0: r.cy - 10, x1: b.cx + k * 3, y1: b.y + b.h - 6, col: k % 2 ? '#ff5a2a' : '#ffd08a', speed: 5, life: 12, s: 2 }); });
    // 착지: 땅이 갈라지며 불기둥 + 큰 이펙트
    at(hit, () => {
      const gx = b.cx, gy = b.y + b.h - 4;
      flash(); if (SET.shake) shake(); redEdge();
      add({ k: 'oval', x: gx, y: gy, r0: 6, r1: 90, col: '#ffb060', life: 22 });
      add({ k: 'oval', x: gx, y: gy, r0: 4, r1: 60, col: '#ffffff', life: 14 });
      playFx('akane_atk', gx, b.y + b.h * .45, 190, 60);
      for (let k = 0; k < 5; k++) at(k * 40, () => flames(gx + rnd(-40, 40), gy - rnd(0, 10)));
      for (let k = 0; k < 18; k++) add({ k: 'dot', x: gx + rnd(-30, 30), y: gy, vx: rnd(-3, 3), vy: rnd(-4.5, -1.5), g: .18, life: rnd(18, 30), col: k % 3 ? '#8a6a5a' : '#ffcf7a', s: 2 });
      sparks(gx, gy - 20, '#ffe08a', 40, 3.5);
    });
  },
  // 시온: 지팡이를 들고(스킬 자세) 위로 별자리가 그어지고 → 별이 비처럼 적마다 쏟아짐
  sion(id, img, e) {
    const a = rel(img), foes = [...(root()?.querySelectorAll('.foe[data-fi] > img') || [])].map(x => rel(x));
    poseSeq(id, [['skill', 700]]); auraFlare(id, 2.2, 900); dim(900);
    zoomAt(a.cx, a.cy - 20, 1.12, 500, .4);
    const sky = { x: a.cx + 40, y: Math.max(20, a.y - 60) };
    for (let k = 0; k < 7; k++) at(k * 30, () => add({ k: 'dot', x: sky.x + rnd(-60, 60), y: sky.y + rnd(-20, 20), vx: 0, vy: 0, g: 0, life: 30, col: '#fff6c8', s: 2 }));
    at(120, () => ring(sky.x, sky.y, '#9fb4ff', 10, 70, 18));
    foes.forEach((b, i) => { for (let k = 0; k < 5; k++) at(220 + i * 70 + k * 40, () => { const x0 = b.cx + rnd(-70, -20), y0 = 10; starTrail(x0, y0, b.cx + rnd(-10, 10), b.cy + rnd(-12, 12), '#bcd0ff'); }); });
    at(540, () => foes.forEach(b => { playFx('sion_atk', b.cx, b.cy, 120, 55); sparks(b.cx, b.cy, '#fff6c8', 16, 2.4); }));
    petAttack(id, e, 200);
  },
  // 루나리아: 춤추듯 돌며(스킬 자세) 초승달 칼날 셋이 적을 가로질러 베고 → 달빛 기둥
  lunaria(id, img, e) {
    const a = rel(img), foes = [...(root()?.querySelectorAll('.foe[data-fi] > img') || [])].map(x => rel(x));
    poseSeq(id, [['skill', 260], ['attack', 420]]); auraFlare(id, 2.2, 800); dim(850);
    img.animate([{ transform: 'none' }, { transform: 'translate(0,-14px)', offset: .3 }, { transform: 'translate(10px,-4px)', offset: .6 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.25,.8,.35,1)' });
    for (let k = 0; k < 3; k++) at(140 + k * 90, () => foes.forEach(b => { const a0 = rnd(-2.8, -2.2); add({ k: 'arc', x: b.cx, y: b.cy, r: 30 + k * 8, a0, a1: a0 + 2.8, w: 7, flat: .5, col: k === 1 ? '#e8d8ff' : '#b8a0ff', life: 14 }); }));
    at(460, () => foes.forEach(b => { playFx('lunaria_atk', b.cx, b.cy, 130, 55); for (let k = 0; k < 14; k++) add({ k: 'dot', x: b.cx + rnd(-8, 8), y: b.y + b.h, vx: 0, vy: rnd(-4, -2), g: 0, life: 22, col: k % 2 ? '#e8e0ff' : '#ffffff', s: 2 }); }));
  },
  // 엘레오노르: 시간이 멈춤(판이 잿빛, 시계 고리) → 바늘이 다시 돌며 적마다 터짐
  eleonore(id, img, e) {
    const a = rel(img), foes = [...(root()?.querySelectorAll('.foe[data-fi] > img') || [])].map(x => rel(x)), field = root()?.querySelector('.field');
    poseSeq(id, [['skill', 620]]); auraFlare(id, 2.4, 1000);
    if (field) field.animate([{ filter: 'none' }, { filter: 'grayscale(1) brightness(.75) contrast(1.2)', offset: .15 }, { filter: 'grayscale(1) brightness(.75) contrast(1.2)', offset: .75 }, { filter: 'none' }], { duration: 640 });
    const cx = (a.cx + (foes[0]?.cx || a.cx + 200)) / 2, cy = a.cy - 10;
    ring(cx, cy, '#c8a0ff', 120, 40, 26); ring(cx, cy, '#ffffff', 80, 20, 20);
    for (let k = 0; k < 12; k++) { const ang = k / 12 * Math.PI * 2; add({ k: 'line', x0: cx, y0: cy, x1: cx + Math.cos(ang) * 70, y1: cy + Math.sin(ang) * 46, col: '#b890ff', speed: 6, life: 18, s: 1 }); }
    at(480, () => { flash(); foes.forEach((b, i) => at(i * 60, () => { playFx('eleonore_atk', b.cx, b.cy, 140, 55); ring(b.cx, b.cy, '#d0b0ff', 6, 46, 16); sparks(b.cx, b.cy, '#ffffff', 18, 2.6); })); });
  },
  // 네레아: 작살을 들면(스킬 자세) 발밑에서 큰 물결이 일어 적 쪽으로 밀려감 → 물보라 기둥
  nerea(id, img, e) {
    const a = rel(img), foes = [...(root()?.querySelectorAll('.foe[data-fi] > img') || [])].map(x => rel(x));
    poseSeq(id, [['skill', 300], ['attack', 400]]); auraFlare(id, 2.4, 900); dim(900);
    const x1 = Math.max(...foes.map(b => b.x + b.w), a.cx + 200), gy = a.y + a.h;
    for (let k = 0; k < 14; k++) at(k * 28, () => { const x = a.cx + (x1 - a.cx) * k / 13; add({ k: 'blob', x, y: gy - 14 - Math.sin(k / 13 * Math.PI) * 26, vx: 1.2, vy: -.2, r: 14, col: k % 2 ? '#4aa8e8' : '#9fe0ff', life: 22 }); for (let j = 0; j < 3; j++) add({ k: 'dot', x, y: gy - 30, vx: rnd(-1, 1.5), vy: rnd(-3, -1), g: .12, life: 20, col: '#e0f6ff', s: 2 }); });
    at(440, () => foes.forEach(b => { playFx('nerea_atk', b.cx, b.cy, 140, 55); for (let k = 0; k < 16; k++) add({ k: 'dot', x: b.cx + rnd(-10, 10), y: b.y + b.h, vx: rnd(-1.5, 1.5), vy: rnd(-5, -2.5), g: .15, life: 26, col: k % 2 ? '#9fe0ff' : '#ffffff', s: 2 }); }));
    petAttack(id, e, 200);
  },
};

// ---------- ★4 전용 필살(짧게) ----------
const allFoes = () => [...(root()?.querySelectorAll('.foe[data-fi] > img') || [])].map(x => rel(x));
// 대상 앞까지 갔다 돌아오는 몸 움직임(시계에 맞춰 시작). keys: [시간 비율, 대상 쪽 거리 비율, 위로(px)]
function moveTo(img, b, T, keys) {
  const a = rel(img), host = img.closest('[data-ally]'); if (host) host.style.zIndex = 6;
  const dx = Math.round(b.x - (a.x + a.w) + 12), dy = Math.round((b.y + b.h) - (a.y + a.h));
  const an = img.animate(keys.map(([o, k, up = 0, ease]) => ({ offset: o, transform: `translate(${Math.round(dx * k)}px,${Math.round(dy * Math.min(1, k) + up)}px)`, ...(ease ? { easing: ease } : {}) })), { duration: T });
  an.startTime = document.timeline.currentTime;
  moving.add(an); an.onfinish = an.oncancel = () => { moving.delete(an); if (host) host.style.zIndex = ''; };
  return a;
}
const FAST = 'cubic-bezier(.2,.9,.3,1)', IN2 = 'cubic-bezier(.7,0,.95,.3)';
Object.assign(SIG, {
  // 아이리스: 적 앞으로 미끄러져 은빛 베기 셋을 엇갈려 긋고 마지막에 크게 한 번
  iris(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return; const b = rel(tgt), hit = 550;
    poseSeq(id, [['windup', 120], ['attack', 700]]); dim(900);
    const a = moveTo(img, b, 1000, [[0, 0], [.12, -.05, 2], [.22, 1, 0, FAST], [.3, .96], [.38, 1.02], [.46, .98], [.62, 1.04], [.82, 1, 0, IN2], [1, 0]]);
    at(150, () => afterimage(img, colOf(id)));
    for (let k = 0; k < 3; k++) at(260 + k * 80, () => { const a0 = k % 2 ? rnd(-.6, -.2) : rnd(-2.8, -2.4); add({ k: 'arc', x: b.cx, y: b.cy, r: 26 + k * 4, a0, a1: a0 + 2.4, w: 5, flat: .6, col: '#dfe8ff', life: 10 }); sfx('slash', { vol: .5, rate: 1.1 + k * .1 }); });
    at(hit, () => { flash(); add({ k: 'arc', x: b.cx, y: b.cy, r: 46, a0: -2.9, a1: .3, w: 8, flat: .45, col: '#ffffff', life: 14 }); sparks(b.cx, b.cy, '#e8f0ff', 24, 3); zoomAt(b.cx, b.cy, 1.12, 360, .3); });
  },
  // 노엘: 베개를 안고 둥실 떠올라 잠들면, 분홍 꿈별이 베개에서 적마다 쏟아짐
  noel(id, img, e) {
    const a = rel(img), foes = allFoes(); poseSeq(id, [['skill', 800]]); auraFlare(id, 2, 900); dim(850);
    const an = img.animate([{ transform: 'none' }, { transform: 'translate(0,-16px)', offset: .3, easing: FAST }, { transform: 'translate(0,-18px)', offset: .8 }, { transform: 'none' }], { duration: 900 }); an.startTime = document.timeline.currentTime;
    for (let k = 0; k < 6; k++) at(k * 60, () => add({ k: 'blob', x: a.cx + rnd(-20, 20), y: a.y + rnd(0, 20), vx: rnd(-.3, .3), vy: -.4, r: rnd(6, 9), col: '#f0d8ff', life: 26 }));
    foes.forEach((b, i) => { for (let k = 0; k < 4; k++) at(200 + i * 60 + k * 50, () => starTrail(a.cx + 10, a.y + 20, b.cx + rnd(-10, 10), b.cy + rnd(-10, 10), '#ffa8e0')); });
    at(500, () => foes.forEach(b => { ring(b.cx, b.cy, '#ffb8f0', 6, 34, 14); sparks(b.cx, b.cy, '#fff0ff', 14, 2); }));
  },
  // 레이븐: 깃털로 흩어져 사라졌다가 적 뒤에서 나타나 독침, 검은 깃털이 칼처럼 흩날림
  raven(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return; const b = rel(tgt), a = rel(img), host = img.closest('[data-ally]'); if (host) host.style.zIndex = 6;
    poseSeq(id, [['windup', 160], ['attack', 640]]);
    const dx = Math.round(b.x + b.w - 10 - a.x), dy = Math.round((b.y + b.h) - (a.y + a.h));
    const an = img.animate([{ transform: 'none', opacity: 1 }, { transform: 'none', opacity: 0, offset: .18 }, { transform: `translate(${dx}px,${dy}px) scaleX(-1)`, opacity: 0, offset: .3 }, { transform: `translate(${dx}px,${dy}px) scaleX(-1)`, opacity: 1, offset: .4 }, { transform: `translate(${dx}px,${dy}px) scaleX(-1)`, opacity: 1, offset: .75 }, { transform: 'none', opacity: 0, offset: .85 }, { transform: 'none', opacity: 1 }], { duration: 1000 });
    an.startTime = document.timeline.currentTime; moving.add(an); an.onfinish = an.oncancel = () => { moving.delete(an); if (host) host.style.zIndex = ''; };
    const feathers = (x, y) => { for (let k = 0; k < 14; k++) add({ k: 'line', x0: x, y0: y, x1: x + rnd(-50, 50), y1: y + rnd(-40, 30), col: k % 3 ? '#1a1424' : '#7a5aa0', speed: 6, life: 14, s: 2 }); };
    at(60, () => feathers(a.cx, a.cy)); at(320, () => feathers(b.cx + b.w * .4, b.cy));
    at(530, () => { flash(); mistFx(b.cx, b.cy); sparks(b.cx, b.cy, '#c8ffb0', 16, 2.4); });
  },
  // 미미·모모: 둘이 양쪽에서 교차해 X자로 베기
  mimimomo(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return; const b = rel(tgt);
    poseSeq(id, [['windup', 100], ['attack', 600]]); dim(800);
    moveTo(img, b, 900, [[0, 0], [.15, -.05], [.3, 1, -6, FAST], [.7, 1], [1, 0]]);
    at(330, () => { add({ k: 'arc', x: b.cx, y: b.cy, r: 34, a0: -2.4, a1: -.2, w: 6, flat: 1, col: '#ff9ac8', life: 12 }); sfx('slash', { vol: .5 }); });
    at(400, () => { add({ k: 'arc', x: b.cx, y: b.cy, r: 34, a0: -.9, a1: 1.3, w: 6, flat: 1, col: '#9ad8ff', life: 12 }); sfx('slash', { vol: .5, rate: 1.2 }); });
    at(490, () => { flash(); ring(b.cx, b.cy, '#ffffff', 4, 40, 12); sparks(b.cx, b.cy, '#ffe0f0', 18, 2.6); });
  },
  // 세바스: 정중히 인사 → 한순간 판이 멈추고(흰 선) 지팡이칼 일섬이 여러 번 그어짐
  sebas(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return; const b = rel(tgt);
    poseSeq(id, [['guard', 200], ['attack', 600]]); dim(850);
    moveTo(img, b, 900, [[0, 0], [.2, 0, 3], [.32, 1, 0, 'steps(1)'], [.75, 1], [.76, 0, 0, 'steps(1)'], [1, 0]]);
    at(300, () => { flash(); for (let k = 0; k < 6; k++) { const y = b.y + b.h * (.2 + k * .12); add({ k: 'line', x0: b.x - 30, y0: y + rnd(-6, 6), x1: b.x + b.w + 30, y1: y - rnd(10, 24), col: k % 2 ? '#ffffff' : '#e8e0c8', speed: 3, life: 10, s: 1 }); } });
    at(480, () => { ring(b.cx, b.cy, '#f0e8d0', 6, 44, 14); sparks(b.cx, b.cy, '#ffffff', 20, 2.6); });
  },
  // 마리아나: 단총을 들면 뒤에서 배의 대포가 일제 사격 — 포탄 셋이 적마다 터짐
  mariana(id, img, e) {
    const a = rel(img), foes = allFoes(); poseSeq(id, [['skill', 300], ['attack', 400]]); dim(900);
    muzzle(a, '#ffd890'); if (SET.shake) shake();
    foes.forEach((b, i) => { for (let k = 0; k < 3; k++) at(140 + i * 40 + k * 90, () => { tracer(a.x - 20, a.y - 30 - k * 10, b.cx + rnd(-8, 8), b.cy + rnd(-8, 8), '#ffd890'); }); });
    at(520, () => foes.forEach(b => { boomFx(b.cx, b.cy); for (let k = 0; k < 8; k++) add({ k: 'dot', x: b.cx, y: b.cy, vx: rnd(-2.5, 2.5), vy: rnd(-3, -1), g: .15, life: 22, col: '#ffd040', s: 2 }); }));
  },
  // 토모리: 등불을 높이 들면 등대 불빛이 적을 쓸고 지나감
  tomori(id, img, e) {
    const a = rel(img), foes = allFoes(); poseSeq(id, [['skill', 700]]); auraFlare(id, 2, 800);
    const sx = a.cx + 6, sy = a.y + 8;
    for (let k = 0; k < 8; k++) at(80 + k * 40, () => foes.forEach(b => add({ k: 'line', x0: sx, y0: sy, x1: b.cx + rnd(-16, 16), y1: b.cy + rnd(-20, 20), col: k % 2 ? '#fff4c0' : '#ffd060', speed: 3, life: 10, s: 2 })));
    at(480, () => foes.forEach(b => { ring(b.cx, b.cy, '#fff0a0', 6, 40, 14); sparks(b.cx, b.cy, '#fffbe0', 14, 2); }));
  },
  // 시그룬: 날개처럼 높이 솟아 화면 밖으로 → 창을 앞세워 하늘에서 비스듬히 꽂힘, 흰 깃털 폭발
  sigrun(id, img, e) {
    const tgt = sigTarget(e); if (!tgt) return; const b = rel(tgt), hit = 690;
    poseSeq(id, [['windup', 160], ['skill', 300], ['attack', 500]]); auraFlare(id, 2.4, 900); dim(1100);
    moveTo(img, b, 1150, [[0, 0], [.1, 0, 5], [.32, .3, -150, FAST], [.48, .35, -160, IN2], [.6, 1, 0], [.8, 1], [1, 0]]);
    at(380, () => { for (let k = 0; k < 4; k++) add({ k: 'line', x0: b.cx - 90 + k * 6, y0: 0, x1: b.cx + k * 3, y1: b.y + b.h - 8, col: k % 2 ? '#ffffff' : '#d8e8ff', speed: 5, life: 12, s: 2 }); });
    at(hit, () => { flash(); if (SET.shake) shake(); add({ k: 'oval', x: b.cx, y: b.y + b.h - 4, r0: 6, r1: 80, col: '#ffffff', life: 20 });
      for (let k = 0; k < 20; k++) add({ k: 'line', x0: b.cx, y0: b.cy, x1: b.cx + rnd(-70, 70), y1: b.cy + rnd(-60, 20), col: '#f4f8ff', speed: 7, life: 14, s: 1 }); sparks(b.cx, b.cy, '#ffffff', 26, 3.2); });
  },
  // 제노: 대검을 크게 치켜들어(용의 눈이 빛남) 검은 불꽃 반달을 모든 적에게 휘두름
  zeno(id, img, e) {
    const a = rel(img), foes = allFoes(); poseSeq(id, [['windup', 260], ['attack', 500]]); auraFlare(id, 2.4, 900); dim(1000);
    zoomAt(a.cx, a.cy - 10, 1.15, 420, .4);
    at(120, () => { add({ k: 'dot', x: a.cx + 4, y: a.y + 14, vx: 0, vy: 0, g: 0, life: 18, col: '#ffd040', s: 3 }); ring(a.cx + 4, a.y + 14, '#ffd040', 2, 14, 10); });
    at(320, () => { const L = foes[foes.length - 1] || a; for (let k = 0; k < 3; k++) add({ k: 'arc', x: (a.cx + L.cx) / 2, y: a.cy, r: 110 + k * 10, a0: -2.6, a1: -.3, w: 9 - k * 2, flat: .4, col: k ? '#5a1a3a' : '#ff4a6a', life: 16 }); });
    at(560, () => foes.forEach(b => { flames(b.cx, b.cy + 8); flames(b.cx + 8, b.cy); sparks(b.cx, b.cy, '#ff6a8a', 16, 2.6); }));
  },
  // 베르타: 등불 지팡이로 길을 가리키면 빛 발자국이 적까지 이어지고 화살표 빛이 꽂힘
  bertha(id, img, e) {
    const a = rel(img), foes = allFoes(); poseSeq(id, [['skill', 700]]); auraFlare(id, 1.8, 700);
    foes.forEach((b, i) => { for (let k = 1; k <= 6; k++) at(60 + k * 45 + i * 30, () => { const x = a.cx + (b.cx - a.cx) * k / 7, y = a.y + a.h - 4 + (b.y + b.h - a.y - a.h) * k / 7; add({ k: 'oval', x, y, r0: 2, r1: 6, col: '#ffe090', life: 18 }); }); });
    at(400, () => foes.forEach(b => { for (let k = 0; k < 3; k++) add({ k: 'line', x0: b.cx - 40, y0: b.cy - 30 - k * 8, x1: b.cx, y1: b.cy, col: '#fff0b0', speed: 4, life: 10, s: 2 }); ring(b.cx, b.cy, '#ffe090', 4, 30, 12); }));
  },
});

// ---------- 인연 듀오 합동기 ----------
// 공격 듀오: A가 적 앞으로 파고들어 올려 베어 적을 띄움 → B가 근접이면 뛰어올라 내리찍고, 원거리면 공중의 적에 집중 사격 → 두 색이 섞인 큰 폭발.
// 그 밖(방어·회복·상태) 듀오: 둘이 함께 시전, 머리 위로 두 빛이 이어지고 가운데서 합쳐져 퍼짐.
const DUO_LEAD = 540;
const isRanged = id => RANGED.has(STYLE[id]) || STYLE[id] === 'boom';
function duoFx(e, d) {
  // 띄우는 쪽(A)은 근접 동료가 맡는다(원거리 동료는 뒤에서 쏘는 마무리)
  const [A, B] = isRanged(e.a) && !isRanged(e.b) ? [e.b, e.a] : [e.a, e.b];
  const ia = allyEl(A)?.querySelector(':scope > img'), ib = allyEl(B)?.querySelector(':scope > img');
  if (!ia || !ib) return;
  const ca = colOf(A), cb = colOf(B), ra = rel(ia), rb = rel(ib);
  auraFlare(A, 2.6, 1100); auraFlare(B, 2.6, 1100); dim(1300);
  if (!d?.atk) {
    poseSeq(A, [['skill', 800]]); poseSeq(B, [['skill', 800]]);
    const mx = (ra.cx + rb.cx) / 2, my = Math.min(ra.y, rb.y) - 16;
    for (let k = 0; k < 10; k++) at(k * 30, () => { add({ k: 'line', x0: ra.cx, y0: ra.y + 6, x1: mx, y1: my, col: k % 2 ? ca : '#ffffff', speed: 4, life: 10, s: 2 }); add({ k: 'line', x0: rb.cx, y0: rb.y + 6, x1: mx, y1: my, col: k % 2 ? cb : '#ffffff', speed: 4, life: 10, s: 2 }); });
    at(320, () => { flash(); ring(mx, my, ca, 4, 60, 18); ring(mx, my, cb, 8, 90, 22); sparks(mx, my, '#ffffff', 24, 2.6);
      for (const r of [ra, rb]) circle(r, '#ffffff', 30); });
    return;
  }
  const tgt = sigTarget(e); if (!tgt) return;
  const b = rel(tgt), hit = 170 + DUO_LEAD;
  // A: 파고들어 올려 베기
  poseSeq(A, [['windup', 120], ['attack', 700]]);
  moveTo(ia, b, 1100, [[0, 0], [.1, -.05, 3], [.22, 1, 0, FAST], [.34, 1, -10], [.62, 1, -6], [.8, 1, 0, IN2], [1, 0]]);
  at(250, () => { add({ k: 'arc', x: b.cx - 6, y: b.cy + 10, r: 34, a0: .6, a1: -2.2, w: 7, flat: .9, col: ca, life: 12 }); sparks(b.cx, b.cy, ca, 12, 2.2); sfx('slash', { vol: .6 }); });
  // 적이 떠오름
  at(270, () => { const fa = tgt.animate([{ transform: 'none' }, { transform: 'translate(4px,-38px)', offset: .35, easing: 'cubic-bezier(.2,.9,.3,1)' }, { transform: 'translate(6px,-44px)', offset: .75 }, { transform: 'none' }], { duration: 560 }); fa.startTime = document.timeline.currentTime; });
  // B: 근접이면 뛰어올라 내리찍기, 원거리면 공중 사격
  if (isRanged(B)) {
    poseSeq(B, [['skill', 260], ['attack', 500]]);
    for (let k = 0; k < 6; k++) at(330 + k * 45, () => { const r = rel(ib); tracer(r.x + r.w * .8, r.y + r.h * .35, b.cx + rnd(-8, 8), b.cy - 40 + rnd(-8, 8), k % 2 ? cb : '#ffffff'); });
    at(330, () => muzzle(rel(ib), cb));
  } else {
    poseSeq(B, [['windup', 300], ['attack', 600]]);
    moveTo(ib, b, 1150, [[0, 0], [.22, 0, 4], [.42, .7, -90, FAST], [.6, 1, -20, IN2], [.8, 1], [1, 0]]);
    at(600, () => { const r = rel(ib); for (let k = 0; k < 3; k++) add({ k: 'line', x0: r.cx, y0: r.cy, x1: b.cx + k * 3, y1: b.cy - 20, col: cb, speed: 4, life: 10, s: 2 }); });
  }
  zoomAt(b.cx, b.cy - 20, 1.18, 700, .5);
  // 합동 적중: 두 색 폭발
  at(hit, () => {
    flash(); if (SET.shake) shake(); redEdge();
    ring(b.cx, b.cy, ca, 6, 70, 18); ring(b.cx, b.cy, cb, 10, 100, 22);
    playFx(fxFrames(`${A}_atk`).length ? `${A}_atk` : 'slash', b.cx - 10, b.cy, 150, 55);
    at(60, () => playFx(fxFrames(`${B}_atk`).length ? `${B}_atk` : 'explode', b.cx + 10, b.cy - 6, 170, 55));
    sparks(b.cx, b.cy, ca, 20, 3.2); sparks(b.cx, b.cy, cb, 20, 3.2);
  });
}

// ---------- 패시브 ③ 폭발 각성 ----------
// 판이 0.22초 멈칫 → 동료 색 번쩍 + 빛줄기 + 큰 고리 → 아래쪽 띠에 얼굴과 「폭발 이름」. 이번 턴 동안은 .pm.awaken(빛나는 몸·오르는 불티)
function awaken(who, name) {
  const c = CHARACTERS[who]; if (!c || !layer) return;
  sfx('burst', { vol: .9 });
  const img = allyEl(who)?.querySelector(':scope > img'), col = colOf(who);
  for (const a of moving) { a.pause(); setTimeout(() => { try { a.play(); } catch (_) {} }, 220); }
  freeze = Math.max(freeze, performance.now() + 220);
  if (img) {
    const r = rel(img);
    pulse(img, 'jflash', 300); auraFlare(who, 2.8, 900);
    ring(r.cx, r.cy, col, 6, 90, 22); ring(r.cx, r.cy, '#ffffff', 4, 60, 16);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; add({ k: 'line', x0: r.cx, y0: r.cy, x1: r.cx + Math.cos(a) * 80, y1: r.cy + Math.sin(a) * 60, col: k % 2 ? col : '#ffffff', speed: 4, life: 12, s: 2 }); }
    if (SET.shake) shake();
  }
  const el = document.createElement('div'); el.className = 'jawake'; el.style.setProperty('--c', col);
  const face = charArt(who, 'normal');
  el.innerHTML = `${face ? `<img src="${face}" alt="">` : ''}<span>${c.name}</span><b>「${name}」</b>`;
  layer.append(el);
  el.animate([{ opacity: 0, transform: 'translateX(-40px)' }, { opacity: 1, transform: 'none', offset: .15 }, { opacity: 1, transform: 'translateX(6px)', offset: .8 }, { opacity: 0, transform: 'translateX(16px)' }],
    { duration: 1100, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
}

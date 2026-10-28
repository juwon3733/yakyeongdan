// 소리: 배경음악(반복)과 효과음. 브라우저 규칙상 첫 입력 뒤에 켜진다.
// render() 끝에서 sync()를 부르면, 지금 화면에 맞는 곡을 고르고 직전 상태와 비교해 효과음을 낸다.
// 그래서 게임 규칙 코드는 소리를 몰라도 된다. 곡·효과음은 tools/compose/build.py가 만든다.
import { S } from './run.js';
import { RULES } from './data/rules.js';

const BASE = 'assets/audio/';
const LEVELS = [1, 0.45, 0];            // 켬 · 작게 · 끔
const LABELS = ['소리 켬', '소리 작게', '소리 끔'];
const BGM_VOL = 0.5, SFX_VOL = 0.8;
const LATE = 300;                       // 5:00부터 전투곡이 조금 빨라진다
const LATE_RATE = 1.05;

let level = 0;
try { level = Math.min(2, Math.max(0, +(localStorage.getItem('yk-sound') || 0))); } catch (e) { /* 저장 안 됨 */ }

let ctx = null, master = null, bgmBus = null, sfxBus = null, manifest = null;
const buffers = new Map(), loading = new Map();
let want = null, curName = null, curSrc = null, curGain = null, curRate = 1;

function load(file) {
  if (buffers.has(file)) return Promise.resolve(buffers.get(file));
  if (!loading.has(file)) {
    loading.set(file, fetch(BASE + file)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(file))))
      .then(b => ctx.decodeAudioData(b))
      .then(buf => { buffers.set(file, buf); return buf; })
      .catch(() => null));
  }
  return loading.get(file);
}

function applyLevel() {
  if (master) master.gain.setTargetAtTime(LEVELS[level], ctx.currentTime, 0.05);
  const b = document.querySelector('[data-sound]');
  if (b) b.textContent = LABELS[level];
}

function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = LEVELS[level]; master.connect(ctx.destination);
  bgmBus = ctx.createGain(); bgmBus.gain.value = BGM_VOL; bgmBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(master);
  fetch(BASE + 'manifest.json').then(r => r.json()).then(m => {
    manifest = m;
    for (const n of m.sfx) load(`sfx_${n}.wav`);
  }).catch(() => {});
  if (want) playBgm(want, true);
}
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });

async function playBgm(name, force = false) {
  want = name;
  if (!ctx || (!force && curName === name)) return;
  curName = name;
  const buf = await load(`bgm_${name}.mp3`);
  if (!buf || want !== name) return;
  const t = ctx.currentTime;
  if (curSrc) {
    const s = curSrc, g = curGain;
    g.gain.setTargetAtTime(0, t, 0.25);
    setTimeout(() => { try { s.stop(); } catch (e) { /* 이미 멈춤 */ } s.disconnect(); g.disconnect(); }, 1500);
  }
  const g = ctx.createGain(); g.gain.value = 0; g.connect(bgmBus);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const len = manifest?.bgm?.[name];
  if (len && len < buf.duration) { src.loopStart = 0; src.loopEnd = len; }
  src.playbackRate.value = curRate;
  src.connect(g); src.start();
  g.gain.setTargetAtTime(1, t, 0.3);
  curSrc = src; curGain = g;
}

let lastSfx = {};
export function sfx(name, { vol = 1, rate = 1 } = {}) {
  if (!ctx || !LEVELS[level]) return;
  const buf = buffers.get(`sfx_${name}.wav`);
  if (!buf) { load(`sfx_${name}.wav`); return; }
  const now = ctx.currentTime;
  if (now - (lastSfx[name] || -1) < 0.04) return;   // 같은 소리가 한꺼번에 겹치지 않게
  lastSfx[name] = now;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.playbackRate.value = rate; g.gain.value = vol;
  src.connect(g); g.connect(sfxBus); src.start();
}

// ---------- 화면 → 곡 ----------
function pickBgm() {
  const G = S.G;
  if (!G) return 'title';
  if (G.screen === 'result') return G.won ? 'victory' : 'result';
  if (G.screen === 'combat' && S.C) {
    if (S.C.kind === 'boss') return G.act >= 3 ? 'dawn' : `boss${G.act}`;
    return S.C.kind === 'elite' ? 'elite' : 'battle';
  }
  if (G.screen === 'rest') return 'base';
  return `map${Math.min(3, G.act)}`;
}

function setRate(r) {
  if (r === curRate) return;
  curRate = r;
  if (curSrc) curSrc.playbackRate.setTargetAtTime(r, ctx.currentTime, 0.5);
}

// ---------- 상태 비교 → 효과음 ----------
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
function snap() {
  const G = S.G, C = S.C;
  if (!G) return null;
  return {
    screen: G.screen, clock: G.clock, deck: G.deck.length, row: G.row, act: G.act, won: G.won,
    hp: sum(Object.fromEntries(G.party.map(p => [p, G.members[p].hp]))),
    down: G.party.filter(p => G.members[p].down).length,
    c: C ? {
      turn: C.turn, hand: C.hand.length, foeHp: C.foe.hp, poison: C.foe.poison || 0, block: sum(C.blocks),
      chain: C.chain, loaded: C.loaded, mana: C.mana, asleep: C.asleep, slashes: C.slashes,
      duos: C.duoUsed.size, pending: C.pending, foe: C.foe,
    } : null,
  };
}

let prev = null;
function sounds(a, b) {
  if (!b) return;
  if (!a) { if (b.screen === 'combat') sfx('turn'); return; }
  if (a.clock < RULES.dawn && b.clock >= RULES.dawn) sfx('dawn');
  if (a.screen !== b.screen) {
    if (a.screen === 'combat' && b.screen === 'reward') sfx('win');
    else if (b.screen === 'result') sfx(b.won ? 'win' : 'lose');
    else if (a.screen === 'map') sfx('move');
  }
  if (b.deck > a.deck && b.screen !== 'combat') sfx('get');
  const x = a.c, y = b.c;
  const inCombat = x && y && x.foe === y.foe;
  if (!inCombat) {
    if (b.hp > a.hp) sfx('heal');
    if (y && b.screen === 'combat' && a.screen !== 'combat') sfx('turn');
    return;
  }
  if (y.turn > x.turn) sfx('turn');
  let loud = false;
  if (y.foeHp < x.foeHp) {
    loud = true;
    if (y.foeHp <= 0) sfx('foe_down');
    else if (y.loaded < x.loaded) sfx('cannon');
    else if (y.slashes > x.slashes) sfx('slash');
    else sfx('hit');
  }
  if (y.poison > x.poison) { sfx('poison'); loud = true; }
  if (y.block > x.block) { sfx('block'); loud = true; }
  if (y.duos > x.duos) { sfx('duo'); loud = true; }
  else if (y.chain > x.chain) sfx(`chain${Math.min(3, y.chain)}`);
  if (y.mana > x.mana || (y.asleep && !x.asleep)) { sfx('mana'); loud = true; }
  if (b.clock > a.clock) { sfx('clock'); loud = true; }
  if (b.down > a.down) sfx('down');
  else if (b.hp < a.hp) sfx('hurt');
  else if (b.hp > a.hp) { sfx('heal'); loud = true; }
  if (y.hand < x.hand && y.turn === x.turn && !loud) sfx('card');
  else if (y.pending && y.pending !== x.pending) sfx('select');
}

// ---------- 소리 버튼 (위 띠, 파티 고르기 화면) ----------
function placeButton() {
  if (document.querySelector('[data-sound]')) return;
  const host = document.querySelector('.topbar [data-deck]') || document.querySelector('.thead');
  if (!host) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'mini'; b.dataset.sound = ''; b.textContent = LABELS[level];
  b.title = '소리: 켬 → 작게 → 끔 (M 키)';
  if (host.matches('[data-deck]')) host.before(b); else host.append(b);
}
function cycle() {
  level = (level + 1) % LEVELS.length;
  try { localStorage.setItem('yk-sound', String(level)); } catch (e) { /* 저장 안 됨 */ }
  unlock(); applyLevel();
}
document.addEventListener('click', e => { if (e.target.closest('[data-sound]')) cycle(); });
addEventListener('keydown', e => { if ((e.key === 'm' || e.key === 'M') && !e.repeat) cycle(); });

export function sync() {
  if (window.__yk && !window.__yk.audio) {   // 개발판 점검용
    window.__yk.audio = () => ({ ctx: ctx && ctx.state, bgm: curName, rate: curRate, level, loaded: buffers.size });
  }
  placeButton();
  playBgm(pickBgm());
  setRate(S.G && S.G.screen === 'combat' && S.G.clock >= LATE ? LATE_RATE : 1);
  const now = snap();
  try { sounds(prev, now); } catch (e) { /* 소리 때문에 게임이 멈추면 안 된다 */ }
  prev = now;
}

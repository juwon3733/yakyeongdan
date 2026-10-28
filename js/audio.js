// 소리: 배경음악(반복)과 효과음. 브라우저 규칙상 첫 입력 뒤에 켜진다.
// render() 끝에서 sync()를 부르면, 지금 화면에 맞는 곡을 고르고 직전 상태와 비교해 효과음을 낸다.
// 그래서 게임 규칙 코드는 소리를 몰라도 된다. 곡·효과음은 tools/compose/build.py가 만든다.
import { S } from './run.js';
import { RULES } from './data/rules.js';
import { SET } from './settings.js';

const BASE = 'assets/audio/';
const LEVELS = [1, 0.45, 0];            // 켬 · 작게 · 끔
const LABELS = ['소리 켬', '소리 작게', '소리 끔'];
const BGM_VOL = 0.5, SFX_VOL = 0.8, AMB_VOL = 0.22;   // 설정의 음악·효과음 음량(SET.music·SET.sfx)을 곱한다. 환경음은 음악 음량을 따른다
const AMB_LEN = 16;                     // 환경음 루프 길이(초, tools/compose/ambience.py LEN)
const LATE = 300;                       // 5:00부터 전투곡이 조금 빨라진다
const LATE_RATE = 1.05;

let level = 0;
try { level = Math.min(2, Math.max(0, +(localStorage.getItem('yk-sound') || 0))); } catch (e) { /* 저장 안 됨 */ }

let ctx = null, master = null, bgmBus = null, sfxBus = null, ambBus = null, manifest = null;
const buffers = new Map(), loading = new Map();
let want = null, curName = null, curSrc = null, curGain = null, curRate = 1;
let wantAmb = null, ambName = null, ambSrc = null, ambGain = null;

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
  bgmBus = ctx.createGain(); bgmBus.gain.value = BGM_VOL * SET.music; bgmBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL * SET.sfx; sfxBus.connect(master);
  ambBus = ctx.createGain(); ambBus.gain.value = AMB_VOL * SET.music; ambBus.connect(master);
  fetch(BASE + 'manifest.json').then(r => r.json()).then(m => {
    manifest = m;
    for (const n of m.sfx) load(`sfx_${n}.wav`);
  }).catch(() => {});
  if (want) playBgm(want, true);
  if (wantAmb) playAmb(wantAmb, true);
}
// 설정 화면에서 음량을 바꾸면
export function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  bgmBus.gain.setTargetAtTime(BGM_VOL * SET.music, t, 0.05);
  ambBus.gain.setTargetAtTime(AMB_VOL * SET.music, t, 0.05);
  sfxBus.gain.setTargetAtTime(SFX_VOL * SET.sfx, t, 0.05);
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

// 환경음: 막마다 하나(파도·바람·탑 안 웅웅). 이음매 없이 반복, 바뀔 때 천천히 바꿔 낀다.
async function playAmb(name, force = false) {
  wantAmb = name;
  if (!ctx || (!force && ambName === name)) return;
  ambName = name;
  const t = ctx.currentTime;
  if (ambSrc) {
    const s = ambSrc, g = ambGain; ambSrc = null;
    g.gain.setTargetAtTime(0, t, 0.6);
    setTimeout(() => { try { s.stop(); } catch (e) { /* 이미 멈춤 */ } s.disconnect(); g.disconnect(); }, 3000);
  }
  if (!name) return;
  const buf = await load(`amb_${name}.mp3`);
  if (!buf || wantAmb !== name || ambSrc) return;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(ambBus);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  if (buf.duration > AMB_LEN) { src.loopStart = 0; src.loopEnd = AMB_LEN; }
  src.connect(g); src.start();
  g.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  ambSrc = src; ambGain = g;
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
// 에피소드: 대본에 bgm(화 전체) 또는 줄 명령 { bgm } 이 있으면 그 곡, 없으면 분위기 기본(인연 장면·3화 뭉클, 나머지 일상)
const EP_SONGS = ['ep_daily', 'ep_warm', 'ep_tense', 'base', 'rest', 'event', 'title', 'result', 'victory'];
function epBgm() {
  const E = S.ep;
  if (!E) return 'ep_daily';
  if (E.phase === 'fight' || E.phase === 'lost') return 'ep_tense';
  if (E.bgm && EP_SONGS.includes(E.bgm)) return E.bgm;
  return E.kind === 'bond' || E.n === 2 ? 'ep_warm' : 'ep_daily';
}
function pickBgm() {
  const G = S.G;
  if (S.view === 'ep') return epBgm();
  if (!G || S.view !== 'run') return ['base', 'summon', 'reveal', 'episodes'].includes(S.view) ? 'base' : 'title';
  if (G.screen === 'result') return G.won ? 'victory' : 'result';
  if (G.screen === 'tutdone') return 'victory';
  if (G.episode) return 'battle';                        // 에피소드 특별 전투
  if (G.screen === 'combat' && S.C) {
    if (S.C.kind === 'boss') {
      if (G.act >= 3) return S.C.all.some(f => f.p2 && !f.dead) ? 'dawn2' : 'dawn';
      return `boss${G.act}`;
    }
    if (G.tutorial) return 'tutorial';
    return S.C.kind === 'elite' ? 'elite' : 'battle';
  }
  if (G.tutorial) return 'tutorial';
  if (G.screen === 'rest') return 'rest';
  if (G.screen === 'event' || G.screen === 'shop') return 'event';
  if (['remove', 'dupe', 'upgrade'].includes(G.screen) && want) return want;   // 야시장·사건·휴식에서 이어지는 고르기 화면은 곡 유지
  return `map${Math.min(3, G.act)}`;
}

// 화면 → 환경음: 판 안이면 막(1 파도 · 2 바람 · 3 탑 안), 판 밖(타이틀·본부)은 파도. 에피소드 특별 전투는 없음.
const AMB_ACT = { 1: 'sea', 2: 'wind', 3: 'tower' };
function pickAmb() {
  const G = S.G;
  if (!G || S.view !== 'run') return S.view === 'ep' ? null : 'sea';
  if (G.episode) return null;
  return AMB_ACT[Math.min(3, G.act)] || 'sea';
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
      turn: C.turn, hand: C.hand.length, foeHp: C.all.reduce((t, f) => t + f.hp, 0), poison: C.all.reduce((t, f) => t + f.poison, 0),
      dead: C.all.filter(f => f.dead).length, block: sum(C.blocks),
      chain: C.chain, loaded: C.loaded, mana: C.mana, asleep: C.asleep, slashes: C.slashes,
      duos: C.duoUsed.size, pending: C.pending, foe: C.all,
    } : null,
  };
}

let prev = null;
function sounds(a, b) {
  if (!b) return;
  // 화면 연출(js/juice.js)이 있으면 전투의 타격·피해·방어·시계·턴·승리 소리는 연출 시간에 맞춰 그쪽에서 낸다
  const fx = !!S.fxDriven;
  if (!a) { if (b.screen === 'combat' && !fx) sfx('turn'); return; }
  if (a.clock < RULES.dawn && b.clock >= RULES.dawn) sfx('dawn');
  if (a.screen !== b.screen) {
    if (a.screen === 'combat' && b.screen === 'reward') { if (!fx) sfx('win'); }
    else if (b.screen === 'result') sfx(b.won ? 'win' : 'lose');
    else if (a.screen === 'map') sfx('move');
  }
  if (b.deck > a.deck && b.screen !== 'combat') sfx('get');
  const x = a.c, y = b.c;
  const inCombat = x && y && x.foe === y.foe;
  if (!inCombat) {
    if (b.hp > a.hp) sfx('heal');
    if (y && b.screen === 'combat' && a.screen !== 'combat' && !fx) sfx('turn');
    return;
  }
  let loud = false;
  if (fx) {   // 고르기·연계·듀오·마력·카드 내기만 바로
    if (y.duos > x.duos) { sfx('duo'); loud = true; }
    else if (y.chain > x.chain) sfx(`chain${Math.min(3, y.chain)}`);
    if (y.mana > x.mana || (y.asleep && !x.asleep)) { sfx('mana'); loud = true; }
    if (y.hand < x.hand && y.turn === x.turn && !loud) sfx('card');
    else if (y.pending && y.pending !== x.pending) sfx('select');
    return;
  }
  if (y.turn > x.turn) sfx('turn');
  if (y.foeHp < x.foeHp) {
    loud = true;
    if (y.dead > x.dead) sfx('foe_down');
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
  const host = document.querySelector('.topbar [data-deck]') || document.querySelector('.thead, .bhead, .tmenu');
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
    window.__yk.audio = () => ({ ctx: ctx && ctx.state, bgm: curName, amb: ambName, rate: curRate, level, loaded: buffers.size,
      vol: ctx ? { bgm: bgmBus.gain.value, sfx: sfxBus.gain.value, amb: ambBus.gain.value } : null });
  }
  placeButton();
  playBgm(pickBgm());
  playAmb(pickAmb());
  setRate(S.G && S.G.screen === 'combat' && S.G.clock >= LATE ? LATE_RATE : 1);
  const now = snap();
  try { sounds(prev, now); } catch (e) { /* 소리 때문에 게임이 멈추면 안 된다 */ }
  prev = now;
}

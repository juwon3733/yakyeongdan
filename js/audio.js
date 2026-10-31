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
// 끝없는 탑: 10층마다 곡이 조금씩 빨라진다 (최대 1.15)
const endlessRate = G => Math.min(1.15, 1 + Math.floor((G.endless.floor || 0) / 10) * .03);

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
  if (b) { b.textContent = LABELS[level]; b.dataset.lv = level; }
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

// 효과음이 있는지 (manifest 기준). 아직 못 읽었으면 false → 부르는 쪽이 공용 소리로 대신한다
export const hasSfx = name => !!manifest?.sfx?.includes(name);

// 적 피격음: 적 재질별 효과음 이름 (sfx(HIT_SFX.shell) 식으로 부른다. 없으면 'hit')
export const HIT_SFX = {
  soft: 'hit_soft',    // 유령·구름·해파리
  shell: 'hit_shell',  // 게·갑옷·톱니
  beast: 'hit_beast',  // 새·고양이·고래
  magic: 'hit_magic',  // 별·마녀·천사
};

// 희귀 카드·듀오 필살 컷인(0.9초) 효과음: 0~0.2초 빨려 듦 → 0.7초 쾅 (sfx(CUTIN_SFX)로 부른다)
export const CUTIN_SFX = 'special';

// 짧은 징글: sfx(JINGLE_SFX.win) 식으로 부른다
export const JINGLE_SFX = {
  win: 'win2',        // 전투 승리 (1.5초, 밝게 올라가는 팡파르)
  lose: 'lose',       // 판 패배 (2초, 낮게 내려가며 사라짐)
  bossIn: 'boss_in',  // 보스 등장 (1.2초, 무거운 쿵 + 불길한 화음)
};

// 별 소환 연출: sfx(SUMMON_SFX.charge) 식으로 부른다. 등급 열림은 SUMMON_SFX.rank[3|4|5]
export const SUMMON_SFX = {
  charge: 'summon_charge',  // 별이 모이며 차오름 (1.2초, 끝에서 뚝 끊김)
  drop: 'summon_drop',      // 별똥별 떨어짐 (0.5초, 0.33초에 땅에 닿는 툭)
  rank: { 3: 'summon_r3', 4: 'summon_r4', 5: 'summon_r5' },  // 흰 별(0.45초)·보라 반짝+화음(0.9초)·금빛 쾅+상승 아르페지오(1.5초)
};

// 기술 연출: sfx(SKILL_SFX.windup) 식으로 부른다. 없으면 hasSfx로 확인해 옛 소리로 대신한다
export const SKILL_SFX = {
  windup: 'windup',          // 공격 직전 숨 들이킴·칼 뽑기 (0.15초, 끝에 칭)
  projFly: 'proj_fly',       // 투사체 날아가는 휘익 (0.3초, 가운데가 가장 큼)
  petWhale: 'pet_whale',     // 고래 울음 + 물보라 (0.8초, 0.3초부터 물보라)
  petSpirit: 'pet_spirit',   // 별 정령 반짝 3연타 (0.4초, 0.09초 간격)
  auraOn: 'aura_on',         // 오라 켜지는 낮은 웅 (0.4초)
};

// 시즌 1 「유성우의 밤」: sfx(SEASON_SFX.meteor) — 유성우 규칙 별똥 (0.4초, 0~0.26초 휘익 하강 → 0.26초 반짝 터짐)
export const SEASON_SFX = {
  meteor: 'meteor',
};

// UI 효과음 (0.05~0.2초): sfx(UI_SFX.hover) 식으로 부른다. 자주 나므로 SFX_GAIN으로 작게 낸다
export const UI_SFX = {
  hover: 'ui_hover',  // 카드에 마우스를 댐: 아주 짧은 틱
  pick: 'ui_pick',    // 카드를 고름
  end: 'ui_end',      // 턴 끝 버튼
  page: 'ui_page',    // 화면 바뀜
};
// 효과음마다 기본 음량 배수 (없으면 1). 부르는 쪽의 vol과 곱한다
const SFX_GAIN = { ui_hover: 0.25, ui_pick: 0.4, ui_end: 0.45, ui_page: 0.35, windup: 0.6, proj_fly: 0.6, aura_on: 0.7 };

let lastSfx = {};
export function sfx(name, { vol = 1, rate = 1 } = {}) {
  if (!ctx || !LEVELS[level]) return;
  const buf = buffers.get(`sfx_${name}.wav`);
  if (!buf) { load(`sfx_${name}.wav`); return; }
  const now = ctx.currentTime;
  if (now - (lastSfx[name] || -1) < 0.04) return;   // 같은 소리가 한꺼번에 겹치지 않게
  lastSfx[name] = now;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.playbackRate.value = rate; g.gain.value = vol * (SFX_GAIN[name] ?? 1);
  src.connect(g); g.connect(sfxBus); src.start();
}

// ---------- 화면 → 곡 ----------
// 에피소드: 대본에 bgm(화 전체) 또는 줄 명령 { bgm } 이 있으면 그 곡, 없으면 분위기 기본(인연 장면·3화 뭉클, 나머지 일상)
const EP_SONGS = ['ep_daily', 'ep_warm', 'ep_tense', 'story', 'base', 'rest', 'event', 'title', 'result', 'victory'];
function epBgm() {
  const E = S.ep;
  if (!E) return 'ep_daily';
  if (E.phase === 'fight' || E.phase === 'lost') return 'ep_tense';
  if (E.bgm && EP_SONGS.includes(E.bgm)) return E.bgm;
  if (E.kind === 'story') return 'story';                // 본편 장 이야기 장면
  return E.kind === 'bond' || E.n === 2 ? 'ep_warm' : 'ep_daily';
}
// 일반 전투: 같은 주제를 막마다 조·악기·빠르기를 바꿔 편곡 (1 금관 144 · 2 FM 리드 152 · 3 금관+종 160)
const BATTLE_SONG = { 1: 'battle', 2: 'battle2', 3: 'battle3' };
// 본편 2장 운하 도시·3장 별바다 끝: 장마다 지도·일반(강적 포함) 전투 곡. 끝없는 탑·튜토리얼·에피소드 전투는 제외, 보스 곡은 BOSS_SONG 그대로
const CHAPTER_SONG = { 2: { map: 'map_ch2', battle: 'battle_ch2' }, 3: { map: 'map_ch3', battle: 'battle_ch3' } };
// 보스별 곡 (막 보스 변형: 안개 마녀 여왕·폭풍 고래, 시즌 1 보스: 떨어진 별의 왕,
// 본편 2장: 수문장·멈춘 태엽 기사 → 운하, 침묵의 종지기 → 종 / 3장: 얼어붙은 등대지기·오로라 파수꾼 → 얼음, 첫 밤)
const BOSS_SONG = { keeper: 'boss1', queen: 'boss_queen', captain: 'boss2', whale: 'boss_whale', starking: 'boss_star',
  floodgate: 'boss_canal', clockknight: 'boss_canal', bellkeeper: 'boss_bell',
  frostkeeper: 'boss_ice', warden: 'boss_ice', firstnight: 'boss_firstnight' };
// 3단계가 되면 바뀌는 곡 (같은 주제를 빠르고 높게 / 밝게)
const BOSS_SONG_P3 = { starking: 'boss_star3', bellkeeper: 'boss_bell2', firstnight: 'boss_firstnight2' };
function pickBgm() {
  const G = S.G;
  if (S.view === 'ep') return epBgm();
  if (S.view === 'season') return 'season';              // 시즌 화면·시즌 소개
  if (!G || S.view !== 'run') return ['base', 'summon', 'reveal', 'episodes'].includes(S.view) ? 'base' : 'title';
  if (G.screen === 'result') return G.won ? 'victory' : 'result';
  if (G.screen === 'tutdone') return 'victory';
  if (G.episode) return 'battle';                        // 에피소드 특별 전투
  const ch = !G.endless && !G.tutorial ? CHAPTER_SONG[G.chapter] : null;
  if (G.screen === 'combat' && S.C) {
    if (S.C.kind === 'boss') {
      const b = S.C.all[0];
      if (b?.key === 'dawn') return b.p3 ? 'dawn3' : b.p2 ? 'dawn2' : 'dawn';
      if (b?.p3 && BOSS_SONG_P3[b.key]) return BOSS_SONG_P3[b.key];   // 3단계(두 번 행동)
      return BOSS_SONG[b?.key] || `boss${Math.min(2, G.act)}`;
    }
    if (G.tutorial) return 'tutorial';
    if (ch) return ch.battle;
    if (S.C.kind === 'elite') return 'elite';
    return BATTLE_SONG[G.endless ? (G.endless.seg - 1) % 3 + 1 : Math.min(3, G.act)] || 'battle';
  }
  if (G.tutorial) return 'tutorial';
  if (G.screen === 'rest') return 'rest';
  if (G.screen === 'event' || G.screen === 'shop') return 'event';
  if (['remove', 'dupe', 'upgrade'].includes(G.screen) && want) return want;   // 야시장·사건·휴식에서 이어지는 고르기 화면은 곡 유지
  if (ch) return ch.map;
  if (G.endless) return `map${(G.endless.seg - 1) % 3 + 1}`;   // 끝없는 탑: 층 묶음마다 막 지도 곡을 돌아가며
  return `map${Math.min(3, G.act)}`;
}

// 화면 → 환경음: 판 안이면 막(1 파도 · 2 바람 · 3 탑 안), 판 밖(타이틀·본부)은 파도. 에피소드 특별 전투는 없음.
const AMB_ACT = { 1: 'sea', 2: 'wind', 3: 'tower' };
const AMB_EP = { harbor: 'harbor_town', convent: 'convent', clock: 'clock' };   // 에피소드 장소(S.ep.bg) → 환경음
const AMB_CHAPTER = { 2: 'canal', 3: 'icesea' };                              // 본편 2장 운하 도시·3장 별바다 끝
function pickAmb() {
  const G = S.G;
  if (S.view === 'ep') return AMB_EP[S.ep?.bg] || null;
  if (!G || S.view !== 'run') return 'sea';
  if (G.episode) return null;
  if (G.screen === 'rest') return 'campfire';
  if (G.endless) return AMB_ACT[(G.endless.seg - 1) % 3 + 1];
  return AMB_CHAPTER[G.chapter] || AMB_ACT[Math.min(3, G.act)] || 'sea';
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

// ---------- 소리 버튼 (위 띠, 파티 고르기·본부 밖 화면 머리줄) — 타이틀·본부 메뉴에는 넣지 않는다(M 키·설정으로) ----------
function placeButton() {
  if (document.querySelector('[data-sound]')) return;
  // 판 위 띠(전투·지도 등)에만. 본부 밖 화면 머리줄마다 제목 옆에 떠 있던 단추는 뺐다(설정 음량·M 키로)
  const host = document.querySelector('.topbar [data-deck]');
  if (!host) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'mini'; b.dataset.sound = ''; b.dataset.lv = level; b.textContent = LABELS[level];
  b.title = '소리: 켬 → 작게 → 끔 (M 키)';
  if (host.matches('[data-deck]')) host.before(b); else host.append(b);
}
function cycle() {
  level = (level + 1) % LEVELS.length;
  try { localStorage.setItem('yk-sound', String(level)); } catch (e) { /* 저장 안 됨 */ }
  unlock(); applyLevel();
}
document.addEventListener('click', e => { if (e.target.closest('[data-sound]')) cycle(); });
addEventListener('keydown', e => { if (e.target.closest?.('input, textarea')) return; if ((e.key === 'm' || e.key === 'M') && !e.repeat) cycle(); });

export function sync() {
  if (window.__yk && !window.__yk.audio) {   // 개발판 점검용
    window.__yk.audio = () => ({ ctx: ctx && ctx.state, bgm: curName, amb: ambName, rate: curRate, level, loaded: buffers.size,
      vol: ctx ? { bgm: bgmBus.gain.value, sfx: sfxBus.gain.value, amb: ambBus.gain.value } : null });
  }
  placeButton();
  playBgm(pickBgm());
  playAmb(pickAmb());
  setRate(S.G?.endless ? endlessRate(S.G) : S.G && S.G.screen === 'combat' && S.G.clock >= LATE ? LATE_RATE : 1);
  const now = snap();
  try { sounds(prev, now); } catch (e) { /* 소리 때문에 게임이 멈추면 안 된다 */ }
  prev = now;
}

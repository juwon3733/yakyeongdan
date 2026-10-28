// 에피소드 재생 (docs/09_episodes.md): 대사 넘기기, 좌우 인물 자리, 배경 바꾸기, 특별 전투, 다 보면 보상.
// 상태는 S.ep. 특별 전투는 작은 판(S.G.episode)을 만들어 기존 전투 엔진으로 싸우고,
// 끝나면 combat.js/run.js가 G.screen = 'epdone'으로 돌려보낸다(main.js after()가 epFightDone을 부름).
import { S, newRun } from './run.js';
import { startCombat } from './combat.js';
import { P, save, epKey, epExtra } from './meta.js';
import { EPISODES, BOND_SCENES, EP_REWARD } from './data/episodes.js';

const isLine = it => Array.isArray(it);

function open(src, meta) {
  S.ep = { ...meta, title: src.title, bg: src.bg, seq: src.lines.slice(), i: -1, left: null, right: null, last: null,
    log: [], auto: false, phase: 'read', lose: null, reward: 0 };
  S.view = 'ep';
  epNext();
}
export const openEp = (cid, n) => open(EPISODES[cid][n], { kind: 'ep', cid, n });
export const openBond = k => open(BOND_SCENES[k], { kind: 'bond', key: k });

// 말하는 사람 자리: 비어 있는 쪽, 둘 다 차 있으면 방금 말하지 않은 쪽을 바꾼다
function seat(E, who) {
  if (!who || who === E.left || who === E.right) return;
  if (!E.left) E.left = who;
  else if (!E.right) E.right = who;
  else if (E.last === E.left) E.right = who;
  else E.left = who;
}

// 다음 줄로. 배경 바꾸기는 그 자리에서 처리하고, 전투 앞에서는 멈춘다.
export function epNext() {
  const E = S.ep; if (!E || E.phase !== 'read') return;
  for (;;) {
    E.i++;
    const it = E.seq[E.i];
    if (it === undefined) return finish();
    if (it.bg) { E.bg = it.bg; continue; }
    if (it.fight) { E.phase = 'fight'; return; }
    const [who, text] = it;
    seat(E, who);
    if (who) E.last = who;
    E.log.push([who, text]);
    return;
  }
}
// [빨리]: 전투나 끝까지 한 번에
export function epSkip() {
  const E = S.ep; if (!E) return;
  while (E.phase === 'read') epNext();
}
export const epLine = () => { const it = S.ep?.seq[S.ep.i]; return isLine(it) ? it : null; };
export const epFight = () => S.ep?.seq[S.ep.i]?.fight || null;

// 특별 전투 시작: 정해진 파티·적으로 작은 판을 만든다
export function epStartFight() {
  const f = epFight(); if (!f) return;
  newRun(f.party.slice(), 0x5e7);
  S.G.episode = { won: null };
  S.G.relics = [];
  startCombat(f.foes.slice(), 'fight');
}
// 전투가 끝나면 (main.js after()에서)
export function epFightDone() {
  const won = S.G?.episode?.won;
  S.G = null; S.C = null; S.view = 'ep';
  const E = S.ep, f = epFight();
  if (won) {
    E.seq.splice(E.i + 1, 0, ...f.win);
    E.phase = 'read';
    epNext();
  } else {
    E.phase = 'lost';
    E.lose = f.lose?.[0]?.[1] || '졌다. 다시 해 보자.';
  }
}
// 진 뒤: 이야기만 이어 보기 (이긴 것처럼 win 줄로)
export function epSkipFight() {
  const E = S.ep, f = epFight(); if (!f) return;
  E.seq.splice(E.i + 1, 0, ...f.win);
  E.phase = 'read'; E.lose = null;
  epNext();
}

// 끝: 처음 다 본 화면 별 조각
function finish() {
  const E = S.ep;
  E.phase = 'end'; E.auto = false;
  if (E.kind === 'ep') {
    const k = epKey(E.cid, E.n);
    if (!P.epSeen[k]) { P.epSeen[k] = true; E.reward = EP_REWARD[E.n]; P.shards += E.reward; E.extra = epExtra(E.cid, E.n); save(); }
  } else if (!P.bondSeen.includes(E.key)) { P.bondSeen.push(E.key); save(); }
}

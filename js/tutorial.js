// 첫 실행 튜토리얼 (docs/10_details.md §5). 정해진 지도(전투 → 사건 → 전투 → 작은 보스)로 짧은 첫 밤을 하고,
// 단계마다 도움말 줄(인물 대사 아님)을 띄운다. 판 바깥 기록(별 조각·판 수·에피소드)에는 들어가지 않는다.
// 데이터는 js/data/tutorial.js. 지도 칸은 map.js goNode, 끝은 combat.js·run.js가 G.screen = 'tutdone'으로 돌려보낸다.
import { S, newRun } from './run.js';
import { P, save } from './meta.js';
import { TUT, TUT_TIPS } from './data/tutorial.js';

export const tutorialPending = () => !P.tutDone;

export function startTutorial() {
  newRun(TUT.party.slice(), TUT.seed);
  const G = S.G;
  G.tutorial = { duoSeen: false };
  G.moon = TUT.moon;
  G.relics = [];
  G.map = { rows: [...TUT.rows.map(t => [t])], edges: TUT.rows.map((_, r) => r + 1 < TUT.rows.length ? [[0]] : [[]]) };
  G.nextMap = null;
}
// 튜토리얼 칸: 정해진 적·사건 (없으면 null → 보통 판처럼)
export const tutNode = r => (S.G?.tutorial && TUT.nodes[r]) || null;

// 전투 첫 턴 손패를 맞춘다 (4단계 듀오): 원하는 카드를 뽑을 더미에서 손으로 옮긴다
export function rigHand(ids) {
  const C = S.C; if (!C) return;
  for (const id of ids) {
    if (C.hand.some(h => h.id === id)) continue;
    const di = C.draw.findIndex(h => h.id === id); if (di < 0) continue;
    const hi = C.hand.findIndex(h => !ids.includes(h.id));
    const card = C.draw.splice(di, 1)[0];
    if (hi >= 0) C.draw.push(C.hand.splice(hi, 1, card)[0]); else C.hand.push(card);
  }
  // 손에서 쓰는 순서대로 앞에 둔다
  C.hand.sort((a, b) => (ids.indexOf(a.id) + 1 || 99) - (ids.indexOf(b.id) + 1 || 99));
}

// 지금 보여 줄 도움말 줄
export function tutTip() {
  const G = S.G; if (!G?.tutorial) return '';
  const C = S.C, s = G.screen;
  if (s === 'map') return TUT_TIPS[`map${G.row}`] || '';
  if (s === 'event') return TUT_TIPS.event;
  if (s === 'reward') return TUT_TIPS.reward;
  if (s !== 'combat' || !C) return '';
  if (C.kind === 'boss') return TUT_TIPS.boss;
  if (G.row === 0) return C.turn === 1 && !C.playedTurn ? TUT_TIPS.play : C.turn === 1 ? TUT_TIPS.intent : TUT_TIPS.chain;
  if (G.row === 2) {
    if (C.hand.some(h => h.id.startsWith('duo:'))) { G.tutorial.duoSeen = true; return TUT_TIPS.duoGot; }
    return C.turn === 1 && !C.duoUsed.size ? TUT_TIPS.duo : TUT_TIPS.fight;
  }
  return TUT_TIPS.fight;
}

// 끝: 처음 한 번만. 별 조각 첫 선물(100)은 프로필을 만들 때 이미 들어 있다 → 본부의 [별 소환]을 짚어 준다
export function finishTutorial() {
  P.tutDone = true; save();
  S.G = null; S.C = null; S.view = 'base'; S.hint = 'summon';
}
export function skipTutorial() {
  P.tutDone = true; save();
  S.G = null; S.C = null; S.view = 'title';
}

// 매일의 밤 (docs/05_meta.md §11): 날짜 하나 = 시드 하나. 같은 날이면 누구나 같은 파티 후보·지도·달·변칙 규칙.
// 변칙 규칙은 도구 수치 필드(js/data/relics.js 머리말)를 그대로 쓴다. 판의 S.G.mods로 들어가 js/relics.js가 도구처럼 더한다.
export const DAILY_SHARDS = 15;    // 하루 한 번, 그날 밤을 처음 깨면
export const DAILY_CANDIDATES = 6; // 그날 고를 수 있는 동료 후보 수 (그중 셋)

export const DAILY_RULES = [
  { id: 'stopped', name: '멈춘 시계탑의 밤', text: '시간 카드 비용 0분. 대신 칸마다 시간 +5분.', mods: { timeCardFree: 1, nodeTimeAdd: 5 } },
  { id: 'chain', name: '이어지는 밤', text: '전투 첫 턴을 연계 2칸으로 시작하고, 듀오 카드 비용 0.', mods: { chainStart: 2, duoFree: 1 } },
  { id: 'crown', name: '별의 왕관', text: '턴마다 에너지 +1. 대신 손패가 4장.', mods: { energy: 1, handSize: -1 } },
  { id: 'gold', name: '야시장 대목', text: '전투에서 이기면 별빛 +15. 대신 보상 카드가 한 장 적다.', mods: { winGold: 15, rewardLess: 1 } },
  { id: 'short', name: '짧은 밤', text: '칸마다 시간 −3분. 대신 낮잠으로 되찾는 시간 −10분.', mods: { nodeTimeAdd: -3, napAdd: -10 } },
  { id: 'wall', name: '밀물의 밤', text: '턴마다 앞줄 동료 방어 4. 대신 첫 턴 카드 −1장.', mods: { frontBlockTurn: 4, firstDraw: -1 } },
  { id: 'bond', name: '인연의 밤', text: '인연이 아닌 두 동료도 「합동」 카드가 생기고, 인연 짝이 있으면 첫 턴 연계 1칸.', mods: { bond: 1, bondStart: 1 } },
  { id: 'banner', name: '깃발의 밤', text: '대열 바꾸기를 턴마다 두 번. 바꾼 둘은 방어가 줄지 않고 방어 +4.', mods: { swaps: 2, swapFree: 1, swapBlock: 4 } },
  { id: 'rest', name: '느린 밤', text: '휴식 칸에서 쉬면 회복 +20%, 낮잠으로 되찾는 시간 +10분. 대신 칸마다 시간 +4분.', mods: { restHealAdd: .2, napAdd: 10, nodeTimeAdd: 4 } },
  { id: 'pistol', name: '선제 사격', text: '전투 시작에 무작위 적에게 피해 10. 첫 턴 카드 +1장.', mods: { pistol: 10, firstDraw: 1 } },
  { id: 'duo', name: '맞잡은 손', text: '듀오 카드가 생기면 카드 1장, 쓰면 두 사람 체력 3 회복.', mods: { duoDraw: 1, duoHeal: 3 } },
  { id: 'reverse', name: '거꾸로 도는 밤', text: '전투에서 이기면 밤 시계 −6분. 대신 시간 카드 비용 +10분.', mods: { winRewind: 6, timeCardAdd: 10 } },
  { id: 'sand', name: '모래의 밤', text: '시간 카드를 쓰면 그 카드 주인 방어 8. 첫 턴 에너지 +1.', mods: { timeCardBlock: 8, firstEnergy: 1 } },
  { id: 'feather', name: '깃털 없는 새벽', text: '6시가 넘어도 여명이 오지 않는다. 대신 휴식 칸 회복이 절반.', mods: { noDawn: 1, restHealMul: .5 } },
];

// 그날의 열쇠(현지 날짜 YYYY-MM-DD)와 시드
export const dailyKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dailySeed(key) {
  let h = 0x811c9dc5;
  for (const ch of `yk-daily-${key}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
// 그날의 규칙: 날짜 수로 돌아간다 (연속한 날에 같은 규칙이 겹치지 않게)
export function dailyRule(key) {
  const day = Math.floor(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86400000);
  return DAILY_RULES[((day * 5) % DAILY_RULES.length + DAILY_RULES.length) % DAILY_RULES.length];
}

// 밤의 깊이 (docs/05_meta.md §10). 「새벽」을 한 번 이기면 열린다. 단계는 누적(1~n단계 규칙이 모두 걸림).
// 엔진은 run.js의 depthRule(필드)만 읽는다.
//   eliteHp·bossHp·fightHp 적 체력 비율 + · nodeTime 칸 시간 +분 · startHp 시작 체력 · napTime 낮잠 되찾는 분(덮어씀)
//   curse 시작 덱에 넣는 저주 · dawnAt 여명이 시작되는 시각(분) · restPct 쉬기 회복 비율(덮어씀) · dawnClock 「새벽」 턴마다 시계 +분 더
export const DEPTH = [
  null,
  { text: '강적 체력 +15%', eliteHp: .15 },
  { text: '칸 시간 +5분', nodeTime: 5 },
  { text: '시작 체력 -10 (동료마다)', startHp: -10 },
  { text: '보스 체력 +15%', bossHp: .15 },
  { text: '낮잠이 20분만 되찾는다', napTime: 20 },
  { text: '시작 덱에 저주 「졸음」 1장', curse: 'curse.drowsy' },
  { text: '일반 적 체력 +10%', fightHp: .1 },
  { text: '여명 효과가 5:30부터', dawnAt: 330 },
  { text: '휴식 쉬기 회복 20%', restPct: .2 },
  { text: '「새벽」이 매 턴 밤 시계 +3분 더', dawnClock: 3 },
];
export const DEPTH_MAX = 10;
export const DEPTH_BONUS = 5;   // 그 단계를 처음 깨면 단계 × 5 별 조각
// depth 단계까지 쌓인 규칙에서 필드 k (없으면 undefined)
export function depthRuleAt(depth, k) {
  let v;
  for (let n = 1; n <= Math.min(depth || 0, DEPTH_MAX); n++) if (DEPTH[n][k] !== undefined) v = DEPTH[n][k];
  return v;
}

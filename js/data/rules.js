// 판·전투 기본 수치 (docs/02_rules.md)
export const RULES = {
  dawn: 360,            // 6:00 (분)
  energy: 3,
  handSize: 5,
  maxHand: 9,
  chainMax: 3,
  duoNeed: 2,           // 듀오가 생기는 연계 칸 수 (달이 바꿀 수 있음)
  timeCard: 30,         // 시간 카드 기본 비용(분)
  dawnStrPerTurn: 2,    // 6시 이후 적 힘 증가
  hpByRarity: { 3: 22, 4: 24, 5: 30 },
  eliteHeal: 10,
  rest: { long: 25, short: 10, shortTime: 30 },
  mapRows: 4,           // 막마다 보스 전 층 수
  mapWeights: [['fight', .45], ['event', .20], ['rest', .17], ['elite', .18]],
};
export const NODE = {
  fight: { name: '전투', min: 20 },
  elite: { name: '강적', min: 35 },
  event: { name: '사건', min: 10 },
  rest:  { name: '휴식', min: 45 },
  boss:  { name: '보스', min: 20 },
};
export const ACT_NAME = { 1: '1막 · 항구층', 2: '2막 · 구름층', 3: '3막 · 별층' };

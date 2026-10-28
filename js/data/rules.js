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
  eliteHeal: 5,         // 강적을 이기면 살아 있는 동료마다 회복
  rest: { healPct: .3, downHealPct: .5, napTime: 30 },  // 쉬기: 최대 체력 비율(쓰러졌던 동료는 downHealPct), 낮잠: 되찾는 분
  swapBlockCost: 2,     // 전투 중 대열 바꾸기: 바꾼 둘의 방어 감소
  swapsPerTurn: 1,
  reviveHp: 1,          // 쓰러진 동료가 전투 뒤 일어날 때 체력
  defaultAim: 'front',  // 적 노림 기본값 (front·back·weakest·last)
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
// 노림 이름 (docs/04_enemies.md 끝 「노림」 표)
export const AIM_NAME = { front: '앞줄', back: '뒤를 노림', weakest: '가장 약한', last: '방금 친 동료' };
export const ROW_NAME = ['앞', '가운데', '뒤'];
export const ACT_NAME = { 1: '1막 · 항구층', 2: '2막 · 구름층', 3: '3막 · 별층' };

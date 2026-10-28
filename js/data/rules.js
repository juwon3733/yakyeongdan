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
  reviveHp: 1,
  sleepMana: 3,          // 노엘이 잠든 채 턴을 시작하면 마력
  weakMul: .75,         // 약화: 주는 피해
  vulnMul: 1.5,         // 취약: 받는 피해
  lightCost: 1,         // 등대 불빛이 비춘 동료 카드 비용 +          // 쓰러진 동료가 전투 뒤 일어날 때 체력
  defaultAim: 'front',  // 적 노림 기본값 (front·back·weakest·last)
  mapRows: 4,           // 막마다 보스 전 층 수
  mapWeights: [['fight', .45], ['event', .20], ['rest', .17], ['elite', .18]],
};
// 보상 카드 희귀도 확률 (docs/10_details.md §1). r 희귀, u 보통, 나머지 흔함. 희귀가 안 나온 보상마다 pityStep씩 희귀 확률 +
export const REWARD = {
  odds: { fight: { r: .08, u: .32 }, elite: { r: .15, u: .45 }, boss: { r: 1, u: 0 } },
  pityStep: .02,
};
export const RARITY_NAME = { c: '흔함', u: '보통', r: '희귀', curse: '저주', duo: '듀오' };
export const NODE = {
  fight: { name: '전투', min: 20 },
  elite: { name: '강적', min: 35 },
  event: { name: '사건', min: 10 },
  rest:  { name: '휴식', min: 45 },
  boss:  { name: '보스', min: 20 },
};
// 노림 이름 (docs/04_enemies.md 끝 「노림」 표)
export const AIM_NAME = { front: '앞줄', back: '뒤를 노림', weakest: '가장 약한', last: '방금 친 동료', light: '불빛이 비춘 동료', taunt: '대신 맞기' };
export const ROW_NAME = ['앞', '가운데', '뒤'];
export const ACT_NAME = { 1: '1막 · 항구층', 2: '2막 · 구름층', 3: '3막 · 별층' };

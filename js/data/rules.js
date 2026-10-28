// 판·전투 기본 수치 (docs/02_rules.md)
export const RULES = {
  dawn: 360,            // 6:00 (분)
  collapse: 420,        // 7:00 탑이 무너져 패배
  dawnStartStr: 3,      // 6시 이후 들어간 전투: 적이 힘 +3으로 시작
  energy: 3,
  handSize: 5,
  maxHand: 9,
  chainMax: 3,
  duoNeed: 2,           // 듀오가 생기는 연계 칸 수 (달이 바꿀 수 있음)
  timeCard: 12,         // 시간 카드 기본 비용(분)
  dawnStrPerTurn: 1,    // 6시 이후 적 힘 증가
  eliteHeal: 5,         // 강적을 이기면 살아 있는 동료마다 회복
  rest: { healPct: .3, downHealPct: .5, napTime: 30 },  // 쉬기: 최대 체력 비율(쓰러졌던 동료는 downHealPct), 낮잠: 되찾는 분
  swapBlockCost: 2,     // 전투 중 대열 바꾸기: 바꾼 둘의 방어 감소
  swapsPerTurn: 1,
  reviveHp: 1,
  sleepMana: 4,          // 노엘이 잠든 채 턴을 시작하면 마력
  weakMul: .75,         // 약화: 주는 피해
  vulnMul: 1.5,         // 취약: 받는 피해
  lightCost: 1,         // 등대 불빛이 비춘 동료 카드 비용 +
  bossHealPct: .25,     // 막 보스를 이기면 살아 있는 동료 최대 체력의 비율만큼 회복
  defaultAim: 'front',  // 적 노림 기본값 (front·back·weakest·last)
  // 패시브 ③ 폭발이 생기면서 올린 적 체력 (docs/12_signature.md §3). 막별 × 칸 종류. 튜토리얼·에피소드 전투는 그대로.
  foeHpMul: { 1: { fight: 2, elite: 2.8, boss: 3.4 }, 2: { fight: 2, elite: 2.8, boss: 3.2 }, 3: { fight: 2, elite: 2.8, boss: 3.2 } },
  foeAtkMul: .66,        // 적 피해 배수 (전투가 길어진 만큼)
  bigTurn: 100,         // 「터지는 턴」: 한 턴 피해가 이 이상 (결과 화면 최고의 한 턴, 「새벽」 대응)
  burstMul: 2,        // 폭발 턴: 패시브 ③이 터진 동료는 그 턴 남은 공격 피해 ×
  // 지도 (docs/10_details.md §4): 막마다 4층 + 보스. 칸 비율, 그믐달이면 사건 비율 newMoonEvent
  mapRows: 4,
  mapWidth: [2, 3],     // 층마다 칸 수
  mapWeights: [['fight', .45], ['event', .20], ['rest', .15], ['elite', .10], ['shop', .10]],
  newMoonEvent: .30,
  eliteMax: 2,
  mapTries: 60,
  // 별빛(판 안의 돈)
  startGold: 30,
  gold: { fight: [10, 20], elite: [30, 30], boss: [40, 40] },
};
// 야시장 (docs/02_rules.md §8)
export const SHOP = {
  cards: 5,
  cardPrice: { c: 45, u: 70, r: 110 },
  sale: .5,             // 카드 한 장은 반값
  relics: 3,
  relicPrice: { c: 120, u: 160, r: 220 },
  remove: 75, removeStep: 25,
  upgrade: 50,
  // 가끔 옆에 서는 특별 노점 (별빛 대신 다른 것으로 산다). chance: 야시장마다 나올 확률
  special: { chance: .35, kinds: {
    clock:  { name: '모래시계 노점', pay: 'time', talk: '"값은 별빛 말고, 밤 몇 분이면 돼."', card: 15, cardRare: 25, relic: 25 },
    porter: { name: '짐꾼 노점', pay: 'hp', talk: '"짐 좀 들어 주면 하나 줄게. 무겁다고."', card: 5, cardRare: 8, relic: 6 },
  } },
  talk: ['"손님, 오늘만 특별가."', '"탑 위에서 쓸 물건은 탑 위에서 사야지."', '"이 등불? 지난 야경단이 두고 간 거야."', '"값은 별빛으로. 외상은… 안 돼."', '"새벽이 오기 전에 문 닫는다고."'],
};
// 보상 카드 희귀도 확률 (docs/10_details.md §1). r 희귀, u 보통, 나머지 흔함. 희귀가 안 나온 보상마다 pityStep씩 희귀 확률 +
export const REWARD = {
  odds: { fight: { r: .08, u: .32 }, elite: { r: .15, u: .45 }, boss: { r: 1, u: 0 } },
  pityStep: .02,
};
export const RARITY_NAME = { c: '흔함', u: '보통', r: '희귀', curse: '저주', duo: '듀오' };
export const NODE = {
  fight: { name: '전투', min: 12 },
  elite: { name: '강적', min: 25 },
  event: { name: '사건', min: 10 },
  rest:  { name: '휴식', min: 35 },
  shop:  { name: '야시장', min: 10 },
  boss:  { name: '보스', min: 15 },
};
// 노림 이름 (docs/04_enemies.md 끝 「노림」 표)
export const AIM_NAME = { front: '앞줄', back: '뒤를 노림', weakest: '가장 약한', last: '방금 친 동료', light: '불빛이 비춘 동료', taunt: '대신 맞기',
  cycle: '앞→가운데→뒤 차례로', dawn: '큰 공격은 체력이 가장 높은 동료, 연타는 나눠서' };
export const ROW_NAME = ['앞', '가운데', '뒤'];
export const ACT_NAME = { 1: '1막 · 항구층', 2: '2막 · 구름층', 3: '3막 · 별층' };
